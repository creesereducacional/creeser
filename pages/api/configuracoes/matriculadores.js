import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('matriculadores').select('*').order('nome');
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const { data, error } = await supabase.from('matriculadores').insert({
      nome:           body.nome           || '',
      email:          body.email          || null,
      telefone:       body.telefone       || null,
      ativo:          body.ativo          !== false,
      instituicao_id: instId              || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });
    const { error } = await supabase.from('matriculadores').delete().eq('email', email);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
