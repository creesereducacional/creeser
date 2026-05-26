import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGrupoAdmin = hasPerfil(authUser, ['grupo_admin']);

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

  // Usuário comum: retorna apenas sua própria instituição
  if (!authUser.instituicao_id) return res.status(200).json([]);

  const { data, error } = await supabase
    .from('instituicoes')
    .select('id, nome, tipo_instituicao')
    .eq('id', authUser.instituicao_id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ? [data] : []);
}
