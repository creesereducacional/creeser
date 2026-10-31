// lib/negociacoes-service.js
// Serviço central de Gestão de Negociações/Acordos Financeiros
// Responsável por orquestrar o encerramento com idempotência, integração EFI,
// trilha de auditoria append-only e histórico permanente estruturado.

const efi = require('./efi-client');

/**
 * Validação rigorosa do campo Observação do Operador.
 * Impede textos curtos, vazios ou meramente genéricos.
 */
function validarObservacaoOperador(obs) {
  if (!obs || typeof obs !== 'string') {
    return { valido: false, erro: 'Observação do operador é obrigatória.' };
  }
  const limpo = obs.trim();
  if (limpo.length < 10) {
    return { valido: false, erro: 'A observação do operador deve conter ao menos 10 caracteres explicativos.' };
  }

  const genericos = [
    'negociacao',
    'negociação',
    'acordo',
    'acordo feito',
    'renegociacao',
    'renegociação',
    'teste',
    'teste teste',
    'padrao',
    'padrão',
    'ok',
    'conforme combinado',
    'solicitado'
  ];

  const normalizado = limpo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (genericos.map(g => g.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')).includes(normalizado)) {
    return {
      valido: false,
      erro: 'Informe uma observação detalhada e significativa sobre os motivos e condições do acordo (termos genéricos não são permitidos).'
    };
  }

  return { valido: true, observacao: limpo };
}

/**
 * Executa o encerramento seguro e idempotente de uma lista de parcelas originais
 * no CREESER e solicita a baixa bancária correspondente na EFI.
 *
 * @param {Object} params
 * @param {Object} params.supabase Cliente do Supabase
 * @param {Array<string>} params.parcelaIds Lista de IDs de parcelas originais
 * @param {string|UUID} params.ordemAcordoId ID da ordem do acordo
 * @param {string} params.motivo Texto para a observacao_baixa
 * @param {Object} params.operador Informações do operador
 * @returns {Promise<Object>} Resultado da operação com status e logs individuais por parcela
 */
async function encerrarCobrancasOriginais({ supabase, parcelaIds, ordemAcordoId, motivo, operador }) {
  if (!Array.isArray(parcelaIds) || parcelaIds.length === 0) {
    return { sucesso: true, parcelasCanceladas: [], resultadosEfi: [], pendenteEfi: false };
  }

  // 1. Buscar detalhes completos das parcelas originais
  const { data: parcelas, error: errParcelas } = await supabase
    .from('financeiro_parcelas')
    .select(`
      id,
      ordem_pagamento_id,
      numero_parcela,
      valor,
      data_vencimento,
      status,
      efi_charge_id,
      boleto_numero,
      financeiro_ordens_pagamento!ordem_pagamento_id (
        id,
        tipo,
        status,
        efi_charge_id,
        efi_carnet_id,
        descricao
      )
    `)
    .in('id', parcelaIds);

  if (errParcelas || !parcelas) {
    throw new Error('Falha ao consultar parcelas originais: ' + (errParcelas?.message || 'não encontradas'));
  }

  const resultadosEfi = [];
  let houveFalhaEfi = false;

  // 2. Para cada parcela, consultar a EFI e cancelar charge ou registrar situação
  for (const p of parcelas) {
    const chargeId = p.efi_charge_id || (p.financeiro_ordens_pagamento && p.financeiro_ordens_pagamento.tipo === 'ordem_simples' ? p.financeiro_ordens_pagamento.efi_charge_id : null);
    
    if (!chargeId) {
      resultadosEfi.push({
        parcela_id: p.id,
        charge_id: null,
        status: 'sem_cobranca_efi',
        mensagem: 'Parcela sem cobrança bancária EFI associada.',
        sucesso: true
      });
      continue;
    }

    try {
      const chargeIdNum = Number(chargeId);
      // Consulta a situação na EFI
      const chargeInfo = await efi.getCharge(chargeIdNum);
      const statusEfi = chargeInfo?.data?.status;

      if (statusEfi === 'paid' || statusEfi === 'settled') {
        resultadosEfi.push({
          parcela_id: p.id,
          charge_id: chargeId,
          status_anterior: statusEfi,
          status: 'ja_paga_na_efi',
          mensagem: 'Cobrança já constava como paga na EFI. Não cancelada.',
          sucesso: true
        });
        continue;
      }

      if (statusEfi === 'canceled') {
        resultadosEfi.push({
          parcela_id: p.id,
          charge_id: chargeId,
          status_anterior: statusEfi,
          status: 'ja_cancelada',
          mensagem: 'Cobrança já estava cancelada na EFI.',
          sucesso: true
        });
        continue;
      }

      // Se estiver ativa, cancelar oficialmente
      const carnetId = p.financeiro_ordens_pagamento?.efi_carnet_id;
      if (carnetId) {
        await efi.cancelCarnetParcel(Number(carnetId), Number(p.numero_parcela));
        resultadosEfi.push({
          parcela_id: p.id,
          charge_id: chargeId,
          carnet_id: carnetId,
          status_anterior: statusEfi,
          status: 'cancelado_efi_sucesso',
          mensagem: 'Parcela de carnê cancelada com sucesso na EFI.',
          sucesso: true
        });
      } else {
        await efi.cancelCharge(chargeIdNum);
        resultadosEfi.push({
          parcela_id: p.id,
          charge_id: chargeId,
          status_anterior: statusEfi,
          status: 'cancelado_efi_sucesso',
          mensagem: 'Cobrança bancária cancelada com sucesso na EFI.',
          sucesso: true
        });
      }
    } catch (errEfi) {
      console.error(`[encerrarCobrancasOriginais] Falha ao cancelar charge ${chargeId} na EFI:`, errEfi.message);
      houveFalhaEfi = true;
      resultadosEfi.push({
        parcela_id: p.id,
        charge_id: chargeId,
        status: 'falha_cancelamento_efi',
        erro: errEfi.message || 'Erro de comunicação bancária',
        sucesso: false
      });
    }
  }

  // 3. Atualizar no banco local do CREESER as parcelas para 'cancelado' (apenas as que ainda não estavam pagas)
  const parcelasParaCancelar = parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado').map(p => p.id);
  let parcelasAtualizadas = [];

  if (parcelasParaCancelar.length > 0) {
    const { data: updated, error: errUpdate } = await supabase
      .from('financeiro_parcelas')
      .update({
        status: 'cancelado',
        observacao_baixa: motivo || `Cancelada automaticamente por renegociação no Acordo (Ordem ${ordemAcordoId}).`,
        updated_at: new Date().toISOString()
      })
      .in('id', parcelasParaCancelar)
      .select('id, numero_parcela, valor, data_vencimento, status');

    if (errUpdate) {
      console.error('[encerrarCobrancasOriginais] Erro ao atualizar status das parcelas no banco:', errUpdate);
    } else {
      parcelasAtualizadas = updated || [];
    }
  }

  return {
    sucesso: true,
    parcelasCanceladas: parcelasAtualizadas,
    resultadosEfi,
    pendenteEfi: houveFalhaEfi
  };
}

/**
 * Registra ou atualiza o histórico na tabela `financeiro_negociacoes`
 * com suporte a fallback gracioso caso a tabela ainda não tenha sido criada via migration.
 */
async function registrarNegociacao({
  supabase,
  ordemId,
  alunoId,
  instituicaoId,
  unidadeId,
  operador,
  valorTotalOriginal,
  valorEncargos,
  valorDesconto,
  valorTotalNegociado,
  possuiEntrada,
  valorEntrada,
  tipoEntrada,
  entradaParcelaId,
  entradaPaga,
  dataPagamentoEntrada,
  valorSaldo,
  quantidadeParcelas,
  diaVencimentoParcelas,
  status,
  observacaoOperador,
  parcelasOriginais,
  parcelasGeradas,
  sincronizacaoEfi,
  eventoInicial
}) {
  const agora = new Date().toISOString();
  const eventos = [
    {
      tipo: eventoInicial || 'criacao_acordo',
      timestamp: agora,
      operador: operador?.email || 'sistema',
      detalhes: {
        status,
        possui_entrada: possuiEntrada,
        tipo_entrada: tipoEntrada,
        valor_entrada: valorEntrada,
        valor_total_negociado: valorTotalNegociado,
        qtd_parcelas: quantidadeParcelas
      }
    }
  ];

  const payload = {
    ordem_id: ordemId,
    aluno_id: Number(alunoId),
    instituicao_id: instituicaoId || null,
    unidade_id: unidadeId ? Number(unidadeId) : null,
    operador_id: operador?.id ? Number(operador.id) : null,
    operador_email: operador?.email || null,
    operador_perfil: operador?.perfil || null,
    valor_total_original: Number(valorTotalOriginal || 0),
    valor_encargos: Number(valorEncargos || 0),
    valor_desconto: Number(valorDesconto || 0),
    valor_total_negociado: Number(valorTotalNegociado || 0),
    possui_entrada: Boolean(possuiEntrada),
    valor_entrada: Number(valorEntrada || 0),
    tipo_entrada: tipoEntrada || 'sem_entrada',
    entrada_parcela_id: entradaParcelaId || null,
    entrada_paga: Boolean(entradaPaga),
    data_pagamento_entrada: dataPagamentoEntrada || null,
    valor_saldo: Number(valorSaldo || 0),
    quantidade_parcelas: Number(quantidadeParcelas || 1),
    dia_vencimento_parcelas: Number(diaVencimentoParcelas || 10),
    status: status || 'concluido',
    observacao_operador: observacaoOperador,
    parcelas_originais: parcelasOriginais || [],
    parcelas_geradas: parcelasGeradas || [],
    sincronizacao_efi: sincronizacaoEfi || [],
    eventos_historico: eventos,
    created_at: agora,
    updated_at: agora
  };

  try {
    const { data, error } = await supabase
      .from('financeiro_negociacoes')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[registrarNegociacao] Tabela financeiro_negociacoes não disponível ou erro no insert:', error.message);
    }
    return data || null;
  } catch (err) {
    console.warn('[registrarNegociacao] Exceção ao gravar financeiro_negociacoes:', err.message);
    return null;
  }
}

