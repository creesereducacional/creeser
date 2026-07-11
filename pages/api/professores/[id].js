import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, hasPerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'admin', 'professor'])) return;

  // Professor só tem permissão de leitura (GET)
  if (hasPerfil(authUser, ['professor']) && req.method !== 'GET') {
    return res.status(403).json({ error: 'Acesso negado: Professor possui acesso apenas para leitura.' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    // Se for professor logado, certificar que ele está consultando o seu próprio registro
    if (hasPerfil(authUser, ['professor'])) {
      const emailLogado = authUser.email;
      const { data: currentProf, error: checkError } = await supabase
        .from('professores')
        .select('id, email')
        .eq('id', id)
        .maybeSingle();

      if (checkError || !currentProf || currentProf.email !== emailLogado) {
        return res.status(403).json({ error: 'Acesso negado: Professor pode consultar apenas seu próprio cadastro.' });
      }
    }

    const { data, error } = await supabase.from('professores').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Professor não encontrado' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase.from('professores').update(body).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('professores').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Professor removido com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
