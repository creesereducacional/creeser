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

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial'];
const STATUS_VALIDOS = ['novo', 'contatado', 'interessado', 'matriculado', 'perdido'];

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

const isComercialPuro = (user) =>
  hasPerfil(user, ['comercial']) && !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID não informado' });

  const instituicaoId = resolveInstituicaoId(req, authUser);

  // Buscar o lead com filtro de instituição + isolamento do comercial
  let selectQuery = supabase.from('leads').select('*').eq('id', id);
  selectQuery = applyInstituicaoFilter(selectQuery, instituicaoId);
  if (isComercialPuro(authUser)) {
    selectQuery = selectQuery.eq('captado_por_id', authUser.id);
  }

  const { data: lead, error: findError } = await selectQuery.maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

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

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
