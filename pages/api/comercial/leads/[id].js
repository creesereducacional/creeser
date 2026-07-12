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

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID não informado' });

  const instituicaoId = resolveInstituicaoId(req, authUser);

  // Buscar o lead com filtro de instituição + isolamento por perfil
  let selectQuery = supabase.from('leads').select('*').eq('id', id);
  selectQuery = applyInstituicaoFilter(selectQuery, instituicaoId);
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
