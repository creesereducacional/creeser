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
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';
import { emitirBoletoEfi } from '../../../../lib/efi/EfiBillingService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  req.instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  if (!isGroupAdmin && !req.instituicaoId) {
    return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
  }

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
    let parcelaQuery = supabase
      .from('financeiro_parcelas')
      .select(`
        id, ordem_pagamento_id, numero_parcela, valor, valor_nominal, valor_desconto, valor_final, data_limite_desconto, data_vencimento, status,
        ordem:financeiro_ordens_pagamento!inner ( id, tipo, efi_charge_id, instituicao_id ),
        aluno:alunos!inner ( id, nome, cpf, email, data_nascimento, telefone_celular )
      `)
      .eq('id', parcela_id);

    parcelaQuery = applyInstituicaoFilter(parcelaQuery, req.instituicaoId);
    const { data: parcela, error: parcelaErr } = await parcelaQuery.single();

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

    // 2. Buscar configurações da empresa para juros/multa
    const { data: configEmpresa } = await supabase
      .from('configuracoes_empresa')
      .select('financeiro')
      .eq('instituicao_id', parcela.ordem.instituicao_id)
      .maybeSingle();

    const configFinanceiro = configEmpresa?.financeiro || {};
    const instituicaoId = parcela?.ordem?.instituicao_id || req.instituicaoId || null;
    const notificationUrl =
      process.env.EFI_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_URL}/api/admin-financeiro/efi/webhook`;

    // 3. Delegar emissão ao EfiBillingService (sem lógica de rollback de ERP aqui)
    const resultado = await emitirBoletoEfi({
      parcela: { ...parcela, ordem_pagamento_id: parcela.ordem_pagamento_id },
      aluno,
      descricao,
      configFinanceiro,
      supabase,
      instituicaoId,
      notificationUrl,
    });

    return res.status(201).json({
      message: 'Boleto criado com sucesso.',
      charge_id: resultado.charge_id,
      boleto_url: resultado.boleto_url,
      barcode: resultado.barcode,
      vencimento: parcela.data_vencimento,
    });
  } catch (err) {
    console.error('[EFI cobranca POST]', err.efiResponse ? JSON.stringify(err.efiResponse) : err.message);
    // Nota: rollback de financeiro_parcelas / financeiro_ordens_pagamento é
    // responsabilidade de ordens/create.js quando emitir_imediatamente=true.
    // Este endpoint não executa rollback de entidades do ERP.
    const status = err.statusCode === 401 ? 502 : err.statusCode >= 400 && err.statusCode < 500 ? 422 : 500;
    const efiDetail = err.efiResponse
      ? (err.efiResponse.error_description || err.efiResponse.message || JSON.stringify(err.efiResponse))
      : null;
    // err.message já contém o detalhe legível quando vindo do EfiBillingService
    const mensagem = err.message || (efiDetail ? `Erro EFI: ${efiDetail}` : 'Erro ao emitir boleto');
    return res.status(status).json({
      message: mensagem,
      efi: err.efiResponse || null,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Cancelar cobrança
// ─────────────────────────────────────────────────────────────────────────────
async function cancelarCobranca(req, res) {
  try {
    const { ordem_id, motivo } = req.body;

    if (!ordem_id) {
      return res.status(400).json({ message: 'ordem_id é obrigatório.' });
    }

    // 1. Buscar ordem
    let ordemQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('id, tipo, status, efi_charge_id, instituicao_id')
      .eq('id', ordem_id);

    ordemQuery = applyInstituicaoFilter(ordemQuery, req.instituicaoId);
    const { data: ordem, error: ordemErr } = await ordemQuery.single();

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
        console.warn('[EFI cancelCharge] ignorando erro EFI, cancelando localmente:', efiErr.message, efiErr.efiResponse);
      }
    }

    // 3. Atualizar status no banco
    const updateOrdem = { status: 'cancelado', efi_status: 'canceled' };
    if (motivo) updateOrdem.observacoes = motivo;
    await supabase
      .from('financeiro_ordens_pagamento')
      .update(updateOrdem)
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
