import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('disciplinas').select('*').order('nome');
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);

    if (!body.grade) {
      return res.status(400).json({ error: 'Matriz Curricular (grade) é obrigatória' });
    }

    if (body.grade) {
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('curso_nome')
        .eq('id', body.grade)
        .single();
      
      if (gradeError || !gradeData) {
        return res.status(400).json({ error: 'Matriz Curricular selecionada não é válida' });
      }

      if (body.curso && gradeData.curso_nome !== body.curso) {
        return res.status(400).json({ error: 'A Matriz Curricular não pertence ao Curso selecionado' });
      }
    }

    const { data, error } = await supabase.from('disciplinas').insert({
      codigo:        body.codigo        || null,
      nome:          body.nome,
      curso:         body.curso         || null,
      periodo:       body.periodo       || null,
      carga_horaria: body.cargaHoraria  || body.carga_horaria || null,
      matriz:        body.matriz        ?? true,
      grade:         body.grade         || null,
      situacao:      body.situacao      || 'ATIVO',
      instituicao_id: instId            || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
