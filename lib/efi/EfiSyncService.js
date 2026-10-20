const efi = require('../efi-client');

/**
 * Serviço de Sincronização de Baixas com o EFI Bank (Efí Pay).
 * Realiza a consulta e o cancelamento/baixa bancária oficial na EFI
 * quando uma baixa manual é efetuada no CREESER.
 */
async function sincronizarBaixaEfi({ supabase, ordemId, usuarioId }) {
  const agora = new Date().toISOString();

  // 1. Buscar a ordem e suas parcelas para identificar as cobranças EFI vinculadas
  const { data: ordem, error: errOrdem } = await supabase
    .from('financeiro_ordens_pagamento')
    .select(`
      id,
      tipo,
      status,
      efi_charge_id,
      efi_carnet_id,
      efi_status,
      instituicao_id,
      aluno_id
    `)
    .eq('id', ordemId)
    .maybeSingle();

  if (errOrdem || !ordem) {
    throw new Error('Ordem não encontrada para sincronização EFI: ' + (errOrdem?.message || 'ID inválido'));
  }

  const { data: parcelas } = await supabase
    .from('financeiro_parcelas')
    .select('id, efi_charge_id, status')
    .eq('ordem_pagamento_id', ordemId);

  // Coletar todos os chargeIds únicos vinculados
  const chargeIdsSet = new Set();
  if (ordem.efi_charge_id) chargeIdsSet.add(String(ordem.efi_charge_id));
  if (Array.isArray(parcelas)) {
    for (const p of parcelas) {
      if (p.efi_charge_id) chargeIdsSet.add(String(p.efi_charge_id));
    }
  }

  const chargeIds = Array.from(chargeIdsSet);
  const carnetId = ordem.efi_carnet_id ? String(ordem.efi_carnet_id) : null;

  // Se não possuir cobrança bancária na EFI
  if (chargeIds.length === 0 && !carnetId) {
    return {
      sucesso: true,
      efiVinculada: false,
      syncStatus: 'nao_aplicavel',
      mensagem: 'Esta ordem não possui cobrança bancária vinculada à EFI.',
      detalhes: null,
    };
  }

  // 2. Realizar a sincronização com a API oficial da EFI
  const resultados = [];
  let houveErro = false;
  let ultimoErroMsg = '';
  let statusFinalEfi = 'canceled';

  try {
    // A) Processar cobranças individuais (charge_id)
    for (const cid of chargeIds) {
      try {
        const idNum = Number(cid);
        // 2.1 Consultar o status atualizado na EFI
        const chargeData = await efi.getCharge(idNum);
        const statusEfi = chargeData?.data?.status; // 'waiting', 'paid', 'settled', 'canceled', 'unpaid', etc.

        // 2.2 Se a EFI já indicar pagamento, não cancelar nem duplicar quitação
        if (statusEfi === 'paid' || statusEfi === 'settled') {
          statusFinalEfi = 'paid';
          resultados.push({
            chargeId: cid,
            statusAnterior: statusEfi,
            acao: 'conciliado_ja_pago',
            sucesso: true,
            mensagem: 'Cobrança já constava como quitada na EFI.',
          });
          continue;
        }

        // 2.3 Se já estiver cancelada
        if (statusEfi === 'canceled') {
          resultados.push({
            chargeId: cid,
            statusAnterior: statusEfi,
            acao: 'ja_cancelado',
            sucesso: true,
            mensagem: 'Cobrança já se encontrava cancelada na EFI.',
          });
          continue;
        }

        // 2.4 Se estiver ativa ('waiting', 'unpaid', 'new', 'link'), solicitar cancelamento/baixa bancária oficial
        await efi.cancelCharge(idNum);
        resultados.push({
          chargeId: cid,
          statusAnterior: statusEfi,
          acao: 'cancelado_com_sucesso',
          sucesso: true,
          mensagem: 'Cobrança cancelada com sucesso na EFI.',
        });
      } catch (errCharge) {
        console.error(`[EfiSyncService] Erro ao sincronizar charge ${cid}:`, errCharge);
        houveErro = true;
        ultimoErroMsg = errCharge.message || 'Erro de comunicação com a EFI';
        resultados.push({
          chargeId: cid,
          acao: 'falha_cancelamento',
          sucesso: false,
          erro: errCharge.message,
          detalhes: errCharge.efiResponse || null,
        });
      }
    }

    // B) Processar carnê inteiro se aplicável
    if (carnetId) {
      try {
        const carnetNum = Number(carnetId);
        const carnetData = await efi.getCarnet(carnetNum);
        const statusCarnet = carnetData?.data?.status;

        if (statusCarnet !== 'canceled' && statusCarnet !== 'paid' && statusCarnet !== 'settled') {
          await efi.cancelCarnet(carnetNum);
          resultados.push({
            carnetId,
            statusAnterior: statusCarnet,
            acao: 'carnet_cancelado_com_sucesso',
            sucesso: true,
          });
        }
      } catch (errCarnet) {
        console.error(`[EfiSyncService] Erro ao sincronizar carnê ${carnetId}:`, errCarnet);
        houveErro = true;
        ultimoErroMsg = errCarnet.message || 'Erro ao cancelar carnê na EFI';
        resultados.push({
          carnetId,
          acao: 'falha_cancelamento_carne',
          sucesso: false,
          erro: errCarnet.message,
        });
      }
    }
  } catch (errGeral) {
    houveErro = true;
    ultimoErroMsg = errGeral.message;
  }

  const syncStatus = houveErro ? 'pendente' : 'sincronizado';
  const efiStatusFinal = houveErro ? 'sync_pending' : statusFinalEfi;

  // 3. Atualizar registros no CREESER de forma resiliente
  try {
    // Tenta atualizar incluindo as colunas dedicadas efi_sync_*
    const updateCompleto = {
      efi_status: efiStatusFinal,
      efi_sync_status: syncStatus,
      efi_sync_at: agora,
      efi_sync_erro: houveErro ? String(ultimoErroMsg).slice(0, 500) : null,
      updated_at: agora,
    };

    const { error: errUpdateCompleto } = await supabase
      .from('financeiro_ordens_pagamento')
      .update(updateCompleto)
      .eq('id', ordemId);

    // Se as colunas novas ainda não tiverem sido criadas (código 42703), salva no efi_status nativo
    if (errUpdateCompleto && (errUpdateCompleto.code === '42703' || String(errUpdateCompleto.message).includes('does not exist'))) {
      await supabase
        .from('financeiro_ordens_pagamento')
        .update({
          efi_status: efiStatusFinal,
          updated_at: agora,
        })
        .eq('id', ordemId);
    }
  } catch (dbErr) {
    console.warn('[EfiSyncService] Erro ao atualizar status na ordem:', dbErr);
  }

  // 4. Registro de auditoria nos logs financeiros
  try {
    await supabase.from('financeiro_logs').insert({
      aluno_id: ordem.aluno_id || null,
      instituicao_id: ordem.instituicao_id || null,
      usuario_id: usuarioId || null,
      acao: 'sincronizacao_efi_baixa_manual',
      data_pagamento: agora.split('T')[0],
      observacao: houveErro
        ? `Sincronização EFI Pendente: ${ultimoErroMsg}`
        : `Cobrança EFI sincronizada e encerrada (${statusFinalEfi})`,
      dados_extras: {
        ordem_id: ordemId,
        charge_ids: chargeIds,
        carnet_id: carnetId,
        sync_status: syncStatus,
        resultados,
      },
    });
  } catch (_) {}

  return {
    sucesso: !houveErro,
    efiVinculada: true,
    syncStatus,
    mensagem: houveErro
      ? `Sincronização EFI pendente: ${ultimoErroMsg}`
      : (statusFinalEfi === 'paid' ? 'Cobrança já constava como quitada na EFI.' : 'Cobrança encerrada e sincronizada na EFI com sucesso.'),
    detalhes: {
      chargeIds,
      carnetId,
      resultados,
      syncStatus,
    },
  };
}

module.exports = { sincronizarBaixaEfi };
