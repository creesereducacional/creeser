/**
 * Helpers para identificação de ambiente e contexto de subdomínio no CREESER.
 * 
 * Contextos mapeados:
 * - 'admin': app.creeser.com.br (ou subdomínios administrativos)
 * - 'portal': portal.creeser.com.br (Portal Acadêmico de Alunos e Professores)
 * - 'local': localhost, 127.0.0.1 ou IPs locais
 * - 'default': domínio raiz creeser.com.br ou hosts não mapeados (modo seguro/fallback)
 */

export const DOMAIN_CONTEXTS = {
  ADMIN: 'admin',
  PORTAL: 'portal',
  LOCAL: 'local',
  DEFAULT: 'default',
};

export const PRODUCTION_DOMAINS = {
  ADMIN: 'app.creeser.com.br',
  PORTAL: 'portal.creeser.com.br',
};

/**
 * Verifica se o caminho pertence a rotas acadêmicas (Aluno, Professor, Player e Cursos).
 * @param {string} pathname 
 * @returns {boolean}
 */
export function isAcademicPath(pathname) {
  if (!pathname) return false;
  const path = String(pathname).toLowerCase();
  return (
    path === '/aluno' ||
    path.startsWith('/aluno/') ||
    path === '/professor' ||
    path.startsWith('/professor/') ||
    path === '/assistir' ||
    path.startsWith('/assistir/') ||
    path === '/curso' ||
    path.startsWith('/curso/') ||
    path === '/curso-estatico' ||
    path.startsWith('/curso-estatico/') ||
    path === '/enviar-documentos' ||
    path.startsWith('/enviar-documentos/')
  );
}

/**
 * Verifica se o caminho pertence a rotas administrativas/operacionais (Admin, Financeiro, Comercial, Recepção, Dashboards).
 * @param {string} pathname 
 * @returns {boolean}
 */
export function isAdminPath(pathname) {
  if (!pathname) return false;
  const path = String(pathname).toLowerCase();
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/admin-financeiro' ||
    path.startsWith('/admin-financeiro/') ||
    path === '/comercial' ||
    path.startsWith('/comercial/') ||
    path === '/recepcao' ||
    path.startsWith('/recepcao/') ||
    path === '/dashboard' ||
    path.startsWith('/dashboard/') ||
    path.startsWith('/dashboard_') ||
    path.startsWith('/dashboard-')
  );
}

/**
 * Avalia o acesso de uma rota com base no hostname e contexto de subdomínio.
 * 
 * Regras:
 * - ADMIN (`app.creeser.com.br`): bloqueia rotas acadêmicas redirecionando para o Portal.
 * - PORTAL (`portal.creeser.com.br`): bloqueia rotas administrativas redirecionando para o App.
 * - LOCAL (`localhost`, `127.0.0.1`) e DEFAULT (`creeser.com.br`, hosts desconhecidos): permite tudo (modo permissivo).
 * 
 * @param {string} hostname 
 * @param {string} pathname 
 * @param {string} [search=''] 
 * @returns {{ action: 'allow' | 'redirect', targetUrl?: string, context: 'admin' | 'portal' | 'local' | 'default' }}
 */
export function evaluateRouteAccess(hostname, pathname, search = '') {
  const context = resolveDomainContext(hostname);

  if (context === DOMAIN_CONTEXTS.ADMIN) {
    if (isAcademicPath(pathname)) {
      return {
        action: 'redirect',
        targetUrl: `https://${PRODUCTION_DOMAINS.PORTAL}${pathname}${search || ''}`,
        context,
      };
    }
  }

  if (context === DOMAIN_CONTEXTS.PORTAL) {
    if (isAdminPath(pathname)) {
      return {
        action: 'redirect',
        targetUrl: `https://${PRODUCTION_DOMAINS.ADMIN}${pathname}${search || ''}`,
        context,
      };
    }
  }

  return {
    action: 'allow',
    context,
  };
}

/**
 * Normaliza o hostname removendo porta e convertendo para minúsculas.
 * @param {string} hostStr 
 * @returns {string}
 */
export function normalizeHostname(hostStr) {
  if (!hostStr) return '';
  const clean = String(hostStr).trim().toLowerCase();
  // Se contiver porta (ex: localhost:3000 ou app.creeser.com.br:443), remove a porta
  return clean.split(':')[0];
}

/**
 * Extrai o hostname a partir de headers de requisição (Request ou req padrão).
 * Suporta x-forwarded-host (usado por proxies reversos/Vercel) e host.
 * @param {object} headers - Headers da requisição (Map, Headers ou Objeto)
 * @returns {string}
 */
export function getHostnameFromHeaders(headers) {
  if (!headers) return '';

  let forwardedHost = '';
  let host = '';

  if (typeof headers.get === 'function') {
    forwardedHost = headers.get('x-forwarded-host') || '';
    host = headers.get('host') || '';
  } else {
    forwardedHost = headers['x-forwarded-host'] || '';
    host = headers['host'] || '';
  }

  // O primeiro valor de x-forwarded-host é o host original do cliente
  const primaryForwarded = forwardedHost ? forwardedHost.split(',')[0].trim() : '';
  const selected = primaryForwarded || host || '';

  return normalizeHostname(selected);
}

/**
 * Verifica se o hostname pertence ao ambiente de desenvolvimento local.
 * @param {string} hostname 
 * @returns {boolean}
 */
