/**
 * PATCH  /api/comercial/equipe/[id] — Atualiza dados ou status do operador
 * DELETE /api/comercial/equipe/[id] — Desativa operador (soft delete)
 *
 * Perfis: comercial_master, grupo_admin, instituicao_admin, admin
 */
import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'comercial', 'comercial_master'];

const CAMPOS_SEGUROS = 'id, nomecompleto, email, whatsapp, tipo, perfil, status, instituicao_id, comercial_master_id';

const isMaster = (user) =>
  hasPerfil(user, ['comercial_master']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

const isAdminLevel = (user) =>
  hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

async function resolveOperador(operadorId, authUser) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(CAMPOS_SEGUROS)
    .eq('id', operadorId)
    .eq('perfil', 'comercial_operador')
    .maybeSingle();

  if (error) return { operador: null, erro: error.message };
  if (!data)  return { operador: null, erro: 'Operador não encontrado.' };

  // Verificar ownership
  if (isMaster(authUser) && data.comercial_master_id !== Number(authUser.id)) {
    return { operador: null, erro: 'Acesso negado: este operador pertence a outro master.' };
  }

  if (!isAdminLevel(authUser) && !isMaster(authUser)) {
    return { operador: null, erro: 'Acesso negado.' };
  }

  // Isolamento multi-tenant para admin
  if (!hasPerfil(authUser, ['grupo_admin']) && authUser.instituicao_id && data.instituicao_id !== authUser.instituicao_id) {
    return { operador: null, erro: 'Acesso negado: instituição diferente.' };
  }

  return { operador: data, erro: null };
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  if (hasPerfil(authUser, ['comercial_operador']) && !hasPerfil(authUser, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master'])) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID do operador é obrigatório.' });

  const operadorId = Number(id);
  if (isNaN(operadorId)) return res.status(400).json({ error: 'ID inválido.' });

  // ── PATCH: atualizar operador ─────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { operador, erro } = await resolveOperador(operadorId, authUser);
    if (erro) return res.status(operador === null ? 404 : 403).json({ error: erro });

    const { nomeCompleto, email, whatsapp, status, nova_senha } = req.body || {};

    const updates = {};
    if (nomeCompleto) updates.nomecompleto = String(nomeCompleto).trim();
    if (email)        updates.email        = String(email).trim().toLowerCase();
    if (whatsapp !== undefined) updates.whatsapp = whatsapp ? String(whatsapp).trim() : null;
    if (status && ['ativo', 'inativo'].includes(status)) updates.status = status;
    if (nova_senha)   updates.senha = String(nova_senha);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', operadorId)
      .select(CAMPOS_SEGUROS)
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email já em uso.' });
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      mensagem: `Operador "${data.nomecompleto}" atualizado com sucesso.`,
      operador: data,
    });
  }

  // ── DELETE: desativar operador (soft delete) ──────────────────────────────
  if (req.method === 'DELETE') {
    const { operador, erro } = await resolveOperador(operadorId, authUser);
    if (erro) return res.status(404).json({ error: erro });

    const { data, error } = await supabase
      .from('usuarios')
      .update({ status: 'inativo' })
      .eq('id', operadorId)
      .select('id, nomecompleto')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
      mensagem: `Operador "${data.nomecompleto}" desativado.`,
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
