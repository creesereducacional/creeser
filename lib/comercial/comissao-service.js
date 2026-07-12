// Serviço do Motor de Comissões Comerciais
// Local: c:\PROJETOS\creeser\lib\comercial\comissao-service.js

export async function calcularComissaoReceita(supabase, receitaId) {
  // 1. Carregar Receita
  const { data: receita, error: recErr } = await supabase
    .from('financeiro_receitas_comerciais')
    .select('*, leads(observacoes)')
    .eq('id', receitaId)
    .single();

  if (recErr || !receita) {
    throw new Error('Receita comercial não encontrada.');
  }

  // 2. Prevenir duplicidade: verificar se já existe comissão para esta receita
  const { data: comissaoExistente } = await supabase
    .from('financeiro_comissoes')
    .select('id')
    .eq('receita_id', receitaId)
    .maybeSingle();

  if (comissaoExistente) {
    console.log(`[Motor Comissões] Comissão já calculada para a receita ${receitaId}`);
    return { status: 'IGNORADO', message: 'Comissão já processada.' };
  }

  // 3. Obter configuração vigente da instituição
  const { data: config } = await supabase
    .from('configuracao_comissoes')
    .select('*')
    .eq('instituicao_id', receita.instituicao_id)
    .eq('ativo', true)
    .maybeSingle();

  // Se não encontrar, aplicar padrão de 10%
  const percentual = config ? parseFloat(config.percentual) : 10.0;
  const valorBase = parseFloat(receita.valor_bruto || 0);
  const valorComissao = parseFloat((valorBase * (percentual / 100)).toFixed(2));

  // 4. Salvar Comissão (com fallback robusto para o Lead)
  try {
    const { error: insertErr } = await supabase
      .from('financeiro_comissoes')
      .insert({
        receita_id: receitaId,
        lead_id: receita.lead_id,
        captador_id: receita.captador_id,
        instituicao_id: receita.instituicao_id,
        percentual_aplicado: percentual,
        valor_base: valorBase,
        valor_comissao: valorComissao,
        status: 'PENDENTE'
      });

    if (insertErr) {
      console.error('[Motor Comissões] Erro ao gravar comissão no banco (tentando fallback):', insertErr);
      
      const fallbackComissao = {
        financeiro_comissoes: {
          receita_id: receitaId,
          lead_id: receita.lead_id,
          captador_id: receita.captador_id,
          instituicao_id: receita.instituicao_id,
          percentual_aplicado: percentual,
          valor_base: valorBase,
          valor_comissao: valorComissao,
          status: 'PENDENTE'
        }
      };

      const leadObs = receita.leads?.observacoes || '';
      const updatedObs = `${leadObs}\n\n[COMISSÃO GERADA]\n${JSON.stringify(fallbackComissao, null, 2)}`;
      
      await supabase
        .from('leads')
        .update({ observacoes: updatedObs })
        .eq('id', receita.lead_id);
    }
  } catch (e) {
    console.error('[Motor Comissões] Falha geral ao salvar comissão:', e);
  }

  // 5. Registrar em leads_auditoria
  try {
    await supabase
      .from('leads_auditoria')
      .insert({
        lead_id: receita.lead_id,
        usuario_id: receita.captador_id || null,
        acao: 'comissao_comercial_calculada',
        dados_anteriores: {},
        dados_novos: {
          receita_id: receitaId,
          percentual_aplicado: percentual,
          valor_base: valorBase,
          valor_comissao: valorComissao,
          status: 'PENDENTE'
        }
      });
  } catch (auditErr) {
    console.error('[Motor Comissões] Falha ao registrar auditoria de comissão:', auditErr);
  }

  // Timeline 360
  try {
    const { registrarInteracao } = require('./interacao-service');
    await registrarInteracao(supabase, receita.lead_id, {
      instituicao_id: receita.instituicao_id,
      usuario_id: receita.captador_id || null,
      tipo: 'comissao_calculada',
      descricao: `Comissão calculada para o captador. Percentual: ${percentual}%. Valor Repasse: R$ ${valorComissao.toFixed(2)}`,
      metadata: { receita_id: receitaId, valor_comissao: valorComissao }
    });
  } catch (_) {}

  return {
    status: 'CALCULADO',
    percentual,
    valorBase,
    valorComissao
  };
}
