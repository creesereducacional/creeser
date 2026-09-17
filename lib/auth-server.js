import crypto from 'crypto';

const COOKIE_NAME = 'creeser_token';

// Validação antecipada em produção — falha rápida antes do primeiro request
if (process.env.NODE_ENV === 'production') {
  const _secret = process.env.AUTH_JWT_SECRET || '';
  if (!_secret || _secret.length < 32) {
    throw new Error(
      'FATAL: AUTH_JWT_SECRET nao configurada ou muito curta (minimo 32 caracteres). ' +
      'Configure esta variavel de ambiente antes de iniciar o servidor em producao.'
    );
  }
}
const ISSUER = 'creeser';
const DEFAULT_TTL_SECONDS = 60 * 60 * 8;

const getSecret = () => process.env.AUTH_JWT_SECRET || '';

const base64urlEncode = (input) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64urlDecode = (input) => {
  const padded = String(input)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

const buildSignature = (secret, signingInput) => {
  return base64urlEncode(crypto.createHmac('sha256', secret).update(signingInput).digest());
};

const timingSafeEqual = (a, b) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const parseCookies = (req) => {
  const header = req?.headers?.cookie;
  if (!header) return {};

  return header.split(';').reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

export const buildAuthCookie = (token, maxAgeSeconds) => {
  const maxAge = Number.isFinite(maxAgeSeconds) ? maxAgeSeconds : DEFAULT_TTL_SECONDS;
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
};

export const signAuthToken = (payload, options = {}) => {
  const secret = getSecret();
  if (!secret) {
    throw new Error('AUTH_JWT_SECRET nao configurada.');
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = Number.isFinite(options.expiresInSeconds)
    ? options.expiresInSeconds
    : Number.parseInt(process.env.AUTH_JWT_TTL_SECONDS || '', 10) || DEFAULT_TTL_SECONDS;

  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    iss: ISSUER,
    iat: now,
    exp: now + ttl,
    ...payload,
  };

  const signingInput = `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(JSON.stringify(body))}`;
  const signature = buildSignature(secret, signingInput);
  return `${signingInput}.${signature}`;
};

export const verifyAuthToken = (token) => {
  const secret = getSecret();
  if (!secret) {
    throw new Error('AUTH_JWT_SECRET nao configurada.');
  }

  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedSignature = buildSignature(secret, signingInput);

  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = JSON.parse(base64urlDecode(payloadB64));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) {
    return null;
  }

  return payload;
};

export const getTokenFromRequest = (req) => {
  const header = req?.headers?.authorization || req?.headers?.Authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] || null;
};

export const getAuthUser = (req) => {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  return verifyAuthToken(token);
};

export const requireAuth = (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Nao autorizado' });
      return null;
    }

    return user;
  } catch (error) {
    res.status(500).json({ error: error.message });
    return null;
  }
};

export const listUserPerfis = (user) => {
  const perfis = new Set();
  if (!user) return perfis;

  if (user.perfil) perfis.add(String(user.perfil).toLowerCase());
  if (user.tipo) perfis.add(String(user.tipo).toLowerCase());

  if (perfis.has('admin')) {
    perfis.add('instituicao_admin');
  }

  if (perfis.has('grupo_admin')) {
    perfis.add('instituicao_admin');
  }

  // Aliases de compatibilidade para perfis comerciais:
  // 'comercial' (legado) é equivalente a 'comercial_master'
  if (perfis.has('comercial')) {
    perfis.add('comercial_master');
  }
  if (perfis.has('comercial_master')) {
    perfis.add('comercial');
  }

  return perfis;
};

export const hasPerfil = (user, allowed = []) => {
  if (!allowed.length) return true;
  const perfis = listUserPerfis(user);
  return allowed.some((perfil) => perfis.has(String(perfil).toLowerCase()));
};

export const requirePerfil = (user, res, allowed = []) => {
  if (hasPerfil(user, allowed)) return true;
  res.status(403).json({ error: 'Acesso negado' });
  return false;
};

export const readInstituicaoId = (req) => {
  return (
    normalizeText(req?.headers?.['x-instituicao-id']) ||
    normalizeText(req?.query?.instituicao_id ?? req?.query?.instituicaoId) ||
    normalizeText(req?.body?.instituicao_id ?? req?.body?.instituicaoId)
  );
};

