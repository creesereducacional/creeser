// pages/api/admin-financeiro/parcelas/[id]/sincronizar-efi.js
// POST — Consulta e sincroniza a situação de uma cobrança bancária individual na EFI

import { createClient } from '@supabase/supabase-js';
import efi from '../../../../../lib/efi-client';
import {
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';
import { anexarEventoNegociacao } from '../../../../../lib/negociacoes-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'ID da parcela é obrigatório.' });
  }

  try {
    // 1. Buscar a parcela e a ordem vinculada
    const { data: parcela, error: parcErr } = await supabase
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
        boleto_url,
        boleto_barcode,
        metodo_pagamento,
        valor_pago,
        data_pagamento,
        ordem:financeiro_ordens_pagamento!ordem_pagamento_id (
          id,
          tipo,
          status,
          instituicao_id,
          aluno_id,
          descricao
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (parcErr || !parcela) {
      return res.status(404).json({ message: 'Parcela não encontrada.' });
    }

    if (!isGroupAdmin) {
      const instParcela = parcela.ordem?.instituicao_id;
      if (userInstituicaoId && instParcela && userInstituicaoId !== instParcela) {
        return res.status(403).json({ message: 'Acesso negado: a parcela pertence a outra instituição.' });
      }
    }

    if (!parcela.efi_charge_id) {
      return res.status(200).json({
        sucesso: true,
        efi_vinculada: false,
        status: parcela.status,
        message: 'Esta parcela ainda não possui cobrança bancária emitida na EFI Bank.',
        parcela
      });
    }

    // 2. Consultar cobrança na EFI
    const chargeIdNum = Number(parcela.efi_charge_id);
    const chargeData = await efi.getCharge(chargeIdNum);
    const efiResp = chargeData?.data || {};
    const statusEfi = efiResp.status; // 'waiting', 'paid', 'settled', 'canceled', 'unpaid', etc.

    const updates = {};
    const hojeStr = new Date().toISOString().split('T')[0];

    // Atualizar links/barcodes se disponíveis
    const billet = efiResp.payment?.banking_billet || {};
    const novoBoletoUrl = billet.link || billet.pdf?.charge || efiResp.link || null;
    const novoBarcode = billet.barcode || efiResp.barcode || null;

    if (novoBoletoUrl && novoBoletoUrl !== parcela.boleto_url) {
      updates.boleto_url = novoBoletoUrl;
    }
    if (novoBarcode && novoBarcode !== parcela.boleto_barcode) {
      updates.boleto_barcode = novoBarcode;
    }

    let statusMudou = false;

    if (statusEfi === 'paid' || statusEfi === 'settled') {
      if (parcela.status !== 'pago') {
        updates.status = 'pago';
        updates.data_pagamento = efiResp.paid_at ? String(efiResp.paid_at).split('T')[0] : hojeStr;
        updates.valor_pago = efiResp.total ? Number(efiResp.total) / 100 : Number(parcela.valor);
        updates.metodo_pagamento = efiResp.payment_method || 'efi';
        updates.observacoes = (parcela.observacoes ? parcela.observacoes + ' | ' : '') + 'Quitação confirmada via sincronização bancária EFI.';
        statusMudou = true;
      }
    } else if (statusEfi === 'canceled') {
      if (parcela.status !== 'cancelado') {
        updates.status = 'cancelado';
        updates.observacao_baixa = 'Cancelada no gateway bancário EFI.';
        statusMudou = true;
      }
    }

    let parcelaAtualizada = parcela;

    if (Object.keys(updates).length > 0) {
      const { data: updated, error: updErr } = await supabase
        .from('financeiro_parcelas')
        .update(updates)
        .eq('id', parcela.id)
        .select()
        .single();

      if (!updErr && updated) {
        parcelaAtualizada = { ...parcela, ...updated };
      }
    }

    // Se for parcela de Acordo e houve confirmação de quitação, registrar evento na negociação
    if (parcela.ordem?.tipo === 'acordo' && statusMudou) {
      try {
        await anexarEventoNegociacao({
          supabase,
          ordemId: parcela.ordem.id,
          tipoEvento: `sincronizacao_efi_${statusEfi}`,
          operadorEmail: authUser.email,
          detalhes: {
            parcela_id: parcela.id,
            numero_parcela: parcela.numero_parcela,
            status_anterior: parcela.status,
            novo_status: updates.status || parcela.status,
            status_efi: statusEfi,
            charge_id: parcela.efi_charge_id
          }
        });
      } catch (_) {}
    }

    const mensagemStatus = {
      waiting: 'Cobrança bancária ativa na EFI e aguardando pagamento pelo aluno.',
      paid: 'Cobrança confirmada como PAGA na EFI Bank. Parcela baixada.',
      settled: 'Cobrança confirmada como LIQUIDADA na EFI Bank. Parcela baixada.',
      canceled: 'Cobrança consta como CANCELADA na EFI Bank.',
      unpaid: 'Cobrança consta como NÃO PAGA na EFI Bank.'
    }[statusEfi] || `Situação na EFI: ${statusEfi}`;

    return res.status(200).json({
      sucesso: true,
      efi_vinculada: true,
      status_efi: statusEfi,
      status_local: parcelaAtualizada.status,
      message: mensagemStatus,
      parcela: parcelaAtualizada,
      charge_id: parcela.efi_charge_id,
      boleto_url: parcelaAtualizada.boleto_url,
      barcode: parcelaAtualizada.boleto_barcode
    });

  } catch (err) {
    console.error('[parcelas/sincronizar-efi] Erro:', err);
    return res.status(500).json({
      message: 'Falha ao sincronizar situação na EFI: ' + (err.message || 'Erro desconhecido'),
      erro: err.message
    });
  }
}
