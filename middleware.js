import { NextResponse } from 'next/server';
import {
  getHostnameFromHeaders,
  evaluateRouteAccess,
} from './lib/domain-helpers';

/**
 * Middleware de Roteamento Multi-Ambiente CREESER.
 * 
 * Regras por Contexto:
 * 1. ADMIN (`app.creeser.com.br`):
 *    - Permite rotas administrativas (/admin/*, /admin-financeiro/*, /comercial/*, /recepcao/*, /dashboard, etc.)
 *    - Bloqueia acesso direto às áreas acadêmicas (/aluno/*, /professor/*, /assistir/*, /curso/*, /curso-estatico/*, /enviar-documentos)
 *      redirecionando para https://portal.creeser.com.br
 * 
 * 2. PORTAL (`portal.creeser.com.br`):
 *    - Permite rotas acadêmicas (/aluno/*, /professor/*, /assistir/*, /curso/*, /curso-estatico/*, /enviar-documentos)
 *    - Impede acesso às áreas administrativas (/admin/*, /admin-financeiro/*, /comercial/*, /recepcao/*, /dashboard)
 *      redirecionando para https://app.creeser.com.br
 * 
 * 3. LOCAL (`localhost`, `127.0.0.1`) e DEFAULT (`creeser.com.br`, hosts desconhecidos):
 *    - Modo permissivo total, preservando comportamento de desenvolvimento e domínios raiz.
 * 
 * 4. Rotas Públicas / Compartilhadas (/login, /, /politica-de-privacidade, /termos-de-uso, /noticia/*, etc.):
 *    - Permitidas em ambos os ambientes, sem loops de redirecionamento.
 */
export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // Obter hostname e avaliar decisão de roteamento por contexto
  const hostname = getHostnameFromHeaders(request.headers);
  const decision = evaluateRouteAccess(hostname, pathname, search);

  // Injetar headers informativos na requisição downstream
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-creeser-hostname', hostname);
  requestHeaders.set('x-creeser-context', decision.context);

  // Se houver necessidade de redirecionamento inter-domínio
  if (decision.action === 'redirect' && decision.targetUrl) {
    return NextResponse.redirect(new URL(decision.targetUrl), 307);
  }

  // Prosseguir normalmente para a rota solicitada
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Configuração do Matcher:
 * Ignora explicitamente:
 * - Rotas de API (/api/*)
 * - Arquivos internos do Next.js (_next/static, _next/image)
 * - Favicon e extensões de arquivos estáticos comuns (imagens, fontes, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match em todas as rotas exceto:
     * 1. /api (endpoints de API)
     * 2. /_next/static (arquivos estáticos)
     * 3. /_next/image (otimização de imagens)
     * 4. /favicon.ico, sitemap.xml, robots.txt
     * 5. Arquivos com extensão (.png, .jpg, .jpeg, .gif, .svg, .css, .js, .woff, .woff2, .ico, .webp)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|css|js|woff|woff2|ico|webp|ttf|map)$).*)',
  ],
};
