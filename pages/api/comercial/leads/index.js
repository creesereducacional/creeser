import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

const STATUS_VALIDOS = ['novo', 'contatado', 'interessado', 'pre_matricula', 'matriculado', 'perdido', 'desistente'];

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

// Operador só vê seus próprios leads
const isOperador = (user) =>
  hasPerfil(user, ['comercial_operador']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master']);

// Master (inclui legacy 'comercial') vê equipe — não é admin-level
const isMasterRestrito = (user) =>
  hasPerfil(user, ['comercial_master']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

// Obtém IDs dos operadores vinculados ao master
async function getEquipeIds(masterId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('comercial_master_id', masterId)
    .eq('perfil', 'comercial_operador');
  return (data || []).map(o => o.id);
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const instituicaoId = resolveInstituicaoId(req, authUser);
  if (!instituicaoId) {
    return res.status(403).json({ error: 'Instituição não definida para o usuário atual' });
  }

  // ── GET: listar leads ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    query = applyInstituicaoFilter(query, instituicaoId);

    if (isOperador(authUser)) {
      // Operador: apenas seus próprios leads
      query = query.eq('captado_por_id', authUser.id);
    } else if (isMasterRestrito(authUser)) {
      // Master: próprios leads + leads dos operadores vinculados
      const operadorIds = await getEquipeIds(Number(authUser.id));
      const todosIds = [Number(authUser.id), ...operadorIds];
      query = query.in('captado_por_id', todosIds);
    }
    // Admin-level: vê todos da instituição (sem filtro adicional)

    const { status } = req.query;
    if (status && STATUS_VALIDOS.includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── POST: criar lead ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { nome, telefone, whatsapp, email, curso_interesse, origem, observacoes, status } = req.body || {};

    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const statusFinal = status && STATUS_VALIDOS.includes(status) ? status : 'novo';

    const novoLead = {
      instituicao_id: instituicaoId,
      nome: String(nome).trim(),
      telefone: telefone ? String(telefone).trim() : null,
      whatsapp: whatsapp ? String(whatsapp).trim() : null,
      email: email ? String(email).trim().toLowerCase() : null,
      curso_interesse: curso_interesse ? String(curso_interesse).trim() : null,
      origem: origem ? String(origem).trim() : null,
      observacoes: observacoes ? String(observacoes).trim() : null,
      status: statusFinal,
      captado_por_id: authUser.id,
    };

    const { data, error } = await supabase.from('leads').insert(novoLead).select().single();
    if (error) return res.status(500).json({ error: error.message });

    await registrarAuditoria(data.id, authUser.id, 'criacao', null, novoLead);

    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
