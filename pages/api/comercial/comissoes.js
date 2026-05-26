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

const isComercialPuro = (user) =>
  hasPerfil(user, ['comercial']) && !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro']);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  try {
    let query = supabase
      .from('comercial_comissoes')
      .select(`
        id, comercial_id, aluno_id, lead_id, ordem_id,
        valor_base, valor_comissao, percentual_comissao,
        status, created_at, data_liberacao, data_repasse,
        alunos(nome, email),
        leads(nome, curso_interesse)
      `)
      .order('created_at', { ascending: false });

    // Comercial puro só vê as próprias comissões
    if (isComercialPuro(authUser)) {
      query = query.eq('comercial_id', authUser.id);
    } else if (hasPerfil(authUser, ['financeiro', 'instituicao_admin', 'admin'])) {
      // Admin/financeiro pode filtrar por comercial_id via query param
      if (req.query.comercial_id) {
        query = query.eq('comercial_id', req.query.comercial_id);
      }
    }

    const { data, error } = await query;

    if (error) {
      // Tabela ainda não existe no banco → retornar array vazio com aviso
      if (error.code === '42P01' || String(error.message).includes('does not exist')) {
        return res.status(200).json({
          comissoes: [],
          aviso: 'Tabela comercial_comissoes não criada. Execute a migration SQL.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ comissoes: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
