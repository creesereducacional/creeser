import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMPRESA_ID = 1; // id INTEGER na tabela existente

// DB (snake_case) → API (camelCase)
function dbToApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    nomeEmpresa: row.nome_empresa || '',
    cnpj: row.cnpj || '',
    razaoSocial: row.razao_social || '',
    email: row.email || '',
    telefone: row.telefone || '',
    endereco: row.endereco || '',
    cidade: row.cidade || '',
    estado: row.estado || '',
    cep: row.cep || '',
    logo: row.logo || '',
    website: row.website || '',
    descricao: row.descricao || '',
    faculdade: row.faculdade || '',
    biografia: row.biografia || '',
    ddd: row.ddd || '',
    exibirWhatsappAluno: row.exibir_whatsapp_aluno || false,
    contatoWhatsapp: row.contato_whatsapp || '',
    pedagogico: row.pedagogico || {},
    financeiro: row.financeiro || {},
    biblioteca: row.biblioteca || {},
  };
}

// API (camelCase) → DB (snake_case)
function apiToDb(body) {
  return {
    id: EMPRESA_ID,
    nome_empresa: body.nomeEmpresa || '',
    cnpj: body.cnpj || '',
    razao_social: body.razaoSocial || '',
    email: body.email || '',
    telefone: body.telefone || '',
    endereco: body.endereco || '',
    cidade: body.cidade || '',
    estado: (body.estado || '').trim().slice(0, 5),
    cep: (body.cep || '').trim().slice(0, 20),
    logo: body.logo || '',
    website: body.website || '',
    descricao: body.descricao || '',
    faculdade: body.faculdade || '',
    biografia: body.biografia || '',
    ddd: body.ddd || '',
    exibir_whatsapp_aluno: body.exibirWhatsappAluno || false,
    contato_whatsapp: body.contatoWhatsapp || '',
    pedagogico: body.pedagogico || {},
    financeiro: body.financeiro || {},
    biblioteca: body.biblioteca || {},
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('configuracoes_empresa')
      .select('*')
      .eq('id', EMPRESA_ID)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[empresa GET]', error);
      return res.status(500).json({ erro: error.message });
    }

    return res.status(200).json(dbToApi(data || {}));

  } else if (req.method === 'POST') {
    const row = apiToDb(req.body);

    const { data, error } = await supabase
      .from('configuracoes_empresa')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('[empresa POST]', error);
      return res.status(500).json({ erro: error.message });
    }

    return res.status(200).json(dbToApi(data));

  } else {
    return res.status(405).json({ erro: 'Método não permitido' });
  }
}
