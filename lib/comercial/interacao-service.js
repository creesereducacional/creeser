// Servico de registro de interacoes e eventos 360 no Lead
// Local: c:\PROJETOS\creeser\lib\comercial\interacao-service.js

function obterTituloPadrao(tipo) {
  const titulos = {
    criacao: 'Ficha Cadastrada',
    atualizacao: 'Ficha Atualizada',
    cobranca_asaas: 'Cobrança Gerada',
    link_enviado: 'Link de Pagamento Enviado',
    pagamento_confirmado: 'Pagamento Confirmado',
    receita_criada: 'Receita Comercial Criada',
    comissao_calculada: 'Comissão Calculada',
    venda_criada: 'Venda Comercial Criada',
    matricula_efetivada: 'Matrícula Acadêmica Efetivada',
    contrato_emitido: 'Contrato Educacional Emitido',
    ligacao: 'Ligação Telefônica',
    whatsapp: 'Mensagem de WhatsApp',
    email: 'E-mail Enviado',
    reuniao: 'Reunião Realizada',
    visita: 'Visita Presencial',
    observacao: 'Observação Interna'
  };
  return titulos[tipo] || 'Interação Registrada';
}

export async function registrarInteracaoLead(supabase, leadId, {
  instituicao_id = null,
  usuario_id = null,
  tipo,
  titulo = null,
  descricao,
  data_evento = new Date().toISOString(),
  metadata = {}
}) {
  const finalTitulo = titulo || obterTituloPadrao(tipo);
  try {
    const { data, error } = await supabase
      .from('leads_interacoes')
      .insert({
        lead_id: leadId,
        instituicao_id,
        usuario_id,
        tipo,
        titulo: finalTitulo,
        descricao,
        data_evento,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.warn('[interacao-service] Tabela leads_interacoes ausente ou falha. Rodando fallback...', error.message);
      await executarFallback(supabase, leadId, tipo, finalTitulo, descricao, data_evento);
      return { status: 'FALLBACK', message: 'Registrado em observacoes por fallback.' };
    }

    return { status: 'SUCESSO', data };
  } catch (err) {
    console.error('[interacao-service] Erro geral. Rodando fallback...', err.message);
    await executarFallback(supabase, leadId, tipo, finalTitulo, descricao, data_evento);
    return { status: 'FALLBACK', error: err.message };
  }
}

// Alias para manter compatibilidade com arquivos existentes
export async function registrarInteracao(supabase, leadId, params) {
  return registrarInteracaoLead(supabase, leadId, params);
}

// Fallback: Grava em observações do Lead caso a tabela física não exista
async function executarFallback(supabase, leadId, tipo, titulo, descricao, data_evento) {
  try {
    const { data: lead } = await supabase
      .from('leads')
      .select('observacoes')
      .eq('id', leadId)
      .single();

    if (lead) {
      const logsTimeline = lead.observacoes || '';
      const dataFmt = new Date(data_evento).toLocaleString('pt-BR');
      const novoLog = `\n[TIMELINE_${tipo.toUpperCase()}] [${dataFmt}] [${titulo}] ${descricao}`;
      
      await supabase
        .from('leads')
        .update({
          observacoes: logsTimeline + novoLog,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
    }
  } catch (err) {
    console.error('[interacao-service-fallback] Erro fatal no fallback:', err.message);
  }
}
