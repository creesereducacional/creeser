import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const PLACEHOLDERS_CONTRATO = [
  '{{ALUNO_NOME}}',
  '{{ALUNO_CPF}}',
  '{{ALUNO_RG}}',
  '{{ALUNO_EMAIL}}',
  '{{ALUNO_TELEFONE}}',
  '{{ALUNO_DATA_NASCIMENTO}}',
  '{{ALUNO_NACIONALIDADE}}',
  '{{ALUNO_NATURALIDADE}}',
  '{{ALUNO_ESTADO_CIVIL}}',
  '{{ALUNO_PROFISSAO}}',
  '{{ALUNO_ENDERECO_RESIDENCIAL}}',
  '{{ALUNO_ENDERECO}}',
  '{{ALUNO_BAIRRO}}',
  '{{ALUNO_CIDADE}}',
  '{{ALUNO_CEP}}',
  '{{ALUNO_UF}}',
  '{{CURSO_NOME}}',
  '{{CURSO_CARGA_HORARIA}}',
  '{{TURMA_NOME}}',
  '{{VALOR_MENSALIDADE}}',
  '{{VALOR_MATRICULA}}',
  '{{QTD_PARCELAS}}',
  '{{DATA_INICIO_CURSO}}',
  '{{DATA_FIM_CURSO}}',
  '{{INSTITUICAO_NOME}}',
  '{{INSTITUICAO_CNPJ}}',
  '{{INSTITUICAO_ENDERECO}}',
  '{{RESPONSAVEL_NOME}}',
  '{{RESPONSAVEL_CPF}}',
  '{{DATA_ASSINATURA}}'
];

export const toBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return defaultValue;
};

const parseOrder = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : defaultValue;
};

const uniqueStrings = (values) => {
  const seen = new Set();
  const result = [];

  for (const item of values) {
    const normalized = String(item || '').trim();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
};

export const normalizePlaceholders = (input) => {
  if (Array.isArray(input)) {
    return uniqueStrings(input);
  }

  if (typeof input === 'string' && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return uniqueStrings(parsed);
    } catch (_) {
      return uniqueStrings(input.split(','));
    }
  }

  return [];
};

export const parseContratoPayload = (body, existing = null) => {
  const payload = {};

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'nome')) {
    const nome = String(body?.nome || existing?.nome || '').trim();
    if (!nome) {
      throw new Error('Nome do modelo é obrigatório');
    }
    payload.nome = nome;
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'descricao')) {
    payload.descricao = body?.descricao ? String(body.descricao).trim() : null;
  }

  const conteudoRecebido =
    Object.prototype.hasOwnProperty.call(body, 'conteudoHtml') ||
    Object.prototype.hasOwnProperty.call(body, 'conteudo_html');

  if (!existing || conteudoRecebido) {
    payload.conteudo_html = String(body?.conteudoHtml ?? body?.conteudo_html ?? existing?.conteudo_html ?? '');
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'placeholders')) {
    payload.placeholders = normalizePlaceholders(body?.placeholders ?? existing?.placeholders ?? []);
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'ativo')) {
    payload.ativo = toBoolean(body?.ativo, existing?.ativo ?? true);
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'ordem')) {
    payload.ordem = parseOrder(body?.ordem, existing?.ordem ?? 0);
  }

  return payload;
};

export const mapContratoRow = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    instituicaoId: row.instituicao_id,
    instituicao_id: row.instituicao_id,
    nome: row.nome,
    descricao: row.descricao,
    conteudoHtml: row.conteudo_html || '',
    conteudo_html: row.conteudo_html || '',
    placeholders: Array.isArray(row.placeholders) ? row.placeholders : [],
    ativo: Boolean(row.ativo),
    padrao: Boolean(row.padrao),
    ordem: Number.isFinite(Number(row.ordem)) ? Number(row.ordem) : 0,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
};

export const unsetDefaultFromInstitution = async (instituicaoId, exceptId = null) => {
  let query = supabase
    .from('contratos_instituicao')
    .update({ padrao: false, updated_at: new Date().toISOString() })
    .eq('instituicao_id', instituicaoId)
    .eq('padrao', true);

  if (exceptId) {
    query = query.neq('id', exceptId);
  }

  const { error } = await query;
  if (error) throw error;
};

export const isMissingContratoSchemaError = (error) => {
  const mensagem = String(error?.message || '').toLowerCase();

  return (
    mensagem.includes('could not find the table') ||
    mensagem.includes('schema cache') ||
    mensagem.includes('does not exist')
  );
};

export const contratoSchemaErrorMessage =
  'Estrutura de contratos ainda não aplicada no banco. Execute as migrations do Supabase e tente novamente.';
