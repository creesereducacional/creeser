import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

let cursoUnidadeSchemaCache = null;

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  const normalized = String(value).trim();
  return normalized || '';
};

const isMissingColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('does not exist') || message.includes('could not find');
};

const getCursoUnidadeSchema = async () => {
  if (cursoUnidadeSchemaCache) {
    return cursoUnidadeSchemaCache;
  }

  const candidates = [
    { cursoCol: 'cursoid', unidadeCol: 'unidadeid' },
    { cursoCol: 'curso_id', unidadeCol: 'unidade_id' },
    { cursoCol: 'cursoId', unidadeCol: 'unidadeId' },
  ];

  for (const schema of candidates) {
    const { error } = await supabase
      .from('curso_unidade')
      .select(`${schema.cursoCol},${schema.unidadeCol}`)
      .limit(1);

    if (!error) {
      cursoUnidadeSchemaCache = schema;
      return schema;
    }

    if (!isMissingColumnError(error) && error?.code !== '42P01') {
      throw error;
    }
  }

  return null;
};

const getCursosByUnidade = async (unidadeId) => {
  const parsedUnidadeId = Number.parseInt(unidadeId, 10);
  if (Number.isNaN(parsedUnidadeId)) {
    return [];
  }

  const schema = await getCursoUnidadeSchema();
  if (!schema) {
    return [];
  }

  const { data: links, error: linksError } = await supabase
    .from('curso_unidade')
    .select(schema.cursoCol)
    .eq(schema.unidadeCol, parsedUnidadeId);

  if (linksError) {
    throw linksError;
  }

  const cursoIds = [...new Set((links || [])
    .map((item) => Number.parseInt(item[schema.cursoCol], 10))
    .filter((value) => !Number.isNaN(value)))];

  if (cursoIds.length === 0) {
    return [];
  }

  const { data: cursos, error: cursosError } = await supabase
    .from('cursos')
    .select('id,nome,situacao')
    .in('id', cursoIds)
    .eq('situacao', 'ATIVO')
    .order('nome', { ascending: true });

  if (cursosError) {
    throw cursosError;
  }

  return cursos || [];
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { unidadeId, instituicaoId } = req.query;
    const instituicaoIdNormalizado = normalizeText(instituicaoId);

    let unidadesQuery = supabase
      .from('unidades')
      .select('id,nome,instituicao_id')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (instituicaoIdNormalizado) {
      unidadesQuery = unidadesQuery.eq('instituicao_id', instituicaoIdNormalizado);
    }

    const [instituicoesResp, unidadesResp, gradesResp] = await Promise.all([
      supabase
        .from('instituicoes')
        .select('id,nome,ativa')
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true }),
      unidadesQuery,
      supabase.from('grades').select('id,nome,cursoid').order('nome', { ascending: true }),
    ]);

    const cursos = unidadeId ? await getCursosByUnidade(unidadeId) : [];

    if (instituicoesResp.error) {
      throw instituicoesResp.error;
    }
    if (unidadesResp.error) {
      throw unidadesResp.error;
    }
    if (gradesResp.error) {
      throw gradesResp.error;
    }

    return res.status(200).json({
      instituicoes: (instituicoesResp.data || []).filter((instituicao) => instituicao.ativa !== false),
      unidades: unidadesResp.data || [],
      cursos,
      grades: gradesResp.data || [],
    });
  } catch (error) {
    console.error('Erro ao carregar opções de turmas:', error);
    return res.status(500).json({ error: 'Erro ao carregar opções', detail: error.message });
  }
}
