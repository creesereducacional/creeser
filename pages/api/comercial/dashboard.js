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

  // ── Contagem de leads por status ──────────────────────────────────────────
  let leadsQuery = supabase.from('leads').select('status');
  if (instituicaoId) leadsQuery = applyInstituicaoFilter(leadsQuery, instituicaoId);
  if (comercial) leadsQuery = leadsQuery.eq('captado_por_id', authUser.id);

  const { data: leads, error: leadsError } = await leadsQuery;
  if (leadsError) return res.status(500).json({ error: leadsError.message });

  const total      = leads.length;
  const novo       = leads.filter(l => l.status === 'novo').length;
  const contatado  = leads.filter(l => l.status === 'contatado').length;
  const interessado = leads.filter(l => l.status === 'interessado').length;
  const matriculado = leads.filter(l => l.status === 'matriculado').length;
  const perdido    = leads.filter(l => l.status === 'perdido').length;
  const taxaConversao = total > 0 ? Number(((matriculado / total) * 100).toFixed(1)) : 0;

  // ── Total de matrículas captadas ──────────────────────────────────────────
  let matriculasQuery = supabase.from('alunos').select('id', { count: 'exact', head: true });
  if (instituicaoId) matriculasQuery = applyInstituicaoFilter(matriculasQuery, instituicaoId);
  if (comercial) {
    matriculasQuery = matriculasQuery.eq('captado_por_id', authUser.id);
  } else {
    matriculasQuery = matriculasQuery.not('captado_por_id', 'is', null);
  }

  const { count: totalMatriculas } = await matriculasQuery;

  return res.status(200).json({
    totalLeads: total,
    novo,
    contatado,
    interessado,
    matriculado,
    perdido,
    taxaConversao,
    totalMatriculas: totalMatriculas || 0,
  });
}
