import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// DB (snake_case) → API (camelCase)
function dbToApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    instituicaoId: row.instituicao_id || null,
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
function apiToDb(body, instituicaoId) {
  const row = {
    instituicao_id: instituicaoId,
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

  if (body.id) {
    row.id = body.id;
  }

  return row;
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: false, allowNull: isGroupAdmin });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ erro: 'Instituicao nao definida para o usuario atual' });
  }

  if (req.method === 'GET') {
    let query = supabase
      .from('configuracoes_empresa')
      .select('*');

    if (instituicaoId === null) {
      query = query.is('instituicao_id', null);
    } else if (instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('[empresa GET]', error);
      return res.status(500).json({ erro: error.message });
    }

    return res.status(200).json(dbToApi(data || {}));

  } else if (req.method === 'POST') {
    const row = apiToDb(req.body || {}, instituicaoId);

    let data = null;
    let error = null;

    if (instituicaoId === null) {
      const { data: existente, error: existenteError } = await supabase
        .from('configuracoes_empresa')
        .select('id')
        .is('instituicao_id', null)
        .maybeSingle();

      if (existenteError && existenteError.code !== 'PGRST116') {
        console.error('[empresa POST]', existenteError);
        return res.status(500).json({ erro: existenteError.message });
      }

      if (existente?.id) {
        ({ data, error } = await supabase
          .from('configuracoes_empresa')
          .update(row)
          .eq('id', existente.id)
          .select('*')
          .single());
      } else {
        ({ data, error } = await supabase
          .from('configuracoes_empresa')
          .insert(row)
          .select('*')
          .single());
      }
    } else {
      ({ data, error } = await supabase
        .from('configuracoes_empresa')
        .upsert(row, { onConflict: 'instituicao_id' })
        .select('*')
        .single());
    }

    if (error) {
      console.error('[empresa POST]', error);
      return res.status(500).json({ erro: error.message });
    }

    return res.status(200).json(dbToApi(data));

  } else {
    return res.status(405).json({ erro: 'Método não permitido' });
  }
}
