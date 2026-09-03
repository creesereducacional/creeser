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
        .select('id')
        .eq('id', body.grade)
        .maybeSingle();
      
      if (gradeError || !gradeData) {
        return res.status(400).json({ error: 'Matriz Curricular selecionada não é válida' });
      }
    }

    const cargaHorariaVal = body.cargaHoraria || body.carga_horaria || body.cargahoraria ? Number(body.cargaHoraria || body.carga_horaria || body.cargahoraria) : null;
    
    // Resolver cursoid numérico válido buscando na tabela cursos
    let numericCursoId = null;
    let cursoNome = body.curso || null;

    if (body.cursoId || body.curso_id) {
      const parsed = Number(body.cursoId || body.curso_id);
      if (!Number.isNaN(parsed)) numericCursoId = parsed;
    }

    if (!numericCursoId && body.curso) {
      const { data: cursoEncontrado } = await supabase
        .from('cursos')
        .select('id, nome')
        .ilike('nome', body.curso.trim())
        .maybeSingle();

      if (cursoEncontrado) {
        numericCursoId = Number(cursoEncontrado.id);
        cursoNome = cursoEncontrado.nome;
      }
    }

    // Se ainda não encontrou, deduz pelo curso vinculado à grade
    if (!numericCursoId && body.grade) {
      const { data: gradeInfo } = await supabase
        .from('grades')
        .select('curso_id, cursoid')
        .eq('id', body.grade)
        .maybeSingle();

      if (gradeInfo) {
        const cId = gradeInfo.curso_id || gradeInfo.cursoid;
        if (cId) numericCursoId = Number(cId);
      }
    }

    // Se ainda assim não encontrou, busca o primeiro curso cadastrado
    if (!numericCursoId) {
      const { data: primeiroCurso } = await supabase.from('cursos').select('id, nome').limit(1).maybeSingle();
      if (primeiroCurso) {
        numericCursoId = Number(primeiroCurso.id);
        if (!cursoNome) cursoNome = primeiroCurso.nome;
      } else {
        numericCursoId = 1;
      }
    }

    const payloadNormalizado = {
      codigo:        body.codigo        || null,
      nome:          body.nome,
      curso:         cursoNome,
      cursoid:       numericCursoId,
      periodo:       body.periodo       || null,
      carga_horaria: cargaHorariaVal,
      cargahoraria:  cargaHorariaVal,
      matriz:        body.matriz        ?? true,
      grade:         body.grade         || null,
      situacao:      body.situacao      || 'ATIVO',
      instituicao_id: instId            || null,
    };

    let { data, error } = await supabase.from('disciplinas').insert(payloadNormalizado).select().single();
    if (error && error.message && error.message.includes('column')) {
      const payloadLegado = {
        codigo:        body.codigo        || null,
        nome:          body.nome,
        cursoid:       numericCursoId,
        periodo:       body.periodo       ? Number(body.periodo) : null,
        cargahoraria:  cargaHorariaVal,
        situacao:      body.situacao      || 'ATIVO',
      };
      const fallback = await supabase.from('disciplinas').insert(payloadLegado).select().single();
      if (fallback.error) return res.status(500).json({ error: fallback.error.message });
      data = {
        ...fallback.data,
        carga_horaria: fallback.data.cargahoraria,
        curso_id: fallback.data.cursoid,
        grade: body.grade || null
      };
      error = null;
    }

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
