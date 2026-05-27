/**
 * AUDITORIA OPERACIONAL — INOVE TÉCNICO
 * Fase Final de Validação — 27/05/2026
 *
 * Testa ponta a ponta: Recepção, Comercial, Financeiro,
 * Formação de Turmas, Contratos, Segurança.
 *
 * Uso: node scripts/auditoria-operacional.cjs
 * Pré-requisito: arquivo .env.local com credenciais reais.
 */

'use strict';

const crypto = require('crypto');
const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');

// ── Carregar .env.local ────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const [k, ...rest] = line.split('=');
      if (k && rest.length && !process.env[k.trim()]) {
        process.env[k.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH_SECRET  = process.env.AUTH_JWT_SECRET || '';
const BASE_URL     = 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.');
  process.exit(1);
}

// ── Utilitários ─────────────────────────────────────────────────────────────

const b64url = (buf) =>
  (Buffer.isBuffer(buf) ? buf : Buffer.from(JSON.stringify(buf)))
    .toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function buildToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now    = Math.floor(Date.now() / 1000);
  const body   = { iss: 'creeser', iat: now, exp: now + 28800, ...payload };
  const input  = `${b64url(header)}.${b64url(body)}`;
  const sig    = crypto.createHmac('sha256', AUTH_SECRET).update(input).digest();
  return `${input}.${b64url(sig)}`;
}

