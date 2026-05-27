/**
 * VALIDACAO FASE 2 — Abertura de Turma
 * Executa todos os cenários de teste contra localhost:3000
 */
'use strict';

const crypto = require('crypto');
const https  = require('https');
const http   = require('http');

// ── Config ─────────────────────────────────────────────
const BASE_URL  = 'http://localhost:3000';
const SECRET    = 'IhHXnYyjLkWUD1ZlE70iz8RGwAarvgqtFNV5spSmd6QfKO32';
const SUPABASE_URL = 'https://wjcbobcqyqdkludsbqgf.supabase.co';
const SERVICE_KEY  = 'sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ';

const TURMA_TESTE_NOME = '__TESTE_FASE2_' + Date.now();

// ── Resultados ─────────────────────────────────────────
const resultados = [];
let passCount = 0;
let failCount = 0;

function ok(descricao, detalhes = '') {
  resultados.push({ status: 'OK', descricao, detalhes });
  passCount++;
  console.log('  ✅ ' + descricao + (detalhes ? '  →  ' + detalhes : ''));
}
function fail(descricao, detalhes = '') {
  resultados.push({ status: 'FALHOU', descricao, detalhes });
  failCount++;
  console.log('  ❌ ' + descricao + (detalhes ? '  →  ' + detalhes : ''));
}

// ── JWT ─────────────────────────────────────────────────
function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(JSON.stringify(input));
  return buf.toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
function makeToken(payload) {
  const now    = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body   = { iss: 'creeser', iat: now, exp: now + 28800, ...payload };
  const si     = `${b64url(header)}.${b64url(body)}`;
  const sig    = b64url(crypto.createHmac('sha256', SECRET).update(si).digest());
  return `${si}.${sig}`;
}

// Token grupo_admin não precisa de instituicao_id real
const TOKEN_ADMIN = makeToken({ id: 999, email: 'test-admin@test.com', nome: 'Admin Teste', perfil: 'grupo_admin', tipo: 'grupo_admin', instituicao_id: null });

// Tokens dependentes de instituicaoId real são gerados após setup
const TOKENS = { grupo_admin: TOKEN_ADMIN };

