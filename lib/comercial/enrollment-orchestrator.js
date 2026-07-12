// Orquestrador de Matrícula Acadêmica e Geração de Contratos/Planos Financeiros
// Local: c:\PROJETOS\creeser\lib\comercial\enrollment-orchestrator.js

export async function efetuarMatriculaVenda(supabase, vendaId, dadosMatricula = {}) {
  // 1. Carregar Venda Comercial
  const { data: venda, error: vendaErr } = await supabase
    .from('vendas_comerciais')
    .select('*, leads(*)')
    .eq('id', vendaId)
    .single();

  if (vendaErr || !venda) {
    throw new Error('Venda comercial não encontrada.');
  }

  // Prevenir re-processamento
  if (venda.status === 'MATRICULADO') {
    return { status: 'IGNORADO', message: 'Venda comercial já matriculada.' };
  }

  const lead = venda.leads;
  if (!lead) {
    throw new Error('Lead associado à venda comercial não foi localizado.');
  }

  // Operação transacional simulada com tratamento de erro completo para rollback
  try {
    // 2. Criar Aluno se não existir
    let alunoId = lead.aluno_convertido_id;
    let newAluno;

    if (alunoId) {
      const { data: existingAluno } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', alunoId)
        .maybeSingle();
      
      newAluno = existingAluno;
    }

    if (!newAluno) {
      // Extrair dados da Ficha de Matrícula do campo observacoes do Lead
      let extraAlunoData = {};
      try {
        const marker = '[FICHA_MATRICULA_COMERCIAL]';
        const idx = lead.observacoes?.indexOf(marker);
        if (idx !== -1 && idx !== undefined) {
          const jsonStr = lead.observacoes.substring(idx + marker.length).trim();
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.aluno) {
            extraAlunoData = {
              data_nascimento: parsed.aluno.data_nascimento || null,
              mae: parsed.aluno.nome_mae || null,
              pai: parsed.aluno.nome_pai || null,
              rg: parsed.aluno.rg || null,
              endereco: parsed.aluno.endereco || null,
              numeroendereco: parsed.aluno.numero || null,
              complemento: parsed.aluno.complemento || null,
              cep: parsed.aluno.cep || null,
              bairro: parsed.aluno.bairro || null,
              cidade: parsed.aluno.cidade || null,
              estado: parsed.aluno.estado || null,
            };
          }
          if (parsed && parsed.academico) {
            extraAlunoData.ano_letivo = parsed.academico.ano_letivo || null;
            extraAlunoData.semestre = parsed.academico.periodo || null;
            if (parsed.academico.data_matricula) {
              extraAlunoData.datamatricula = parsed.academico.data_matricula;
            }
          }
        }
      } catch (err) {
        console.error('[Orquestrador Matrícula] Falha ao extrair dados da ficha no lead:', err);
      }

      const { data: createdAluno, error: insertAlunoErr } = await supabase
        .from('alunos')
        .insert({
          nome: lead.nome,
          email: lead.email || null,
          telefone_celular: lead.whatsapp || lead.telefone || null,
          cpf: lead.cpf || null,
          instituicao_id: venda.instituicao_id,
          cursoid: venda.curso_id || null,
          turmaid: dadosMatricula.turma_id || null,
          statusmatricula: 'ATIVO',
          datamatricula: new Date().toISOString().slice(0, 10),
          data_captacao: new Date().toISOString().slice(0, 10),
          origem_captacao: 'COMERCIAL',
          ...extraAlunoData
        })
        .select()
        .single();

      if (insertAlunoErr) {
        throw new Error(`Erro ao criar aluno no banco de dados: ${insertAlunoErr.message}`);
      }
      newAluno = createdAluno;
      alunoId = newAluno.id;
    }

    // 3. Gerar Contrato Educacional
    const { data: modeloContrato } = await supabase
      .from('contratos_instituicao')
      .select('*')
      .eq('instituicao_id', venda.instituicao_id)
      .eq('ativo', true)
      .order('padrao', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (modeloContrato) {
      const { data: newContract, error: contratoErr } = await supabase
        .from('contratos_assinaturas')
        .insert({
          aluno_id: alunoId,
          instituicao_id: venda.instituicao_id,
          contrato_id: modeloContrato.id,
          provider: 'local',
          status: 'pending_signature',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (contratoErr) {
        console.error('[Matrícula] Erro ao gerar contrato educacional:', contratoErr.message);
      } else if (newContract) {
        // Timeline 360: Contrato emitido
        try {
          const { registrarInteracaoLead } = require('./interacao-service');
          await registrarInteracaoLead(supabase, lead.id, {
            instituicao_id: venda.instituicao_id,
            usuario_id: lead.captado_por_id || null,
            tipo: 'contrato_emitido',
            descricao: `Contrato Educacional emitido com sucesso! Código de Assinatura: ${newContract.id}`
          });
        } catch (_) {}
      }
    }

    // 4. Gerar Plano Financeiro (Carnê / Mensalidades)
    const { data: curso } = await supabase
      .from('cursos')
      .select('*')
      .eq('id', venda.curso_id)
      .maybeSingle();

    // Extrair mensalidade do faturamento da Ficha de Matrícula
    let parsedValorMensalidade = null;
    let parsedQtdParcelas = null;
    let parsedDiaVencimento = null;
    let parsedPrimeiroVencimento = null;
    try {
      const marker = '[FICHA_MATRICULA_COMERCIAL]';
      const idx = lead.observacoes?.indexOf(marker);
      if (idx !== -1 && idx !== undefined) {
        const jsonStr = lead.observacoes.substring(idx + marker.length).trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.financeiro) {
          parsedValorMensalidade = parsed.financeiro.valor_mensalidade;
          parsedQtdParcelas = parsed.financeiro.qtd_parcelas;
          parsedDiaVencimento = parsed.financeiro.dia_vencimento;
          parsedPrimeiroVencimento = parsed.financeiro.data_primeiro_vencimento;
        }
      }
    } catch (_) {}

    const valorMensalidade = parseFloat(dadosMatricula.valor_mensalidade || parsedValorMensalidade || curso?.valor_mensalidade || 300.00);
    const qtdParcelas = parseInt(dadosMatricula.qtd_parcelas || parsedQtdParcelas || curso?.qtd_parcelas || 12);
    const diaPagamento = parseInt(dadosMatricula.dia_pagamento || parsedDiaVencimento || 10);

    // Atualizar dados financeiros no perfil do aluno
    await supabase
      .from('alunos')
      .update({
        plano_financeiro: 'BOLETO',
        valor_mensalidade: valorMensalidade,
        qtd_parcelas: qtdParcelas,
        dia_pagamento: diaPagamento
      })
      .eq('id', alunoId);

    // Criar Ordem Principal
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .insert({
        instituicao_id: venda.instituicao_id,
        aluno_id: alunoId,
        tipo: 'carne',
        descricao: `Plano de Mensalidades - Curso: ${curso?.nome || 'Geral'}`,
        valor_total: valorMensalidade * qtdParcelas,
        quantidade_parcelas: qtdParcelas,
        status: 'ativo'
      })
      .select()
      .single();

    if (ordemErr) {
      throw new Error(`Erro ao gerar ordem financeira do curso: ${ordemErr.message}`);
    }

    // Gerar as parcelas mensais
    const parcelas = [];
    let dataVenc = parsedPrimeiroVencimento ? new Date(parsedPrimeiroVencimento) : new Date();
    if (!parsedPrimeiroVencimento) {
      dataVenc.setDate(diaPagamento);
      // Avançar para próximo mês se dia do vencimento já passou no mês atual
      if (dataVenc.getDate() <= new Date().getDate()) {
        dataVenc.setMonth(dataVenc.getMonth() + 1);
      }
    }

    for (let i = 1; i <= qtdParcelas; i++) {
      parcelas.push({
        instituicao_id: venda.instituicao_id,
        ordem_pagamento_id: ordem.id,
        aluno_id: alunoId,
        numero_parcela: i,
        valor: valorMensalidade,
        data_vencimento: dataVenc.toISOString().slice(0, 10),
        status: 'pendente'
      });
      dataVenc.setMonth(dataVenc.getMonth() + 1);
    }

    const { error: parcErr } = await supabase
      .from('financeiro_parcelas')
      .insert(parcelas);

    if (parcErr) {
      throw new Error(`Erro ao gerar parcelas mensais do plano: ${parcErr.message}`);
    }

    // 5. Atualizar Venda Comercial
    await supabase
      .from('vendas_comerciais')
      .update({
        status: 'MATRICULADO',
        matricula_id: alunoId, // Linkagem unificada
        aluno_id: alunoId,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendaId);

    // 6. Atualizar status final do Lead
    await supabase
      .from('leads')
      .update({
        status: 'matriculado',
        aluno_convertido_id: alunoId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    // 7. Registrar Auditoria do Funil
    await supabase
      .from('leads_auditoria')
      .insert({
        lead_id: lead.id,
        usuario_id: lead.captado_por_id || null,
        acao: 'matricula_automatizada_venda',
        dados_anteriores: { status_venda: venda.status, status_lead: lead.status },
        dados_novos: {
          status_venda: 'MATRICULADO',
          status_lead: 'matriculado',
          aluno_id: alunoId,
          ordem_id: ordem.id,
          parcelas_geradas: qtdParcelas
        }
      });

    // Timeline 360
    try {
      const { registrarInteracaoLead } = require('./interacao-service');
      await registrarInteracaoLead(supabase, lead.id, {
        instituicao_id: venda.instituicao_id,
        usuario_id: lead.captado_por_id || null,
        tipo: 'matricula_efetivada',
        descricao: `Matrícula acadêmica confirmada com sucesso! Aluno ID: ${alunoId}`
      });
    } catch (_) {}

    return {
      status: 'MATRICULADO',
      aluno_id: alunoId,
      ordem_id: ordem.id
    };
  } catch (error) {
    console.error('[Orquestrador Matrícula] Rollback executado devido a erro:', error.message);
    
    // Tentar reverter os status da venda em caso de falha geral
    try {
      await supabase
        .from('vendas_comerciais')
        .update({ status: 'PAGO' })
        .eq('id', vendaId);
    } catch (_) {}

    throw error;
  }
}
