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
  resolveContextoUsuario,
} from '../../../../lib/auth-server';
import { emitirBoletoEfi } from '../../../../lib/efi/EfiBillingService';
import { anexarEventoNegociacao } from '../../../../lib/negociacoes-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Função auxiliar: derivar unidade do aluno através de matrículas/turmas ──
async function resolverUnidadeAluno(alunoId, turmaidLegado) {
  let turmaIdResolvida = null;
  const { data: matriculasAluno } = await supabase
    .from('matriculas')
    .select('turma_id, is_principal, instituicao_id')
    .eq('aluno_id', alunoId);

  if (Array.isArray(matriculasAluno) && matriculasAluno.length > 0) {
    const matAlvo = matriculasAluno.find(m => m.is_principal) || matriculasAluno[0];
    turmaIdResolvida = matAlvo?.turma_id || null;
  }

  if (!turmaIdResolvida) {
    turmaIdResolvida = turmaidLegado || null;
  }

  let unidadeIdDoAluno = null;
  let turmaInstituicaoId = null;

  if (turmaIdResolvida) {
    const { data: turmaData } = await supabase
      .from('turmas')
      .select('id, unidadeid, instituicao_id')
      .eq('id', turmaIdResolvida)
      .maybeSingle();

    if (turmaData) {
      unidadeIdDoAluno = turmaData.unidadeid != null ? Number(turmaData.unidadeid) : null;
      turmaInstituicaoId = turmaData.instituicao_id || null;
    }
  }

  return { turmaIdResolvida, unidadeIdDoAluno, turmaInstituicaoId };
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 6.1.6: Resolver contexto de escopo (Instituição × Unidade) ──────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[efi/cobranca] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  req.ctx = ctx;
  req.isGroupAdmin = isGroupAdmin;
  req.instituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;
  req.authUser = authUser;

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
        aluno:alunos!inner ( id, nome, cpf, email, data_nascimento, telefone_celular, turmaid, instituicao_id )
      `)
      .eq('id', parcela_id);

    parcelaQuery = applyInstituicaoFilter(parcelaQuery, req.instituicaoId);
    const { data: parcela, error: parcelaErr } = await parcelaQuery.single();

    if (parcelaErr || !parcela) {
      return res.status(404).json({ message: 'Parcela não encontrada.' });
    }

    const aluno = parcela.aluno;

    // ── Validação de Escopo de Unidade e Instituição (Fase 6.1.6) ───────────────
    const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(aluno.id, aluno.turmaid);

    if (!req.isGroupAdmin) {
      if (aluno.instituicao_id && req.instituicaoId && aluno.instituicao_id !== req.instituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
      }
      if (turmaInstituicaoId && req.instituicaoId && turmaInstituicaoId !== req.instituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
      }
    }

    if (req.ctx.unidadesPermitidas !== null) {
      if (unidadeIdDoAluno !== null && !req.ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
        return res.status(403).json({
          message: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
        });
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    if (parcela.status === 'cancelado') {
      return res.status(422).json({ message: 'Parcela já está cancelada.' });
    }

    if (parcela.status === 'pago') {
      return res.status(422).json({ message: 'Esta parcela já consta como paga. Emissão de nova cobrança não permitida.' });
    }

    if (parcela.ordem.tipo !== 'ordem_simples' && parcela.ordem.tipo !== 'acordo') {
      return res.status(422).json({ message: 'Use o endpoint /efi/carne para carnês.' });
    }

    // Se a parcela individual já possui cobrança emitida na EFI, recuperar os dados existentes (Idempotência)
    if (parcela.efi_charge_id) {
      const { data: bolExistente } = await supabase
        .from('financeiro_boletos')
        .select('boleto_id_gateway, boleto_url, boleto_barcode')
        .eq('parcela_id', parcela.id)
        .maybeSingle();

      return res.status(200).json({
        message: 'Cobrança bancária já existente recuperada com sucesso.',
        charge_id: parcela.efi_charge_id,
        boleto_url: parcela.boleto_url || bolExistente?.boleto_url || null,
        barcode: parcela.boleto_barcode || bolExistente?.boleto_barcode || null,
        vencimento: parcela.data_vencimento,
        ja_existia: true
      });
    }

    if (parcela.ordem.tipo === 'ordem_simples' && parcela.ordem.efi_charge_id) {
      return res.status(422).json({
        message: 'Cobrança EFI já criada para esta ordem.',
        efi_charge_id: parcela.ordem.efi_charge_id,
      });
    }

    // Para Acordo Financeiro: validar se há pendência de cancelamento bancário das parcelas originais
    if (parcela.ordem.tipo === 'acordo') {
      const { data: negData } = await supabase
        .from('financeiro_negociacoes')
        .select('status, sincronizacao_efi, parcelas_originais')
        .eq('ordem_id', parcela.ordem.id)
        .maybeSingle();

      const temFalhaEfiOriginais = (negData?.sincronizacao_efi || []).some(
        s => s.status === 'falha_cancelamento_efi' || s.sucesso === false
      );

      if (temFalhaEfiOriginais) {
        return res.status(422).json({
          message: 'Emissão bloqueada: Existem parcelas originais deste acordo com pendência de cancelamento bancário na EFI Bank. É necessário concluir o cancelamento bancário das dívidas anteriores para evitar cobrança em duplicidade contra o aluno.',
          bloqueio_duplicidade: true
        });
      }
    }

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

    // 3. Delegar emissão ao EfiBillingService
    const resultado = await emitirBoletoEfi({
      parcela: { ...parcela, ordem_pagamento_id: parcela.ordem_pagamento_id },
      aluno,
      descricao,
      configFinanceiro,
      supabase,
      instituicaoId,
      notificationUrl,
    });

    // Se for parcela de Acordo, anexar evento na auditoria append-only da negociação
    if (parcela.ordem.tipo === 'acordo') {
      try {
        await anexarEventoNegociacao({
          supabase,
          ordemId: parcela.ordem.id,
          tipoEvento: 'emissao_cobranca_parcela',
          operadorEmail: req.authUser?.email,
          detalhes: {
            parcela_id: parcela.id,
            numero_parcela: parcela.numero_parcela,
            charge_id: resultado.charge_id
          }
        });
      } catch (_) {}
    }

    return res.status(201).json({
      message: 'Boleto criado com sucesso.',
      charge_id: resultado.charge_id,
      boleto_url: resultado.boleto_url,
      barcode: resultado.barcode,
      vencimento: parcela.data_vencimento,
    });
  } catch (err) {
    console.error('[EFI cobranca POST]', err.efiResponse ? JSON.stringify(err.efiResponse) : err.message);
    const status = err.statusCode === 401 ? 502 : err.statusCode >= 400 && err.statusCode < 500 ? 422 : 500;
    const efiDetail = err.efiResponse
      ? (err.efiResponse.error_description || err.efiResponse.message || JSON.stringify(err.efiResponse))
      : null;
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
      .select('id, tipo, status, efi_charge_id, instituicao_id, aluno_id, aluno:alunos ( id, turmaid, instituicao_id )')
      .eq('id', ordem_id);

    ordemQuery = applyInstituicaoFilter(ordemQuery, req.instituicaoId);
    const { data: ordem, error: ordemErr } = await ordemQuery.single();

    if (ordemErr || !ordem) {
      return res.status(404).json({ message: 'Ordem não encontrada.' });
    }

    // ── Validação de Escopo de Unidade e Instituição (Fase 6.1.6) ───────────────
    if (ordem.aluno) {
      const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(ordem.aluno.id, ordem.aluno.turmaid);

      if (!req.isGroupAdmin) {
        if (ordem.aluno.instituicao_id && req.instituicaoId && ordem.aluno.instituicao_id !== req.instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
        }
        if (turmaInstituicaoId && req.instituicaoId && turmaInstituicaoId !== req.instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
        }
      }

      if (req.ctx.unidadesPermitidas !== null) {
        if (unidadeIdDoAluno !== null && !req.ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
          return res.status(403).json({
            message: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
          });
        }
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

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

