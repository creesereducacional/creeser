import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  if (req.method !== 'GET') {
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'aluno'])) return;
  }

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('avaliacoes').select('*').order('created_at', { ascending: false });
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { cursoId, aulaId, alunoId, alunoNome, estrelas, comentario } = body;

    if (!cursoId || !aulaId || !alunoId || !estrelas) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const instId = resolveInstituicaoId(req, authUser);
    const { data, error } = await supabase.from('avaliacoes').insert({
      curso_id:      String(cursoId),
      aula_id:       String(aulaId),
      aluno_id:      String(alunoId),
      aluno_nome:    alunoNome    || null,
      estrelas:      Number(estrelas),
      comentario:    comentario   || '',
      data:          new Date().toISOString(),
      instituicao_id: instId      || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ message: 'Avaliação salva com sucesso', avaliacao: data });
  }

  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
