/**
 * POST /api/admin-financeiro/efi/webhook
 *
 * Recebe notificações da EFI Bank quando o status de uma cobrança muda.
 *
 * FLUXO (2 etapas — conforme documentação EFI):
 *   1. EFI faz POST aqui com body: notification=<token>  (form-urlencoded)
 *   2. Este handler consulta GET /v1/notification/:token na EFI
 *   3. Processa cada evento do array data[] e atualiza o banco
 *
 * Cadastre esta URL na cobrança via notification_url:
 *   https://seu-dominio.com/api/admin-financeiro/efi/webhook
 *
 * Mapeamento de status EFI → banco local:
 *   new       → pendente  (cobrança criada na EFI)
 *   waiting   → pendente  (boleto emitido, aguardando pagamento)
 *   paid      → pago
 *   settled   → pago      (marcado manualmente)
 *   unpaid    → vencido
 *   expired   → vencido
 *   canceled  → cancelado
 *   identified→ pago      (pagamento identificado pelo banco)
 */

import { createClient } from '@supabase/supabase-js';
import efi from '../../../../lib/efi-client';

// Desabilitar parser padrão — EFI envia multipart/form-data ou x-www-form-urlencoded
export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Status EFI → status no nosso banco
const STATUS_MAP = {
  new: 'pendente',
  waiting: 'pendente',
  paid: 'pago',
  settled: 'pago',
  identified: 'pago',
  unpaid: 'vencido',
  expired: 'vencido',
  canceled: 'cancelado',
};

// Status que significam pagamento confirmado
const PAGOS = new Set(['paid', 'settled', 'identified']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Ler body raw (form-urlencoded)
    const rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    // Parsear: "notification=TOKEN"
    const params = new URLSearchParams(rawBody);
    const token = params.get('notification');

    if (!token) {
      console.warn('[EFI Webhook] Body sem campo notification:', rawBody);
      return res.status(400).json({ message: 'Token de notificação ausente.' });
    }

    // 2. Consultar os detalhes na EFI — isso confirma para a EFI que recebemos
    const notification = await efi.getNotification(token);
    const eventos = notification?.data || [];

    if (!eventos.length) {
      return res.status(200).json({ message: 'Nenhum evento para processar.' });
    }

    // 3. Processar cada evento (podem vir vários na mesma notificação)
    for (const evento of eventos) {
      const chargeId = evento.identifiers?.charge_id;
      const statusAtual = evento.status?.current;

      if (!chargeId || !statusAtual) continue;

      const statusLocal = STATUS_MAP[statusAtual];
      if (!statusLocal) continue;

      await processarEvento(chargeId, statusAtual, statusLocal, evento);
    }

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    console.error('[EFI Webhook]', err);
    // Retornar 500 faz a EFI retentar (até 10x conforme documentação)
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function processarEvento(chargeId, statusEFI, statusLocal, evento) {
  const chargeIdStr = String(chargeId);

  // ── Buscar parcela pelo efi_charge_id ──────────────────────────────────────
  const { data: parcela, error } = await supabase
    .from('financeiro_parcelas')
    .select('id, ordem_pagamento_id, status, numero_parcela')
    .eq('efi_charge_id', chargeIdStr)
    .maybeSingle();

  if (error) {
    console.error('[EFI Webhook] Erro ao buscar parcela:', error);
    return;
  }

  if (!parcela) {
    // charge_id pode ser de uma ordem_simples registrada na tabela de boletos
    const { data: boleto } = await supabase
      .from('financeiro_boletos')
      .select('parcela_id')
      .eq('boleto_id_gateway', chargeIdStr)
      .eq('gateway', 'efi')
      .maybeSingle();

    if (!boleto) {
      console.warn('[EFI Webhook] charge_id não encontrado no banco:', chargeIdStr);
      return;
    }

    await atualizarParcelaEOrdem(boleto.parcela_id, statusLocal, statusEFI, evento);
    return;
  }

  await atualizarParcelaEOrdem(parcela.id, statusLocal, statusEFI, evento, parcela.ordem_pagamento_id);
}

async function atualizarParcelaEOrdem(parcelaId, statusLocal, statusEFI, evento, ordemId = null) {
  // Campos extras para pagamento confirmado
  const extrasParcela = {};
  if (PAGOS.has(statusEFI)) {
    extrasParcela.data_pagamento = evento.received_by_bank_at || new Date().toISOString().slice(0, 10);
    if (evento.value) extrasParcela.valor_pago = evento.value / 100;
  }

  // Atualizar parcela
  await supabase
    .from('financeiro_parcelas')
    .update({ status: statusLocal, ...extrasParcela })
    .eq('id', parcelaId);

  // Atualizar registro em financeiro_boletos
  await supabase
    .from('financeiro_boletos')
    .update({ status_gateway: statusEFI })
    .eq('parcela_id', parcelaId)
    .eq('gateway', 'efi');

  // Atualizar efi_status na ordem (usa o id da ordem se disponível)
  if (ordemId) {
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({ efi_status: statusEFI })
      .eq('id', ordemId);

    // Se todas as parcelas da ordem estão pagas → encerrar a ordem
    if (PAGOS.has(statusEFI)) {
      const { data: parcelas } = await supabase
        .from('financeiro_parcelas')
        .select('status')
        .eq('ordem_pagamento_id', ordemId);

      const todasPagas = parcelas?.every(p => p.status === 'pago');
      if (todasPagas) {
        await supabase
          .from('financeiro_ordens_pagamento')
          .update({ status: 'encerrado', efi_status: statusEFI })
          .eq('id', ordemId);
      }
    }
  }

  console.log(`[EFI Webhook] parcela ${parcelaId} → ${statusLocal} (EFI: ${statusEFI})`);
}
