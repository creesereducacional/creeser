import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

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

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
  }

  if (req.method === 'GET') {
    // Se for perfil professor, retornar apenas seu próprio registro (baseado no email da sessão)
    if (hasPerfil(authUser, ['professor'])) {
      const emailLogado = authUser.email;
      if (!emailLogado) {
        return res.status(200).json([]);
      }
      
      const { data: prof, error } = await supabase
        .from('professores')
        .select('*')
        .eq('email', emailLogado)
        .eq('instituicao_id', instituicaoId)
        .maybeSingle();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(prof ? [prof] : []);
    }

    let query = supabase.from('professores').select('*').order('nome');
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const instId = resolveInstituicaoId(req, authUser);
    if (!instId) return res.status(400).json({ error: 'Instituicao obrigatoria para criar professor' });
    const body = req.body || {};
    const { data, error } = await supabase.from('professores').insert({
      ...body,
      instituicao_id: instId,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
