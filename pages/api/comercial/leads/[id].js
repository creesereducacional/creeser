import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];
const STATUS_VALIDOS = ['novo', 'contatado', 'interessado', 'proposta_enviada', 'aguardando_pagamento', 'pago', 'matriculado', 'perdido', 'pre_matricula', 'desistente'];

async function registrarAuditoria(leadId, usuarioId, acao, dadosAnteriores, dadosNovos) {
  try {
    await supabase.from('leads_auditoria').insert({
      lead_id: leadId,
      usuario_id: usuarioId,
      acao,
      dados_anteriores: dadosAnteriores || null,
      dados_novos: dadosNovos || null,
    });
  } catch (_) { /* auditoria não deve bloquear a operação */ }
}

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
  if (!id) return res.status(400).json({ error: 'ID não informado' });

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
  let selectQuery = supabase.from('leads').select('*').eq('id', id);
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
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

  // ── 3. Validação de Unidade para Filial se lead estiver convertido ───────────
  if (ctx.unidadesPermitidas !== null && lead.aluno_convertido_id) {
    const unidadeId = await resolverUnidadeAluno(lead.aluno_convertido_id);
    if (unidadeId !== null && !ctx.unidadesPermitidas.includes(unidadeId)) {
      return res.status(403).json({
        error: 'Acesso negado: lead convertido para unidade fora do seu escopo autorizado',
      });
    }
  }

  // ── GET: detalhar lead ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    return res.status(200).json(lead);
  }

  // ── PUT: editar lead ──────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { nome, telefone, whatsapp, email, curso_interesse, origem, observacoes, status } = req.body || {};

    if (nome !== undefined && !String(nome || '').trim()) {
      return res.status(400).json({ error: 'Nome não pode ser vazio' });
    }
    if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Valores: ${STATUS_VALIDOS.join(', ')}` });
    }
    // Operador e master não podem marcar como matriculado manualmente
    if (status === 'matriculado' && (isOperador(authUser) || isMasterRestrito(authUser))) {
      return res.status(403).json({ error: 'Status "Matriculado" é definido automaticamente após confirmação do fluxo financeiro/acadêmico.' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (nome !== undefined) updates.nome = String(nome).trim();
    if (telefone !== undefined) updates.telefone = telefone ? String(telefone).trim() : null;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp ? String(whatsapp).trim() : null;
    if (email !== undefined) updates.email = email ? String(email).trim().toLowerCase() : null;
    if (curso_interesse !== undefined) updates.curso_interesse = curso_interesse ? String(curso_interesse).trim() : null;
    if (origem !== undefined) updates.origem = origem ? String(origem).trim() : null;
    if (observacoes !== undefined) updates.observacoes = observacoes ? String(observacoes).trim() : null;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    await registrarAuditoria(id, authUser.id, 'edicao', lead, updates);

    // Timeline 360
    try {
      const { registrarInteracao } = require('../../../../lib/comercial/interacao-service');
      await registrarInteracao(supabase, id, {
        instituicao_id: lead.instituicao_id,
        usuario_id: authUser.id,
        tipo: 'atualizacao',
        descricao: `Ficha cadastral atualizada. Novo status: ${updates.status || lead.status}`
      });
    } catch (_) {}

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
