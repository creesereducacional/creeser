import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';
import { normalizeDisciplina, parsePeriodo } from './index';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Disciplina não encontrada' });
    return res.status(200).json(normalizeDisciplina(data));
  }

  if (req.method === 'PUT') {
    const body = req.body || {};

    if (!body.grade) {
      return res.status(400).json({ error: 'Matriz Curricular (grade) é obrigatória' });
    }

    // Validar se a grade existe
    const { data: gradeData, error: gradeError } = await supabase
      .from('grades')
      .select('id, curso_id, cursoid')
      .eq('id', body.grade)
      .maybeSingle();

    if (gradeError || !gradeData) {
      return res.status(400).json({ error: 'Matriz Curricular selecionada não é válida' });
    }

    // Resolver cursoid obrigatório (NOT NULL no banco)
    let numericCursoId = null;

    if (body.cursoId) numericCursoId = Number(body.cursoId);
    else if (body.cursoid) numericCursoId = Number(body.cursoid);

    if (!numericCursoId && body.curso) {
      const { data: c } = await supabase
        .from('cursos').select('id').ilike('nome', body.curso.trim()).maybeSingle();
      if (c) numericCursoId = Number(c.id);
    }

    if (!numericCursoId) {
      // Deduzir pelo curso da grade
      const cId = gradeData.curso_id || gradeData.cursoid;
      if (cId) numericCursoId = Number(cId);
    }

    if (!numericCursoId) {
      const { data: primeiro } = await supabase.from('cursos').select('id').limit(1).maybeSingle();
      if (primeiro) numericCursoId = Number(primeiro.id);
    }

    if (!numericCursoId) {
      return res.status(400).json({ error: 'Não foi possível determinar o curso da disciplina' });
    }

    // Montar payload APENAS com colunas que existem na tabela real
    const updates = {
      nome:               body.nome,
      codigo:             body.codigo || null,
      cursoid:            numericCursoId,
      cargahoraria:       body.cargaHoraria || body.cargahoraria ? Number(body.cargaHoraria || body.cargahoraria) : null,
      ementa:             body.ementa || null,
      periodo:            parsePeriodo(body.periodo),
      situacao:           body.situacao || 'ATIVO',
      credito:            body.credito !== '' && body.credito !== null && body.credito !== undefined ? Number(body.credito) : null,
      qtd_aulas:          body.qtdAulas || body.qtd_aulas ? Number(body.qtdAulas || body.qtd_aulas) : null,
      complementar:       Boolean(body.complementar),
      optativa:           Boolean(body.optativa),
      requer_deferimento: Boolean(body.requerDeferimento || body.requer_deferimento),
      estagio:            Boolean(body.estagio),
      avaliacoes:         body.avaliacoes !== '' && body.avaliacoes !== null && body.avaliacoes !== undefined ? Number(body.avaliacoes) : null,
      grade:              body.grade || null,
      matriz:             body.compoeMatriz !== undefined ? Boolean(body.compoeMatriz) : Boolean(body.matriz !== undefined ? body.matriz : true),
    };

    const { data, error } = await supabase
      .from('disciplinas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(normalizeDisciplina(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Disciplina removida com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
