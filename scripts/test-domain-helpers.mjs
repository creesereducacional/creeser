import {
  normalizeHostname,
  getHostnameFromHeaders,
  isLocalDomain,
  isAdminDomain,
  isPortalDomain,
  resolveDomainContext,
  DOMAIN_CONTEXTS,
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
console.log('🧪 TESTES: Fase 1 - Helpers de Domínio e Contextos');
console.log('====================================================\n');

// 1. Normalização de Hostname
console.log('--- 1. Normalização de Hostname ---');
assert(normalizeHostname('app.creeser.com.br') === 'app.creeser.com.br', 'Host simples sem porta');
assert(normalizeHostname('app.creeser.com.br:443') === 'app.creeser.com.br', 'Host com porta 443');
assert(normalizeHostname('localhost:3000') === 'localhost', 'Localhost com porta 3000');
assert(normalizeHostname('  PORTAL.CREESER.COM.BR:80  ') === 'portal.creeser.com.br', 'Trim + Lowercase + Porta');
assert(normalizeHostname('') === '', 'Host vazio');

// 2. Extração de Headers
console.log('\n--- 2. Extração de Headers ---');
const headersMock1 = { 'x-forwarded-host': 'app.creeser.com.br:443, proxy.internal', host: 'internal-host' };
assert(getHostnameFromHeaders(headersMock1) === 'app.creeser.com.br', 'Extração de x-forwarded-host com múltiplos proxies');

const headersMock2 = { host: 'portal.creeser.com.br:3000' };
assert(getHostnameFromHeaders(headersMock2) === 'portal.creeser.com.br', 'Extração de host fallback');

const headersMapMock = new Map([['x-forwarded-host', 'app.creeser.com.br']]);
assert(getHostnameFromHeaders(headersMapMock) === 'app.creeser.com.br', 'Extração com objeto Headers/Map');

// 3. Identificação de Ambientes Locais
console.log('\n--- 3. Identificação de Ambientes Locais ---');
assert(isLocalDomain('localhost') === true, 'localhost');
assert(isLocalDomain('localhost:3000') === true, 'localhost:3000');
assert(isLocalDomain('127.0.0.1') === true, '127.0.0.1');
assert(isLocalDomain('192.168.1.50:8080') === true, 'IP rede local 192.168.x.x');
assert(isLocalDomain('app.creeser.com.br') === false, 'app.creeser.com.br não é local');

// 4. Identificação de Domínio Administrativo
console.log('\n--- 4. Identificação de Domínio Administrativo ---');
assert(isAdminDomain('app.creeser.com.br') === true, 'app.creeser.com.br');
assert(isAdminDomain('app.creeser.com.br:443') === true, 'app.creeser.com.br com porta');
assert(isAdminDomain('adm.creeser.com.br') === true, 'adm.creeser.com.br');
assert(isAdminDomain('portal.creeser.com.br') === false, 'portal.creeser.com.br não é admin');
assert(isAdminDomain('localhost') === false, 'localhost não é admin');

// 5. Identificação de Domínio Portal Acadêmico
console.log('\n--- 5. Identificação de Domínio Portal Acadêmico ---');
assert(isPortalDomain('portal.creeser.com.br') === true, 'portal.creeser.com.br');
assert(isPortalDomain('portal.creeser.com.br:443') === true, 'portal.creeser.com.br com porta');
assert(isPortalDomain('aluno.creeser.com.br') === true, 'aluno.creeser.com.br');
assert(isPortalDomain('app.creeser.com.br') === false, 'app.creeser.com.br não é portal');
assert(isPortalDomain('localhost') === false, 'localhost não é portal');

// 6. Resolução de Contexto
console.log('\n--- 6. Resolução Completa de Contexto ---');
assert(resolveDomainContext('app.creeser.com.br') === DOMAIN_CONTEXTS.ADMIN, 'app.creeser.com.br -> ADMIN');
assert(resolveDomainContext('portal.creeser.com.br') === DOMAIN_CONTEXTS.PORTAL, 'portal.creeser.com.br -> PORTAL');
assert(resolveDomainContext('localhost:3000') === DOMAIN_CONTEXTS.LOCAL, 'localhost:3000 -> LOCAL');
assert(resolveDomainContext('127.0.0.1:3000') === DOMAIN_CONTEXTS.LOCAL, '127.0.0.1 -> LOCAL');
assert(resolveDomainContext('creeser.com.br') === DOMAIN_CONTEXTS.DEFAULT, 'creeser.com.br -> DEFAULT');
assert(resolveDomainContext('desconhecido.dominio.com') === DOMAIN_CONTEXTS.DEFAULT, 'Hostname desconhecido -> DEFAULT');

console.log('\n====================================================');
console.log(`📊 RESULTADO: ${passed} passaram | ${failed} falharam`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
