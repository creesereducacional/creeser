import {
  isAcademicPath,
  isAdminPath,
  resolveDomainContext,
  evaluateRouteAccess,
  getHostnameFromHeaders,
  DOMAIN_CONTEXTS,
  PRODUCTION_DOMAINS,
} from '../lib/domain-helpers.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 TESTES: Roteamento de Middleware por Hostname');
console.log('====================================================\n');

// 1. Testes de Classificação de Caminhos
console.log('--- 1. Classificação de Caminhos Acadêmicos e Administrativos ---');
assert(isAcademicPath('/aluno/home') === true, 'isAcademicPath /aluno/home');
assert(isAcademicPath('/aluno/dashboard') === true, 'isAcademicPath /aluno/dashboard');
assert(isAcademicPath('/aluno/boletim') === true, 'isAcademicPath /aluno/boletim');
assert(isAcademicPath('/aluno/forum') === true, 'isAcademicPath /aluno/forum');
assert(isAcademicPath('/professor/dashboard') === true, 'isAcademicPath /professor/dashboard');
assert(isAcademicPath('/professor/diario') === true, 'isAcademicPath /professor/diario');
assert(isAcademicPath('/professor/frequencia') === true, 'isAcademicPath /professor/frequencia');
assert(isAcademicPath('/professor/notas') === true, 'isAcademicPath /professor/notas');
assert(isAcademicPath('/professor/planejamento') === true, 'isAcademicPath /professor/planejamento');
assert(isAcademicPath('/professor/alunos') === true, 'isAcademicPath /professor/alunos');
assert(isAcademicPath('/assistir/curso-123') === true, 'isAcademicPath /assistir/curso-123');
assert(isAcademicPath('/curso/456') === true, 'isAcademicPath /curso/456');
assert(isAcademicPath('/curso-estatico/789') === true, 'isAcademicPath /curso-estatico/789');
assert(isAcademicPath('/enviar-documentos') === true, 'isAcademicPath /enviar-documentos');
assert(isAcademicPath('/admin/dashboard') === false, 'isAcademicPath /admin/dashboard -> false');
assert(isAcademicPath('/login') === false, 'isAcademicPath /login -> false');
assert(isAcademicPath('/comercial/dashboard') === false, 'isAcademicPath /comercial/dashboard -> false');

assert(isAdminPath('/admin') === true, 'isAdminPath /admin');
assert(isAdminPath('/admin/dashboard') === true, 'isAdminPath /admin/dashboard');
assert(isAdminPath('/admin/alunos') === true, 'isAdminPath /admin/alunos');
assert(isAdminPath('/admin-financeiro') === true, 'isAdminPath /admin-financeiro');
assert(isAdminPath('/admin-financeiro/carnes') === true, 'isAdminPath /admin-financeiro/carnes');
assert(isAdminPath('/comercial') === true, 'isAdminPath /comercial');
assert(isAdminPath('/comercial/dashboard') === true, 'isAdminPath /comercial/dashboard');
assert(isAdminPath('/comercial/leads') === true, 'isAdminPath /comercial/leads');
assert(isAdminPath('/recepcao') === true, 'isAdminPath /recepcao');
assert(isAdminPath('/recepcao/dashboard') === true, 'isAdminPath /recepcao/dashboard');
assert(isAdminPath('/recepcao/pre-cadastros') === true, 'isAdminPath /recepcao/pre-cadastros');
assert(isAdminPath('/dashboard') === true, 'isAdminPath /dashboard');
assert(isAdminPath('/aluno/home') === false, 'isAdminPath /aluno/home -> false');
assert(isAdminPath('/professor/dashboard') === false, 'isAdminPath /professor/dashboard -> false');
assert(isAdminPath('/login') === false, 'isAdminPath /login -> false');
assert(isAdminPath('/termos-de-uso') === false, 'isAdminPath /termos-de-uso -> false');

// 2. Testes de Roteamento no Contexto ADMIN (app.creeser.com.br)
console.log('\n--- 2. Contexto ADMIN (app.creeser.com.br) ---');
const resAdmin1 = evaluateRouteAccess('app.creeser.com.br', '/admin/dashboard');
assert(resAdmin1.action === 'allow', 'Permite /admin/dashboard no app.creeser.com.br');
assert(resAdmin1.context === DOMAIN_CONTEXTS.ADMIN, 'Contexto é ADMIN');

const resAdmin2 = evaluateRouteAccess('app.creeser.com.br', '/admin-financeiro/carnes');
assert(resAdmin2.action === 'allow', 'Permite /admin-financeiro/carnes no app.creeser.com.br');

const resAdmin3 = evaluateRouteAccess('app.creeser.com.br', '/comercial/dashboard');
assert(resAdmin3.action === 'allow', 'Permite /comercial/dashboard no app.creeser.com.br');

const resAdmin4 = evaluateRouteAccess('app.creeser.com.br', '/recepcao/dashboard');
assert(resAdmin4.action === 'allow', 'Permite /recepcao/dashboard no app.creeser.com.br');

const resAdmin5 = evaluateRouteAccess('app.creeser.com.br', '/login');
assert(resAdmin5.action === 'allow', 'Permite /login no app.creeser.com.br');

const resAdmin6 = evaluateRouteAccess('app.creeser.com.br', '/aluno/home', '?tab=1');
assert(resAdmin6.action === 'redirect', 'Bloqueia /aluno/home no app e redireciona');
assert(resAdmin6.targetUrl === 'https://portal.creeser.com.br/aluno/home?tab=1', 'Redireciona para portal.creeser.com.br/aluno/home?tab=1');

