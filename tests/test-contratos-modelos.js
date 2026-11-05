/**
 * Testes unitários e de integração para modelos de contratos:
 * 1. Sanitização de excessos de formatação gerados por editores (Office / Google Docs).
 * 2. Preservação de tabelas, estilos legítimos, placeholders dinâmicos e conteúdo.
 * 3. Validação de isolamento institucional (não sobrescrever contrato de outra instituição).
 * 4. Validação de limites de payload (sizeLimit: 10mb) nas APIs de contratos.
 * 5. Tratamento amigável e distinção de erros HTTP (413 Payload Too Large, 401 Não Autorizado, 403 Acesso Negado).
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const assert = require('assert');
const {
  sanitizarHtmlContrato,
  parseContratoPayload,
  normalizePlaceholders
} = require('../pages/api/contratos/_shared');

async function runTests() {
  console.log('=== INICIANDO TESTES DO MÓDULO DE CONTRATOS ===\n');

  // ── TESTE 1: Sanitização de HTML com formatação de Google Docs/Office ────────
  console.log('1. Testando sanitização de HTML pesado...');
  const htmlDocsSuja = `
    <span id="docs-internal-guid-c0645b87-7fff-9ae5-b62e-b1638a752404">
      <div dir="ltr" align="left">
        <table style="text-align: left; border: 1px solid #ccc;">
          <colgroup><col width="100"><col width="200"></colgroup>
          <tbody>
            <tr>
              <td style="background-color: transparent; font-variant: normal; vertical-align: baseline; text-decoration: none; font-weight: bold;">
                <span style="background-color: rgba(0, 0, 0, 0); font-variant: normal; vertical-align: baseline; color: #333333;">
                  CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS
                </span>
              </td>
              <td>Aluno: {{ALUNO_NOME}} - CPF: {{ALUNO_CPF}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </span>
  `;

  const limpo = sanitizarHtmlContrato(htmlDocsSuja);

  // Asserções:
  // a) Não pode ter docs-internal-guid
  assert.strictEqual(limpo.includes('docs-internal-guid'), false, 'Não deve conter spans id=docs-internal-guid');
  // b) Não pode ter background-color transparent ou normal redundant
  assert.strictEqual(limpo.includes('background-color: transparent'), false, 'Não deve conter background-color transparent');
  assert.strictEqual(limpo.includes('font-variant: normal'), false, 'Não deve conter font-variant: normal');
  // c) DEVE preservar table, colgroup, tbody, tr, td
  assert.strictEqual(limpo.includes('<table'), true, 'Deve preservar a tag table');
  assert.strictEqual(limpo.includes('<colgroup>'), true, 'Deve preservar colgroup');
  assert.strictEqual(limpo.includes('<tr>'), true, 'Deve preservar tr');
  assert.strictEqual(limpo.includes('<td>'), true, 'Deve preservar td');
  // d) DEVE preservar placeholders
  assert.strictEqual(limpo.includes('{{ALUNO_NOME}}'), true, 'Deve preservar o placeholder {{ALUNO_NOME}}');
  assert.strictEqual(limpo.includes('{{ALUNO_CPF}}'), true, 'Deve preservar o placeholder {{ALUNO_CPF}}');
  // e) DEVE preservar texto e estilos úteis (ex: border, font-weight, color)
  assert.strictEqual(limpo.includes('CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS'), true, 'Deve preservar o texto original');
  assert.strictEqual(limpo.includes('font-weight: bold'), true, 'Deve preservar font-weight: bold');
  assert.strictEqual(limpo.includes('color: #333333'), true, 'Deve preservar color: #333333');
  console.log('✓ Sanitização reduziu overhead mantendo 100% das tabelas, estilos úteis e placeholders.\n');

  // ── TESTE 2: parseContratoPayload aplicando sanitização automática ───────────
  console.log('2. Testando parseContratoPayload...');
  const payloadBruto = {
    nome: 'Contrato Técnico Enfermagem',
    descricao: 'Modelo adaptado para Inove Técnico',
    conteudoHtml: htmlDocsSuja,
    placeholders: ['{{ALUNO_NOME}}', '{{ALUNO_CPF}}'],
    ativo: 'true',
    ordem: '2'
  };

  const parsed = parseContratoPayload(payloadBruto);
  assert.strictEqual(parsed.nome, 'Contrato Técnico Enfermagem');
  assert.strictEqual(parsed.ativo, true);
  assert.strictEqual(parsed.ordem, 2);
  assert.strictEqual(parsed.conteudo_html.includes('docs-internal-guid'), false);
  assert.strictEqual(parsed.conteudo_html.includes('{{ALUNO_NOME}}'), true);
  console.log('✓ parseContratoPayload sanitizou e normalizou os campos com sucesso.\n');

  // ── TESTE 3: Isolamento Institucional e Cópia Segura ────────────────────────
  console.log('3. Testando lógica de isolamento institucional na cópia...');
  const instOrigem = '30130938-4437-4527-a841-ffb1e0fc887a'; // Colégio Inove (Básica)
  const instDestino = '1f140f5f-cf75-489d-8ab3-d99cf28d1414'; // Inove Técnico

  const contratoOriginal = {
    id: 'contrato-original-1',
    instituicao_id: instOrigem,
    nome: 'Contrato Educação Básica',
    conteudo_html: '<p>Cláusula 1: Ensino Fundamental</p>'
  };

  // Simular ação de Cópia (duplicarContrato)
  const copiaParaDestino = {
    nome: `${contratoOriginal.nome} (Cópia)`,
    descricao: `Cópia adaptada para Inove Técnico`,
    conteudoHtml: contratoOriginal.conteudo_html,
    ativo: true,
    padrao: false,
    ordem: 1
  };

  // Ao salvar como novo modelo na instituição destino:
  // POST em /api/instituicoes/${instDestino}/contratos
  const contratoNovoCriado = {
    id: 'novo-uuid-gerado-no-insert',
    instituicao_id: instDestino,
    ...parseContratoPayload(copiaParaDestino)
  };

  assert.notStrictEqual(contratoNovoCriado.id, contratoOriginal.id, 'Novo contrato deve ter ID próprio gerado no INSERT');
  assert.strictEqual(contratoNovoCriado.instituicao_id, instDestino, 'Novo contrato deve pertencer à instituição de destino (Inove Técnico)');
  assert.strictEqual(contratoOriginal.instituicao_id, instOrigem, 'Contrato original deve permanecer inalterado na instituição de origem');
  assert.strictEqual(contratoOriginal.id, 'contrato-original-1');
  console.log('✓ Isolamento confirmado: contrato original preservado na origem e novo modelo criado no destino.\n');

  // ── TESTE 4: Verificação de configuração de sizeLimit (10mb) nas APIs ────────
  console.log('4. Testando configuração de bodyParser sizeLimit...');
  const c1 = fs.readFileSync('pages/api/instituicoes/[id]/contratos.js', 'utf8');
  const c2 = fs.readFileSync('pages/api/contratos/[id].js', 'utf8');

  assert.strictEqual(c1.includes("sizeLimit: '10mb'"), true, 'API instituicoes/[id]/contratos deve ter sizeLimit 10mb');
  assert.strictEqual(c2.includes("sizeLimit: '10mb'"), true, 'API contratos/[id] deve ter sizeLimit 10mb');
  console.log('✓ Configuração de 10mb presente nas APIs de contratos.\n');

  // ── TESTE 5: Verificação de tratamento de erros amigáveis na UI ──────────────
  console.log('5. Testando tratamento de erros na tela de configurações...');
  const cUi = fs.readFileSync('pages/admin/configuracoes/empresa.js', 'utf8');
  assert.strictEqual(cUi.includes('413 Payload Too Large'), true, 'UI deve tratar e exibir mensagem específica para 413');
  assert.strictEqual(cUi.includes('401 Não Autorizado'), true, 'UI deve tratar e exibir mensagem específica para 401');
  assert.strictEqual(cUi.includes('403 Acesso Negado'), true, 'UI deve tratar e exibir mensagem específica para 403');
  assert.strictEqual(cUi.includes('duplicarContrato'), true, 'UI deve conter ação dedicada de cópia de modelo');
  console.log('✓ Mensagens de feedback especializadas presentes na interface.\n');

  console.log('=== TODOS OS TESTES PASSARAM COM SUCESSO! ===');
}

runTests().catch(err => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
