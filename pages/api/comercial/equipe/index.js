/**
 * GET  /api/comercial/equipe  — Lista operadores do master logado
 * POST /api/comercial/equipe  — Cria novo operador comercial
 *
 * Perfis permitidos para GET/POST: comercial_master, grupo_admin, instituicao_admin, admin
 * Perfil comercial_operador: 403
 */
import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  applyInstituicaoFilter,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Perfis que podem acessar esta rota
const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'comercial', 'comercial_master'];

// Campos seguros para retornar de usuarios (nunca retornar senha)
const CAMPOS_SEGUROS = 'id, nomecompleto, email, whatsapp, tipo, perfil, status, instituicao_id, comercial_master_id, criado_por_id, created_at';

const isMaster = (user) =>
  hasPerfil(user, ['comercial_master']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

const isAdminLevel = (user) =>
  hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  // Operador não acessa
  if (hasPerfil(authUser, ['comercial_operador']) && !hasPerfil(authUser, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master'])) {
    return res.status(403).json({ error: 'Acesso negado: operadores não gerenciam equipe.' });
  }

  const instituicaoId = resolveInstituicaoId(req, authUser);

  // ── GET: listar operadores ────────────────────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('usuarios')
      .select(CAMPOS_SEGUROS)
      .eq('perfil', 'comercial_operador')
      .order('nomecompleto');

    if (isAdminLevel(authUser)) {
      // Admin/grupo_admin vê todos os operadores da instituição
      query = applyInstituicaoFilter(query, instituicaoId);
    } else {
      // Master vê apenas seus operadores
      query = query.eq('comercial_master_id', Number(authUser.id));
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // ── POST: criar operador ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      nomeCompleto,
      email,
      senha_inicial,
      whatsapp,
    } = req.body || {};

    if (!nomeCompleto || !String(nomeCompleto).trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }
    if (!senha_inicial || !String(senha_inicial).trim()) {
      return res.status(400).json({ error: 'Senha inicial é obrigatória.' });
    }

    // Instituição: herda do master ou da seleção do admin
    const instId = isMaster(authUser)
      ? authUser.instituicao_id
      : (resolveInstituicaoId(req, authUser) || authUser.instituicao_id);

    if (!instId) {
      return res.status(422).json({ error: 'Instituição não definida. Não é possível criar operador.' });
    }

    // Master ID: o próprio master ou o que o admin especificar
    const masterIdFinal = isMaster(authUser)
      ? Number(authUser.id)
      : (req.body?.comercial_master_id ? Number(req.body.comercial_master_id) : Number(authUser.id));

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nomecompleto:          String(nomeCompleto).trim(),
        email:                 String(email).trim().toLowerCase(),
        senha:                 String(senha_inicial),
        whatsapp:              whatsapp ? String(whatsapp).trim() : null,
        tipo:                  'comercial',
        perfil:                'comercial_operador',
        status:                'ativo',
        instituicao_id:        instId,
        comercial_master_id:   masterIdFinal,
        criado_por_id:         Number(authUser.id),
      })
      .select(CAMPOS_SEGUROS)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Já existe um usuário com este email.' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      mensagem: `Operador "${data.nomecompleto}" criado com sucesso.`,
      operador: data,
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
