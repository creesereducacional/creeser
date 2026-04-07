/**
 * POST /api/admin-financeiro/efi/carne
 *   Cria um carnê na EFI para uma ordem do tipo 'carne'.
 *   Body: { ordem_id — UUID da ordem em financeiro_ordens_pagamento }
 *
 * DELETE /api/admin-financeiro/efi/carne
 *   Cancela o carnê inteiro na EFI e marca no banco.
 *   Body: { ordem_id }
 */

import { createClient } from '@supabase/supabase-js';
import efi from '../../../../lib/efi-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET')    return buscarCarne(req, res);
  if (req.method === 'POST')   return criarCarne(req, res);
  if (req.method === 'DELETE') return cancelarCarne(req, res);
  return res.status(405).json({ message: 'Método não permitido' });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Buscar link do carnê na EFI
// ─────────────────────────────────────────────────────────────────────────────
async function buscarCarne(req, res) {
  try {
    const { ordem_id } = req.query;
    if (!ordem_id) return res.status(400).json({ message: 'ordem_id é obrigatório.' });

    const { data: ordem, error } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('efi_carnet_id')
      .eq('id', ordem_id)
      .single();

    if (error || !ordem?.efi_carnet_id) {
      return res.status(404).json({ message: 'Carnê EFI não encontrado para esta ordem.' });
    }

    const data = await efi.getCarnet(Number(ordem.efi_carnet_id));
    return res.status(200).json({
      carnet_id: ordem.efi_carnet_id,
      link: data?.data?.carnet?.link || data?.data?.link || null,
      status: data?.data?.carnet?.status || null,
    });
  } catch (err) {
    console.error('[EFI carne GET]', err);
    return res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Criar carnê
// ─────────────────────────────────────────────────────────────────────────────
async function criarCarne(req, res) {
  try {
    const { ordem_id } = req.body;

    if (!ordem_id) {
      return res.status(400).json({ message: 'ordem_id é obrigatório.' });
    }

    // 1. Buscar ordem + parcelas + aluno
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id, tipo, descricao, status, quantidade_parcelas, efi_carnet_id,
        aluno:alunos!inner ( id, nome, cpf, email, data_nascimento, telefone_celular )
      `)
      .eq('id', ordem_id)
      .single();

    if (ordemErr || !ordem) {
      return res.status(404).json({ message: 'Ordem não encontrada.' });
    }

    if (ordem.tipo !== 'carne') {
      return res.status(422).json({ message: 'Use /efi/cobranca para ordens simples.' });
    }

    if (ordem.status === 'cancelado') {
      return res.status(422).json({ message: 'Ordem já está cancelada.' });
    }

    if (ordem.efi_carnet_id) {
      return res.status(422).json({
        message: 'Carnê EFI já criado para esta ordem.',
        efi_carnet_id: ordem.efi_carnet_id,
      });
    }

    // 2. Buscar parcelas em ordem crescente
    const { data: parcelas, error: parcelasErr } = await supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, valor, data_vencimento')
      .eq('ordem_pagamento_id', ordem_id)
      .order('numero_parcela', { ascending: true });

    if (parcelasErr || !parcelas?.length) {
      return res.status(422).json({ message: 'Nenhuma parcela encontrada para esta ordem.' });
    }

    const aluno = ordem.aluno;
    const cpfLimpo = (aluno.cpf || '').replace(/\D/g, '');

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return res.status(422).json({ message: 'CPF do aluno inválido ou ausente.' });
    }

    // Valor da 1ª parcela em centavos (todas devem ter o mesmo valor, mas usamos a 1ª de referência)
    const valorCentavos = Math.round(Number(parcelas[0].valor) * 100);
    const primeiroVencimento = parcelas[0].data_vencimento;

    const phoneDigits = (aluno.telefone_celular || '').replace(/\D/g, '');
    const birthRaw = aluno.data_nascimento || null;
    const birth = birthRaw ? String(birthRaw).substring(0, 10) : undefined;

    const customer = {
      name: aluno.nome,
      cpf: cpfLimpo,
    };
    if (aluno.email) customer.email = aluno.email;
    if (phoneDigits.length === 10 || phoneDigits.length === 11) customer.phone_number = phoneDigits;
    if (birth && /^\d{4}-\d{2}-\d{2}$/.test(birth)) customer.birth = birth;

    // URL do webhook para receber confirmações de pagamento de cada parcela
    const notificationUrl = process.env.EFI_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_URL}/api/admin-financeiro/efi/webhook`;

    // 3. Criar carnê na EFI
    const carnetData = await efi.createCarnet({
      items: [{ name: ordem.descricao, value: valorCentavos, amount: 1 }],
      customer,
      expire_at: primeiroVencimento,
      repeats: parcelas.length,
      split_items: false,
      metadata: notificationUrl ? { notification_url: notificationUrl } : undefined,
    });

    const carnet = carnetData.data;
    const carnetId = carnet.carnet_id;
    const charges = carnet.charges || []; // array com charge_id por parcela

    // 4. Salvar cada charge_id na parcela correspondente
    for (const parcela of parcelas) {
      const chargeInfo = charges[parcela.numero_parcela - 1];
      if (!chargeInfo) continue;

      const chargeId = chargeInfo.charge_id;
      const billet = chargeInfo.parcel || {};

      // Registrar em financeiro_boletos
      await supabase.from('financeiro_boletos').insert({
        parcela_id: parcela.id,
        gateway: 'efi',
        boleto_id_gateway: String(chargeId),
        boleto_barcode: billet.barcode || null,
        boleto_url: billet.link || null,
        status_gateway: 'waiting',
        resposta_json: chargeInfo,
      });

      // Atualizar a parcela com os dados do boleto
      await supabase
        .from('financeiro_parcelas')
        .update({
          efi_charge_id: String(chargeId),
          boleto_barcode: billet.barcode || null,
          boleto_url: billet.link || null,
        })
        .eq('id', parcela.id);
    }

    // 5. Atualizar a ordem com o carnet_id
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({ efi_carnet_id: String(carnetId), efi_status: 'waiting' })
      .eq('id', ordem_id);

    return res.status(201).json({
      message: 'Carnê criado com sucesso.',
      carnet_id: carnetId,
      link: carnet.link || null,
      parcelas: charges.map(c => ({
        charge_id: c.charge_id,
        parcel: c.parcel_number,
      })),
    });
  } catch (err) {
    console.error('[EFI carne POST]', JSON.stringify(err.efiResponse || err.message));
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
// DELETE — Cancelar carnê
// ─────────────────────────────────────────────────────────────────────────────
async function cancelarCarne(req, res) {
  try {
    const { ordem_id } = req.body;

    if (!ordem_id) {
      return res.status(400).json({ message: 'ordem_id é obrigatório.' });
    }

    // 1. Buscar ordem
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, tipo, status, efi_carnet_id')
      .eq('id', ordem_id)
      .single();

    if (ordemErr || !ordem) {
      return res.status(404).json({ message: 'Ordem não encontrada.' });
    }

    if (ordem.status === 'cancelado') {
      return res.status(422).json({ message: 'Ordem já está cancelada.' });
    }

    if (ordem.tipo !== 'carne') {
      return res.status(422).json({ message: 'Use /efi/cobranca para cancelar ordens simples.' });
    }

    // 2. Cancelar no EFI
    let efiCancelado = false;
    if (ordem.efi_carnet_id) {
      try {
        await efi.cancelCarnet(Number(ordem.efi_carnet_id));
        efiCancelado = true;
      } catch (efiErr) {
        // Ignora se já estava cancelado/encerrado na EFI
        const ignorable = efiErr.statusCode === 422 || (efiErr.efiResponse?.error === 'invalid_operation');
        if (!ignorable) throw efiErr;
      }
    }

    // 3. Atualizar banco
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({ status: 'cancelado', efi_status: 'canceled' })
      .eq('id', ordem_id);

    await supabase
      .from('financeiro_parcelas')
      .update({ status: 'cancelado' })
      .eq('ordem_pagamento_id', ordem_id);

    return res.status(200).json({
      message: 'Carnê cancelado.',
      cancelado_na_efi: efiCancelado,
    });
  } catch (err) {
    console.error('[EFI carne DELETE]', err);
    const status = err.statusCode >= 400 && err.statusCode < 500 ? 422 : 500;
    return res.status(status).json({
      message: err.message,
      efi: err.efiResponse || null,
    });
  }
}
