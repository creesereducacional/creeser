import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'secretaria'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('notas_faltas').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Registro não encontrado' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase.from('notas_faltas').update({
      nome_aluno:  body.nomeAluno  || body.nome_aluno  || null,
      matricula:   body.matricula  || null,
      turma:       body.turma      || null,
      disciplina:  body.disciplina || null,
      ap1:         body.ap1        ?? null,
      ap2:         body.ap2        ?? null,
      ap3:         body.ap3        ?? null,
      media_prova: body.mediaProva || body.media_prova || null,
      exame_final: body.exameFinal || body.exame_final || null,
      frequencia:  body.frequencia || null,
      media_final: body.mediaFinal || body.media_final || null,
      situacao:    body.situacao   || 'CURSANDO',
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('notas_faltas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Registro removido com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
