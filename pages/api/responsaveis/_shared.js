import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01'
    || message.includes('relation')
    || message.includes('does not exist')
    || message.includes('could not find the table')
    || message.includes('schema cache')
  );
};

const isMissingColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || (message.includes('could not find') && message.includes('column'));
};

const normalizeText = (value, options = {}) => {
  if (value === undefined || value === null) return null;

  let normalized = String(value).trim();
  if (!normalized) return null;

  if (options.uppercase) {
    normalized = normalized.toUpperCase();
  }

  if (options.lowercase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const parseInteger = (value) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseOptionalInteger = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return parseInteger(value);
};

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

export const parseAlunoIdsFromBody = (body = {}) => {
  const source = Array.isArray(body.alunoIds)
    ? body.alunoIds
    : Array.isArray(body.alunoids)
      ? body.alunoids
      : [];

  const parsed = source
    .map((value) => parseInteger(value))
    .filter((value) => value !== null);

  return [...new Set(parsed)];
};

export const filterExistingAlunoIds = async (alunoIds) => {
  if (!Array.isArray(alunoIds) || alunoIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('alunos')
    .select('id')
    .in('id', alunoIds);

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }

  const existingIds = new Set((data || []).map((row) => row.id));
  return alunoIds.filter((id) => existingIds.has(id));
};

export const mapBodyToPayload = (body = {}) => {
  const uf = normalizeText(body.uf ?? body.estado, { uppercase: true });

  return {
    usuarioid: parseOptionalInteger(body.usuarioId ?? body.usuarioid),
    parentesco: normalizeText(body.parentesco),
    nome: normalizeText(body.nome),
    profissao: normalizeText(body.profissao),
    sexo: normalizeText(body.sexo),
    data_nascimento: normalizeDate(body.dataNascimento ?? body.data_nascimento ?? body.datanascimento),
    estado_civil: normalizeText(body.estadoCivil ?? body.estado_civil ?? body.estadocivil),
    whatsapp: normalizeText(body.whatsapp),
    telefone_comercial: normalizeText(body.telefoneComercial ?? body.telefone_comercial ?? body.telefonecomercial),
    endereco: normalizeText(body.endereco),
    complemento: normalizeText(body.complemento),
    cep: normalizeText(body.cep),
    bairro: normalizeText(body.bairro),
    cidade: normalizeText(body.cidade),
    uf,
    estado: uf,
    numeroendereco: normalizeText(body.numeroEndereco ?? body.numeroendereco ?? body.numero),
    telefonecelular: normalizeText(body.whatsapp ?? body.telefoneCelular ?? body.telefonecelular),
    email: normalizeText(body.email, { lowercase: true }),
    senha: normalizeText(body.senha),
    cpf: normalizeText(body.cpf),
    rg: normalizeText(body.rg),
    cnpj: normalizeText(body.cnpj),
    observacoes: normalizeText(body.observacoes),
    situacao: normalizeText(body.situacao, { uppercase: true }) || 'ATIVO',
    dataatualizacao: new Date().toISOString(),
  };
};

export const mapRowToResponse = (row, alunoIds = []) => {
  const alunoIdsAsString = [...new Set((alunoIds || []).map((id) => String(id)))];

  const mapped = {
    id: row.id,
    nome: row.nome || '',
    profissao: row.profissao || '',
    sexo: row.sexo || '',
    dataNascimento: row.data_nascimento || '',
    estadoCivil: row.estado_civil || '',
    whatsapp: row.whatsapp || row.telefonecelular || '',
    telefoneComercial: row.telefone_comercial || '',
    endereco: row.endereco || '',
    complemento: row.complemento || '',
    cep: row.cep || '',
    bairro: row.bairro || '',
    cidade: row.cidade || '',
    uf: row.uf || row.estado || '',
    email: row.email || '',
    senha: row.senha || '',
    cpf: row.cpf || '',
    rg: row.rg || '',
    cnpj: row.cnpj || '',
    observacoes: row.observacoes || '',
    situacao: row.situacao || 'ATIVO',
    alunoIds: alunoIdsAsString,
    alunoids: alunoIdsAsString,
  };

  return withLowercaseKeys(mapped);
};

export const attachAlunoIdsToRows = async (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const responsavelIds = rows
    .map((row) => parseInteger(row.id))
    .filter((value) => value !== null);

  if (responsavelIds.length === 0) {
    return rows.map((row) => mapRowToResponse(row, []));
  }

  const { data, error } = await supabase
    .from('responsavel_aluno')
    .select('responsavel_id,aluno_id')
    .in('responsavel_id', responsavelIds);

  if (error) {
    if (isMissingTableError(error)) {
      return rows.map((row) => mapRowToResponse(row, []));
    }
    throw error;
  }

  const alunoIdsByResponsavel = new Map();

  (data || []).forEach((item) => {
    const responsavelId = parseInteger(item.responsavel_id);
    const alunoId = parseInteger(item.aluno_id);

    if (responsavelId === null || alunoId === null) return;

    if (!alunoIdsByResponsavel.has(responsavelId)) {
      alunoIdsByResponsavel.set(responsavelId, []);
    }

    alunoIdsByResponsavel.get(responsavelId).push(alunoId);
  });

  return rows.map((row) => {
    const responsavelId = parseInteger(row.id);
    const alunoIds = responsavelId === null ? [] : (alunoIdsByResponsavel.get(responsavelId) || []);
    return mapRowToResponse(row, alunoIds);
  });
};

export const syncResponsavelAlunos = async (responsavelId, alunoIds) => {
  const parsedResponsavelId = parseInteger(responsavelId);

  if (parsedResponsavelId === null) {
    return;
  }

  const { error: deleteError } = await supabase
    .from('responsavel_aluno')
    .delete()
    .eq('responsavel_id', parsedResponsavelId);

  if (deleteError) {
    if (isMissingTableError(deleteError)) {
      return;
    }
    throw deleteError;
  }

  if (!Array.isArray(alunoIds) || alunoIds.length === 0) {
    return;
  }

  const payload = alunoIds.map((alunoId) => ({
    responsavel_id: parsedResponsavelId,
    aluno_id: alunoId,
  }));

  const { error: insertError } = await supabase
    .from('responsavel_aluno')
    .insert(payload);

  if (insertError) {
    if (isMissingTableError(insertError)) {
      return;
    }
    throw insertError;
  }
};

export const parseResponsavelId = (idFromQuery) => parseInteger(idFromQuery);

export const isMissingSupabaseObjectError = isMissingTableError;
export const isMissingSupabaseColumnError = isMissingColumnError;
