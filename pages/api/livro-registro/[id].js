import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'secretaria', 'coordenador', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('livro_registro').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Registro não encontrado' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase.from('livro_registro').update({
      nome_aluno:      body.nomeAluno    || body.nome_aluno    || null,
      numero_registro: body.numeroRegistro || body.numero_registro || null,
      livro:           body.livro        || null,
      folha:           body.folha        || null,
      data:            body.data         || null,
      curso:           body.curso        || null,
      turma:           body.turma        || null,
      periodo:         body.periodo      || null,
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('livro_registro').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Registro removido com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
