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
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Perfis que podem acessar esta rota
const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'comercial', 'comercial_master'];

// Campos seguros para retornar de usuarios (nunca retornar senha)
const CAMPOS_SEGUROS = 'id, nomecompleto, email, whatsapp, tipo, perfil, status, instituicao_id, comercial_master_id, criado_por_id, datacriacao';

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

  // ── GET: listar operadores ────────────────────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('usuarios')
      .select(CAMPOS_SEGUROS)
      .eq('perfil', 'comercial_operador')
      .order('nomecompleto');

    if (!isGroupAdmin) {
      query = applyInstituicaoFilter(query, userInstituicaoId);
    }

    if (!isAdminLevel(authUser)) {
      // Master vê apenas seus próprios operadores subordinados
      query = query.eq('comercial_master_id', Number(authUser.id));
    }

    const { data, error } = await query;
    if (error) {
      // Nunca expor erro SQL bruto ao cliente
      console.error('[equipe/GET] Supabase error:', error.message);
      if (error.message?.includes('comercial_master_id')) {
        return res.status(500).json({ error: 'Configuração pendente: execute a migration do módulo comercial no banco de dados.' });
      }
      return res.status(500).json({ error: 'Erro interno ao carregar equipe.' });
    }
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

    // Instituição: derivada estritamente do contexto autenticado
    const instIdFinal = userInstituicaoId;

    if (!instIdFinal) {
      return res.status(422).json({ error: 'Instituição não definida. Não é possível criar operador.' });
    }

    // Master ID:
    // Se for master, o operador subordinado é obrigatoriamente atribuído a ele mesmo.
    // Se for admin, pode especificar comercial_master_id ou associar ao próprio admin.
    let masterIdFinal = Number(authUser.id);
    if (!isMaster(authUser) && req.body?.comercial_master_id) {
      const candidatoMasterId = Number(req.body.comercial_master_id);
      // Validar se o comercial_master indicado pertence à mesma instituição
      const { data: masterCheck } = await supabase
        .from('usuarios')
        .select('id, instituicao_id, perfil')
        .eq('id', candidatoMasterId)
        .maybeSingle();

      if (masterCheck && (!masterCheck.instituicao_id || String(masterCheck.instituicao_id) === String(instIdFinal))) {
        masterIdFinal = candidatoMasterId;
      }
    }

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
        instituicao_id:        instIdFinal,
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