export function isLocalDomain(hostname) {
  const host = normalizeHostname(hostname);
  if (!host) return false;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.test') ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(host)
  );
}

/**
 * Verifica se o hostname corresponde ao ambiente Administrativo (app.creeser.com.br).
 * @param {string} hostname 
 * @returns {boolean}
 */
export function isAdminDomain(hostname) {
  const host = normalizeHostname(hostname);
  if (!host) return false;
  return host === 'app.creeser.com.br' || host.startsWith('app.') || host.startsWith('adm.');
}

/**
 * Verifica se o hostname corresponde ao Portal Acadêmico (portal.creeser.com.br).
 * @param {string} hostname 
 * @returns {boolean}
 */
export function isPortalDomain(hostname) {
  const host = normalizeHostname(hostname);
  if (!host) return false;
  return host === 'portal.creeser.com.br' || host.startsWith('portal.') || host.startsWith('aluno.');
}

/**
 * Resolve o contexto do domínio com base no hostname fornecido.
 * @param {string} hostname 
 * @returns {'admin' | 'portal' | 'local' | 'default'}
 */
export function resolveDomainContext(hostname) {
  const host = normalizeHostname(hostname);
  if (!host) return DOMAIN_CONTEXTS.DEFAULT;

  if (isLocalDomain(host)) {
    return DOMAIN_CONTEXTS.LOCAL;
  }
  if (isAdminDomain(host)) {
    return DOMAIN_CONTEXTS.ADMIN;
  }
  if (isPortalDomain(host)) {
    return DOMAIN_CONTEXTS.PORTAL;
  }
  return DOMAIN_CONTEXTS.DEFAULT;
}

/**
 * Valida se o perfil/tipo do usuário é compatível com o ambiente acessado.
 * 
 * Regras:
 * - 'admin' (app.creeser.com.br): Apenas perfis operacionais e administrativos. Alunos e professores não pertencem ao app.
 * - 'portal' (portal.creeser.com.br): Apenas 'aluno' e 'professor'. Administradores e operadores não pertencem ao portal acadêmico.
 * - 'local' ou 'default': Modo permissivo/desenvolvimento (qualquer perfil é aceito).
 * 
 * @param {object} usuario - Objeto do usuário autenticado ({ perfil, tipo })
 * @param {'admin' | 'portal' | 'local' | 'default'} context - Contexto do domínio acessado
 * @returns {{ permitido: boolean, mensagemErro?: string }}
 */
export function validarCompatibilidadeAmbiente(usuario, context) {
  if (!usuario) {
    return { permitido: false, mensagemErro: 'Usuário não autenticado.' };
  }

  // Em ambiente local ou default (fallback), permite todos os perfis
  if (context === DOMAIN_CONTEXTS.LOCAL || context === DOMAIN_CONTEXTS.DEFAULT) {
    return { permitido: true };
  }

  const perfil = String(usuario.perfil || '').toLowerCase();
  const tipo = String(usuario.tipo || '').toLowerCase();
  const isAcademico = tipo === 'aluno' || tipo === 'professor' || perfil === 'aluno' || perfil === 'professor';

  if (context === DOMAIN_CONTEXTS.ADMIN) {
    if (isAcademico) {
      return {
        permitido: false,
        mensagemErro: 'Este ambiente é exclusivo para a Administração. Acesse pelo Portal Acadêmico (portal.creeser.com.br).',
      };
    }
    return { permitido: true };
  }

  if (context === DOMAIN_CONTEXTS.PORTAL) {
    if (!isAcademico) {
      return {
        permitido: false,
        mensagemErro: 'Este ambiente é exclusivo para Alunos e Professores. Acesse o sistema administrativo pelo app.creeser.com.br.',
      };
    }
    return { permitido: true };
  }

  return { permitido: true };
}

/**
 * Retorna a rota de destino padrão do usuário após o login com base no perfil e ambiente.
 * 
 * @param {object} usuario - Objeto com perfil e tipo
 * @param {'admin' | 'portal' | 'local' | 'default'} context - Contexto do ambiente
 * @returns {string} Rota de destino
 */
export function getDestinoPosLogin(usuario, context) {
  if (!usuario) return '/login';

  const perfil = String(usuario.perfil || '').toLowerCase();
  const tipo = String(usuario.tipo || '').toLowerCase();

  // Se estiver no Portal Acadêmico
  if (context === DOMAIN_CONTEXTS.PORTAL) {
    if (tipo === 'professor' || perfil === 'professor') {
      return '/professor/dashboard';
    }
    return '/aluno/home';
  }

  // Se estiver no APP Administrativo ou em ambiente Local / Geral
  if (perfil === 'comercial' || perfil === 'comercial_master' || perfil === 'comercial_captador') {
    return '/comercial/dashboard';
  }
  if (perfil === 'financeiro' || perfil === 'financeiro_admin') {
    return '/admin-financeiro';
  }
  if (tipo === 'recepcao' || perfil === 'recepcao') {
    return '/recepcao/dashboard';
  }
  if (tipo === 'professor' || perfil === 'professor') {
    return '/professor/dashboard';
  }
  if (tipo === 'aluno' || perfil === 'aluno') {
    return '/aluno/home';
  }

  // grupo_admin, instituicao_admin, coordenador, secretaria, admin
  return '/admin/dashboard';
}
