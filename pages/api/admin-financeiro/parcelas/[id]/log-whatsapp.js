import { createClient } from '@supabase/supabase-js';
import {
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
      return;
    }

    const { id } = req.query;
    const { telefone } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'ID da parcela é obrigatório' });
    }

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

    // ── FASE 6.2.8: Resolver contexto de escopo (Instituição × Unidade) ──────────
    const ctx = await resolveContextoUsuario(req, authUser);

    if (ctx.queryError) {
      console.error('[admin-financeiro/parcelas/log-whatsapp] Falha ao resolver contexto de escopo:', ctx.queryError);
      return res.status(503).json({
        message: 'Serviço temporariamente indisponível para resolução de contexto do usuário',
        error: ctx.queryError.message,
      });
    }

    const instituicaoId = ctx.instituicaoId || (ctx.legacyFallback ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin }) : null);

    if (!isGroupAdmin && !instituicaoId) {
      return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
    }
    // ────────────────────────────────────────────────────────────────────────────

    // 1. Buscar a parcela e a ordem correspondente
    const { data: parcela, error: parcelaError } = await supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, valor, data_vencimento, status, boleto_url, ordem_pagamento_id, instituicao_id, aluno_id, financeiro_ordens_pagamento(id, aluno_id, instituicao_id)')
      .eq('id', id)
      .maybeSingle();

    if (parcelaError || !parcela) {
      return res.status(404).json({ message: 'Parcela não encontrada' });
    }

    // Validação institucional na parcela
    if (!isGroupAdmin && instituicaoId && parcela.instituicao_id && parcela.instituicao_id !== instituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: a parcela pertence a outra instituição.' });
    }

    const o = parcela.financeiro_ordens_pagamento || {};

    // Validação institucional na ordem de pagamento vinculada
    if (!isGroupAdmin && instituicaoId && o.instituicao_id && o.instituicao_id !== instituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: a ordem vinculada à parcela pertence a outra instituição.' });
    }

    // 2. Buscar o aluno para validação de escopo e unidade
    const alunoId = o.aluno_id || parcela.aluno_id || null;
    let aluno = null;

    if (alunoId) {
      const { data: alunoData, error: alunoErr } = await supabase
        .from('alunos')
        .select('id, nome, turmaid, instituicao_id')
        .eq('id', alunoId)
        .maybeSingle();

      if (alunoErr) {
        return res.status(500).json({ message: 'Erro ao validar aluno da parcela: ' + alunoErr.message });
      }

      aluno = alunoData;

      if (aluno) {
        // Validação institucional no aluno
        if (!isGroupAdmin && instituicaoId && aluno.instituicao_id && aluno.instituicao_id !== instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
        }

        // Validação de Escopo de Unidade (para Usuário Filial)
        if (ctx.unidadesPermitidas !== null) {
          const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(aluno.id, aluno.turmaid);

          if (!isGroupAdmin && instituicaoId && turmaInstituicaoId && turmaInstituicaoId !== instituicaoId) {
            return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
          }

          if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
            return res.status(403).json({
              message: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
            });
          }
        }
      }
    }

    // ── Autorização concluída: Registrar no financeiro_logs ───────────────────
    const usuarioId = authUser.id ? Number(authUser.id) : null;
    const instituicaoFinal = o.instituicao_id || parcela.instituicao_id || aluno?.instituicao_id || instituicaoId || null;

    await supabase.from('financeiro_logs').insert({
      parcela_id: id,
      aluno_id: alunoId,
      instituicao_id: instituicaoFinal,
      usuario_id: usuarioId,
      acao: 'whatsapp_segunda_via',
      metodo_pagamento: null,
      data_pagamento: null,
      observacao: `2ª via enviada via WhatsApp para o telefone: ${telefone || 'N/A'}`,
      dados_extras: {
        forma_envio: 'WhatsApp',
        ordem_pagamento_id: parcela.ordem_pagamento_id,
        telefone_utilizado: telefone || 'N/A',
        usuario_email: authUser.email || null,
      }
    });

    // Registrar no audit_logs se possível/existente (silencioso)
    try {
      await supabase.from('audit_logs').insert([{
        usuario_id: usuarioId,
        usuario_email: authUser.email || null,
        perfil: authUser.perfil || authUser.tipo || null,
        acao: 'WHATSAPP_SEGUNDA_VIA',
        detalhes: `Envio de 2ª via por WhatsApp da parcela #${parcela.numero_parcela} (Ordem: ${parcela.ordem_pagamento_id}) para o telefone ${telefone}`
      }]);
    } catch (_) {}

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro ao registrar log de auditoria do WhatsApp:', error);
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}

