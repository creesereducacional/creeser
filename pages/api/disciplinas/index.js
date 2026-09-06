import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const normalizeDisciplina = (d) => {
  if (!d) return d;
  const ch = d.carga_horaria !== undefined && d.carga_horaria !== null ? d.carga_horaria : (d.cargahoraria !== undefined ? d.cargahoraria : null);
  const compoeMatriz = d.matriz !== undefined ? Boolean(d.matriz) : (d.compoeMatriz !== undefined ? Boolean(d.compoeMatriz) : true);
  const reqDef = d.requer_deferimento !== undefined ? Boolean(d.requer_deferimento) : (d.requerDeferimento !== undefined ? Boolean(d.requerDeferimento) : false);
  const qa = d.qtd_aulas !== undefined && d.qtd_aulas !== null ? d.qtd_aulas : (d.qtdAulas !== undefined ? d.qtdAulas : null);

  return {
    ...d,
    // Preservar tanto camelCase quanto snake_case
    cargaHoraria: ch !== null ? String(ch) : '',
    carga_horaria: ch,
    cargahoraria: ch,

    credito: d.credito !== undefined && d.credito !== null ? String(d.credito) : '',

    qtdAulas: qa !== null ? String(qa) : '',
    qtd_aulas: qa,

    compoeMatriz: compoeMatriz,
    matriz: compoeMatriz,

    requerDeferimento: reqDef,
    requer_deferimento: reqDef,

    complementar: Boolean(d.complementar),
    optativa: Boolean(d.optativa),
    estagio: Boolean(d.estagio),
    avaliacoes: d.avaliacoes !== undefined && d.avaliacoes !== null ? String(d.avaliacoes) : '',
    ementa: d.ementa || '',
    grade: d.grade ? String(d.grade) : '',
    curso: d.curso || '',
    periodo: d.periodo || '',
    cursoId: d.cursoid || d.curso_id || null,
    curso_id: d.cursoid || d.curso_id || null,
  };
};

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
    const normalizedData = (data || []).map(normalizeDisciplina);
    return res.status(200).json(normalizedData);
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
    const creditoVal = body.credito !== undefined && body.credito !== null && body.credito !== '' ? Number(body.credito) : null;
    const qtdAulasVal = body.qtdAulas || body.qtd_aulas ? Number(body.qtdAulas || body.qtd_aulas) : null;
    const avaliacoesVal = body.avaliacoes !== undefined && body.avaliacoes !== null && body.avaliacoes !== '' ? Number(body.avaliacoes) : null;
    const compoeMatrizVal = body.compoeMatriz !== undefined ? Boolean(body.compoeMatriz) : (body.matriz !== undefined ? Boolean(body.matriz) : true);
    const requerDeferimentoVal = body.requerDeferimento !== undefined ? Boolean(body.requerDeferimento) : Boolean(body.requer_deferimento);
    
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

    const rawPeriodo = body.periodo ? String(body.periodo) : null;
    let parsedPeriodoNum = null;
    if (rawPeriodo) {
      const match = rawPeriodo.match(/\d+/);
      if (match) parsedPeriodoNum = parseInt(match[0], 10);
    }

    const payloadNormalizado = {
      codigo:             body.codigo || null,
      nome:               body.nome,
      curso:              cursoNome,
      cursoid:            numericCursoId,
      periodo:            rawPeriodo,
      carga_horaria:      cargaHorariaVal,
      cargahoraria:       cargaHorariaVal,
      credito:            creditoVal,
      qtd_aulas:          qtdAulasVal,
      matriz:             compoeMatrizVal,
      grade:              body.grade || null,
      ementa:             body.ementa || null,
      complementar:       Boolean(body.complementar),
      optativa:           Boolean(body.optativa),
      requer_deferimento: requerDeferimentoVal,
      estagio:            Boolean(body.estagio),
      avaliacoes:         avaliacoesVal,
      situacao:           body.situacao || 'ATIVO',
      instituicao_id:     instId || null,
    };

    let { data, error } = await supabase.from('disciplinas').insert(payloadNormalizado).select().single();

    if (error && error.message && (error.message.includes('invalid input syntax for type integer') || error.message.includes('periodo'))) {
      const retryPayload = { ...payloadNormalizado, periodo: parsedPeriodoNum };
      const retry = await supabase.from('disciplinas').insert(retryPayload).select().single();
      if (!retry.error) {
        data = retry.data;
        error = null;
      } else {
        error = retry.error;
      }
    }

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(normalizeDisciplina(data));
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
