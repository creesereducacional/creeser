/**
 * POST /api/admin-financeiro/efi/cobranca
 *   Cria um boleto único na EFI para uma parcela de ordem_simples.
 *   Body: {
 *     parcela_id   — UUID da parcela em financeiro_parcelas
 *     descricao    — texto do item no boleto (ex: "Mensalidade Junho/2026")
 *   }
 *
 * DELETE /api/admin-financeiro/efi/cobranca
 *   Cancela a cobrança na EFI e marca no banco.
 *   Body: { ordem_id — UUID da ordem em financeiro_ordens_pagamento }
 */

import { createClient } from '@supabase/supabase-js';
import efi from '../../../../lib/efi-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') return criarCobranca(req, res);
  if (req.method === 'DELETE') return cancelarCobranca(req, res);
  return res.status(405).json({ message: 'Método não permitido' });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Criar boleto único
// ─────────────────────────────────────────────────────────────────────────────
async function criarCobranca(req, res) {
  try {
    const { parcela_id, descricao } = req.body;

    if (!parcela_id || !descricao) {
      return res.status(400).json({ message: 'parcela_id e descricao são obrigatórios.' });
    }

    // 1. Buscar parcela + aluno
    const { data: parcela, error: parcelaErr } = await supabase
      .from('financeiro_parcelas')
      .select(`
        id, ordem_pagamento_id, numero_parcela, valor, data_vencimento, status,
        ordem:financeiro_ordens_pagamento!inner ( id, tipo, efi_charge_id ),
        aluno:alunos!inner ( id, nome, cpf, email, data_nascimento, telefone_celular )
      `)
      .eq('id', parcela_id)
      .single();

    if (parcelaErr || !parcela) {
      return res.status(404).json({ message: 'Parcela não encontrada.' });
    }

    if (parcela.status === 'cancelado') {
      return res.status(422).json({ message: 'Parcela já está cancelada.' });
    }

    if (parcela.ordem.tipo !== 'ordem_simples') {
      return res.status(422).json({ message: 'Use o endpoint /efi/carne para carnês.' });
    }

    if (parcela.ordem.efi_charge_id) {
      return res.status(422).json({
        message: 'Cobrança EFI já criada para esta ordem.',
        efi_charge_id: parcela.ordem.efi_charge_id,
      });
    }

    const aluno = parcela.aluno;
    const cpfLimpo = (aluno.cpf || '').replace(/\D/g, '');

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return res.status(422).json({ message: 'CPF do aluno inválido ou ausente.' });
    }

    // Valor em centavos (EFI sempre usa centavos)
    const valorCentavos = Math.round(Number(parcela.valor) * 100);

    // 2. Criar cobrança (charge) vazia na EFI
    const chargeData = await efi.createCharge([
      { name: descricao, value: valorCentavos, amount: 1 },
    ]);

    const chargeId = chargeData.data.charge_id;

    // Registrar notification_url via metadata (após criação do charge)
    const notificationUrl = process.env.EFI_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_URL}/api/admin-financeiro/efi/webhook`;

    if (notificationUrl) {
      await efi.updateChargeMetadata(chargeId, notificationUrl)
        .catch(err => console.warn('[EFI cobranca] Falha ao definir notification_url:', err.message));
    }

    // 3. Associar ao boleto bancário
    // phone_number: EFI exige exatamente 10 ou 11 dígitos
    const phoneDigits = (aluno.telefone_celular || '').replace(/\D/g, '');
    // birth: EFI exige YYYY-MM-DD — extrair só a parte da data se vier com timestamp
    const birthRaw = aluno.data_nascimento || null;
    const birth = birthRaw ? String(birthRaw).substring(0, 10) : undefined;

    const customer = {
      name: aluno.nome,
      cpf: cpfLimpo,
    };
    // Só inclui email se houver
    if (aluno.email) customer.email = aluno.email;
    // Só inclui phone se tiver 10 ou 11 dígitos
    if (phoneDigits.length === 10 || phoneDigits.length === 11) customer.phone_number = phoneDigits;
    // Só inclui birth se tiver formato YYYY-MM-DD válido
    if (birth && /^\d{4}-\d{2}-\d{2}$/.test(birth)) customer.birth = birth;

    console.log('[EFI cobranca] customer:', JSON.stringify(customer));
    console.log('[EFI cobranca] expire_at:', parcela.data_vencimento);

    const billetData = await efi.associateBillet(chargeId, {
      expire_at: parcela.data_vencimento,
      customer,
    });

    const billet = billetData.data;

    // 4. Salvar na tabela financeiro_boletos
    await supabase.from('financeiro_boletos').insert({
      parcela_id,
      gateway: 'efi',
      boleto_id_gateway: String(chargeId),
      boleto_numero: billet.identifications?.barcode || null,
      boleto_barcode: billet.identifications?.barcode || null,
      boleto_url: billet.link || null,
      status_gateway: 'waiting',
      resposta_json: billet,
    });

    // 5. Atualizar parcela com dados do boleto
    await supabase
      .from('financeiro_parcelas')
      .update({
        efi_charge_id: String(chargeId),
        boleto_barcode: billet.identifications?.barcode || null,
        boleto_url: billet.link || null,
      })
      .eq('id', parcela_id);

    // 6. Atualizar ordem com o charge_id
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({ efi_charge_id: String(chargeId), efi_status: 'waiting' })
      .eq('id', parcela.ordem_pagamento_id);

    return res.status(201).json({
      message: 'Boleto criado com sucesso.',
      charge_id: chargeId,
      boleto_url: billet.link,
      barcode: billet.identifications?.barcode,
      vencimento: parcela.data_vencimento,
    });
  } catch (err) {
    console.error('[EFI cobranca POST]', JSON.stringify(err.efiResponse || err.message));
    const status = err.statusCode === 401 ? 502 : err.statusCode >= 400 && err.statusCode < 500 ? 422 : 500;
    const efiDetail = err.efiResponse
      ? (err.efiResponse.error_description || err.efiResponse.message || JSON.stringify(err.efiResponse))
      : null;
    return res.status(status).json({
      message: efiDetail ? `${err.message}: ${efiDetail}` : err.message,
      efi: err.efiResponse || null,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Cancelar cobrança
// ─────────────────────────────────────────────────────────────────────────────
async function cancelarCobranca(req, res) {
  try {
    const { ordem_id } = req.body;

    if (!ordem_id) {
      return res.status(400).json({ message: 'ordem_id é obrigatório.' });
    }

    // 1. Buscar ordem
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, tipo, status, efi_charge_id')
      .eq('id', ordem_id)
      .single();

    if (ordemErr || !ordem) {
      return res.status(404).json({ message: 'Ordem não encontrada.' });
    }

    if (ordem.status === 'cancelado') {
      return res.status(422).json({ message: 'Ordem já está cancelada.' });
    }

    if (ordem.tipo !== 'ordem_simples') {
      return res.status(422).json({ message: 'Use o endpoint /efi/carne para cancelar carnês.' });
    }

    // 2. Cancelar no EFI (se existir charge_id)
    let efiCancelado = false;
    if (ordem.efi_charge_id) {
      try {
        await efi.cancelCharge(Number(ordem.efi_charge_id));
        efiCancelado = true;
      } catch (efiErr) {
        // Se já estava cancelado/expirado na EFI, prossegue com cancelamento local
        const ignorable = efiErr.statusCode === 422 || (efiErr.efiResponse?.error === 'invalid_operation');
        if (!ignorable) throw efiErr;
      }
    }

    // 3. Atualizar status no banco
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({ status: 'cancelado', efi_status: 'canceled' })
      .eq('id', ordem_id);

    await supabase
      .from('financeiro_parcelas')
      .update({ status: 'cancelado' })
      .eq('ordem_pagamento_id', ordem_id);

    return res.status(200).json({
      message: 'Cobrança cancelada.',
      cancelado_na_efi: efiCancelado,
    });
  } catch (err) {
    console.error('[EFI cobranca DELETE]', err);
    const status = err.statusCode >= 400 && err.statusCode < 500 ? 422 : 500;
    return res.status(status).json({
      message: err.message,
      efi: err.efiResponse || null,
    });
  }
}
