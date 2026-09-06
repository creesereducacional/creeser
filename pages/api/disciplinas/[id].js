import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';
import { normalizeDisciplina } from './index';

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
    const { data, error } = await supabase.from('disciplinas').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Disciplina não encontrada' });
    return res.status(200).json(normalizeDisciplina(data));
  }

  if (req.method === 'PUT') {
    const body = req.body || {};

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

    const cargaHorariaVal = body.cargaHoraria || body.carga_horaria || body.cargahoraria ? Number(body.cargaHoraria || body.carga_horaria || body.cargahoraria) : undefined;
    const creditoVal = body.credito !== undefined && body.credito !== null && body.credito !== '' ? Number(body.credito) : undefined;
    const qtdAulasVal = body.qtdAulas || body.qtd_aulas ? Number(body.qtdAulas || body.qtd_aulas) : undefined;
    const avaliacoesVal = body.avaliacoes !== undefined && body.avaliacoes !== null && body.avaliacoes !== '' ? Number(body.avaliacoes) : undefined;
    const compoeMatrizVal = body.compoeMatriz !== undefined ? Boolean(body.compoeMatriz) : (body.matriz !== undefined ? Boolean(body.matriz) : undefined);
    const requerDeferimentoVal = body.requerDeferimento !== undefined ? Boolean(body.requerDeferimento) : (body.requer_deferimento !== undefined ? Boolean(body.requer_deferimento) : undefined);
    
    // Resolver cursoid numérico
    let numericCursoId = undefined;
    let cursoNome = body.curso !== undefined ? body.curso : undefined;

    if (body.cursoId || body.curso_id) {
      const parsed = Number(body.cursoId || body.curso_id);
      if (!Number.isNaN(parsed)) numericCursoId = parsed;
    }

    if (numericCursoId === undefined && body.curso) {
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

    if (numericCursoId === undefined && body.grade) {
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

    const updatesNormalizado = {
      codigo:             body.codigo,
      nome:               body.nome,
      curso:              cursoNome,
      cursoid:            numericCursoId,
      periodo:            body.periodo,
      carga_horaria:      cargaHorariaVal,
      cargahoraria:       cargaHorariaVal,
      credito:            creditoVal,
      qtd_aulas:          qtdAulasVal,
      matriz:             compoeMatrizVal,
      grade:              body.grade,
      ementa:             body.ementa,
      complementar:       body.complementar !== undefined ? Boolean(body.complementar) : undefined,
      optativa:           body.optativa !== undefined ? Boolean(body.optativa) : undefined,
      requer_deferimento: requerDeferimentoVal,
      estagio:            body.estagio !== undefined ? Boolean(body.estagio) : undefined,
      avaliacoes:         avaliacoesVal,
      situacao:           body.situacao,
    };

    // Remover propriedades undefined
    Object.keys(updatesNormalizado).forEach(k => updatesNormalizado[k] === undefined && delete updatesNormalizado[k]);

    let { data, error } = await supabase.from('disciplinas').update(updatesNormalizado).eq('id', id).select().single();
    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache'))) {
      const updatesLegado = {
        codigo:        body.codigo,
        nome:          body.nome,
        cursoid:       numericCursoId,
        periodo:       body.periodo,
        cargahoraria:  cargaHorariaVal,
        situacao:      body.situacao,
      };
      Object.keys(updatesLegado).forEach(k => updatesLegado[k] === undefined && delete updatesLegado[k]);

      const fallback = await supabase.from('disciplinas').update(updatesLegado).eq('id', id).select().single();
      if (fallback.error) return res.status(500).json({ error: fallback.error.message });
      data = fallback.data;
      error = null;
    }

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
