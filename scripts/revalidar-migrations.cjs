'use strict';
const https = require('https');
const fs    = require('fs');

// Carrega .env.local
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

function sb(path) {
  return new Promise((resolve) => {
    const u = new URL(SB_URL + '/rest/v1' + path);
    const opts = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        Accept: 'application/json',
      },
    };
    const req = https.request(opts, (re) => {
      let d = '';
      re.on('data', c => { d += c; });
      re.on('end', () => {
        try { resolve({ s: re.statusCode, b: JSON.parse(d) }); }
        catch (_) { resolve({ s: re.statusCode, b: d }); }
      });
    });
    req.on('error', e => resolve({ s: 0, b: e.message }));
    req.end();
  });
}

async function checkColumn(colName) {
  const r = await sb('/alunos?select=id,' + colName + '&limit=1');
  if (r.s === 200) return 'PRESENTE';
  // HTTP 400 com PGRST204 = coluna nao existe no schema cache (pode ser cache desatualizado ou coluna real ausente)
  const code = r.b && r.b.code;
  const msg  = r.b && r.b.message ? r.b.message : '';
  if (code === 'PGRST204' || msg.includes('schema cache')) {
    return 'AUSENTE  (HTTP 400 — PGRST204: schema cache desatualizado ou coluna nao existe)';
  }
  return 'AUSENTE  (HTTP ' + r.s + ' — ' + msg.slice(0, 80) + ')';
}

async function checkTable(tableName, selectCols) {
  const r = await sb('/' + tableName + '?select=' + selectCols + '&limit=3');
  if (r.s === 200) {
    const count = Array.isArray(r.b) ? r.b.length : 0;
    return { existe: true, count, rows: Array.isArray(r.b) ? r.b : [] };
  }
  const msg = (r.b && r.b.message) ? r.b.message : JSON.stringify(r.b).slice(0, 120);
  return { existe: false, count: 0, erro: 'HTTP ' + r.s + ' — ' + msg };
}

async function main() {
  console.log('=================================================================');
  console.log(' REVALIDACAO DE MIGRATIONS — ' + new Date().toLocaleString('pt-BR'));
  console.log('=================================================================\n');

  // ── 1. MIGRATION: 20260527_status_datas_matricula.sql ────────────────────────
  console.log('── 1. MIGRATION: status_datas_matricula (tabela alunos) ─────────\n');

  const cols = ['data_captacao', 'data_pagamento_matricula', 'data_ativacao'];
  for (const col of cols) {
    const status = await checkColumn(col);
    const icon = status.startsWith('PRESENTE') ? '✅' : '❌';
    console.log('  ' + icon + '  alunos.' + col.padEnd(28) + status);
  }

  // ── 2. MIGRATION: 20260527_comissoes_comerciais.sql ──────────────────────────
  console.log('\n── 2. MIGRATION: comissoes_comerciais ───────────────────────────\n');

  const cfgResult = await checkTable('comissoes_config', 'id,modo,percentual,ativo');
  if (cfgResult.existe) {
    console.log('  ✅  comissoes_config       EXISTE — ' + cfgResult.count + ' registro(s)');
    cfgResult.rows.forEach(r => console.log('       ', JSON.stringify(r)));
  } else {
    console.log('  ❌  comissoes_config       NAO EXISTE —', cfgResult.erro);
  }

  const comResult = await checkTable('comissoes_comerciais', 'id,status,valor_comissao');
  if (comResult.existe) {
    console.log('  ✅  comissoes_comerciais   EXISTE — ' + comResult.count + ' registro(s)');
  } else {
    console.log('  ❌  comissoes_comerciais   NAO EXISTE —', comResult.erro);
  }

  // ── 3. RECLASSIFICACAO ───────────────────────────────────────────────────────
  console.log('\n=================================================================');
  console.log(' RECLASSIFICACAO DOS BUGS\n');

  const bug001Resolvido = (await checkColumn('data_captacao')) === 'PRESENTE';
  const bug002aResolvido = cfgResult.existe;
  const bug002bResolvido = comResult.existe;

  console.log('  BUG-001 — alunos.data_captacao ausente');
  console.log('    Status :', bug001Resolvido ? '✅ RESOLVIDO' : '❌ BUG REAL — migration nao aplicada');

  console.log('\n  BUG-002 — tabelas comissoes_config / comissoes_comerciais ausentes');
  console.log('    comissoes_config    :', bug002aResolvido ? '✅ RESOLVIDO' : '❌ BUG REAL — tabela nao existe');
  console.log('    comissoes_comerciais:', bug002bResolvido ? '✅ RESOLVIDO' : '❌ BUG REAL — tabela nao existe');

  console.log('\n  BUG-003 — 0 usuarios operacionais (recepcao, coordenador, comercial_master)');
  const usuarios = await sb('/usuarios?select=id,email,perfil,status&limit=20');
  const perfisOperacionais = ['recepcao', 'coordenador', 'comercial_master', 'comercial_operador'];
  if (usuarios.s === 200 && Array.isArray(usuarios.b)) {
    const perfisPresentes = new Set(usuarios.b.map(u => u.perfil));
    const faltam = perfisOperacionais.filter(p => !perfisPresentes.has(p));
    if (faltam.length === 0) {
      console.log('    Status : ✅ RESOLVIDO — todos os perfis cadastrados');
    } else {
      console.log('    Status : ⚠️  PENDENCIA OPERACIONAL — perfis ausentes:', faltam.join(', '));
    }
    console.log('    Perfis no banco:', [...perfisPresentes].join(', '));
  } else {
    console.log('    Status : ⚠️  NAO VERIFICAVEL — HTTP', usuarios.s);
  }

  // ── 4. PARECER GO / NO-GO ────────────────────────────────────────────────────
  const bugsReais = [
    !bug001Resolvido,
    !bug002aResolvido,
    !bug002bResolvido,
  ].filter(Boolean).length;

  console.log('\n=================================================================');
  console.log(' PARECER FINAL\n');

  if (bugsReais === 0) {
    console.log('  ✅  GO — Nenhum bug bloqueante detectado.');
    console.log('  Pendencias operacionais restantes devem ser tratadas antes do lancamento.');
  } else {
    console.log('  🔴 NO-GO — ' + bugsReais + ' bug(s) bloqueante(s) ainda nao resolvido(s).');
  }
  console.log('=================================================================\n');
}

main().catch(console.error);
