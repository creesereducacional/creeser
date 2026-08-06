import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || message.includes('does not exist') || message.includes('relation');
};

const parseId = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  const parsedNum = Number.parseInt(str, 10);
  if (!Number.isNaN(parsedNum) && String(parsedNum) === str) {
    return parsedNum;
  }
  return str;
};

const asText = (val, fallback = '') => {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  return str || fallback;
};

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const dStr = String(dateVal).split('T')[0];
  const parts = dStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) {
      return `${day}/${month}/${year}`;
    }
  }
  const dateObj = new Date(dateVal);
  if (Number.isNaN(dateObj.getTime())) return String(dateVal);
  return dateObj.toLocaleDateString('pt-BR');
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === '') return 'R$ 0,00';
  if (typeof val === 'string' && val.includes('R$')) return val;
  const num = typeof val === 'number' ? val : Number.parseFloat(String(val).replace(',', '.'));
  if (Number.isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const buildAddress = (aluno) => {
  const parts = [
    aluno?.endereco,
    aluno?.numero ? `nº ${aluno.numero}` : '',
    aluno?.complemento,
    aluno?.bairro,
    aluno?.cidade,
    aluno?.estado,
    aluno?.cep ? `CEP: ${aluno.cep}` : '',
  ].filter(Boolean);

  return parts.join(', ');
};

const findInstituicaoPorId = async (instituicaoId) => {
  if (!instituicaoId) return null;
  const { data, error } = await supabase
    .from('instituicoes')
    .select('*')
    .eq('id', instituicaoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data || null;
};

const findInstituicaoPorNome = async (aluno) => {
  const instituicaoNome = (aluno?.instituicao || '').trim();
  if (!instituicaoNome) return null;

  let query = await supabase
    .from('instituicoes')
    .select('*')
    .eq('nome', instituicaoNome)
    .limit(1);

  if (!query.error && query.data && query.data.length > 0) {
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

export class ContratoResolverService {
  /**
   * Resolve o contrato para um aluno fornecido.
   * Lógica:
   * Aluno -> Turma -> turmas.contrato_id
   * SE existir contrato_id -> carrega modelo correspondente em contratos_instituicao.
   * SE não existir -> localiza contrato ativo padrao da instituicao.
   * SE não existir nenhum -> lança erro 'Não há modelo de contrato cadastrado para esta instituição.'
   */
  static async resolveContratoAluno(alunoId, options = {}) {
    const parsedAlunoId = parseId(alunoId);
    if (!parsedAlunoId) {
      const error = new Error('ID do aluno inválido');
      error.statusCode = 400;
      throw error;
    }

    let alunoQuery = supabase
      .from('alunos')
      .select('*')
      .eq('id', parsedAlunoId);

    if (options.applyFilter && typeof options.applyFilter === 'function') {
      alunoQuery = options.applyFilter(alunoQuery);
    }

    const { data: alunosData, error: alunoError } = await alunoQuery.limit(1);

    if (alunoError || !alunosData || alunosData.length === 0) {
      if (alunoError) console.error('alunoQuery error:', alunoError);
      const error = new Error('Aluno não encontrado');
      error.statusCode = 404;
      throw error;
    }

    const aluno = alunosData[0];

    const instituicao =
      (await findInstituicaoPorId(aluno.instituicao_id)) ||
      (await findInstituicaoPorNome(aluno));

    if (!instituicao) {
      const error = new Error('Instituição do aluno não encontrada. Verifique o cadastro da instituição no aluno.');
      error.statusCode = 404;
      throw error;
    }

    // 1. Localizar a turma do aluno
    const turma = await findTurmaDoAluno(aluno);

    // 2. Resolver o modelo de contrato:
    // a) Prioridade: contrato vinculado à Turma (contrato_id / contratoid)
    // b) Fallback: contrato Padrão da Instituição
    let contrato = null;
    const turmaContratoId = parseId(turma?.contrato_id || turma?.contratoid) || (turma?.contrato_id || turma?.contratoid || null);

    if (turmaContratoId) {
      const { data: cTurma, error: cTurmaErr } = await supabase
        .from('contratos_instituicao')
        .select('*')
        .eq('id', turmaContratoId)
        .single();

      if (!cTurmaErr && cTurma && cTurma.ativo !== false) {
        contrato = cTurma;
      }
    }

    if (!contrato) {
      contrato = await findContratoPadraoInstituicao(instituicao.id);
    }

    if (!contrato) {
      const error = new Error('Não há modelo de contrato cadastrado para esta instituição.');
      error.statusCode = 404;
      throw error;
    }

    const curso = await findCursoDaTurma(turma);
    const responsavel = await findResponsavelDoAluno(parsedAlunoId);

    let periodoCarneStr = '';
    try {
      const { data: ordensCarne } = await supabase
        .from('financeiro_ordens_pagamento')
        .select('id')
        .eq('aluno_id', parsedAlunoId)
        .eq('tipo', 'carne')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(1);

      if (ordensCarne && ordensCarne.length > 0) {
        const carneId = ordensCarne[0].id;
        const { data: parcelas } = await supabase
          .from('financeiro_parcelas')
          .select('data_vencimento')
          .eq('ordem_pagamento_id', carneId)
          .order('data_vencimento', { ascending: true });

        if (parcelas && parcelas.length > 0) {
          const dIni = formatDate(parcelas[0].data_vencimento);
          const dFim = formatDate(parcelas[parcelas.length - 1].data_vencimento);
          if (dIni && dFim) {
            periodoCarneStr = `Período do carnê: ${dIni} a ${dFim}`;
          }
        }
      }
    } catch (_) {}

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
      '{{INSTITUICAO_ENDERECO}}': asText(instituicao.endereco),
      '{{INSTITUICAO_CIDADE}}': asText(instituicao.cidade),
      '{{INSTITUICAO_UF}}': asText(instituicao.estado),
      '{{RESPONSAVEL_NOME}}': asText(responsavel?.nome),
      '{{RESPONSAVEL_CPF}}': asText(responsavel?.cpf),
      '{{RESPONSAVEL_RG}}': asText(responsavel?.rg),
      '{{RESPONSAVEL_EMAIL}}': asText(responsavel?.email),
      '{{RESPONSAVEL_TELEFONE}}': asText(responsavel?.telefonecelular || responsavel?.whatsapp || responsavel?.telefone),
      '{{DATA_ATUAL}}': formatDate(new Date().toISOString()),
      '{{DATA_GERACAO}}': formatDate(new Date().toISOString()),
      '{{PERIODO_CARNE}}': periodoCarneStr,
    };

    let htmlFormatado = contrato.conteudo_html || '';
    Object.entries(placeholders).forEach(([token, valor]) => {
      htmlFormatado = htmlFormatado.split(token).join(valor);
    });

    return {
      aluno,
      turma,
      curso,
      instituicao,
      responsavel,
      contrato: {
        id: contrato.id,
        nome: contrato.nome,
        descricao: contrato.descricao,
        padrao: contrato.padrao,
        origem: turmaContratoId && contrato.id === turmaContratoId ? 'turma' : 'instituicao_padrao',
        html: htmlFormatado,
      },
      placeholders,
    };
  }
}
