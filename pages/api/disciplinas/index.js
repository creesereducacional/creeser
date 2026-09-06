import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Schema real da tabela public.disciplinas (confirmado via information_schema):
// id, nome, codigo, cursoid, cargahoraria, ementa, objetivos, periodo (integer),
// situacao, datacriacao, dataatualização, numero_id, credito, qtd_aulas,
// complementar, optativa, requer_deferimento, estagio, avaliacoes, grade, grade_id, matriz

export const normalizeDisciplina = (d) => {
  if (!d) return d;
  const ch = d.cargahoraria !== undefined && d.cargahoraria !== null ? d.cargahoraria : null;
  const compoeMatriz = d.matriz !== undefined ? Boolean(d.matriz) : true;
  const reqDef = Boolean(d.requer_deferimento);

  return {
    // Spread do registro original
    ...d,

    // Carga horária — coluna real: cargahoraria
    cargaHoraria: ch !== null ? String(ch) : '',
    cargahoraria: ch,

    // Crédito
    credito: d.credito !== undefined && d.credito !== null ? String(d.credito) : '',

    // Qtd Aulas — coluna real: qtd_aulas
    qtdAulas: d.qtd_aulas !== undefined && d.qtd_aulas !== null ? String(d.qtd_aulas) : '',
    qtd_aulas: d.qtd_aulas,

    // Compõe a matriz — coluna real: matriz
    compoeMatriz: compoeMatriz,
    matriz: compoeMatriz,

    // Requer deferimento — coluna real: requer_deferimento
    requerDeferimento: reqDef,
    requer_deferimento: reqDef,

    // Booleans
    complementar: Boolean(d.complementar),
    optativa: Boolean(d.optativa),
    estagio: Boolean(d.estagio),

    // Avaliacoes — coluna real: avaliacoes (integer)
    avaliacoes: d.avaliacoes !== undefined && d.avaliacoes !== null ? String(d.avaliacoes) : '',

    // Texto
    ementa: d.ementa || '',
    grade: d.grade ? String(d.grade) : '',

    // Período — coluna real: periodo (integer), exposto como string no frontend
    periodo: d.periodo !== undefined && d.periodo !== null ? String(d.periodo) : '',

    // Curso — apenas cursoid existe no banco; expor também como alias para o frontend
    cursoId: d.cursoid || null,
    cursoid: d.cursoid || null,

    // Situação
    situacao: d.situacao || 'ATIVO',
  };
};

// Extrai número inteiro de uma string como "03º Período" → 3
export const parsePeriodo = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (!Number.isNaN(num) && Number.isFinite(num)) return Math.round(num);
  const match = String(val).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .order('nome');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(normalizeDisciplina));
  }

  if (req.method === 'POST') {
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

    // Montar payload APENAS com colunas que existem na tabela
    const payload = {
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

    const { data, error } = await supabase.from('disciplinas').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(normalizeDisciplina(data));
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