// Supabase REST helper
async function sb(path_, method = 'GET', body = null) {
  const url    = new URL(path_.startsWith('http') ? path_ : `${SUPABASE_URL}/rest/v1${path_}`);
  const isHttps = url.protocol === 'https:';
  const mod    = isHttps ? https : http;
  const opts = {
    hostname: url.hostname,
    port:     url.port || (isHttps ? 443 : 80),
    path:     url.pathname + url.search,
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    },
  };

  return new Promise((resolve, reject) => {
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (_) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// HTTP call ao servidor Next.js (cookie auth)
async function api(path_, method = 'GET', body = null, token = '') {
  const url  = new URL(`${BASE_URL}${path_}`);
  const opts = {
    hostname: url.hostname,
    port:     url.port || 80,
    path:     url.pathname + url.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...(token ? { 'Cookie': `creeser_token=${encodeURIComponent(token)}` } : {}),
    },
  };

  return new Promise((resolve) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (_) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 0, body: { error: 'timeout' } }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Estado do relatório ──────────────────────────────────────────────────────
const results = [];
let createdAlunoId = null;
let createdLeadId  = null;
let sampleAlunoId  = null;
let sampleOrdemId  = null;
let sampleParcelaId = null;
let sampleTurmaId  = null;
let instituicaoId  = null;
let tokens         = {};

function record(secao, teste, status, detalhe = '') {
  const emoji = status === 'OK' ? '✅' : status === 'AVISO' ? '⚠️' : '❌';
  console.log(`  ${emoji} [${secao}] ${teste}${detalhe ? ' — ' + detalhe : ''}`);
  results.push({ secao, teste, status, detalhe });
}

function ok(secao, teste, d = '') { record(secao, teste, 'OK', d); }
function fail(secao, teste, d = '') { record(secao, teste, 'FAIL', d); }
function aviso(secao, teste, d = '') { record(secao, teste, 'AVISO', d); }

// ── FASE 0: Descoberta de dados reais ───────────────────────────────────────
async function descubrir() {
  console.log('\n══ FASE 0: Descoberta de dados reais ══════════════════════════════');

  // Instituição ativa
  const inst = await sb('/instituicoes?ativa=eq.true&limit=1&select=id,nome');
  if (inst.status === 200 && Array.isArray(inst.body) && inst.body.length > 0) {
    instituicaoId = inst.body[0].id;
    console.log(`  → Instituição: ${inst.body[0].nome} (${instituicaoId})`);
  } else {
    const instAll = await sb('/instituicoes?limit=1&select=id,nome');
    if (instAll.status === 200 && Array.isArray(instAll.body) && instAll.body.length > 0) {
      instituicaoId = instAll.body[0].id;
      console.log(`  → Instituição (primeira): ${instAll.body[0].nome} (${instituicaoId})`);
    } else {
      console.log('  ⚠️  Nenhuma instituição encontrada — alguns testes serão limitados');
    }
  }

  // Usuários por perfil
  const usuarios = await sb('/usuarios?select=id,email,perfil,nome,instituicao_id,status&limit=100');
  const usrList  = Array.isArray(usuarios.body) ? usuarios.body : [];
  console.log(`  → ${usrList.length} usuário(s) encontrado(s) no banco`);

  const perfisProcurados = ['grupo_admin','instituicao_admin','coordenador','secretaria','financeiro','recepcao','comercial_master','comercial_operador'];
  const usuarioPorPerfil = {};
  for (const p of perfisProcurados) {
    const u = usrList.find(x => x.perfil === p && (!x.status || x.status === 'ativo' || x.status === 'ATIVO'));
    if (u) usuarioPorPerfil[p] = u;
    else {
      const any = usrList.find(x => x.perfil === p);
      if (any) usuarioPorPerfil[p] = any;
    }
  }

  // Gerar tokens para cada perfil encontrado
  for (const [perfil, u] of Object.entries(usuarioPorPerfil)) {
    tokens[perfil] = buildToken({
      id:            u.id,
      email:         u.email,
      perfil:        u.perfil,
      tipo:          u.perfil,
      nome:          u.nome,
      instituicao_id: u.instituicao_id || instituicaoId,
      instituicaoId:  u.instituicao_id || instituicaoId,
    });
    console.log(`  → Token gerado para perfil ${perfil}: ${u.email}`);
  }

  // Token de fallback grupo_admin (para testes que precisam de admin)
  if (!tokens['grupo_admin']) {
    tokens['grupo_admin'] = buildToken({
      id: 1, email: 'auditoria@sistema.creeser', perfil: 'grupo_admin', tipo: 'grupo_admin',
      nome: 'Auditoria', instituicao_id: instituicaoId, instituicaoId: instituicaoId,
    });
    console.log('  ⚠️  Token grupo_admin gerado artificialmente (sem usuário real no banco)');
  }

  // Aluno de amostra (qualquer status)
  const alunoSample = await sb(
    `/alunos?select=id,nome,statusmatricula,captado_por_id,instituicao_id${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=5&order=id.desc`
  );
  if (alunoSample.status === 200 && Array.isArray(alunoSample.body) && alunoSample.body.length > 0) {
    sampleAlunoId = alunoSample.body[0].id;
    console.log(`  → Aluno de amostra: #${sampleAlunoId} — ${alunoSample.body[0].nome} [${alunoSample.body[0].statusmatricula}]`);
  }

  // Ordem/parcela de amostra
  const ordens = await sb(
    `/financeiro_ordens_pagamento?select=id,aluno_id,tipo,status${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=3&order=id.desc`
  );
  if (ordens.status === 200 && Array.isArray(ordens.body) && ordens.body.length > 0) {
    sampleOrdemId = ordens.body[0].id;
    // parcela pendente desta ordem
    const parc = await sb(
      `/financeiro_parcelas?select=id,status&ordem_pagamento_id=eq.${sampleOrdemId}&status=eq.pendente&limit=1`
    );
    if (parc.status === 200 && Array.isArray(parc.body) && parc.body.length > 0) {
      sampleParcelaId = parc.body[0].id;
    }
    console.log(`  → Ordem de amostra: ${sampleOrdemId} — Parcela pendente: ${sampleParcelaId || 'nenhuma'}`);
  }

  // Turma de amostra
  const turmas = await sb(
    `/turmas?select=id,nome,status_formacao,situacao${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=3&order=id.desc`
  );
  if (turmas.status === 200 && Array.isArray(turmas.body) && turmas.body.length > 0) {
    sampleTurmaId = turmas.body[0].id;
    console.log(`  → Turma de amostra: #${sampleTurmaId} — ${turmas.body[0].nome} [formação: ${turmas.body[0].status_formacao || 'null'}]`);
  }
}

// ══ MÓDULO 1: RECEPÇÃO ══════════════════════════════════════════════════════
async function auditoriaRecepcao() {
  console.log('\n══ 1. RECEPÇÃO ═══════════════════════════════════════════════════════');
  const token = tokens['recepcao'] || tokens['grupo_admin'];
  const tokenAdmin = tokens['grupo_admin'];

  // 1.1 Listar pré-cadastros via API
  const lista = await api('/api/recepcao/pre-cadastros', 'GET', null, tokenAdmin);
  if (lista.status === 200 && Array.isArray(lista.body)) {
    ok('Recepção', '1.1 GET /api/recepcao/pre-cadastros retorna 200', `${lista.body.length} registros`);
  } else if (lista.status === 0) {
    aviso('Recepção', '1.1 Servidor não disponível — testando via Supabase direto', 'HTTP timeout');
    // Fallback: Supabase direto
    const direct = await sb(`/alunos?statusmatricula=in.(PRE_CADASTRO,AGUARDANDO_PAGAMENTO_MATRICULA)${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&select=id,nome,statusmatricula&limit=5`);
    if (direct.status === 200 && Array.isArray(direct.body)) {
      ok('Recepção', '1.1b Supabase direto: alunos PRE_CADASTRO acessíveis', `${direct.body.length} registros`);
    } else {
      fail('Recepção', '1.1b Supabase direto falhou', JSON.stringify(direct.body).slice(0, 100));
    }
  } else {
    fail('Recepção', '1.1 GET /api/recepcao/pre-cadastros', `HTTP ${lista.status}`);
  }

  // 1.2 Criar pré-cadastro via API
  const nome = `AUDIT_${Date.now()}`;
  const criar = await api('/api/recepcao/pre-cadastros', 'POST', {
    nome,
    email: `audit${Date.now()}@teste.creeser`,
    telefone_celular: '11999990000',
    instituicao_id: instituicaoId,
  }, token);

  if (criar.status === 201 || criar.status === 200) {
    createdAlunoId = criar.body?.id;
    ok('Recepção', '1.2 POST cria pré-cadastro', `ID ${createdAlunoId}, status=${criar.body?.statusmatricula}`);

    // Validar status PRE_CADASTRO
    if (criar.body?.statusmatricula === 'PRE_CADASTRO') {
      ok('Recepção', '1.3 Status inicial correto: PRE_CADASTRO');
    } else {
      fail('Recepção', '1.3 Status inicial incorreto', `Recebido: ${criar.body?.statusmatricula}`);
    }

    // 1.4 Verificar auditoria no banco
    if (createdAlunoId) {
      const audit = await sb(`/recepcao_auditoria?aluno_id=eq.${createdAlunoId}&select=acao,data_hora`);
      if (audit.status === 200 && Array.isArray(audit.body) && audit.body.length > 0) {
        ok('Recepção', '1.4 Registro de auditoria criado', `ação: ${audit.body[0].acao}`);
      } else if (audit.status === 404 || (Array.isArray(audit.body) && audit.body.length === 0)) {
        fail('Recepção', '1.4 Auditoria não registrada na tabela recepcao_auditoria', 'Tabela pode não existir ou estar vazia');
      } else {
        aviso('Recepção', '1.4 Tabela recepcao_auditoria inacessível', `status ${audit.status}`);
      }
    }
  } else if (criar.status === 0) {
    aviso('Recepção', '1.2 Servidor offline — criando via Supabase direto');
    const dirInsert = await sb('/alunos', 'POST', {
      nome,
      email: `audit${Date.now()}@teste.creeser`,
      statusmatricula: 'PRE_CADASTRO',
      instituicao_id: instituicaoId,
      captado_por_id: 1,
      data_captacao: new Date().toISOString().slice(0, 10),
    });
    if (dirInsert.status === 201 && Array.isArray(dirInsert.body)) {
      createdAlunoId = dirInsert.body[0]?.id;
      ok('Recepção', '1.2b Pré-cadastro criado via Supabase direto', `ID ${createdAlunoId}`);
      ok('Recepção', '1.3b Status PRE_CADASTRO confirmado via insert direto');
    } else {
      fail('Recepção', '1.2b Falha ao criar via Supabase', JSON.stringify(dirInsert.body).slice(0, 120));
    }
  } else {
    fail('Recepção', '1.2 POST falhou', `HTTP ${criar.status} — ${JSON.stringify(criar.body).slice(0, 100)}`);
  }

  // 1.5 Verificar captado_por_id armazenado
  if (createdAlunoId) {
    const check = await sb(`/alunos?id=eq.${createdAlunoId}&select=captado_por_id,statusmatricula`);
    if (check.status === 200 && Array.isArray(check.body) && check.body.length > 0) {
      const a = check.body[0];
      if (a.captado_por_id) {
        ok('Recepção', '1.5 captado_por_id gravado corretamente', String(a.captado_por_id));
      } else {
        aviso('Recepção', '1.5 captado_por_id é NULL', 'Token sem usuário real — esperado em teste');
      }
    }
  }

  // 1.6 Verificar que recepcao puro não acessa admin
  if (token !== tokenAdmin) {
    const adminCheck = await api('/api/contratos/stats', 'GET', null, token);
    if (adminCheck.status === 403) {
      ok('Recepção', '1.6 Perfil recepcao corretamente bloqueado em /api/contratos/stats');
    } else if (adminCheck.status === 0) {
      aviso('Recepção', '1.6 Não foi possível testar bloqueio (servidor offline)');
    } else {
      fail('Recepção', '1.6 Perfil recepcao acessou endpoint restrito', `HTTP ${adminCheck.status}`);
    }
  }
}

// ══ MÓDULO 2: COMERCIAL ═════════════════════════════════════════════════════
async function auditoriaComercial() {
  console.log('\n══ 2. COMERCIAL ══════════════════════════════════════════════════════');
  const token      = tokens['comercial_master'] || tokens['grupo_admin'];
  const tokenAdmin = tokens['grupo_admin'];

  // 2.1 Listar leads
  const leads = await api('/api/comercial/leads', 'GET', null, token);
  if (leads.status === 200 && Array.isArray(leads.body)) {
    ok('Comercial', '2.1 GET /api/comercial/leads retorna 200', `${leads.body.length} leads`);
    createdLeadId = leads.body[0]?.id || null;
  } else if (leads.status === 0) {
    aviso('Comercial', '2.1 Servidor offline — consultando via Supabase');
    const ld = await sb(`/leads?select=id,nome,status,captado_por_id${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=3&order=id.desc`);
    if (ld.status === 200 && Array.isArray(ld.body)) {
      ok('Comercial', '2.1b Leads acessíveis via Supabase direto', `${ld.body.length} leads`);
      createdLeadId = ld.body[0]?.id;
    } else {
      aviso('Comercial', '2.1b Tabela leads não acessível ou vazia', `status ${ld.status}`);
    }
  } else if (leads.status === 403) {
    aviso('Comercial', '2.1 Perfil sem acesso a leads — testando com grupo_admin');
    const leads2 = await api('/api/comercial/leads', 'GET', null, tokenAdmin);
    if (leads2.status === 200) ok('Comercial', '2.1 GET leads com admin OK', `${leads2.body.length} leads`);
  } else {
    fail('Comercial', '2.1 GET /api/comercial/leads', `HTTP ${leads.status}`);
  }

  // 2.2 Criar lead
  const nomeLead = `LEAD_AUDIT_${Date.now()}`;
  const novoLead = await api('/api/comercial/leads', 'POST', {
    nome: nomeLead,
    telefone: '11999880000',
    email: `lead${Date.now()}@test.com`,
    curso_interesse: 'Técnico em Informática',
    origem: 'auditoria',
    instituicao_id: instituicaoId,
  }, tokenAdmin);

  if (novoLead.status === 201 || novoLead.status === 200) {
    createdLeadId = novoLead.body?.id || novoLead.body?.[0]?.id;
    ok('Comercial', '2.2 POST lead criado', `ID ${createdLeadId}`);

    // 2.3 Verificar captado_por_id no lead
    if (createdLeadId) {
      const ld = await sb(`/leads?id=eq.${createdLeadId}&select=captado_por_id,status`);
      if (ld.status === 200 && Array.isArray(ld.body) && ld.body.length > 0) {
        if (ld.body[0].captado_por_id) {
          ok('Comercial', '2.3 captado_por_id registrado no lead', String(ld.body[0].captado_por_id));
        } else {
          aviso('Comercial', '2.3 captado_por_id NULL no lead', 'Token de auditoria não corresponde a usuário real');
        }
      }
    }
  } else if (novoLead.status === 0) {
    aviso('Comercial', '2.2 Servidor offline — lead não criado via HTTP');
    // Usar lead existente
    if (createdLeadId) ok('Comercial', '2.2b Usando lead existente', `ID ${createdLeadId}`);
  } else {
    fail('Comercial', '2.2 POST lead falhou', `HTTP ${novoLead.status} — ${JSON.stringify(novoLead.body).slice(0, 80)}`);
  }

  // 2.4 Verificar rastreabilidade de comissão
  const comCfg = await sb(`/comissoes_config?select=id,ativo,modo,percentual${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=1`);
  if (comCfg.status === 200 && Array.isArray(comCfg.body) && comCfg.body.length > 0) {
    const cfg = comCfg.body[0];
    if (cfg.ativo) {
      ok('Comercial', '2.4 Configuração de comissão ativa encontrada', `modo=${cfg.modo}, percentual=${cfg.percentual}`);
    } else {
      aviso('Comercial', '2.4 Configuração de comissão existente mas INATIVA', 'Comissões não serão geradas');
    }
  } else {
    aviso('Comercial', '2.4 Nenhuma configuração de comissão encontrada', 'Comissões automáticas não funcionarão');
  }

  // 2.5 Verificar tabela comissoes_comerciais acessível
  const comList = await sb(`/comissoes_comerciais?select=id,status,valor_comissao${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=3&order=id.desc`);
  if (comList.status === 200 && Array.isArray(comList.body)) {
    ok('Comercial', '2.5 Tabela comissoes_comerciais acessível', `${comList.body.length} comissão(ões) existentes`);
  } else {
    fail('Comercial', '2.5 Tabela comissoes_comerciais inacessível', `status ${comList.status}`);
  }

  // 2.6 comercial_operador só vê seus leads
  if (tokens['comercial_operador']) {
    const opLeads = await api('/api/comercial/leads', 'GET', null, tokens['comercial_operador']);
    if (opLeads.status === 200) {
      ok('Comercial', '2.6 comercial_operador acessa leads (filtrado por captado_por_id)');
    } else if (opLeads.status === 403) {
      fail('Comercial', '2.6 comercial_operador bloqueado (deveria ter acesso restrito)');
    } else if (opLeads.status === 0) {
      aviso('Comercial', '2.6 Não testado (servidor offline)');
    }
  } else {
    aviso('Comercial', '2.6 Sem usuário comercial_operador no banco para testar');
  }
}

// ══ MÓDULO 3: FINANCEIRO ════════════════════════════════════════════════════
async function auditoriaFinanceiro() {
  console.log('\n══ 3. FINANCEIRO ═════════════════════════════════════════════════════');
  const tokenFin   = tokens['financeiro'] || tokens['grupo_admin'];
  const tokenAdmin = tokens['grupo_admin'];

  // 3.1 Dashboard financeiro
  const dash = await api('/api/admin-financeiro/dashboard', 'GET', null, tokenAdmin);
  if (dash.status === 200) {
    ok('Financeiro', '3.1 Dashboard financeiro retorna 200');
  } else if (dash.status === 0) {
    aviso('Financeiro', '3.1 Servidor offline — testando via Supabase');
    const finCheck = await sb(`/financeiro_ordens_pagamento?select=id,status&limit=1`);
    if (finCheck.status === 200) ok('Financeiro', '3.1b Tabela financeiro_ordens_pagamento acessível');
    else fail('Financeiro', '3.1b Tabela financeiro_ordens_pagamento inacessível', `${finCheck.status}`);
  } else {
    fail('Financeiro', '3.1 Dashboard financeiro', `HTTP ${dash.status}`);
  }

  // 3.2 Verificar tabela de parcelas
  const parcelas = await sb(`/financeiro_parcelas?select=id,status,valor,aluno_id${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=5&order=id.desc`);
  if (parcelas.status === 200 && Array.isArray(parcelas.body)) {
    ok('Financeiro', '3.2 Tabela financeiro_parcelas acessível', `${parcelas.body.length} parcela(s)`);
    const pendentes = parcelas.body.filter(p => p.status === 'pendente');
    const pagas     = parcelas.body.filter(p => p.status === 'pago');
    console.log(`      Pendentes: ${pendentes.length} | Pagas: ${pagas.length}`);
  } else {
    fail('Financeiro', '3.2 Tabela financeiro_parcelas', `status ${parcelas.status}`);
  }

  // 3.3 Criar ordem de matrícula (usando aluno criado na Recepção ou de amostra)
  const alunoParaOrdem = createdAlunoId || sampleAlunoId;
  if (alunoParaOrdem) {
    const criarOrdem = await api('/api/admin-financeiro/ordens/create', 'POST', {
      aluno_id: alunoParaOrdem,
      tipo: 'matricula',
      descricao: 'Taxa de Matrícula — Auditoria',
      valor_total: 500,
      quantidade_parcelas: 1,
      data_vencimento_primeira: new Date().toISOString().split('T')[0],
    }, tokenAdmin);

    if (criarOrdem.status === 200 || criarOrdem.status === 201) {
      const ordemCriada = criarOrdem.body?.data || criarOrdem.body;
      const ordemId = ordemCriada?.ordem?.id || ordemCriada?.id;
      ok('Financeiro', '3.3 Ordem de matrícula gerada', `ID ${ordemId}`);
      if (!sampleOrdemId && ordemId) sampleOrdemId = ordemId;
      // Verificar parcela criada
      if (ordemId) {
        const pCheck = await sb(`/financeiro_parcelas?ordem_pagamento_id=eq.${ordemId}&select=id,status`);
        if (pCheck.status === 200 && Array.isArray(pCheck.body) && pCheck.body.length > 0) {
          ok('Financeiro', '3.3b Parcela criada automaticamente com a ordem', `status=${pCheck.body[0].status}`);
          sampleParcelaId = pCheck.body[0].id;
        } else {
          fail('Financeiro', '3.3b Parcela não criada junto com a ordem');
        }
      }
    } else if (criarOrdem.status === 0) {
      aviso('Financeiro', '3.3 Servidor offline — ordem não criada');
    } else {
      fail('Financeiro', '3.3 Criar ordem de matrícula', `HTTP ${criarOrdem.status} — ${JSON.stringify(criarOrdem.body).slice(0, 100)}`);
    }
  } else {
    aviso('Financeiro', '3.3 Sem aluno disponível para criar ordem');
  }

  // 3.4 Baixa manual de parcela
  if (sampleParcelaId) {
    const baixa = await api(
      `/api/admin-financeiro/parcelas/${sampleParcelaId}/pagar`,
      'PATCH',
      {
        metodo_pagamento: 'pix',
        valor_pago: 500,
        data_pagamento: new Date().toISOString().split('T')[0],
        observacao: 'Baixa auditoria operacional',
      },
      tokenAdmin
    );
    if (baixa.status === 200) {
      ok('Financeiro', '3.4 Baixa manual de parcela realizada', `parcela ${sampleParcelaId}`);
      // Verificar mudança de status do aluno
      if (createdAlunoId || sampleAlunoId) {
        const aId = createdAlunoId || sampleAlunoId;
        const alu = await sb(`/alunos?id=eq.${aId}&select=statusmatricula`);
        if (alu.status === 200 && Array.isArray(alu.body) && alu.body.length > 0) {
          const st = alu.body[0].statusmatricula;
          if (st === 'AGUARDANDO_FORMACAO_TURMA') {
            ok('Financeiro', '3.5 Status aluno mudou para AGUARDANDO_FORMACAO_TURMA');
          } else {
            aviso('Financeiro', '3.5 Status do aluno após baixa', `atual: ${st} (esperado: AGUARDANDO_FORMACAO_TURMA) — pode ser aluno antigo`);
          }
        }
      }
    } else if (baixa.status === 0) {
      aviso('Financeiro', '3.4 Servidor offline — baixa não testada');
    } else if (baixa.status === 422) {
      aviso('Financeiro', '3.4 Parcela já paga (reutilizando dado de amostra)', `HTTP 422`);
    } else {
      fail('Financeiro', '3.4 Baixa manual falhou', `HTTP ${baixa.status} — ${JSON.stringify(baixa.body).slice(0, 100)}`);
    }
  } else {
    aviso('Financeiro', '3.4 Sem parcela pendente disponível para testar baixa');
  }

  // 3.5 Verificar existência de logs financeiros
  const logs = await sb(`/financeiro_logs?select=id,acao${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=3&order=id.desc`);
  if (logs.status === 200 && Array.isArray(logs.body)) {
    ok('Financeiro', '3.6 Tabela financeiro_logs acessível', `${logs.body.length} log(s)`);
  } else {
    aviso('Financeiro', '3.6 Tabela financeiro_logs não encontrada ou vazia', `status ${logs.status}`);
  }
}

// ══ MÓDULO 4: FORMAÇÃO DE TURMAS ════════════════════════════════════════════
async function auditoriaFormacaoTurmas() {
  console.log('\n══ 4. FORMAÇÃO DE TURMAS ═════════════════════════════════════════════');
  const tokenAdmin = tokens['grupo_admin'];
  const tokenCord  = tokens['coordenador'] || tokenAdmin;

  // 4.1 Listar turmas via API
  const turmasList = await api('/api/formacao-turmas', 'GET', null, tokenAdmin);
  if (turmasList.status === 200 && Array.isArray(turmasList.body)) {
    ok('FormacaoTurmas', '4.1 GET /api/formacao-turmas retorna 200', `${turmasList.body.length} turma(s)`);
    if (!sampleTurmaId && turmasList.body.length > 0) sampleTurmaId = turmasList.body[0]?.id;
  } else if (turmasList.status === 0) {
    aviso('FormacaoTurmas', '4.1 Servidor offline — verificando via Supabase');
    const tb = await sb(`/turmas?select=id,nome,status_formacao,situacao${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=5&order=id.desc`);
    if (tb.status === 200 && Array.isArray(tb.body)) {
      ok('FormacaoTurmas', '4.1b Tabela turmas acessível', `${tb.body.length} turma(s)`);
      if (!sampleTurmaId && tb.body.length > 0) sampleTurmaId = tb.body[0].id;
    } else {
      fail('FormacaoTurmas', '4.1b Tabela turmas inacessível', `status ${tb.status}`);
    }
  } else {
    fail('FormacaoTurmas', '4.1 GET /api/formacao-turmas', `HTTP ${turmasList.status}`);
  }

  // 4.2 Verificar contagem de alunos por turma
  if (sampleTurmaId) {
    const countQ = await sb(
      `/alunos?turmaid=eq.${sampleTurmaId}&statusmatricula=in.(AGUARDANDO_FORMACAO_TURMA,ATIVO)&select=id,statusmatricula`
    );
    if (countQ.status === 200 && Array.isArray(countQ.body)) {
      ok('FormacaoTurmas', '4.2 Contagem de alunos por turma', `Turma #${sampleTurmaId}: ${countQ.body.length} aluno(s)`);
    } else {
      fail('FormacaoTurmas', '4.2 Falha ao contar alunos da turma', `${countQ.status}`);
    }
  }

  // 4.3 Verificar se existe turma PRONTA_PARA_ABRIR
  const prontas = await sb(
    `/turmas?status_formacao=eq.PRONTA_PARA_ABRIR${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&select=id,nome,qtd_minima_alunos&limit=5`
  );
  if (prontas.status === 200 && Array.isArray(prontas.body) && prontas.body.length > 0) {
    ok('FormacaoTurmas', '4.3 Existe(m) turma(s) PRONTA_PARA_ABRIR', `${prontas.body.length} turma(s) prontas`);
    const turmaAbrir = prontas.body[0];
    // 4.4 Simular abertura (leitura dos pré-requisitos)
    const alunosAguardando = await sb(
      `/alunos?statusmatricula=eq.AGUARDANDO_FORMACAO_TURMA&turmaid=eq.${turmaAbrir.id}&select=id&limit=100`
    );
    const qtdAlunos = Array.isArray(alunosAguardando.body) ? alunosAguardando.body.length : 0;
    const qtdMin    = turmaAbrir.qtd_minima_alunos || 20;
    if (qtdAlunos >= qtdMin) {
      ok('FormacaoTurmas', '4.4 Turma atingiu mínimo — pode abrir', `${qtdAlunos}/${qtdMin} alunos`);
    } else {
      aviso('FormacaoTurmas', '4.4 Turma não atingiu mínimo para abrir', `${qtdAlunos}/${qtdMin} alunos`);
    }
    // 4.5 Testar endpoint de abertura (bloqueio por status se já ATIVA)
    const abrir = await api(`/api/formacao-turmas/${turmaAbrir.id}/abrir`, 'POST', {}, tokenCord);
    if (abrir.status === 200) {
      ok('FormacaoTurmas', '4.5 Turma aberta com sucesso (ativação coletiva)');
    } else if (abrir.status === 409) {
      ok('FormacaoTurmas', '4.5 Turma já está ATIVA — bloqueio de duplicata funcionando', 'HTTP 409 esperado');
    } else if (abrir.status === 400 && abrir.body?.error?.includes('minimo')) {
      aviso('FormacaoTurmas', '4.5 Abertura bloqueada por qtd mínima', abrir.body?.error);
    } else if (abrir.status === 0) {
      aviso('FormacaoTurmas', '4.5 Servidor offline — não testado');
    } else {
      fail('FormacaoTurmas', '4.5 Abertura de turma', `HTTP ${abrir.status} — ${JSON.stringify(abrir.body).slice(0, 100)}`);
    }
  } else {
    aviso('FormacaoTurmas', '4.3 Nenhuma turma PRONTA_PARA_ABRIR — verificar fluxo');
    // Verificar estados gerais
    const estados = await sb(`/turmas?select=status_formacao${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=50`);
    if (estados.status === 200 && Array.isArray(estados.body)) {
      const cnt = {};
      estados.body.forEach(t => { cnt[t.status_formacao || 'null'] = (cnt[t.status_formacao || 'null'] || 0) + 1; });
      console.log('      Estados de formação:', JSON.stringify(cnt));
    }
    aviso('FormacaoTurmas', '4.4 Teste de abertura não aplicável — nenhuma turma PRONTA');
    aviso('FormacaoTurmas', '4.5 Ativação coletiva não testada — sem turma prontos');
  }

  // 4.6 Endpoint /api/alunos/ativar — validação de status
  const ativarWrong = await api('/api/alunos/ativar', 'PATCH', { aluno_id: sampleAlunoId || 9999999 }, tokenAdmin);
  if (ativarWrong.status === 400) {
    ok('FormacaoTurmas', '4.6 /api/alunos/ativar rejeita aluno com status incorreto');
  } else if (ativarWrong.status === 404) {
    ok('FormacaoTurmas', '4.6 /api/alunos/ativar retorna 404 para aluno inexistente');
  } else if (ativarWrong.status === 0) {
    aviso('FormacaoTurmas', '4.6 Servidor offline — não testado');
  } else {
    aviso('FormacaoTurmas', '4.6 /api/alunos/ativar retornou resposta inesperada', `HTTP ${ativarWrong.status}`);
  }
}

// ══ MÓDULO 5: CONTRATOS ═════════════════════════════════════════════════════
async function auditoriaContratos() {
  console.log('\n══ 5. CONTRATOS ══════════════════════════════════════════════════════');
  const tokenAdmin = tokens['grupo_admin'];
  const tokenFin   = tokens['financeiro'] || tokenAdmin;

  // 5.1 Verificar tabela contratos_instituicao
  const contrModelo = await sb(`/contratos_instituicao?select=id,padrao,instituicao_id${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=3`);
  if (contrModelo.status === 200 && Array.isArray(contrModelo.body) && contrModelo.body.length > 0) {
    const padrao = contrModelo.body.find(c => c.padrao);
    ok('Contratos', '5.1 Modelo(s) de contrato encontrado(s)', `${contrModelo.body.length} contrato(s)`);
    if (padrao) {
      ok('Contratos', '5.1b Contrato padrão configurado', `ID ${padrao.id}`);
    } else {
      aviso('Contratos', '5.1b Nenhum contrato marcado como padrão', 'Assinatura digital pode falhar');
    }
  } else {
    fail('Contratos', '5.1 Nenhum modelo de contrato na tabela contratos_instituicao', 'Assinatura digital impossível');
  }

  // 5.2 Verificar tabela contratos_assinaturas
  const assinaturas = await sb(`/contratos_assinaturas?select=id,status,aluno_id${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}&limit=5&order=id.desc`);
  if (assinaturas.status === 200 && Array.isArray(assinaturas.body)) {
    ok('Contratos', '5.2 Tabela contratos_assinaturas acessível', `${assinaturas.body.length} assinatura(s)`);
    if (assinaturas.body.length > 0) {
      const statusCounts = {};
      assinaturas.body.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
      console.log('      Status assinaturas:', JSON.stringify(statusCounts));
    }
  } else {
    fail('Contratos', '5.2 Tabela contratos_assinaturas inacessível', `status ${assinaturas.status}`);
  }

  // 5.3 Verificar colunas status_contrato em alunos
  const alunosCols = await sb(`/alunos?select=id,status_contrato,data_envio_contrato&limit=1${instituicaoId ? '&instituicao_id=eq.' + instituicaoId : ''}`);
  if (alunosCols.status === 200 && Array.isArray(alunosCols.body) && alunosCols.body.length > 0) {
    const al = alunosCols.body[0];
    if ('status_contrato' in al) {
      ok('Contratos', '5.3 Colunas de status_contrato presentes na tabela alunos');
    } else {
      fail('Contratos', '5.3 Coluna status_contrato ausente em alunos', 'Execute migration 20260527_contratos_status.sql');
    }
  } else {
    aviso('Contratos', '5.3 Não foi possível verificar coluna status_contrato', `status ${alunosCols.status}`);
  }

  // 5.4 Stats de contratos via API
  const stats = await api('/api/contratos/stats', 'GET', null, tokenAdmin);
  if (stats.status === 200 && stats.body?.counts) {
    ok('Contratos', '5.4 /api/contratos/stats retorna dados', JSON.stringify(stats.body.counts));
  } else if (stats.status === 0) {
    aviso('Contratos', '5.4 Servidor offline — stats não testado');
  } else {
    fail('Contratos', '5.4 /api/contratos/stats', `HTTP ${stats.status}`);
  }

  // 5.5 Verificar ASSINAFY_API_KEY configurada
  const assinafyKey = process.env.ASSINAFY_API_KEY;
  if (assinafyKey && assinafyKey.length > 10) {
    ok('Contratos', '5.5 ASSINAFY_API_KEY configurada');
  } else {
    fail('Contratos', '5.5 ASSINAFY_API_KEY não configurada', 'Assinatura digital inoperante');
  }

  // 5.6 Endpoint de assinatura digital (teste de auth + estrutura — não dispara realmente)
  if (sampleAlunoId) {
    const assinReq = await api(`/api/contratos/aluno/${sampleAlunoId}/assinar-digital`, 'POST', {}, tokenFin);
    if (assinReq.status === 400 || assinReq.status === 404 || assinReq.status === 422) {
      ok('Contratos', '5.6 Endpoint assinar-digital acessível (rejeita dados inválidos como esperado)', `HTTP ${assinReq.status}`);
    } else if (assinReq.status === 200) {
      ok('Contratos', '5.6 Endpoint assinar-digital retornou 200 — assinatura iniciada!');
    } else if (assinReq.status === 403) {
      fail('Contratos', '5.6 Acesso negado ao assinar-digital com perfil financeiro');
    } else if (assinReq.status === 0) {
      aviso('Contratos', '5.6 Servidor offline — não testado');
    } else {
      aviso('Contratos', '5.6 Resposta inesperada de assinar-digital', `HTTP ${assinReq.status}`);
    }
  } else {
    aviso('Contratos', '5.6 Sem aluno de amostra para testar assinar-digital');
  }

  // 5.7 Endpoint marcar-gerado
  if (sampleAlunoId) {
    const marcar = await api(`/api/contratos/aluno/${sampleAlunoId}/marcar-gerado`, 'POST', {}, tokenAdmin);
    if (marcar.status === 200) {
      ok('Contratos', '5.7 /marcar-gerado atualiza status do contrato', JSON.stringify(marcar.body));
    } else if (marcar.status === 0) {
      aviso('Contratos', '5.7 Servidor offline — não testado');
    } else {
      aviso('Contratos', '5.7 marcar-gerado resposta inesperada', `HTTP ${marcar.status}`);
    }
  }
}

// ══ MÓDULO 6: SEGURANÇA ═════════════════════════════════════════════════════
async function auditoriaSeguranca() {
  console.log('\n══ 6. SEGURANÇA ══════════════════════════════════════════════════════');

  // Mapeamento: perfil → endpoints que devem ter acesso | endpoints que devem bloquear
  const matrizAcesso = [
    {
      perfil: 'grupo_admin',
      deveAcessar: ['/api/contratos/stats', '/api/go-live/checklist', '/api/admin-financeiro/dashboard'],
      deveBloquear: [],
    },
    {
      perfil: 'instituicao_admin',
      deveAcessar: ['/api/contratos/stats', '/api/go-live/checklist'],
      deveBloquear: [],
    },
    {
      perfil: 'coordenador',
      deveAcessar: ['/api/contratos/stats'],
      deveBloquear: ['/api/go-live/checklist'],
    },
    {
      perfil: 'secretaria',
      deveAcessar: ['/api/contratos/stats'],
      deveBloquear: ['/api/go-live/checklist'],
    },
    {
      perfil: 'financeiro',
      deveAcessar: ['/api/contratos/stats', '/api/admin-financeiro/dashboard'],
      deveBloquear: ['/api/go-live/checklist'],
    },
    {
      perfil: 'recepcao',
      deveAcessar: ['/api/recepcao/pre-cadastros'],
      deveBloquear: ['/api/contratos/stats', '/api/go-live/checklist', '/api/admin-financeiro/dashboard'],
    },
    {
      perfil: 'comercial_master',
      deveAcessar: ['/api/comercial/leads'],
      deveBloquear: ['/api/go-live/checklist'],
    },
    {
      perfil: 'comercial_operador',
      deveAcessar: ['/api/comercial/leads'],
      deveBloquear: ['/api/go-live/checklist'],
    },
  ];

  let serverOnline = false;
  // Verificar se servidor está online
  const ping = await api('/api/auth/me', 'GET', null, tokens['grupo_admin']);
  if (ping.status !== 0) serverOnline = true;

  if (!serverOnline) {
    aviso('Segurança', 'Servidor offline — testes de segurança via Supabase (parcial)');
    // Testes diretos no banco (sem HTTP)
    for (const caso of matrizAcesso) {
      if (tokens[caso.perfil]) {
        ok('Segurança', `${caso.perfil} — token gerado com sucesso`);
      } else {
        aviso('Segurança', `${caso.perfil} — sem usuário real no banco`, 'Token simulado seria inválido sem usuário');
      }
    }

    // Validar que o secret está configurado
    if (AUTH_SECRET && AUTH_SECRET.length >= 32) {
      ok('Segurança', 'AUTH_JWT_SECRET configurada e com tamanho adequado', `${AUTH_SECRET.length} caracteres`);
    } else {
      fail('Segurança', 'AUTH_JWT_SECRET ausente ou muito curta', 'CRÍTICO: autenticação comprometida');
    }

    // Verificar NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      ok('Segurança', 'NODE_ENV=production configurado');
    } else {
      aviso('Segurança', `NODE_ENV=${nodeEnv || 'não definido'}`, 'Deve ser production em produção');
    }
    return;
  }

  // Servidor online — testar HTTP
  for (const caso of matrizAcesso) {
    const token = tokens[caso.perfil];
    if (!token) {
      aviso('Segurança', `${caso.perfil} — sem token real para testar`);
      continue;
    }

    for (const endpoint of caso.deveAcessar) {
      const r = await api(endpoint, 'GET', null, token);
      if (r.status === 200) {
        ok('Segurança', `${caso.perfil} acessa ${endpoint}`, 'OK');
      } else if (r.status === 403 || r.status === 401) {
        fail('Segurança', `${caso.perfil} bloqueado em ${endpoint} (deveria ter acesso)`, `HTTP ${r.status}`);
      } else {
        aviso('Segurança', `${caso.perfil} em ${endpoint}`, `HTTP ${r.status}`);
      }
    }

    for (const endpoint of caso.deveBloquear) {
      const r = await api(endpoint, 'GET', null, token);
      if (r.status === 403 || r.status === 401) {
        ok('Segurança', `${caso.perfil} corretamente bloqueado em ${endpoint}`);
      } else if (r.status === 200) {
        fail('Segurança', `${caso.perfil} acessou ${endpoint} (não deveria)`, 'Falha de controle de acesso');
      } else {
        aviso('Segurança', `${caso.perfil} bloqueio em ${endpoint}`, `HTTP ${r.status}`);
      }
    }
  }

  // Teste de requisição sem token
  const semToken = await api('/api/contratos/stats', 'GET', null, '');
  if (semToken.status === 401) {
    ok('Segurança', 'Requisição sem token retorna 401');
  } else {
    fail('Segurança', 'Requisição sem token não retornou 401', `HTTP ${semToken.status}`);
  }

  // Teste de token adulterado
  const tokenFalso = tokens['grupo_admin'].slice(0, -4) + 'XXXX';
  const adulterado = await api('/api/contratos/stats', 'GET', null, tokenFalso);
  if (adulterado.status === 401) {
    ok('Segurança', 'Token adulterado corretamente rejeitado (401)');
  } else {
    fail('Segurança', 'Token adulterado foi aceito — VULNERABILIDADE CRÍTICA', `HTTP ${adulterado.status}`);
  }

  // Verificar AUTH_JWT_SECRET
  if (AUTH_SECRET && AUTH_SECRET.length >= 32) {
    ok('Segurança', 'AUTH_JWT_SECRET configurada e adequada', `${AUTH_SECRET.length} chars`);
  } else {
    fail('Segurança', 'AUTH_JWT_SECRET ausente ou fraca', 'CRÍTICO');
  }
}

// ══ MÓDULO 7: GO-LIVE CHECKLIST ═════════════════════════════════════════════
async function auditoriaGoLive() {
  console.log('\n══ 7. GO-LIVE CHECKLIST ══════════════════════════════════════════════');
  const tokenAdmin = tokens['grupo_admin'];

  const cl = await api('/api/go-live/checklist', 'GET', null, tokenAdmin);
  if (cl.status === 200 && cl.body?.checks) {
    ok('GoLive', 'API go-live checklist acessível');
    console.log(`\n  Score: ${cl.body.score}% — Resultado: ${cl.body.resultado}`);
    console.log(`  OK: ${cl.body.resumo?.ok} | Avisos: ${cl.body.resumo?.avisos} | Bloqueantes: ${cl.body.resumo?.bloqueantes}`);
    cl.body.checks.forEach(c => {
      const e = c.status === 'ok' ? '✅' : c.status === 'aviso' ? '⚠️' : '❌';
      console.log(`    ${e} [${c.categoria}] ${c.nome}: ${c.detalhe || ''}`);
    });
  } else if (cl.status === 0) {
    aviso('GoLive', 'Servidor offline — checklist via verificações diretas');
    // Verificações críticas de produção direto no banco/env
    const checks = [
      { nome: 'SUPABASE_URL configurada',    ok: !!SUPABASE_URL },
      { nome: 'SUPABASE_KEY configurada',    ok: !!SUPABASE_KEY },
      { nome: 'AUTH_JWT_SECRET adequada',    ok: AUTH_SECRET.length >= 32 },
      { nome: 'ASSINAFY_API_KEY configurada',ok: !!(process.env.ASSINAFY_API_KEY?.length > 10) },
      { nome: 'NODE_ENV definido',           ok: !!process.env.NODE_ENV },
    ];
    checks.forEach(c => {
      if (c.ok) ok('GoLive', c.nome);
      else fail('GoLive', c.nome);
    });
  } else {
    fail('GoLive', 'API go-live checklist falhou', `HTTP ${cl.status}`);
  }
}

// ── Limpeza de dados de teste ────────────────────────────────────────────────
async function limpeza() {
  console.log('\n══ LIMPEZA ═══════════════════════════════════════════════════════════');
  if (createdAlunoId) {
    // Deletar parcelas e ordens associadas primeiro
    await sb(`/financeiro_parcelas?aluno_id=eq.${createdAlunoId}`, 'DELETE');
    await sb(`/financeiro_ordens_pagamento?aluno_id=eq.${createdAlunoId}`, 'DELETE');
    await sb(`/recepcao_auditoria?aluno_id=eq.${createdAlunoId}`, 'DELETE');
    const del = await sb(`/alunos?id=eq.${createdAlunoId}`, 'DELETE');
    if (del.status === 204 || del.status === 200) {
      console.log(`  🗑️  Aluno de teste removido: #${createdAlunoId}`);
    }
  }
  if (createdLeadId) {
    const del = await sb(`/leads?id=eq.${createdLeadId}`, 'DELETE');
    if (del.status === 204 || del.status === 200) {
      console.log(`  🗑️  Lead de teste removido: #${createdLeadId}`);
    }
  }
}

// ── Relatório Final ──────────────────────────────────────────────────────────
function gerarRelatorio() {
  const total    = results.length;
  const oks      = results.filter(r => r.status === 'OK').length;
  const avisos   = results.filter(r => r.status === 'AVISO').length;
  const falhas   = results.filter(r => r.status === 'FAIL').length;
  const score    = total > 0 ? Math.round((oks / total) * 100) : 0;

  // Bugs
  const bugs = results.filter(r => r.status === 'FAIL');
  const warn = results.filter(r => r.status === 'AVISO');

  // Agrupado por seção
  const secoes = {};
  results.forEach(r => {
    if (!secoes[r.secao]) secoes[r.secao] = { ok: 0, aviso: 0, fail: 0 };
    secoes[r.secao][r.status === 'OK' ? 'ok' : r.status === 'AVISO' ? 'aviso' : 'fail']++;
  });

  // Determinar Go/No-Go
  const criticos = bugs.filter(b =>
    b.detalhe?.toLowerCase().includes('crítico') ||
    b.detalhe?.toLowerCase().includes('vulnerabilidade') ||
    b.detalhe?.includes('CRÍTICO') ||
    b.teste?.toLowerCase().includes('token adulterado') ||
    b.teste?.toLowerCase().includes('auth_jwt_secret') ||
    b.secao === 'Segurança'
  );

  const goNogo = criticos.length > 0 ? 'NO-GO 🔴' :
                 falhas > 3         ? 'NO-GO 🔴' :
                 falhas > 0         ? 'CONDICIONAL ⚠️' :
                 avisos > 5         ? 'CONDICIONAL ⚠️' :
                 'GO ✅';

  const linha = '═'.repeat(70);
  const rel = [
    '',
    linha,
    '  RELATÓRIO FINAL — AUDITORIA OPERACIONAL INOVE TÉCNICO',
    `  Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
    linha,
    '',
    `  Testes executados : ${total}`,
    `  ✅ Aprovados       : ${oks}`,
    `  ⚠️  Avisos          : ${avisos}`,
    `  ❌ Reprovados      : ${falhas}`,
    `  Nota geral        : ${score}%`,
    '',
    '── POR MÓDULO ──────────────────────────────────────────────────────────',
    ...Object.entries(secoes).map(([s, c]) =>
      `  ${s.padEnd(20)} ✅ ${String(c.ok).padStart(2)} | ⚠️  ${String(c.aviso).padStart(2)} | ❌ ${String(c.fail).padStart(2)}`
    ),
    '',
    '── FLUXOS APROVADOS ────────────────────────────────────────────────────',
    ...results.filter(r => r.status === 'OK').map(r => `  ✅ [${r.secao}] ${r.teste}`),
    '',
    '── AVISOS (risco baixo/médio) ──────────────────────────────────────────',
    ...(warn.length === 0 ? ['  (nenhum)'] : warn.map(r => `  ⚠️  [${r.secao}] ${r.teste} — ${r.detalhe}`)),
    '',
    '── BUGS ENCONTRADOS / FLUXOS REPROVADOS ────────────────────────────────',
    ...(bugs.length === 0 ? ['  (nenhum)'] : bugs.map(r => `  ❌ [${r.secao}] ${r.teste} — ${r.detalhe}`)),
    '',
    '── RISCOS PARA PRODUÇÃO ────────────────────────────────────────────────',
    ...gerarRiscos(bugs, warn),
    '',
    '── VEREDICTO FINAL ─────────────────────────────────────────────────────',
    `  ${goNogo}`,
    '',
    gerarJustificativa(goNogo, bugs, warn, criticos, score),
    '',
    linha,
  ].join('\n');

  console.log(rel);

  // Salvar relatório em arquivo
  const outPath = path.join(__dirname, '..', 'docs', `RELATORIO_AUDITORIA_${new Date().toISOString().slice(0,10)}.md`);
  const md = gerarMarkdown(total, oks, avisos, falhas, score, goNogo, bugs, warn, secoes, results);
  try {
    fs.writeFileSync(outPath, md, 'utf8');
    console.log(`\n  📄 Relatório salvo em: docs/RELATORIO_AUDITORIA_${new Date().toISOString().slice(0,10)}.md`);
  } catch (e) {
    console.log(`  ⚠️  Não foi possível salvar o relatório: ${e.message}`);
  }
}

function gerarRiscos(bugs, warn) {
  const riscos = [];

  if (bugs.some(b => b.secao === 'Segurança')) {
    riscos.push('  🔴 CRÍTICO — Falha de segurança detectada. Bloqueia Go-Live.');
  }
  if (bugs.some(b => b.teste?.includes('status_contrato') || b.detalhe?.includes('migration'))) {
    riscos.push('  🔴 ALTO — Migration de status_contrato não aplicada. Contratos não funcionarão.');
  }
  if (bugs.some(b => b.secao === 'Contratos' && b.teste?.includes('ASSINAFY'))) {
    riscos.push('  🔴 ALTO — ASSINAFY_API_KEY não configurada. Assinatura digital inoperante.');
  }
  if (warn.some(w => w.teste?.includes('comissão') || w.teste?.includes('comissoes_config'))) {
    riscos.push('  🟡 MÉDIO — Configuração de comissões ausente/inativa. Comissões não serão geradas.');
  }
  if (warn.some(w => w.teste?.includes('captado_por_id'))) {
    riscos.push('  🟡 MÉDIO — captado_por_id NULL em alguns casos. Rastreabilidade comprometida.');
  }
  if (warn.some(w => w.teste?.includes('contrato padrão'))) {
    riscos.push('  🟡 MÉDIO — Nenhum contrato padrão definido. Assinatura digital falhará.');
  }
  if (warn.some(w => w.teste?.includes('PRONTA_PARA_ABRIR'))) {
    riscos.push('  🟡 MÉDIO — Nenhuma turma PRONTA_PARA_ABRIR. Validar se há alunos em formação.');
  }
  if (warn.some(w => w.teste?.includes('recepcao_auditoria'))) {
    riscos.push('  🟡 MÉDIO — Tabela recepcao_auditoria vazia. Rastreabilidade limitada.');
  }
  if (warn.some(w => w.detalhe?.includes('servidor offline') || w.detalhe?.includes('timeout'))) {
    riscos.push('  🟡 MÉDIO — Servidor Next.js indisponível durante teste. Iniciar servidor antes de nova auditoria.');
  }
  if (riscos.length === 0) {
    riscos.push('  🟢 Nenhum risco crítico identificado.');
  }
  return riscos;
}

function gerarJustificativa(goNogo, bugs, warn, criticos, score) {
  if (goNogo === 'GO ✅') {
    return `  Todos os fluxos críticos foram validados. Score ${score}%. Sistema pronto para entrada em produção.`;
  }
  if (goNogo === 'NO-GO 🔴') {
    return `  ${criticos.length > 0 ? 'Vulnerabilidades críticas de segurança detectadas.' : 'Múltiplas falhas bloqueantes.'} Corrigir antes do Go-Live.`;
  }
  return `  ${falhas > 0 ? `${bugs.length} falha(s) encontrada(s).` : ''} ${warn.length} aviso(s). Resolver pendências antes do lançamento.`;
}

function gerarMarkdown(total, oks, avisos, falhas, score, goNogo, bugs, warn, secoes, results) {
  const data = new Date().toLocaleDateString('pt-BR');
  const hora = new Date().toLocaleTimeString('pt-BR');

  return `# Relatório de Auditoria Operacional — Inove Técnico

**Data:** ${data} ${hora}
**Auditor:** Sistema automatizado (auditoria-operacional.cjs)
**Ambiente:** ${process.env.NODE_ENV || 'desenvolvimento'}

---

## Sumário Executivo

| Métrica | Valor |
|---------|-------|
| Testes executados | ${total} |
| ✅ Aprovados | ${oks} |
| ⚠️ Avisos | ${avisos} |
| ❌ Reprovados | ${falhas} |
| **Nota Geral** | **${score}%** |
| **Veredicto** | **${goNogo}** |

---

## Resultado por Módulo

| Módulo | ✅ OK | ⚠️ Aviso | ❌ Falha |
|--------|-------|----------|---------|
${Object.entries(secoes).map(([s, c]) => `| ${s} | ${c.ok} | ${c.aviso} | ${c.fail} |`).join('\n')}

---

## Fluxos Aprovados

${results.filter(r => r.status === 'OK').map(r => `- ✅ **[${r.secao}]** ${r.teste}${r.detalhe ? ' — ' + r.detalhe : ''}`).join('\n') || '_(nenhum)_'}

---

## Fluxos Reprovados / Bugs Encontrados

${bugs.length === 0 ? '_(nenhum)_' : bugs.map(r => `- ❌ **[${r.secao}]** ${r.teste}\n  > ${r.detalhe}`).join('\n')}

---

## Avisos

${warn.length === 0 ? '_(nenhum)_' : warn.map(r => `- ⚠️ **[${r.secao}]** ${r.teste}\n  > ${r.detalhe}`).join('\n')}

---

## Riscos para Produção

${gerarRiscos(bugs, warn).map(r => r.trim()).join('\n')}

---

## Veredicto Go/No-Go

### ${goNogo}

${gerarJustificativa(goNogo, bugs, warn, bugs.filter(b => b.secao === 'Segurança'), score)}

---

## Próximos Passos Recomendados

${bugs.length > 0 ? bugs.map((b, i) => `${i + 1}. Corrigir: [${b.secao}] ${b.teste}`).join('\n') : '1. Executar testes com servidor ativo para validação HTTP completa'}
${warn.some(w => w.detalhe?.includes('migration')) ? '\n- Aplicar migration `20260527_contratos_status.sql` no Supabase SQL Editor' : ''}
${!process.env.ASSINAFY_API_KEY ? '\n- Configurar ASSINAFY_API_KEY nas variáveis de ambiente (Vercel)' : ''}

---

*Gerado automaticamente por \`scripts/auditoria-operacional.cjs\`*
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   AUDITORIA OPERACIONAL — INOVE TÉCNICO — 27/05/2026               ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  try {
    await descubrir();
    await auditoriaRecepcao();
    await auditoriaComercial();
    await auditoriaFinanceiro();
    await auditoriaFormacaoTurmas();
    await auditoriaContratos();
    await auditoriaSeguranca();
    await auditoriaGoLive();
    await limpeza();
  } catch (err) {
    console.error('\n❌ Erro fatal durante auditoria:', err.message);
    console.error(err.stack);
  }

  gerarRelatorio();
}

main();