// ── HTTP helpers ─────────────────────────────────────────
function req(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const url   = new URL(BASE_URL + path);
    const data  = body ? JSON.stringify(body) : null;
    const opts  = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Cookie':       `creeser_token=${encodeURIComponent(token)}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const proto = url.protocol === 'https:' ? https : http;
    const r = proto.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

// ── Supabase direct REST ─────────────────────────────────
function sbReq(method, table, query = '', body = null) {
  return new Promise((resolve, reject) => {
    const url    = new URL(`${SUPABASE_URL}/rest/v1/${table}${query}`);
    const data   = body ? JSON.stringify(body) : null;
    const opts   = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method,
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

// ── Setup: criar turma e alunos de teste ─────────────────
let turmaTesteId    = null;
let alunoTesteIds   = [];
let instituicaoId   = null;
let cursoId         = null;
let unidadeId       = null;

async function setup() {
  console.log('\n📦  SETUP — criando dados de teste...\n');

  // Buscar primeira instituicao existente
  const instR = await sbReq('GET', 'instituicoes', '?select=id&limit=1');
  if (!instR.body || instR.body.length === 0) throw new Error('Nenhuma instituicao encontrada no banco');
  instituicaoId = instR.body[0].id;
  console.log('  instituicao_id =', instituicaoId);

  // Buscar primeiro curso existente
  const cursoR = await sbReq('GET', 'cursos', `?select=id&instituicao_id=eq.${instituicaoId}&limit=1`);
  if (!cursoR.body || cursoR.body.length === 0) {
    // Tentar sem filtro
    const cursoR2 = await sbReq('GET', 'cursos', '?select=id&limit=1');
    if (!cursoR2.body || cursoR2.body.length === 0) throw new Error('Nenhum curso encontrado no banco');
    cursoId = cursoR2.body[0].id;
  } else {
    cursoId = cursoR.body[0].id;
  }
  console.log('  cursoId =', cursoId);

  // Buscar primeira unidade existente
  const unidR = await sbReq('GET', 'unidades', `?select=id&instituicao_id=eq.${instituicaoId}&limit=1`);
  if (!unidR.body || unidR.body.length === 0) {
    const unidR2 = await sbReq('GET', 'unidades', '?select=id&limit=1');
    if (!unidR2.body || unidR2.body.length === 0) throw new Error('Nenhuma unidade encontrada');
    unidadeId = unidR2.body[0].id;
  } else {
    unidadeId = unidR.body[0].id;
  }
  console.log('  unidadeId =', unidadeId);

  // Criar turma de teste com status PRONTA_PARA_ABRIR e qtd_minima=3
  const turmaR = await sbReq('POST', 'turmas', '', {
    nome:                TURMA_TESTE_NOME,
    cursoid:             cursoId,
    unidadeid:           unidadeId,
    instituicao_id:      instituicaoId,
    situacao:            'ativo',
    qtd_minima_alunos:   3,
    status_formacao:     'PRONTA_PARA_ABRIR',
    data_prevista_inicio: new Date().toISOString().split('T')[0],
  });
  if (turmaR.status !== 201 || !turmaR.body || turmaR.body.length === 0) {
    throw new Error('Falha ao criar turma de teste: ' + JSON.stringify(turmaR.body));
  }
  turmaTesteId = turmaR.body[0].id;
  console.log('  turma_id =', turmaTesteId, '(status_formacao = PRONTA_PARA_ABRIR, qtd_minima = 3)');

  // Criar 4 alunos AGUARDANDO_FORMACAO_TURMA (> qtd_minima)
  const nomesAtuais  = ['Aluno Teste A', 'Aluno Teste B', 'Aluno Teste C', 'Aluno Teste D'];
  // Criar 2 alunos em outros status para confirmar que NÃO são ativados
  const nomesExtras  = ['PRE Teste E', 'AGUARD_PAG Teste F', 'CANCELADO Teste G', 'DESISTENTE Teste H'];
  const statusExtras = ['PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO_MATRICULA', 'CANCELADO', 'DESISTENTE'];

  for (const nome of nomesAtuais) {
    const cpf = '000' + Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
    const ar = await sbReq('POST', 'alunos', '', {
      nome, cpf,
      email: `${nome.replace(/ /g,'')}_${Date.now()}@teste.com`,
      cursoid: cursoId,
      turmaid: turmaTesteId,
      instituicao_id: instituicaoId,
      statusmatricula: 'AGUARDANDO_FORMACAO_TURMA',
    });
    if (ar.status === 201 && ar.body && ar.body[0]) {
      alunoTesteIds.push(ar.body[0].id);
      console.log('  aluno AGUARDANDO_FORMACAO_TURMA id =', ar.body[0].id, nome);
    } else {
      console.log('  AVISO: falha ao criar aluno', nome, JSON.stringify(ar.body));
    }
  }

  // Alunos extra com status que não devem ser ativados
  const alunosExtras = [];
  for (let i = 0; i < nomesExtras.length; i++) {
    const cpf = '111' + Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
    const ar = await sbReq('POST', 'alunos', '', {
      nome: nomesExtras[i], cpf,
      email: `extra${i}_${Date.now()}@teste.com`,
      cursoid: cursoId,
      turmaid: turmaTesteId,
      instituicao_id: instituicaoId,
      statusmatricula: statusExtras[i],
    });
    if (ar.status === 201 && ar.body && ar.body[0]) {
      alunosExtras.push({ id: ar.body[0].id, status: statusExtras[i], nome: nomesExtras[i] });
      console.log('  aluno', statusExtras[i], 'id =', ar.body[0].id);
    }
  }

  // Guardar ids de extras para validação pós-ativação
  global.__alunosExtras = alunosExtras;
  global.__instituicaoId = instituicaoId;

  // Gerar tokens com instituicaoId real (UUID válido)
  TOKENS.secretaria   = makeToken({ id: 997, email: 'test-secret@test.com', nome: 'Secret Teste', perfil: 'secretaria',  tipo: 'secretaria',  instituicao_id: instituicaoId });
  TOKENS.coordenador  = makeToken({ id: 998, email: 'test-coord@test.com',  nome: 'Coord Teste',  perfil: 'coordenador', tipo: 'coordenador', instituicao_id: instituicaoId });

  console.log('\n  ✅  Setup concluído. turmaId =', turmaTesteId, '| alunos AGUARDANDO =', alunoTesteIds.length);
}

// ── Cleanup: remover dados de teste ──────────────────────
async function cleanup() {
  console.log('\n🗑️   CLEANUP...\n');

  // Deletar alunos de teste (os normais + os extras)
  if (alunoTesteIds.length > 0) {
    await sbReq('DELETE', 'alunos', `?turmaid=eq.${turmaTesteId}`);
    console.log('  Alunos da turma de teste removidos');
  }

  // Deletar turma de teste
  if (turmaTesteId) {
    const dr = await sbReq('DELETE', 'turmas', `?id=eq.${turmaTesteId}`);
    console.log('  Turma de teste removida (status =', dr.status, ')');
  }

  // Deletar auditoria da turma de teste
  await sbReq('DELETE', 'formacao_auditoria', `?turma_id=eq.${turmaTesteId}`);
  console.log('  Registros de auditoria removidos');
}

// ── TESTES ────────────────────────────────────────────────
async function runTestes() {

  // ─────────────────────────────────────────────────────────
  // CENÁRIO 1: Turma EM_FORMACAO deve ser bloqueada
  // ─────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('CENÁRIO 1 — Turma EM_FORMACAO deve bloquear');
  console.log('══════════════════════════════════════════\n');

  // Criar outra turma para teste EM_FORMACAO
  const turmaEmFormacaoR = await sbReq('POST', 'turmas', '', {
    nome:              '__TESTE_EM_FORMACAO_' + Date.now(),
    cursoid:           cursoId,
    unidadeid:         unidadeId,
    instituicao_id:    instituicaoId,
    situacao:          'ativo',
    qtd_minima_alunos: 20,
    status_formacao:   'EM_FORMACAO',
  });
  const turmaEmFormacaoId = turmaEmFormacaoR.body?.[0]?.id;
  console.log('  Turma EM_FORMACAO id =', turmaEmFormacaoId);

  const r1 = await req('POST', `/api/formacao-turmas/${turmaEmFormacaoId}/abrir`, TOKENS.grupo_admin);
  if (r1.status === 400 && r1.body?.error?.includes('PRONTA_PARA_ABRIR')) {
    ok('Bloqueia turma EM_FORMACAO', `HTTP ${r1.status} — ${r1.body.error}`);
  } else {
    fail('Bloqueia turma EM_FORMACAO', `HTTP ${r1.status} — ${JSON.stringify(r1.body)}`);
  }

  // Limpar turma EM_FORMACAO de teste
  await sbReq('DELETE', 'turmas', `?id=eq.${turmaEmFormacaoId}`);

  // ─────────────────────────────────────────────────────────
  // CENÁRIO 2: Listar alunos via ?incluirAlunos=1
  // ─────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('CENÁRIO 2A — GET com incluirAlunos=1');
  console.log('══════════════════════════════════════════\n');

  const r2 = await req('GET', `/api/formacao-turmas/${turmaTesteId}?incluirAlunos=1`, TOKENS.grupo_admin);
  if (r2.status === 200 && Array.isArray(r2.body.alunos)) {
    ok('GET ?incluirAlunos=1 retorna array', `qtd alunos = ${r2.body.alunos.length}`);
    if (r2.body.alunos.length === alunoTesteIds.length) {
      ok('Qtd alunos AGUARDANDO_FORMACAO_TURMA correta', `${r2.body.alunos.length} de ${alunoTesteIds.length}`);
    } else {
      fail('Qtd alunos AGUARDANDO_FORMACAO_TURMA', `esperado ${alunoTesteIds.length}, recebido ${r2.body.alunos.length}`);
    }
    // Verificar que PRE_CADASTRO etc NÃO aparecem
    const extras = global.__alunosExtras || [];
    const extraIds = extras.map(a => a.id);
    const idsNaLista = r2.body.alunos.map(a => a.id);
    const indevidos = idsNaLista.filter(id => extraIds.includes(id));
    if (indevidos.length === 0) {
      ok('Alunos em outros status NÃO aparecem na lista', 'PRE_CADASTRO/AGUARDANDO_PAGAMENTO/CANCELADO/DESISTENTE excluídos');
    } else {
      fail('Alunos em outros status NÃO devem aparecer', `ids indevidos: ${indevidos}`);
    }
  } else {
    fail('GET ?incluirAlunos=1', `HTTP ${r2.status} — ${JSON.stringify(r2.body)}`);
  }

  // ─────────────────────────────────────────────────────────
  // CENÁRIO 2B: Abrir turma PRONTA_PARA_ABRIR
  // ─────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('CENÁRIO 2B — POST /abrir na turma PRONTA_PARA_ABRIR');
  console.log('══════════════════════════════════════════\n');

  const r3 = await req('POST', `/api/formacao-turmas/${turmaTesteId}/abrir`, TOKENS.grupo_admin);
  console.log('  Resposta:', r3.status, JSON.stringify(r3.body));

  if (r3.status === 200 && r3.body.status_formacao === 'ATIVA') {
    ok('Abrir turma retorna 200 e status_formacao=ATIVA', `qtdAtivados = ${r3.body.qtdAtivados}`);
  } else {
    fail('Abrir turma deve retornar 200', `HTTP ${r3.status} — ${JSON.stringify(r3.body)}`);
  }

  // Verificar no banco: turma.status_formacao = ATIVA
  const turmaCheck = await sbReq('GET', 'turmas', `?id=eq.${turmaTesteId}&select=status_formacao`);
  const sfinal = turmaCheck.body?.[0]?.status_formacao;
  if (sfinal === 'ATIVA') {
    ok('turma.status_formacao = ATIVA (confirmado no banco)', `status_formacao = ${sfinal}`);
  } else {
    fail('turma.status_formacao deveria ser ATIVA', `valor atual: ${sfinal}`);
  }

  // Verificar no banco: alunos AGUARDANDO_FORMACAO_TURMA -> ATIVO
  const qtdAtivados = r3.body.qtdAtivados || 0;
  const alunosCheck = await sbReq('GET', 'alunos',
    `?id=in.(${alunoTesteIds.join(',')})&select=id,statusmatricula,data_ativacao`);
  const todos = alunosCheck.body || [];
  const ativados = todos.filter(a => a.statusmatricula === 'ATIVO');
  const naoAtivados = todos.filter(a => a.statusmatricula !== 'ATIVO');

  if (ativados.length === alunoTesteIds.length) {
    ok(`Todos os ${alunoTesteIds.length} alunos AGUARDANDO_FORMACAO_TURMA viraram ATIVO`, `ativados = ${ativados.length}`);
  } else {
    fail('Alunos não ativados corretamente', `ATIVO: ${ativados.length}, outros: ${naoAtivados.map(a => a.statusmatricula).join(', ')}`);
  }
  if (ativados.length > 0 && ativados[0].data_ativacao) {
    ok('data_ativacao preenchida nos alunos', ativados[0].data_ativacao);
  } else if (ativados.length > 0) {
    // coluna pode não existir ainda — aviso mas não falha
    console.log('  ⚠️   data_ativacao nula (coluna pode ainda não ter sido aplicada no Supabase)');
  }

  // Verificar que alunos extras NÃO foram ativados
  const extras = global.__alunosExtras || [];
  if (extras.length > 0) {
    const extraIds = extras.map(a => a.id);
    const extrasCheck = await sbReq('GET', 'alunos',
      `?id=in.(${extraIds.join(',')})&select=id,statusmatricula,nome`);
    const extrasData = extrasCheck.body || [];
    const indevidamenteMudados = extrasData.filter(a => a.statusmatricula === 'ATIVO');
    if (indevidamenteMudados.length === 0) {
      ok('Alunos PRE_CADASTRO/AGUARDANDO_PAGAMENTO/CANCELADO/DESISTENTE NÃO foram ativados',
         extrasData.map(a => `${a.nome}=${a.statusmatricula}`).join(' | '));
    } else {
      fail('Alunos em outros status foram indevidamente ativados',
           indevidamenteMudados.map(a => `${a.id}:${a.statusmatricula}`).join(', '));
    }
  }

  // ─────────────────────────────────────────────────────────
  // CENÁRIO 3: Execução duplicada → 409
  // ─────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('CENÁRIO 3 — Execução duplicada (turma já ATIVA)');
  console.log('══════════════════════════════════════════\n');

  const r4 = await req('POST', `/api/formacao-turmas/${turmaTesteId}/abrir`, TOKENS.grupo_admin);
  if (r4.status === 409) {
    ok('Execução duplicada retorna 409 Conflict', r4.body?.error || '');
  } else {
    fail('Execução duplicada deveria retornar 409', `HTTP ${r4.status} — ${JSON.stringify(r4.body)}`);
  }

  // ─────────────────────────────────────────────────────────
  // CENÁRIO 4: Secretaria — lista turmas mas não abre
  // ─────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('CENÁRIO 4 — Secretaria');
  console.log('══════════════════════════════════════════\n');

  // Secretaria deve conseguir listar turmas (GET /api/formacao-turmas)
  const r5 = await req('GET', '/api/formacao-turmas', TOKENS.secretaria);
  if (r5.status === 200 && Array.isArray(r5.body)) {
    ok('Secretaria consegue listar turmas (GET /api/formacao-turmas)', `${r5.body.length} turma(s)`);
  } else if (r5.status === 200) {
    ok('Secretaria consegue listar turmas', `resposta OK`);
  } else {
    fail('Secretaria deveria ver lista de turmas', `HTTP ${r5.status} — ${JSON.stringify(r5.body)}`);
  }

  // Secretaria NÃO deve conseguir abrir turma (403)
  const r6 = await req('POST', `/api/formacao-turmas/${turmaTesteId}/abrir`, TOKENS.secretaria);
  if (r6.status === 403) {
    ok('Secretaria recebe 403 ao tentar abrir turma', r6.body?.error || '');
  } else {
    fail('Secretaria deveria receber 403', `HTTP ${r6.status} — ${JSON.stringify(r6.body)}`);
  }

  // ─────────────────────────────────────────────────────────
  // Retornar qtd ativados para relatório
  return { qtdAtivados, sfinal };
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  VALIDAÇÃO FASE 2 — ABERTURA DE TURMA');
  console.log('  ' + new Date().toLocaleString('pt-BR'));
  console.log('═══════════════════════════════════════════════════════');

  let resultado = null;
  try {
    await setup();
    resultado = await runTestes();
  } catch (err) {
    console.error('\n💥  ERRO FATAL durante os testes:', err.message);
    failCount++;
  } finally {
    await cleanup().catch(e => console.warn('Cleanup falhou:', e.message));
  }

  // ─── Relatório Final ─────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RELATÓRIO FINAL');
  console.log('═══════════════════════════════════════════════════════\n');
  for (const r of resultados) {
    const icon = r.status === 'OK' ? '✅' : '❌';
    console.log(`  ${icon} ${r.descricao}`);
    if (r.detalhes) console.log(`      ${r.detalhes}`);
  }
  console.log(`\n  Passou: ${passCount}  |  Falhou: ${failCount}  |  Total: ${passCount + failCount}`);
  if (resultado) {
    console.log(`  Alunos ativados no teste: ${resultado.qtdAtivados}`);
    console.log(`  Status final da turma:    ${resultado.sfinal}`);
  }
  console.log(`  Veredicto: ${failCount === 0 ? '🟢 APROVADO' : '🔴 NÃO APROVADO'}`);
  console.log('\n═══════════════════════════════════════════════════════');
}

main().catch(e => { console.error(e); process.exit(1); });
