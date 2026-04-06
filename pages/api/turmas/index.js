import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const isMissingColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('does not exist') || message.includes('could not find');
};

const parseInteger = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const parseTurmaMeta = (descricao) => {
  if (!descricao) return {};
  if (typeof descricao !== 'string') return {};

  try {
    const parsed = JSON.parse(descricao);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { descricaoTexto: descricao };
  }
};

const mapRowToResponse = (row) => {
  const meta = parseTurmaMeta(row.descricao);
  const descricaoDireta = typeof row.descricao === 'string' && row.descricao.trim().startsWith('{')
    ? meta.descricao || meta.descricaoTexto || ''
    : row.descricao || meta.descricao || meta.descricaoTexto || '';

  return {
    id: row.id,
    nome: row.nome || '',
    instituicaoId: row.instituicao_id || row.instituicaoid || '',
    instituicao: meta.instituicao || '',
    unidadeId: row.unidadeid ? String(row.unidadeid) : '',
    unidade: row.unidades?.nome || meta.unidade || '',
    cursoId: row.cursoid ? String(row.cursoid) : '',
    curso: row.cursos?.nome || meta.curso || '',
    gradeId: row.gradeid ? String(row.gradeid) : '',
    grade: row.grades?.nome || meta.grade || '',
    cargaHoraria: row.cargahoraria || meta.cargaHoraria || '',
    processoSeletivo: row.datainicio || meta.processoSeletivo || '',
    edittalProcessoSeletivo: row.editalprocessoseletivo || meta.edittalProcessoSeletivo || '',
    turno: row.turno || meta.turno || '',
    tipo: row.tipocobranca || meta.tipo || 'Boleto',
    mensalidade: row.mensalidade || meta.mensalidade || '',
    desconto: row.desconto || meta.desconto || '',
    inscricao: row.inscricao || meta.inscricao || '',
    matricula: row.matricula || meta.matricula || '',
    contaRecebimento: row.contarecebimento || meta.contaRecebimento || '',
    mesesContrato:
      row.mesescontrato !== null && row.mesescontrato !== undefined
        ? String(row.mesescontrato)
        : meta.mesesContrato || '',
    limiteCadastroAlunos:
      row.capacidademaxima !== null && row.capacidademaxima !== undefined
        ? String(row.capacidademaxima)
        : meta.limiteCadastroAlunos || '',
    iesRegistradoraDiploma: row.iesregistradoradiploma || meta.iesRegistradoraDiploma || '',
    situacao: row.situacao || 'ATIVO',
    descricao: descricaoDireta,
    dataInicio: row.datainicio || '',
    dataFim: row.datafim || '',
    dataCriacao: row.datacriacao || null,
    dataAtualizacao: row.dataatualizacao || null,
  };
};

const mapBodyToPayload = (body) => {
  const instituicaoId = normalizeText(body.instituicaoId || body.instituicao_id || body.instituicaoid);
  const unidadeId = parseInteger(body.unidadeId || body.unidadeid || body.unidade);
  const cursoId = parseInteger(body.cursoId || body.cursoid || body.curso);
  const gradeId = parseInteger(body.gradeId || body.gradeid || body.grade);
  const capacidadeMaxima = parseInteger(body.limiteCadastroAlunos || body.capacidadeMaxima || body.capacidademaxima);
  const mesesContrato = parseInteger(body.mesesContrato || body.mesescontrato);

  const descricaoMeta = {
    instituicao: body.instituicao || '',
    unidade: body.unidade || '',
    curso: body.curso || '',
    grade: body.grade || '',
    cargaHoraria: body.cargaHoraria || '',
    processoSeletivo: body.processoSeletivo || '',
    edittalProcessoSeletivo: body.edittalProcessoSeletivo || '',
    turno: body.turno || '',
    tipo: body.tipo || 'Boleto',
    mensalidade: body.mensalidade || '',
    desconto: body.desconto || '',
    inscricao: body.inscricao || '',
    matricula: body.matricula || '',
    contaRecebimento: body.contaRecebimento || '',
    mesesContrato: body.mesesContrato || '',
    limiteCadastroAlunos: body.limiteCadastroAlunos || '',
    iesRegistradoraDiploma: body.iesRegistradoraDiploma || '',
    descricao: body.descricao || '',
  };

  const payloadBase = {
    nome: (body.nome || '').trim(),
    instituicao_id: instituicaoId,
    unidadeid: unidadeId,
    cursoid: cursoId,
    gradeid: gradeId,
    situacao: body.situacao || 'ATIVO',
    datainicio: body.processoSeletivo || body.dataInicio || null,
    datafim: body.dataFim || null,
    capacidademaxima: capacidadeMaxima,
  };

  const payloadNormalizado = {
    ...payloadBase,
    cargahoraria: body.cargaHoraria || null,
    editalprocessoseletivo: body.edittalProcessoSeletivo || null,
    turno: body.turno || null,
    tipocobranca: body.tipo || null,
    mensalidade: body.mensalidade || null,
    desconto: body.desconto || null,
    inscricao: body.inscricao || null,
    matricula: body.matricula || null,
    contarecebimento: body.contaRecebimento || null,
    mesescontrato: mesesContrato,
    iesregistradoradiploma: body.iesRegistradoraDiploma || null,
    descricao: body.descricao || null,
  };

  const payloadLegado = {
    ...payloadBase,
    descricao: JSON.stringify(descricaoMeta),
  };

  return {
    payloadNormalizado,
    payloadLegado,
  };
};

const selectTurmas = `
  *,
  unidades(id,nome),
  cursos(id,nome),
  grades(id,nome)
`;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('turmas')
        .select(selectTurmas)
        .order('id', { ascending: false });

      if (error) {
        console.error('Supabase GET turmas error:', error);
        return res.status(500).json({ error: 'Erro ao listar turmas', detail: error.message });
      }

      return res.status(200).json((data || []).map(mapRowToResponse));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { payloadNormalizado, payloadLegado } = mapBodyToPayload(body);

      if (!payloadNormalizado.nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      if (!payloadNormalizado.instituicao_id || !payloadNormalizado.unidadeid || !payloadNormalizado.cursoid || !payloadNormalizado.gradeid) {
        return res.status(400).json({ error: 'Instituição, unidade, curso e grade são obrigatórios' });
      }

      let data = null;
      let error = null;

      ({ data, error } = await supabase
        .from('turmas')
        .insert([payloadNormalizado])
        .select(selectTurmas)
        .single());

      if (error && isMissingColumnError(error)) {
        ({ data, error } = await supabase
          .from('turmas')
          .insert([payloadLegado])
          .select(selectTurmas)
          .single());
      }

      if (error) {
        console.error('Supabase POST turmas error:', error);
        return res.status(500).json({ error: 'Erro ao criar turma', detail: error.message });
      }

      return res.status(201).json(mapRowToResponse(data));
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de turmas:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição', detail: error.message });
  }
}
