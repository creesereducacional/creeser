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

      // 3.1 Verificar se a ordem pai de cada parcela teve TODAS as suas parcelas canceladas/pagas
      // Se sim, atualizar o status da ordem pai para 'cancelado' (ou 'concluido' se todas pagas)
      const ordensPaiIds = Array.from(new Set(parcelas.map(p => p.ordem_pagamento_id).filter(Boolean)));
      for (const ordemPaiId of ordensPaiIds) {
        try {
          const { data: todasParcelasOrdem } = await supabase
            .from('financeiro_parcelas')
            .select('id, status')
            .eq('ordem_pagamento_id', ordemPaiId);

          if (todasParcelasOrdem && todasParcelasOrdem.length > 0) {
            const ativas = todasParcelasOrdem.filter(p => p.status !== 'cancelado' && p.status !== 'pago');
            if (ativas.length === 0) {
              const temPaga = todasParcelasOrdem.some(p => p.status === 'pago');
              const novoStatusOrdem = temPaga ? 'concluido' : 'cancelado';
              await supabase
                .from('financeiro_ordens_pagamento')
                .update({
                  status: novoStatusOrdem,
                  updated_at: new Date().toISOString()
                })
                .eq('id', ordemPaiId);
              console.log(`[encerrarCobrancasOriginais] Ordem pai ${ordemPaiId} atualizada para ${novoStatusOrdem}`);
            }
          }
        } catch (errOrdemPai) {
          console.warn(`[encerrarCobrancasOriginais] Falha ao verificar/atualizar ordem pai ${ordemPaiId}:`, errOrdemPai?.message);
        }
      }
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

/**
 * Emite automaticamente as cobranças EFI para as parcelas de saldo de um acordo.
 * Se uma parcela falhar, não aborta as outras nem o acordo; registra detalhadamente o status.
 *
 * @param {object} params
 * @param {object} params.supabase - Cliente Supabase autenticado com service role
 * @param {string|number} params.ordemId - ID da ordem de pagamento (acordo)
 * @param {object} [params.aluno] - Objeto do aluno (opcional; se omitido, busca no banco)
 * @param {string|number} [params.instituicaoId] - ID da instituição (opcional)
 * @param {string} [params.operadorEmail] - Email do operador para registrar nos eventos
 * @returns {Promise<{ sucesso: boolean, totalEmitidas: number, totalFalhas: number, parcelasEmitidas: Array, resultados: Array }>}
 */
/**
 * Emite automaticamente o CARNÊ EFI com as parcelas de saldo de um acordo financeiro formalizado.
 * Em vez de emitir cobranças avulsas em loop, cria um único carnê na EFI (createCarnet)
 * vinculando todas as parcelas de saldo, com identificador único (carnet_id) e charges individuais.
 *
 * @param {Object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.supabase
 * @param {string} params.ordemId - ID da ordem do acordo (tipo 'acordo')
 * @param {Object} [params.aluno] - Objeto do aluno com nome, cpf, etc.
 * @param {number} [params.instituicaoId] - ID da instituição
 * @param {string} [params.operadorEmail] - Email do operador para registrar nos eventos
 * @returns {Promise<{ sucesso: boolean, carnetId?: string|number, link?: string, totalEmitidas: number, totalFalhas: number, parcelasEmitidas: Array, resultados: Array }>}
 */
