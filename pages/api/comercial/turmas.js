import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
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

  const { cursoid } = req.query;
  if (!cursoid) return res.status(400).json({ error: 'cursoid é obrigatório' });

  const instituicaoId = resolveInstituicaoId(req, authUser);

  let query = supabase
    .from('turmas')
    .select('id, nome, cursoid, instituicao_id, mensalidade, matricula, mesescontrato, datainicio, datafim, situacao, turno, capacidademaxima, desconto')
    .eq('cursoid', cursoid)
    .order('nome');

  if (instituicaoId) query = applyInstituicaoFilter(query, instituicaoId);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Filtrar turmas ativas
  const ativas = (data || []).filter(t => {
    const s = String(t.situacao || '').toUpperCase();
    return !s || s === 'ATIVO' || s === 'EM_ANDAMENTO' || s === 'ABERTA';
  });

  return res.status(200).json(ativas);
}
