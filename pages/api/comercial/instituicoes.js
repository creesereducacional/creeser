import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  resolveContextoUsuario,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador', 'recepcao'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  // ── 1. Resolução do Contexto Instituição × Unidade ───────────────────────────
  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível ao verificar permissões de acesso',
      code: 'AUTH_CONTEXT_UNAVAILABLE',
    });
  }

  const isGrupoAdmin = authUser.perfil === 'grupo_admin' || authUser.is_superadmin;

  if (isGrupoAdmin) {
    const { data, error } = await supabase
      .from('instituicoes')
      .select('id, nome, tipo_instituicao')
      .eq('ativa', true)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // Usuário comum: retorna apenas sua própria instituição resolvida pelo contexto
  const userInstituicaoId = ctx.instituicaoId;
  if (!userInstituicaoId) return res.status(200).json([]);

  const { data, error } = await supabase
    .from('instituicoes')
    .select('id, nome, tipo_instituicao')
    .eq('id', userInstituicaoId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ? [data] : []);
}

