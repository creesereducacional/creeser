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
