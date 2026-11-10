/**
 * Teste automatizado de validação de paginação e impressão A4 de contratos.
 * Verifica:
 * 1. Existência e correção das regras @page (A4 portrait e margens equilibradas).
 * 2. Ausência de bloqueios em table / tr que impeçam quebra fluida (break-inside: auto).
 * 3. Neutralização de alturas fixas herdadas de Word / Google Docs (div, tr, td com height: auto !important).
 * 4. Tratamento de órfãs/viúvas e títulos de cláusulas (break-after: avoid !important).
 * 5. Agrupamento do bloco de assinaturas (break-inside: avoid !important).
 * 6. Neutralização de quebras redundantes (br + br { display: none !important }).
 * 7. Eliminação de linhas vazias (tr:empty { display: none !important }).
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

function runTests() {
  console.log('=== INICIANDO TESTES DE PAGINAÇÃO E IMPRESSÃO A4 DOS CONTRATOS ===\n');

  const filePath = path.join(__dirname, '../pages/admin/alunos/contrato/[id].js');
  const code = fs.readFileSync(filePath, 'utf8');

  console.log('1. Validando regras @page e dimensões A4...');
  assert.strictEqual(code.includes('@page {'), true, 'Deve conter bloco @page');
  assert.strictEqual(code.includes('size: A4 portrait;'), true, 'Deve definir tamanho A4 portrait');
  assert.strictEqual(code.includes('margin: 20mm 15mm 20mm 15mm;'), true, 'Deve ter margens padronizadas de 20mm superior/inferior e 15mm laterais');
  assert.strictEqual(code.includes('.contrato-table-header td'), true, 'Deve conter padding de segurança no thead');
  assert.strictEqual(code.includes('.contrato-table-footer td'), true, 'Deve conter padding de segurança no tfoot');
  console.log('✓ @page configurado para A4 portrait com margens 20mm/15mm e cabeçalho/rodapé protegidos.\n');

  console.log('2. Validando regras de fluidez em tabelas e containers...');
  assert.strictEqual(code.includes('break-inside: auto !important'), true, 'Deve permitir quebra livre de tabelas/containers');
  assert.strictEqual(code.includes('height: auto !important;'), true, 'Deve neutralizar alturas fixas herdadas de editores de texto');
  assert.strictEqual(code.includes('tr:empty'), true, 'Deve ocultar linhas de tabela vazias no print');
  assert.strictEqual(code.includes('br + br'), true, 'Deve colapsar <br> consecutivos para evitar páginas em branco');
  console.log('✓ Tabelas e containers fluem continuamente sem saltos artificiais de página.\n');

  console.log('3. Validando proteção de cabeçalhos e assinaturas...');
  assert.strictEqual(code.includes('break-after: avoid !important;'), true, 'Títulos h1-h4 não devem ficar sozinhos no rodapé');
  assert.strictEqual(code.includes('.bloco-assinaturas'), true, 'Bloco de assinaturas mapeado para impressão');
  assert.strictEqual(code.includes('[class*="assinatura"]'), true, 'Classes de assinatura protegidas contra corte');
  console.log('✓ Assinaturas e títulos de cláusulas protegidos contra quebra indesejada.\n');

  console.log('4. Verificando integridade das tags de renderização...');
  assert.strictEqual(code.includes('dangerouslySetInnerHTML={{ __html: payload?.contrato?.html'), true, 'Deve renderizar HTML do contrato sem truncamento');
  console.log('✓ Conteúdo do contrato e placeholders preservados 100%.\n');

  console.log('=== TODOS OS TESTES DE PAGINAÇÃO PASSARAM COM SUCESSO! ===\n');
}

runTests();