export const resolveInstitutionContext = ({ aluno, user, requestedId } = {}) => {
  // 1. Caso exista instituição vinculada ao aluno ou sua matrícula
  const alunoInstituicao = normalizeText(aluno?.instituicao_id ?? aluno?.instituicaoId);
  if (alunoInstituicao) return alunoInstituicao;

  // 2. Caso exista unidade vinculada
  const unidadeInstituicao = normalizeText(aluno?.unidade?.instituicao_id ?? aluno?.unidade_instituicao_id);
  if (unidadeInstituicao) return unidadeInstituicao;

  // 3. Caso exista instituição/tenant na sessão autenticada do usuário
  const userInstituicao = normalizeText(user?.instituicao_id ?? user?.instituicaoId);
  if (userInstituicao) return userInstituicao;

  // 4. ID informado na requisição
  const reqInstituicao = normalizeText(requestedId);
  if (reqInstituicao) return reqInstituicao;

  return null;
};

export const resolveInstituicaoId = (req, user, options = {}) => {
  const requested = readInstituicaoId(req);
  const userInstituicao = normalizeText(user?.instituicao_id ?? user?.instituicaoId);
  const isGroupAdmin = hasPerfil(user, ['grupo_admin']);

  if (isGroupAdmin) {
    if (requested) return requested;
    if (options.allowAll) return undefined;
    if (options.allowNull) return null;
    return userInstituicao;
  }

  return userInstituicao;
};

export const applyInstituicaoFilter = (query, instituicaoId) => {
  if (instituicaoId === null) {
    return query.is('instituicao_id', null);
  }

  if (!instituicaoId) {
    return query;
  }

  return query.eq('instituicao_id', instituicaoId);
};

export const sanitizeUserForToken = (user = {}) => {
  const perfil = user.perfil || (user.tipo === 'admin' ? 'instituicao_admin' : user.tipo) || null;

  return {
    id: user.id,
    email: user.email,
    nome: user.nome || user.nomeCompleto,
    tipo: user.tipo,
    perfil,
    instituicao_id: user.instituicao_id || user.instituicaoId || null,
    tipo_instituicao: user.tipo_instituicao || user.tipoInstituicao || null,
  };
};

// ============================================================
// FASE 3 — Núcleo de Resolução de Contexto Institucional
// ============================================================
// Implementa a regra de escopo:
//   Usuário → N Instituições → 1 Unidade por Instituição
//   Unidade MATRIZ  → escopo amplo  (todas as unidades da Instituição)
//   Unidade filial  → escopo restrito (apenas a própria unidade)
//
// COMPATIBILIDADE LEGADA:
//   Todas as funções anteriores permanecem intactas.
//   Usuários sem vínculo em usuario_instituicoes continuam
//   funcionando via usuarios.instituicao_id (campo legado).
//   Nenhum endpoint de negócio é alterado nesta fase.
// ============================================================

/**
 * Cria um cliente Supabase com Service Role Key para uso
 * interno neste módulo. Usa require() para evitar import circular.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
const _getSupabaseAdminClient = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
};

/**
 * Retorna todos os vínculos do usuário em usuario_instituicoes,
 * enriquecidos com o campo is_matriz da unidade vinculada.
 *
 * Retorna array vazio se o usuário não tiver vínculos na nova tabela
 * (ex: usuários legados que dependem de usuarios.instituicao_id).
 *
 * @param {number} usuarioId - ID do usuário (PK INTEGER de usuarios)
 * @returns {Promise<Array<{id:number, instituicao_id:string, unidade_id:number|null, is_matriz:boolean}>>}
 */
export const getUserVinculos = async (usuarioId) => {
  if (!usuarioId) return [];

  const supabase = _getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('usuario_instituicoes')
    .select(`
      id,
      instituicao_id,
      unidade_id,
      unidades!usuario_instituicoes_unidade_id_fkey (
        is_matriz
      )
    `)
    .eq('usuario_id', usuarioId);

  if (error) {
    console.error('[auth-server] getUserVinculos error:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id:             row.id,
    instituicao_id: row.instituicao_id,
    unidade_id:     row.unidade_id ?? null,
    is_matriz:      Boolean(row.unidades?.is_matriz),
  }));
};

/**
 * Valida se uma instituicao_id recebida pertence de fato
 * aos vínculos do usuário autenticado.
 *
 * grupo_admin é sempre aprovado (acesso irrestrito).
 *
 * @param {object}       authUser      - Payload do JWT
 * @param {string}       instituicaoId - ID a validar
 * @param {Array|null}   vinculos      - Resultado de getUserVinculos (evita dupla query)
 * @returns {boolean}
 */
