import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial'];

const isComercialPuro = (user) =>
  hasPerfil(user, ['comercial']) && !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const comercial = isComercialPuro(authUser);
  const instituicaoId = resolveInstituicaoId(req, authUser);

  let query = supabase
    .from('alunos')
    .select('id, nome, email, telefone_celular, statusmatricula, cursoid, turmaid, captado_por_id, datacriacao')
    .order('datacriacao', { ascending: false });

  if (instituicaoId) query = applyInstituicaoFilter(query, instituicaoId);

  if (comercial) {
    query = query.eq('captado_por_id', authUser.id);
  } else {
    query = query.not('captado_por_id', 'is', null);
  }

  const { data: alunos, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  if (!alunos || alunos.length === 0) return res.status(200).json([]);

  // Buscar leads associados para obter curso_interesse
  const alunoIds = alunos.map(a => a.id);
  const { data: leads } = await supabase
    .from('leads')
    .select('aluno_convertido_id, curso_interesse, status')
    .in('aluno_convertido_id', alunoIds);

  const leadsMap = {};
  (leads || []).forEach(l => { leadsMap[l.aluno_convertido_id] = l; });

  const resultado = alunos.map(a => ({
    ...a,
    curso_interesse: leadsMap[a.id]?.curso_interesse || null,
    lead_status: leadsMap[a.id]?.status || null,
  }));

  return res.status(200).json(resultado);
}