/**
 * Adiciona um novo evento append-only ao histórico de uma negociação existente.
 */
async function anexarEventoNegociacao({ supabase, ordemId, tipoEvento, operadorEmail, detalhes, novoStatus, sincronizacaoEfiExtra }) {
  try {
    const { data: neg, error: findErr } = await supabase
      .from('financeiro_negociacoes')
      .select('id, eventos_historico, sincronizacao_efi, status')
      .eq('ordem_id', ordemId)
      .maybeSingle();

    if (findErr || !neg) return false;

    const agora = new Date().toISOString();
    const eventos = Array.isArray(neg.eventos_historico) ? [...neg.eventos_historico] : [];
    eventos.push({
      tipo: tipoEvento,
      timestamp: agora,
      operador: operadorEmail || 'sistema',
      detalhes: detalhes || {}
    });

    const updatePayload = {
      eventos_historico: eventos,
      updated_at: agora
    };

    if (novoStatus) {
      updatePayload.status = novoStatus;
    }

    if (sincronizacaoEfiExtra) {
      const syncList = Array.isArray(neg.sincronizacao_efi) ? [...neg.sincronizacao_efi] : [];
      if (Array.isArray(sincronizacaoEfiExtra)) {
        syncList.push(...sincronizacaoEfiExtra);
      } else {
        syncList.push(sincronizacaoEfiExtra);
      }
      updatePayload.sincronizacao_efi = syncList;
    }

    await supabase
      .from('financeiro_negociacoes')
      .update(updatePayload)
      .eq('id', neg.id);

    return true;
  } catch (err) {
    console.error('[anexarEventoNegociacao] Erro ao anexar evento:', err.message);
    return false;
  }
}

module.exports = {
  validarObservacaoOperador,
  encerrarCobrancasOriginais,
  registrarNegociacao,
  anexarEventoNegociacao
};
