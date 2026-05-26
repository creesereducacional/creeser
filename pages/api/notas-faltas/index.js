import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'secretaria'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('notas_faltas').select('*').order('created_at', { ascending: false });
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const { data, error } = await supabase.from('notas_faltas').insert({
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
      instituicao_id: instId       || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