export const userPertenceAInstituicao = (authUser, instituicaoId, vinculos = null) => {
  if (!instituicaoId) return false;
  if (hasPerfil(authUser, ['grupo_admin'])) return true;

  if (vinculos !== null) {
    return vinculos.some((v) => String(v.instituicao_id) === String(instituicaoId));
  }

  // Fallback legado: checar campo direto no token
  const tokenInst = normalizeText(authUser?.instituicao_id ?? authUser?.instituicaoId);
  return tokenInst === String(instituicaoId);
};

/**
 * Determina o escopo de unidades permitido para um usuário
 * em uma Instituição específica.
 *
 * Regras de retorno:
 *  - null           → sem restrição (grupo_admin, matriz, legado ou pendente)
 *  - [unidade_id]   → restrito à unidade filial vinculada
 *
 * @param {object}      authUser      - Payload do JWT
 * @param {string|null} instituicaoId - Instituição de contexto
 * @param {Array}       vinculos      - Resultado de getUserVinculos
 * @returns {number[]|null}
 */
export const resolveUnidadesPermitidas = (authUser, instituicaoId, vinculos) => {
  if (hasPerfil(authUser, ['grupo_admin'])) return null;

  if (!vinculos || vinculos.length === 0) return null; // fallback legado

  const vinculo = vinculos.find(
    (v) => String(v.instituicao_id) === String(instituicaoId),
  );

  if (!vinculo) return null;          // sem vínculo nesta inst: fallback legado
  if (vinculo.unidade_id == null) return null; // vínculo pendente: sem restrição
  if (vinculo.is_matriz) return null; // MATRIZ: acesso amplo

  return [vinculo.unidade_id];        // filial: acesso restrito
};

/**
 * Aplica filtro de unidade em uma query Supabase.
 * Análogo a applyInstituicaoFilter, mas para unidades.
 *
 * @param {object}        query    - Query Supabase em construção
 * @param {number[]|null} unidades - Resultado de resolveUnidadesPermitidas
 * @param {string}        col      - Coluna de unidade (default: 'unidade_id')
 * @returns {object} query com filtro ou query original se sem restrição
 */
export const applyUnidadeFilter = (query, unidades, col = 'unidade_id') => {
  if (!unidades || unidades.length === 0) return query;
  if (unidades.length === 1) return query.eq(col, unidades[0]);
  return query.in(col, unidades);
};

/**
 * Resolve o contexto institucional completo para um request de API.
 *
 * Encapsula a lógica de Fase 3:
 *  1. Busca vínculos em usuario_instituicoes
 *  2. Valida/resolve a instituição de contexto
 *  3. Calcula o escopo de unidades
 *
 * Retorno:
 *  {
 *    instituicaoId:        string|null,   — instituição de contexto resolvida
 *    unidadesPermitidas:   number[]|null, — null = sem restrição por unidade
 *    isGroupAdmin:         boolean,
 *    vinculos:             Array,          — vínculos brutos de usuario_instituicoes
 *    legacyFallback:       boolean,        — true se usou usuarios.instituicao_id
 *  }
 *
 * @param {object} req      - Request HTTP Next.js
 * @param {object} authUser - Payload do JWT (resultado de requireAuth)
 * @returns {Promise<object>}
 */
export const resolveContextoUsuario = async (req, authUser) => {
  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // grupo_admin: sem restrição alguma; aceita qualquer instituição da req
  if (isGroupAdmin) {
    const requestedInstId = readInstituicaoId(req);
    return {
      instituicaoId:      requestedInstId || null,
      unidadesPermitidas: null,
      isGroupAdmin:       true,
      vinculos:           [],
      legacyFallback:     false,
    };
  }

  // Buscar vínculos reais do usuário
  const vinculos = await getUserVinculos(authUser?.id);

  const requestedInstId = readInstituicaoId(req);
  let instituicaoId;
  let legacyFallback = false;

  if (vinculos.length > 0) {
    // Modo novo: valida se o id pedido pertence ao usuário
    if (requestedInstId && userPertenceAInstituicao(authUser, requestedInstId, vinculos)) {
      instituicaoId = requestedInstId;
    } else {
      // Usar a primeira instituição vinculada
      instituicaoId = vinculos[0]?.instituicao_id ?? null;
    }
  } else {
    // Fallback legado: usar instituicao_id do token
    legacyFallback = true;
    instituicaoId  = normalizeText(authUser?.instituicao_id ?? authUser?.instituicaoId);
  }

  const unidadesPermitidas = resolveUnidadesPermitidas(authUser, instituicaoId, vinculos);

  return {
    instituicaoId,
    unidadesPermitidas,
    isGroupAdmin: false,
    vinculos,
    legacyFallback,
  };
};