async function emitirCobrancasSaldoAcordo({
  supabase,
  ordemId,
  aluno = null,
  instituicaoId = null,
  operadorEmail = 'sistema'
}) {
  const efi = require('./efi-client');

  const resultados = [];
  const parcelasEmitidas = [];
  let totalEmitidas = 0;
  let totalFalhas = 0;

  try {
    // 1. Carregar ordem se necessário
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, aluno_id, instituicao_id, descricao, entrada_parcela_id, efi_carnet_id, status')
      .eq('id', ordemId)
      .single();

    if (ordemErr || !ordem) {
      console.error('[emitirCobrancasSaldoAcordo] Ordem não encontrada:', ordemId, ordemErr?.message);
      return { sucesso: false, erro: 'Ordem não encontrada', resultados: [] };
    }

    // Idempotência: se o carnê já existe na ordem, não reemitir
    if (ordem.efi_carnet_id) {
      console.log('[emitirCobrancasSaldoAcordo] Carnê EFI já emitido para a ordem:', ordem.efi_carnet_id);
      return {
        sucesso: true,
        carnetId: ordem.efi_carnet_id,
        jaEmitido: true,
        totalEmitidas: 0,
        totalFalhas: 0,
        parcelasEmitidas: [],
        resultados: []
      };
    }

    const instId = instituicaoId || ordem.instituicao_id;
    const alunoId = ordem.aluno_id;

    // 2. Carregar aluno completo se não fornecido
    let alunoObj = aluno;
    if (!alunoObj || !alunoObj.nome || !alunoObj.cpf) {
      const { data: alunoDb } = await supabase
        .from('alunos')
        .select('id, nome, cpf, email, data_nascimento, telefone_celular, turmaid, cursoid')
        .eq('id', alunoId)
        .maybeSingle();
      alunoObj = alunoDb;
    }

    if (!alunoObj) {
      console.error('[emitirCobrancasSaldoAcordo] Aluno não encontrado para a ordem:', alunoId);
      return { sucesso: false, erro: 'Aluno não encontrado', resultados: [] };
    }

    const cpfLimpo = (alunoObj.cpf || '').replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return { sucesso: false, erro: 'CPF do aluno inválido ou ausente.', resultados: [] };
    }

    // 3. Buscar configurações financeiras da instituição
    const { data: configEmpresa } = await supabase
      .from('configuracoes_empresa')
      .select('financeiro')
      .eq('instituicao_id', instId)
      .maybeSingle();
    const configFinanceiro = configEmpresa?.financeiro || {};

    const notificationUrl =
      process.env.EFI_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_URL}/api/admin-financeiro/efi/webhook`;

    // 4. Buscar parcelas de saldo pendentes (que não sejam a entrada e ainda sem efi_charge_id)
    const { data: parcelasSaldo, error: pErr } = await supabase
      .from('financeiro_parcelas')
      .select('id, ordem_pagamento_id, numero_parcela, valor, valor_nominal, valor_desconto, valor_final, data_limite_desconto, data_vencimento, status, efi_charge_id, boleto_url, boleto_barcode')
      .eq('ordem_pagamento_id', ordem.id)
      .eq('status', 'pendente')
      .order('numero_parcela', { ascending: true });

    if (pErr) {
      console.error('[emitirCobrancasSaldoAcordo] Erro ao buscar parcelas:', pErr.message);
      return { sucesso: false, erro: pErr.message, resultados: [] };
    }

    const parcelasParaEmitir = (parcelasSaldo || []).filter(
      p => p.id !== ordem.entrada_parcela_id && !p.efi_charge_id
    );

    if (parcelasParaEmitir.length === 0) {
      return {
        sucesso: true,
        message: 'Nenhuma parcela pendente para emissão de carnê.',
        totalEmitidas: 0,
        totalFalhas: 0,
        parcelasEmitidas: [],
        resultados: []
      };
    }

    // Buscar curso e turma para descrição legível
    const { data: turma } = alunoObj.turmaid
      ? await supabase.from('turmas').select('nome').eq('id', alunoObj.turmaid).maybeSingle()
      : { data: null };

    const { data: curso } = alunoObj.cursoid
      ? await supabase.from('cursos').select('nome').eq('id', alunoObj.cursoid).maybeSingle()
      : { data: null };

    const descRef = `Acordo #${String(ordem.id).slice(0, 8)} | Aluno: ${alunoObj.nome} | Curso: ${curso?.nome || 'Geral'}`.slice(0, 100);

    const valorBase = parcelasParaEmitir[0].valor_nominal !== undefined && parcelasParaEmitir[0].valor_nominal !== null
      ? Number(parcelasParaEmitir[0].valor_nominal)
      : Number(parcelasParaEmitir[0].valor);
    const valorCentavos = Math.round(valorBase * 100);
    const primeiroVencimento = parcelasParaEmitir[0].data_vencimento;

    const phoneDigits = (alunoObj.telefone_celular || '').replace(/\D/g, '');
    const birthRaw = alunoObj.data_nascimento || null;
    const birth = birthRaw ? String(birthRaw).substring(0, 10) : undefined;

    const customer = {
      name: alunoObj.nome,
      cpf: cpfLimpo,
    };
    if (alunoObj.email) customer.email = alunoObj.email;
    if (phoneDigits.length === 10 || phoneDigits.length === 11) customer.phone_number = phoneDigits;
    if (birth && /^\d{4}-\d{2}-\d{2}$/.test(birth)) customer.birth = birth;

    const configurations = {};
    const multaPercentual = Number(configFinanceiro.multaGerencianet) || Number(configFinanceiro.multa) || 0;
    if (multaPercentual > 0) {
      configurations.fine = Math.round(multaPercentual * 100);
    }
    const jurosPercentualDiario = Number(configFinanceiro.jurosGerencianet) || Number(configFinanceiro.juros) || 0;
    if (jurosPercentualDiario > 0) {
      configurations.interest = Math.round(jurosPercentualDiario * 1000);
    }

    const discountValue = Number(parcelasParaEmitir[0].valor_desconto) || 0;
    const dataLimiteDesconto = parcelasParaEmitir[0].data_limite_desconto || null;
    const discount = {};
    const conditionalDiscount = {};

    if (discountValue > 0) {
      if (dataLimiteDesconto) {
        conditionalDiscount.type = 'currency';
        conditionalDiscount.value = Math.round(discountValue * 100);
        conditionalDiscount.until_date = dataLimiteDesconto;
      } else {
        discount.value = Math.round(discountValue * 100);
        discount.type = 'currency';
      }
    }

    const carnetPayload = {
      items: [{ name: descRef, value: valorCentavos, amount: 1 }],
      customer,
      expire_at: primeiroVencimento,
      repeats: parcelasParaEmitir.length,
      split_items: false,
      metadata: notificationUrl ? { notification_url: notificationUrl } : undefined,
    };

    if (Object.keys(configurations).length > 0) {
      carnetPayload.configurations = configurations;
    }
    if (Object.keys(conditionalDiscount).length > 0) {
      carnetPayload.conditional_discount = conditionalDiscount;
    } else if (Object.keys(discount).length > 0) {
      carnetPayload.discount = discount;
    }

    console.log('[emitirCobrancasSaldoAcordo][CARNE EFI] Emitindo carnê com payload:', JSON.stringify(carnetPayload, null, 2));

    const carnetData = await efi.createCarnet(carnetPayload);
    const carnet = carnetData.data;
    const carnetId = carnet.carnet_id;
    const charges = carnet.charges || [];
    const carnetLink = carnet.link || carnet.carnet_link || carnet.pdf?.carnet || null;

    // Atualizar cada parcela associada na ordem sequencial
    for (let i = 0; i < parcelasParaEmitir.length; i++) {
      const parcela = parcelasParaEmitir[i];
      const chargeInfo = charges[i];
      if (!chargeInfo) continue;

      const chargeId = chargeInfo.charge_id;
      const billet = chargeInfo.parcel || {};
      const parcelUrl = chargeInfo.url || chargeInfo.parcel_link || chargeInfo.pdf?.charge || billet.link || null;
      const barcode = chargeInfo.barcode || billet.barcode || null;

      // Gravar registro na tabela de boletos para auditoria / fallback
      await supabase.from('financeiro_boletos').insert({
        parcela_id: parcela.id,
        instituicao_id: instId,
        gateway: 'efi',
        boleto_id_gateway: String(chargeId),
        boleto_barcode: barcode,
        boleto_url: parcelUrl,
        status_gateway: 'waiting',
        resposta_json: chargeInfo,
      });

      // Atualizar parcela
      await supabase
        .from('financeiro_parcelas')
        .update({
          efi_charge_id: String(chargeId),
          boleto_barcode: barcode,
          boleto_url: parcelUrl,
        })
        .eq('id', parcela.id);

      totalEmitidas++;
      const itemRes = {
        parcela_id: parcela.id,
        numero_parcela: parcela.numero_parcela,
        charge_id: String(chargeId),
        boleto_url: parcelUrl,
        barcode,
        vencimento: parcela.data_vencimento,
        sucesso: true
      };
      resultados.push(itemRes);
      parcelasEmitidas.push(itemRes);
    }

    // Persistir efi_carnet_id na ordem do acordo
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({
        efi_carnet_id: String(carnetId),
        efi_status: 'waiting'
      })
      .eq('id', ordem.id);

    // Anexar evento no histórico estruturado da negociação
    await anexarEventoNegociacao({
      supabase,
      ordemId: ordem.id,
      tipoEvento: 'emissao_carne_saldo_efi',
      operadorEmail,
      detalhes: {
        carnet_id: carnetId,
        link_carne: carnetLink,
        total_parcelas_carne: parcelasParaEmitir.length,
        resultados
      },
      sincronizacaoEfiExtra: resultados.map(r => ({
        parcela_id: r.parcela_id,
        numero_parcela: r.numero_parcela,
        charge_id: r.charge_id,
        status: 'carne_emitido_efi',
        sucesso: true
      }))
    });

    return {
      sucesso: true,
      carnetId,
      link: carnetLink,
      totalEmitidas,
      totalFalhas: 0,
      parcelasEmitidas,
      resultados
    };

  } catch (err) {
    totalFalhas++;
    console.error('[emitirCobrancasSaldoAcordo][CARNE EFI] Falha na emissão:', err.efiResponse || err.message);

    // Anexar evento de falha no histórico da negociação
    try {
      await anexarEventoNegociacao({
        supabase,
        ordemId: ordem.id,
        tipoEvento: 'falha_emissao_carne_efi',
        operadorEmail,
        detalhes: {
          erro: err.message,
          detalhes_efi: err.efiResponse || null
        },
        novoStatus: 'sync_pendente'
      });
    } catch (_) {}

    return {
      sucesso: false,
      erro: err.message || 'Falha ao emitir carnê na EFI',
      totalEmitidas,
      totalFalhas,
      parcelasEmitidas,
      resultados
    };
  }
}

module.exports = {
  validarObservacaoOperador,
  encerrarCobrancasOriginais,
  registrarNegociacao,
  anexarEventoNegociacao,
  emitirCobrancasSaldoAcordo
};
