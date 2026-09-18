import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function registrarLog(payload) {
  try { await supabase.from('financeiro_logs').insert(payload); } catch (_) {}
}

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
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 6.1.8: Resolver contexto de escopo (Instituição × Unidade) ──────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[comissoes/repassar] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ message: 'Instituição não definida para o usuário atual' });
  }
  // ────────────────────────────────────────────────────────────────────────────

  const { id } = req.query;
  const { data_repasse, observacao } = req.body || {};

  if (!data_repasse || !/^\d{4}-\d{2}-\d{2}$/.test(String(data_repasse))) {
    return res.status(400).json({ message: 'data_repasse obrigatória no formato YYYY-MM-DD' });
  }

  // Buscar comissão + dados do aluno para resolução de unidade
  const { data: comissao, error: findErr } = await supabase
    .from('comissoes_comerciais')
    .select(`
      id, status, instituicao_id, captado_por_id, valor_comissao, aluno_id,
      aluno:alunos ( id, turmaid, instituicao_id )
    `)
    .eq('id', id)
    .maybeSingle();

  if (findErr) return res.status(500).json({ message: findErr.message });
  if (!comissao) return res.status(404).json({ message: 'Comissão não encontrada' });

  // ── Validação de Isolamento Multi-tenant (Instituição) ──────────────────────
  if (!isGroupAdmin) {
    if (comissao.instituicao_id && userInstituicaoId && comissao.instituicao_id !== userInstituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: comissão pertence a outra instituição' });
    }
  }

  // ── Validação de Escopo de Unidade (para Usuário Filial) ────────────────────
  if (ctx.unidadesPermitidas !== null) {
    if (comissao.aluno) {
      const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(
        comissao.aluno.id,
        comissao.aluno.turmaid
      );

      if (!isGroupAdmin && turmaInstituicaoId && userInstituicaoId && turmaInstituicaoId !== userInstituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição' });
      }

      if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
        return res.status(403).json({
          message: 'Acesso negado: a matrícula/turma relacionada a esta comissão pertence a uma unidade fora do seu escopo permitido.'
        });
      }
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  if (comissao.status !== 'PENDENTE_REPASSE') {
    return res.status(422).json({
      message: `Comissão não está pendente (status atual: ${comissao.status})`,
    });
  }

  const usuarioId = authUser.id ? Number(authUser.id) : null;
  const agora     = new Date().toISOString();

  const { data: updated, error: updErr } = await supabase
    .from('comissoes_comerciais')
    .update({
      status:            'REPASSADO',
      data_repasse:      String(data_repasse),
      repassado_por_id:  usuarioId,
      observacao:        observacao ? String(observacao).trim().slice(0, 500) : null,
      updated_at:        agora,
    })
    .eq('id', id)
    .select('id, status, data_repasse, valor_comissao')
    .single();

  if (updErr) return res.status(500).json({ message: updErr.message });

  await registrarLog({
    usuario_id:    usuarioId,
    acao:          'comissao_repassada',
    instituicao_id: comissao.instituicao_id,
    dados_extras:  {
      comissao_id:     id,
      captado_por_id:  comissao.captado_por_id,
      valor_comissao:  comissao.valor_comissao,
      data_repasse:    String(data_repasse),
    },
  });

  return res.status(200).json({
    message:  'Comissão marcada como repassada',
    comissao: updated,
  });
}
