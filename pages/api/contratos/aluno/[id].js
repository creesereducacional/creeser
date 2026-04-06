import {
  contratoSchemaErrorMessage,
  isMissingContratoSchemaError,
  supabase
} from '../_shared';

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('relation') ||
    message.includes('does not exist') ||
    message.includes('could not find the table')
  );
};

const parseId = (value) => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const asText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const escapeHtml = (value) => asText(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return asText(value);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numeric);
};

const buildAddress = (obj = {}) => {
  const parts = [
    obj.endereco,
    obj.numeroendereco,
    obj.complemento,
    obj.bairro,
    obj.cidade,
    obj.estado,
    obj.cep
  ]
    .map((item) => asText(item))
    .filter(Boolean);

  return parts.join(', ');
};

const replacePlaceholders = (template, placeholdersMap) => {
  let html = String(template || '');

  Object.entries(placeholdersMap).forEach(([placeholder, value]) => {
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(escapedPlaceholder, 'g'), escapeHtml(value));
  });

  return html;
};

const findInstituicaoDoAluno = async (aluno) => {
  const instituicaoNome = asText(aluno?.instituicao);

  if (!instituicaoNome) return null;

  let query = await supabase
    .from('instituicoes')
    .select('*')
    .ilike('nome', instituicaoNome)
    .limit(1);

  if (query.error) throw query.error;
  if (Array.isArray(query.data) && query.data.length > 0) {
    return query.data[0];
  }

  query = await supabase
    .from('instituicoes')
    .select('*')
    .ilike('nome', `%${instituicaoNome}%`)
    .limit(1);

  if (query.error) throw query.error;
  return (query.data || [])[0] || null;
};

const findContratoPadraoInstituicao = async (instituicaoId) => {
  let { data, error } = await supabase
    .from('contratos_instituicao')
    .select('*')
    .eq('instituicao_id', instituicaoId)
    .eq('ativo', true)
    .order('padrao', { ascending: false })
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    ({ data, error } = await supabase
      .from('contratos_instituicao')
      .select('*')
      .eq('instituicao_id', instituicaoId)
      .order('padrao', { ascending: false })
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })
      .limit(1));

    if (error) throw error;
  }

  return (data || [])[0] || null;
};

const findTurmaDoAluno = async (aluno) => {
  const turmaId = parseId(aluno?.turmaid);
  if (!turmaId) return null;

  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('id', turmaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data || null;
};

const findCursoDaTurma = async (turma) => {
  const cursoId = parseId(turma?.cursoid);
  if (!cursoId) return null;

  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .eq('id', cursoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data || null;
};

const findResponsavelDoAluno = async (alunoId) => {
  const { data: relacoes, error: relError } = await supabase
    .from('responsavel_aluno')
    .select('responsavel_id')
    .eq('aluno_id', alunoId)
    .limit(1);

  if (relError) {
    if (isMissingTableError(relError)) return null;
    throw relError;
  }

  const responsavelId = parseId(relacoes?.[0]?.responsavel_id);
  if (!responsavelId) return null;

  const { data: responsavel, error: respError } = await supabase
    .from('responsaveis')
    .select('*')
    .eq('id', responsavelId)
    .single();

  if (respError) {
    if (respError.code === 'PGRST116' || isMissingTableError(respError)) return null;
    throw respError;
  }

  return responsavel || null;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const alunoId = parseId(req.query?.id);
    if (!alunoId) {
      return res.status(400).json({ error: 'ID do aluno inválido' });
    }

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .single();

    if (alunoError || !aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const instituicao = await findInstituicaoDoAluno(aluno);
    if (!instituicao) {
      return res.status(404).json({
        error: 'Instituição do aluno não encontrada. Verifique o cadastro da instituição no aluno.'
      });
    }

    const contrato = await findContratoPadraoInstituicao(instituicao.id);
    if (!contrato) {
      return res.status(404).json({
        error: 'Não há modelo de contrato cadastrado para esta instituição.'
      });
    }

    const turma = await findTurmaDoAluno(aluno);
    const curso = await findCursoDaTurma(turma);
    const responsavel = await findResponsavelDoAluno(alunoId);

    const placeholders = {
      '{{ALUNO_NOME}}': asText(aluno.nome),
      '{{ALUNO_CPF}}': asText(aluno.cpf),
      '{{ALUNO_RG}}': asText(aluno.rg),
      '{{ALUNO_EMAIL}}': asText(aluno.email),
      '{{ALUNO_TELEFONE}}': asText(aluno.telefone_celular || aluno.telefonecelular || aluno.telefone),
      '{{ALUNO_DATA_NASCIMENTO}}': formatDate(aluno.data_nascimento),
      '{{ALUNO_NACIONALIDADE}}': asText(aluno.pais_origem),
      '{{ALUNO_NATURALIDADE}}': asText(aluno.naturalidade),
      '{{ALUNO_ESTADO_CIVIL}}': asText(aluno.estadocivil),
      '{{ALUNO_PROFISSAO}}': asText(aluno.profissao),
      '{{ALUNO_ENDERECO_RESIDENCIAL}}': buildAddress(aluno),
      '{{ALUNO_ENDERECO}}': asText(aluno.endereco),
      '{{ALUNO_BAIRRO}}': asText(aluno.bairro),
      '{{ALUNO_CIDADE}}': asText(aluno.cidade),
      '{{ALUNO_CEP}}': asText(aluno.cep),
      '{{ALUNO_UF}}': asText(aluno.estado),
      '{{CURSO_NOME}}': asText(curso?.nome || turma?.curso),
      '{{CURSO_CARGA_HORARIA}}': asText(curso?.carga_horaria || turma?.cargahoraria),
      '{{TURMA_NOME}}': asText(turma?.nome),
      '{{VALOR_MENSALIDADE}}': formatCurrency(aluno.valor_mensalidade || turma?.mensalidade),
      '{{VALOR_MATRICULA}}': formatCurrency(aluno.valor_matricula || turma?.matricula),
      '{{QTD_PARCELAS}}': asText(aluno.qtd_parcelas || turma?.mesescontrato),
      '{{DATA_INICIO_CURSO}}': formatDate(turma?.datainicio),
      '{{DATA_FIM_CURSO}}': formatDate(turma?.datafim),
      '{{INSTITUICAO_NOME}}': asText(instituicao.nome),
      '{{INSTITUICAO_CNPJ}}': asText(instituicao.cnpj),
      '{{INSTITUICAO_ENDERECO}}': buildAddress(instituicao),
      '{{RESPONSAVEL_NOME}}': asText(responsavel?.nome),
      '{{RESPONSAVEL_CPF}}': asText(responsavel?.cpf),
      '{{DATA_ASSINATURA}}': formatDate(new Date())
    };

    const htmlContrato = replacePlaceholders(contrato.conteudo_html || '', placeholders);

    return res.status(200).json({
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        instituicao: aluno.instituicao
      },
      instituicao: {
        id: instituicao.id,
        nome: instituicao.nome
      },
      contrato: {
        id: contrato.id,
        nome: contrato.nome,
        descricao: contrato.descricao || '',
        html: htmlContrato
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao gerar contrato do aluno:', error);

    if (isMissingContratoSchemaError(error)) {
      return res.status(503).json({ error: contratoSchemaErrorMessage });
    }

    return res.status(500).json({ error: error.message || 'Erro ao gerar contrato do aluno' });
  }
}
