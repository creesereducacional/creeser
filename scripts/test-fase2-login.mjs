import {
  normalizeHostname,
  getHostnameFromHeaders,
  isLocalDomain,
  isAdminDomain,
  isPortalDomain,
  resolveDomainContext,
  validarCompatibilidadeAmbiente,
  getDestinoPosLogin,
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
console.log('🧪 TESTES: Fase 2 - Validação de Login e Ambientes');
console.log('====================================================\n');

// 1. Cenários de Usuários Mocks
const userAdminGeral = { nome: 'Admin Master', perfil: 'grupo_admin', tipo: 'admin' };
const userAdminInst  = { nome: 'Admin Unidade', perfil: 'instituicao_admin', tipo: 'funcionario' };
const userFinanceiro = { nome: 'Financeiro', perfil: 'financeiro', tipo: 'funcionario' };
const userComercial  = { nome: 'Comercial', perfil: 'comercial', tipo: 'funcionario' };
const userRecepcao   = { nome: 'Recepcao', perfil: 'recepcao', tipo: 'recepcao' };
const userSecretaria = { nome: 'Secretaria', perfil: 'secretaria', tipo: 'funcionario' };
const userProfessor  = { nome: 'Prof. Silva', perfil: 'professor', tipo: 'professor' };
const userAluno      = { nome: 'João Aluno', perfil: 'aluno', tipo: 'aluno' };

// 2. Testes no Ambiente Administrativo (app.creeser.com.br)
console.log('--- 1. Acessos via APP (app.creeser.com.br) ---');
assert(validarCompatibilidadeAmbiente(userAdminGeral, DOMAIN_CONTEXTS.ADMIN).permitido === true, 'Admin Geral permitido no APP');
assert(validarCompatibilidadeAmbiente(userAdminInst, DOMAIN_CONTEXTS.ADMIN).permitido === true, 'Admin Instituicao permitido no APP');
assert(validarCompatibilidadeAmbiente(userFinanceiro, DOMAIN_CONTEXTS.ADMIN).permitido === true, 'Financeiro permitido no APP');
assert(validarCompatibilidadeAmbiente(userComercial, DOMAIN_CONTEXTS.ADMIN).permitido === true, 'Comercial permitido no APP');
assert(validarCompatibilidadeAmbiente(userRecepcao, DOMAIN_CONTEXTS.ADMIN).permitido === true, 'Recepção permitida no APP');
assert(validarCompatibilidadeAmbiente(userSecretaria, DOMAIN_CONTEXTS.ADMIN).permitido === true, 'Secretaria permitida no APP');

// Aluno e Professor devem ser bloqueados no APP
const blockAlunoApp = validarCompatibilidadeAmbiente(userAluno, DOMAIN_CONTEXTS.ADMIN);
assert(blockAlunoApp.permitido === false && blockAlunoApp.mensagemErro.includes('Portal Acadêmico'), 'Aluno bloqueado no APP com mensagem orientativa');

const blockProfApp = validarCompatibilidadeAmbiente(userProfessor, DOMAIN_CONTEXTS.ADMIN);
assert(blockProfApp.permitido === false && blockProfApp.mensagemErro.includes('Portal Acadêmico'), 'Professor bloqueado no APP com mensagem orientativa');

// 3. Testes no Portal Acadêmico (portal.creeser.com.br)
console.log('\n--- 2. Acessos via PORTAL (portal.creeser.com.br) ---');
assert(validarCompatibilidadeAmbiente(userAluno, DOMAIN_CONTEXTS.PORTAL).permitido === true, 'Aluno permitido no PORTAL');
assert(validarCompatibilidadeAmbiente(userProfessor, DOMAIN_CONTEXTS.PORTAL).permitido === true, 'Professor permitido no PORTAL');

// Administrativos devem ser bloqueados no PORTAL
const blockAdminPortal = validarCompatibilidadeAmbiente(userAdminGeral, DOMAIN_CONTEXTS.PORTAL);
assert(blockAdminPortal.permitido === false && blockAdminPortal.mensagemErro.includes('app.creeser.com.br'), 'Admin bloqueado no PORTAL com mensagem orientativa');

const blockFinPortal = validarCompatibilidadeAmbiente(userFinanceiro, DOMAIN_CONTEXTS.PORTAL);
assert(blockFinPortal.permitido === false && blockFinPortal.mensagemErro.includes('app.creeser.com.br'), 'Financeiro bloqueado no PORTAL com mensagem orientativa');

// 4. Testes em Ambiente LOCAL (localhost:3000 / desenvolvimento)
console.log('\n--- 3. Acessos em Ambiente LOCAL (desenvolvimento) ---');
assert(validarCompatibilidadeAmbiente(userAdminGeral, DOMAIN_CONTEXTS.LOCAL).permitido === true, 'Admin permitido em LOCAL');
assert(validarCompatibilidadeAmbiente(userAluno, DOMAIN_CONTEXTS.LOCAL).permitido === true, 'Aluno permitido em LOCAL');
assert(validarCompatibilidadeAmbiente(userProfessor, DOMAIN_CONTEXTS.LOCAL).permitido === true, 'Professor permitido em LOCAL');

// 5. Testes de Destino Pós-Login
console.log('\n--- 4. Destinos Pós-Login Inteligentes ---');
assert(getDestinoPosLogin(userAdminGeral, DOMAIN_CONTEXTS.ADMIN) === '/admin/dashboard', 'Admin Geral -> /admin/dashboard');
assert(getDestinoPosLogin(userFinanceiro, DOMAIN_CONTEXTS.ADMIN) === '/admin-financeiro', 'Financeiro -> /admin-financeiro');
assert(getDestinoPosLogin(userComercial, DOMAIN_CONTEXTS.ADMIN) === '/comercial/dashboard', 'Comercial -> /comercial/dashboard');
assert(getDestinoPosLogin(userRecepcao, DOMAIN_CONTEXTS.ADMIN) === '/recepcao/dashboard', 'Recepcao -> /recepcao/dashboard');
assert(getDestinoPosLogin(userAluno, DOMAIN_CONTEXTS.PORTAL) === '/aluno/home', 'Aluno no PORTAL -> /aluno/home');
assert(getDestinoPosLogin(userProfessor, DOMAIN_CONTEXTS.PORTAL) === '/professor/dashboard', 'Professor no PORTAL -> /professor/dashboard');
assert(getDestinoPosLogin(userAluno, DOMAIN_CONTEXTS.LOCAL) === '/aluno/home', 'Aluno no LOCAL -> /aluno/home');

console.log('\n====================================================');
console.log(`📊 RESULTADO FASE 2: ${passed} passaram | ${failed} falharam`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
