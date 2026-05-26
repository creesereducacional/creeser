import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = [
  'grupo_admin', 'instituicao_admin', 'admin', 'financeiro',
  'comercial', 'comercial_master', 'comercial_operador',
];

const isOperador = (user) =>
  hasPerfil(user, ['comercial_operador']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master']);

const isMasterRestrito = (user) =>
  hasPerfil(user, ['comercial', 'comercial_master']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro']);

async function getEquipeIds(masterId) {
  const { data: operadores = [] } = await supabase
    .from('usuarios')
    .select('id')
    .eq('comercial_master_id', masterId)
    .eq('perfil', 'comercial_operador');
  return [masterId, ...operadores.map(o => o.id)];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const instituicaoId = resolveInstituicaoId(req, authUser);

  try {
    let query = supabase
      .from('comissoes_comerciais')
      .select(`
        id, valor_base, valor_comissao, tipo_comissao, percentual,
        status, data_credito, data_repasse, created_at,
        aluno:alunos!aluno_id(nome, email),
        captado_por:usuarios!captado_por_id(id, nomecompleto)
      `)
      .order('data_credito', { ascending: false });

    if (instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId);
    }

    if (isOperador(authUser)) {
      query = query.eq('captado_por_id', authUser.id);
    } else if (isMasterRestrito(authUser)) {
      const equipeIds = await getEquipeIds(Number(authUser.id));
      query = query.in('captado_por_id', equipeIds);
    }

    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || String(error.message).includes('does not exist')) {
        return res.status(200).json({
          comissoes: [],
          aviso: 'Tabela não criada. Execute a migration 20260527_comissoes_comerciais.sql.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ comissoes: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
