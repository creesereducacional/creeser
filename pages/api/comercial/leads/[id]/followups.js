import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';
import { registrarFollowUp, concluirFollowUp } from '../../../../../lib/comercial/followup-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

const isOperador = (user) =>
  hasPerfil(user, ['comercial_operador']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master']);

const isMasterRestrito = (user) =>
  (hasPerfil(user, ['comercial_master']) || hasPerfil(user, ['comercial'])) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

async function getEquipeIds(masterId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('comercial_master_id', masterId)
    .eq('perfil', 'comercial_operador');
  return (data || []).map(o => o.id);
}

/**
 * Resolve a unidade física de um aluno convertido:
 * aluno_convertido_id -> matriculas (prioriza is_principal) -> turmas.unidadeid
 * fallback: alunos.turmaid -> turmas.unidadeid
 */
async function resolverUnidadeAluno(alunoId) {
  if (!alunoId) return null;

  // 1. Matrículas com turmas(unidadeid)
  const { data: matriculasData } = await supabase
    .from('matriculas')
    .select(`
      id,
      aluno_id,
      turma_id,
      is_principal,
      turmas(id, unidadeid)
    `)
    .eq('aluno_id', alunoId);

  if (matriculasData && matriculasData.length > 0) {
    const matriculasOrdenadas = [...matriculasData].sort((a, b) => {
      if (a.is_principal && !b.is_principal) return -1;
      if (!a.is_principal && b.is_principal) return 1;
      return 0;
    });

    for (const m of matriculasOrdenadas) {
      const uid = m.turmas?.unidadeid != null ? Number(m.turmas.unidadeid) : null;
      if (uid !== null) {
        return uid;
      }
    }
  }

  // 2. Fallback legado: alunos.turmaid -> turmas.unidadeid
  const { data: alunoData } = await supabase
    .from('alunos')
    .select('id, turmaid, turmas(id, unidadeid)')
    .eq('id', alunoId)
    .maybeSingle();

  if (alunoData?.turmas?.unidadeid != null) {
    return Number(alunoData.turmas.unidadeid);
  }

  return null;
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const { id } = req.query;
  const leadId = id;
  if (!leadId) {
    return res.status(400).json({ error: 'ID do lead inválido.' });
  }

  // ── 1. Resolução do Contexto Instituição × Unidade ───────────────────────────
  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível ao verificar permissões de acesso',
      code: 'AUTH_CONTEXT_UNAVAILABLE',
    });
  }

  const isGroupAdmin = authUser.perfil === 'grupo_admin' || authUser.is_superadmin;
  const userInstituicaoId = ctx.instituicaoId;

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ error: 'Instituição não definida para o usuário atual' });
  }

  // ── 2. Buscar o lead com filtro de instituição + isolamento por perfil ───────
  let selectQuery = supabase.from('leads').select('*').eq('id', leadId);
  if (!isGroupAdmin) {
    selectQuery = applyInstituicaoFilter(selectQuery, userInstituicaoId);
  }

  if (isOperador(authUser)) {
    selectQuery = selectQuery.eq('captado_por_id', authUser.id);
  } else if (isMasterRestrito(authUser)) {
    const operadorIds = await getEquipeIds(Number(authUser.id));
    const todosIds = [Number(authUser.id), ...operadorIds];
    selectQuery = selectQuery.in('captado_por_id', todosIds);
  }

  const { data: lead, error: findError } = await selectQuery.maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

  // ── 3. Validação de Unidade para Filial se lead estiver convertido ───────────
  if (ctx.unidadesPermitidas !== null && lead.aluno_convertido_id) {
    const unidadeId = await resolverUnidadeAluno(lead.aluno_convertido_id);
    if (unidadeId !== null && !ctx.unidadesPermitidas.includes(unidadeId)) {
      return res.status(403).json({
        error: 'Acesso negado: lead convertido para unidade fora do seu escopo autorizado',
      });
    }
  }

  // ── GET: Listar Followups do Lead ──────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: dbFollowups, error } = await supabase
      .from('leads_followups')
      .select('*, usuarios(nomecompleto)')
      .eq('lead_id', leadId)
      .order('data_agendada', { ascending: true });

    if (error) {
      // Fallback
      const fakeFollowups = [];
      const obs = lead.observacoes || '';
      const marker = '[FOLLOWUP_AGENDADO]';
      const parts = obs.split(marker);

      parts.slice(1).forEach(part => {
        try {
          const lines = part.trim().split('\n\n')[0]; // Pega apenas o JSON
          const idxFim = lines.lastIndexOf('}');
          if (idxFim !== -1) {
            const cleanJson = lines.substring(0, idxFim + 1).trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && parsed.tipo) {
              fakeFollowups.push({
                ...parsed,
                lead_id: leadId,
                usuarios: { nomecompleto: 'Sistema (Fallback)' }
              });
            }
          }
        } catch (_) {}
      });

      return res.status(200).json(fakeFollowups);
    }

    return res.status(200).json(dbFollowups || []);
  }

  // ── POST: Agendar Followup ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { tipo, assunto, observacao, data_agendada, prioridade } = req.body || {};

    if (!tipo || !assunto?.trim() || !data_agendada) {
      return res.status(400).json({ error: 'Tipo, assunto e data agendada são obrigatórios.' });
    }

    const resFollowup = await registrarFollowUp(supabase, {
      lead_id: leadId,
      instituicao_id: lead.instituicao_id || userInstituicaoId,
      usuario_id: authUser.id,
      tipo,
      assunto: String(assunto).trim(),
      observacao: String(observacao || '').trim(),
      data_agendada,
      prioridade
    });

    return res.status(201).json({
      mensagem: 'Follow-up agendado com sucesso.',
      followup: resFollowup.data || { tipo, assunto, data_agendada, prioridade, status: 'PENDENTE' }
    });
  }

  // ── PUT: Concluir Followup ──────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { followupId, observacao_conclusao } = req.body || {};

    if (!followupId) {
      return res.status(400).json({ error: 'ID do follow-up é obrigatório.' });
    }

    const resultado = await concluirFollowUp(supabase, followupId, {
      lead_id: leadId,
      instituicao_id: lead.instituicao_id || userInstituicaoId,
      usuario_id: authUser.id,
      observacao_conclusao
    });

    if (resultado.status === 'ERRO') {
      return res.status(500).json({ error: resultado.error });
    }

    return res.status(200).json({ mensagem: 'Follow-up concluído com sucesso.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