const resAdmin7 = evaluateRouteAccess('app.creeser.com.br', '/professor/diario');
assert(resAdmin7.action === 'redirect', 'Bloqueia /professor/diario no app e redireciona');
assert(resAdmin7.targetUrl === 'https://portal.creeser.com.br/professor/diario', 'Redireciona para portal.creeser.com.br/professor/diario');

const resAdmin8 = evaluateRouteAccess('app.creeser.com.br', '/assistir/abc');
assert(resAdmin8.action === 'redirect', 'Bloqueia /assistir/abc no app e redireciona para o portal');
assert(resAdmin8.targetUrl === 'https://portal.creeser.com.br/assistir/abc', 'Redireciona para portal.creeser.com.br/assistir/abc');

// 3. Testes de Roteamento no Contexto PORTAL (portal.creeser.com.br)
console.log('\n--- 3. Contexto PORTAL (portal.creeser.com.br) ---');
const resPortal1 = evaluateRouteAccess('portal.creeser.com.br', '/aluno/home');
assert(resPortal1.action === 'allow', 'Permite /aluno/home no portal.creeser.com.br');
assert(resPortal1.context === DOMAIN_CONTEXTS.PORTAL, 'Contexto é PORTAL');

const resPortal2 = evaluateRouteAccess('portal.creeser.com.br', '/professor/dashboard');
assert(resPortal2.action === 'allow', 'Permite /professor/dashboard no portal.creeser.com.br');

const resPortal3 = evaluateRouteAccess('portal.creeser.com.br', '/assistir/10');
assert(resPortal3.action === 'allow', 'Permite /assistir/10 no portal.creeser.com.br');

const resPortal4 = evaluateRouteAccess('portal.creeser.com.br', '/curso/20');
assert(resPortal4.action === 'allow', 'Permite /curso/20 no portal.creeser.com.br');

const resPortal5 = evaluateRouteAccess('portal.creeser.com.br', '/enviar-documentos');
assert(resPortal5.action === 'allow', 'Permite /enviar-documentos no portal.creeser.com.br');

const resPortal6 = evaluateRouteAccess('portal.creeser.com.br', '/login');
assert(resPortal6.action === 'allow', 'Permite /login no portal.creeser.com.br');

const resPortal7 = evaluateRouteAccess('portal.creeser.com.br', '/admin/dashboard', '?periodo=2026');
assert(resPortal7.action === 'redirect', 'Bloqueia /admin/dashboard no portal e redireciona');
assert(resPortal7.targetUrl === 'https://app.creeser.com.br/admin/dashboard?periodo=2026', 'Redireciona para app.creeser.com.br/admin/dashboard?periodo=2026');

const resPortal8 = evaluateRouteAccess('portal.creeser.com.br', '/comercial/dashboard');
assert(resPortal8.action === 'redirect', 'Bloqueia /comercial/dashboard no portal e redireciona');
assert(resPortal8.targetUrl === 'https://app.creeser.com.br/comercial/dashboard', 'Redireciona para app.creeser.com.br/comercial/dashboard');

const resPortal9 = evaluateRouteAccess('portal.creeser.com.br', '/admin-financeiro');
assert(resPortal9.action === 'redirect', 'Bloqueia /admin-financeiro no portal e redireciona');
assert(resPortal9.targetUrl === 'https://app.creeser.com.br/admin-financeiro', 'Redireciona para app.creeser.com.br/admin-financeiro');

const resPortal10 = evaluateRouteAccess('portal.creeser.com.br', '/recepcao/dashboard');
assert(resPortal10.action === 'redirect', 'Bloqueia /recepcao/dashboard no portal e redireciona');
assert(resPortal10.targetUrl === 'https://app.creeser.com.br/recepcao/dashboard', 'Redireciona para app.creeser.com.br/recepcao/dashboard');

// 4. Testes em Ambiente LOCAL e DEFAULT
console.log('\n--- 4. Contexto LOCAL e DEFAULT (Modo Permissivo) ---');
const resLocal1 = evaluateRouteAccess('localhost:3000', '/admin/dashboard');
assert(resLocal1.action === 'allow', 'Permite /admin/dashboard no localhost');
assert(resLocal1.context === DOMAIN_CONTEXTS.LOCAL, 'Contexto é LOCAL');

const resLocal2 = evaluateRouteAccess('localhost:3000', '/aluno/home');
assert(resLocal2.action === 'allow', 'Permite /aluno/home no localhost');

const resLocal3 = evaluateRouteAccess('127.0.0.1:3000', '/professor/dashboard');
assert(resLocal3.action === 'allow', 'Permite /professor/dashboard no 127.0.0.1');

const resDefault1 = evaluateRouteAccess('creeser.com.br', '/noticia/1');
assert(resDefault1.action === 'allow', 'Permite /noticia/1 em creeser.com.br');
assert(resDefault1.context === DOMAIN_CONTEXTS.DEFAULT, 'Contexto é DEFAULT');

const resDefault2 = evaluateRouteAccess('outro-site.com', '/admin/dashboard');
assert(resDefault2.action === 'allow', 'Permite /admin/dashboard em host desconhecido (modo fallback)');

console.log('\n====================================================');
console.log(`📊 RESULTADO FINAL: ${passed} passaram | ${failed} falharam`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
