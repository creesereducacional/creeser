// diagnose.cjs
'use strict';
const https = require('https');
const fs    = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(l => {
  const idx = l.indexOf('=');
  if (idx > 0) {
    const k = l.slice(0, idx).trim();
    const v = l.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
});

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function q(path_) {
  return new Promise((resolve) => {
    const u = new URL(SB_URL + '/rest/v1' + path_);
    const opts = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Accept: 'application/json' }
    };
    const req = https.request(opts, re => {
      let d = '';
      re.on('data', c => d += c);
      re.on('end', () => {
        try { resolve({ s: re.statusCode, b: JSON.parse(d) }); }
        catch (_) { resolve({ s: re.statusCode, b: d }); }
      });
    });
    req.on('error', e => resolve({ s: 0, b: e.message }));
    req.end();
  });
}

async function main() {
  console.log('=== DIAGNÓSTICO SUPABASE ===\n');

  const a = await q('/alunos?limit=1&select=*');
  if (a.s === 200 && Array.isArray(a.b) && a.b[0]) {
    const cols = Object.keys(a.b[0]);
    console.log('Colunas alunos (' + cols.length + '):');
    console.log(cols.join(', '));
    console.log('  data_captacao presente?', cols.includes('data_captacao'));
    console.log('  status_contrato presente?', cols.includes('status_contrato'));
  }

  console.log('\ncomissoes_comerciais:');
  const t = await q('/comissoes_comerciais?limit=1');
  console.log('  status:', t.s, JSON.stringify(t.b).slice(0, 200));

  console.log('\ncomissoes_config:');
  const t2 = await q('/comissoes_config?limit=1');
  console.log('  status:', t2.s, JSON.stringify(t2.b).slice(0, 100));

  console.log('\nleads (colunas):');
  const l = await q('/leads?limit=1&select=*');
  if (l.s === 200 && Array.isArray(l.b) && l.b[0]) {
    console.log('  ' + Object.keys(l.b[0]).join(', '));
  } else {
    console.log('  status:', l.s, JSON.stringify(l.b).slice(0, 150));
  }

  console.log('\nusuarios (primeiros 5):');
  const u = await q('/usuarios?limit=5&select=id,email,perfil,status');
  if (u.s === 200 && Array.isArray(u.b)) {
    u.b.forEach(x => console.log('  ', JSON.stringify(x)));
  } else {
    console.log('  status:', u.s, JSON.stringify(u.b).slice(0, 150));
  }

  console.log('\nfinanceiro_ordens_pagamento (FK check):');
  const fo = await q('/financeiro_ordens_pagamento?limit=2&select=id,aluno_id,tipo,status,instituicao_id&order=id.desc');
  if (fo.s === 200 && Array.isArray(fo.b)) {
    fo.b.forEach(x => console.log('  ', JSON.stringify(x)));
  } else {
    console.log('  status:', fo.s, JSON.stringify(fo.b).slice(0, 150));
  }

  console.log('\nturmas (status_formacao):');
  const tr = await q('/turmas?select=id,nome,status_formacao,situacao,qtd_minima_alunos&order=id.desc&limit=5');
  if (tr.s === 200 && Array.isArray(tr.b)) {
    tr.b.forEach(x => console.log('  ', JSON.stringify(x)));
  }
}
main().catch(console.error);
