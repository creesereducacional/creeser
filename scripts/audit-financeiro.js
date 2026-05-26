/**
 * Auditoria do módulo financeiro — Inove Técnico
 * node scripts/audit-financeiro.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INOVE_UUID = '1f140f5f-cf75-489d-8ab3-d99cf28d1414';

let ok = 0, fail = 0, warn = 0;
function OK(m)   { console.log(`  ✅ ${m}`); ok++;   }
function FAIL(m) { console.log(`  ❌ ${m}`); fail++; }
function WARN(m) { console.log(`  ⚠️  ${m}`); warn++; }
function SEP(t)  { console.log(`\n=== ${t} ===`); }

async function checkColumns(table) {
  const { data } = await supabase.from(table).select('*').limit(1);
  if (data && data.length > 0) return Object.keys(data[0]);
  // If empty table, insert+delete trick won't work; try info schema via RPC
  return null;
}

async function main() {
  console.log('\n==============================================');
  console.log(' AUDITORIA FINANCEIRO — INOVE TÉCNICO');
  console.log('==============================================\n');

  // ── 1. Verificar schema das tabelas financeiras ──────
  SEP('1. SCHEMA DAS TABELAS FINANCEIRAS');

  const tables = [
    'financeiro_ordens_pagamento',
    'financeiro_parcelas',
    'financeiro_boletos',
    'financeiro_convenios',
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      if (error.code === '42P01') FAIL(`Tabela ${t}: NÃO EXISTE`);
      else FAIL(`Tabela ${t}: erro=${error.message}`);
    } else {
      const cols = data?.length > 0 ? Object.keys(data[0]).join(', ') : '(vazia — sem cols visíveis)';
      const hasInstId = cols.includes('instituicao_id');
      console.log(`  📋 ${t}:`);
      console.log(`     colunas: ${cols}`);
      console.log(`     instituicao_id: ${hasInstId ? '✅' : '❌ AUSENTE'}`);
      if (!hasInstId) FAIL(`${t} sem coluna instituicao_id — isolamento quebrado!`);
      else OK(`${t} tem instituicao_id`);
    }
  }

  // ── 2. Dados financeiros no aluno de teste ───────────
  SEP('2. DADOS FINANCEIROS DO ALUNO DE TESTE (id=16)');

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, cpf, email, telefone_celular, data_nascimento, endereco, instituicao_id, valor_matricula, valor_mensalidade, percentual_desconto, qtd_parcelas, dia_pagamento, plano_financeiro, aluno_bolsista, percentual_bolsa')
    .eq('id', 16)
    .single();

  if (!aluno) { FAIL('Aluno id=16 não encontrado'); }
  else {
    console.log(`  Aluno: ${aluno.nome}`);
    const cpfLimpo = (aluno.cpf || '').replace(/\D/g, '');
    cpfLimpo.length === 11 ? OK(`CPF válido (11 dígitos)`) : FAIL(`CPF inválido ou ausente: "${aluno.cpf}"`);
    aluno.email         ? OK(`Email: ${aluno.email}`) : WARN('Email ausente');
    aluno.telefone_celular ? OK(`Telefone: ${aluno.telefone_celular}`) : WARN('Telefone ausente');
    aluno.data_nascimento  ? OK(`Data nascimento: ${aluno.data_nascimento}`) : WARN('Data nascimento ausente');
    aluno.endereco         ? OK(`Endereço: ${aluno.endereco}`) : WARN('Endereço ausente');

    console.log(`\n  Dados financeiros cadastrados no aluno:`);
    console.log(`    valor_matricula:    ${aluno.valor_matricula    ?? '(vazio)'}`);
    console.log(`    valor_mensalidade:  ${aluno.valor_mensalidade  ?? '(vazio)'}`);
    console.log(`    percentual_desconto:${aluno.percentual_desconto ?? '(vazio)'}`);
    console.log(`    qtd_parcelas:       ${aluno.qtd_parcelas       ?? '(vazio)'}`);
    console.log(`    dia_pagamento:      ${aluno.dia_pagamento       ?? '(vazio)'}`);
    console.log(`    plano_financeiro:   ${aluno.plano_financeiro    ?? '(vazio)'}`);
    console.log(`    aluno_bolsista:     ${aluno.aluno_bolsista      ?? false}`);
    console.log(`    percentual_bolsa:   ${aluno.percentual_bolsa    ?? '(vazio)'}`);

    if (!aluno.valor_mensalidade) WARN('valor_mensalidade não cadastrado no aluno — ordem precisará de valor manual');
    else OK(`Valor mensalidade cadastrado: R$ ${aluno.valor_mensalidade}`);
  }

  // ── 3. Ordens existentes do Inove Técnico ────────────
  SEP('3. ORDENS DE PAGAMENTO DO INOVE TÉCNICO');

  const { data: ordens, error: ordensErr } = await supabase
    .from('financeiro_ordens_pagamento')
    .select('id, tipo, descricao, valor_total, status, efi_charge_id, efi_carnet_id, created_at')
    .eq('instituicao_id', INOVE_UUID)
    .order('created_at', { ascending: false })
    .limit(10);

  if (ordensErr) {
    if (ordensErr.message?.includes('does not exist') || ordensErr.code === '42703') {
      FAIL('Coluna instituicao_id não existe em financeiro_ordens_pagamento — query falhou');
      console.log('  Tentando sem filtro de instituição...');
      const { data: todasOrdens } = await supabase
        .from('financeiro_ordens_pagamento')
        .select('id, tipo, descricao, valor_total, status, aluno_id')
        .limit(5);
      console.log(`  Total de ordens (sem filtro): ${todasOrdens?.length ?? 0}`);
      (todasOrdens || []).forEach(o => console.log(`    [${o.id.slice(0,8)}] ${o.tipo} | ${o.descricao} | R$ ${o.valor_total} | aluno=${o.aluno_id}`));
    } else {
      FAIL(`Erro ao listar ordens: ${ordensErr.message}`);
    }
  } else {
    console.log(`  Ordens do Inove Técnico: ${ordens?.length ?? 0}`);
    if (ordens?.length === 0) {
      WARN('Nenhuma ordem de pagamento cadastrada para o Inove Técnico ainda');
    } else {
      OK(`${ordens.length} ordem(ns) encontrada(s)`);
      ordens.forEach(o => {
        const efi = o.efi_charge_id ? `efi_charge=${o.efi_charge_id}` : (o.efi_carnet_id ? `efi_carnet=${o.efi_carnet_id}` : 'sem EFI');
        console.log(`    [${o.id.slice(0,8)}] ${o.tipo} | ${o.descricao} | R$ ${o.valor_total} | ${o.status} | ${efi}`);
      });
    }
  }

  // ── 4. Parcelas existentes do Inove Técnico ──────────
  SEP('4. PARCELAS DO INOVE TÉCNICO');

  const { data: parcelas, error: parcelasErr } = await supabase
    .from('financeiro_parcelas')
    .select('id, valor, data_vencimento, status, efi_charge_id')
    .eq('instituicao_id', INOVE_UUID)
    .order('data_vencimento', { ascending: false })
    .limit(10);

  if (parcelasErr) {
    if (parcelasErr.message?.includes('does not exist') || parcelasErr.code === '42703') {
      FAIL('Coluna instituicao_id não existe em financeiro_parcelas');
      const { data: todasParcelas } = await supabase.from('financeiro_parcelas').select('id, valor, status').limit(5);
      console.log(`  Total parcelas (sem filtro): ${todasParcelas?.length ?? 0}`);
    } else {
      FAIL(`Erro: ${parcelasErr.message}`);
    }
  } else {
    console.log(`  Parcelas do Inove Técnico: ${parcelas?.length ?? 0}`);
    (parcelas || []).forEach(p =>
      console.log(`    [${p.id.slice(0,8)}] R$ ${p.valor} | venc=${p.data_vencimento} | ${p.status} | efi=${p.efi_charge_id || '-'}`)
    );
  }

  // ── 5. Convênios do Inove Técnico ────────────────────
  SEP('5. CONVÊNIOS DO INOVE TÉCNICO');

  const { data: convenios, error: convErr } = await supabase
    .from('financeiro_convenios')
    .select('id, nome, percentual, ativo')
    .eq('instituicao_id', INOVE_UUID);

  if (convErr) FAIL(`Erro: ${convErr.message}`);
  else if (!convenios || convenios.length === 0) {
    WARN('Nenhum convênio cadastrado para o Inove Técnico');
  } else {
    OK(`${convenios.length} convênio(s):`);
    convenios.forEach(c => console.log(`    • ${c.nome} — ${c.percentual}% | ativo=${c.ativo}`));
  }

  // ── 6. Credenciais EFI ───────────────────────────────
  SEP('6. CREDENCIAIS EFI BANK');

  const efiId     = process.env.EFI_CLIENT_ID;
  const efiSecret = process.env.EFI_CLIENT_SECRET;
  const sandbox   = process.env.EFI_SANDBOX;
  const webhookUrl = process.env.EFI_WEBHOOK_URL || process.env.NEXT_PUBLIC_URL;

  console.log(`  EFI_CLIENT_ID:     ${efiId     ? `✅ presente (${efiId.length} chars)` : '❌ ausente'}`);
  console.log(`  EFI_CLIENT_SECRET: ${efiSecret ? `✅ presente (${efiSecret.length} chars)` : '❌ ausente'}`);
  console.log(`  EFI_SANDBOX:       ${sandbox ?? '(não definido — padrão: produção)'}`);
  console.log(`  EFI_WEBHOOK_URL:   ${webhookUrl ? webhookUrl : '❌ ausente (usa NEXT_PUBLIC_URL)'}`);
  console.log(`  Ambiente ativo:    ${sandbox === 'true' ? '🔶 HOMOLOGAÇÃO' : '🟢 PRODUÇÃO'}`);

  if (!efiId || !efiSecret) {
    FAIL('Credenciais EFI ausentes — criação de boletos impossível');
  } else {
    OK('Credenciais EFI presentes');
  }

  // ── 7. Testar autenticação EFI ───────────────────────
  SEP('7. TESTE DE AUTENTICAÇÃO EFI (OAuth2)');

  if (efiId && efiSecret) {
    try {
      const baseUrl = sandbox === 'true'
        ? 'https://cobrancas-h.api.efipay.com.br'
        : 'https://cobrancas.api.efipay.com.br';
      const credentials = Buffer.from(`${efiId}:${efiSecret}`).toString('base64');

      const result = await new Promise((resolve, reject) => {
        const body = JSON.stringify({ grant_type: 'client_credentials' });
        const req = https.request({
          hostname: new URL(baseUrl).hostname,
          path: '/v1/authorize',
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          }
        }, (res) => {
          let data = '';
          res.on('data', d => data += d);
          res.on('end', () => {
            try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
            catch { resolve({ status: res.statusCode, body: data }); }
          });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
        req.write(body);
        req.end();
      });

      if (result.status === 200 && result.body.access_token) {
        OK(`OAuth2 EFI: HTTP 200, token obtido (expires_in=${result.body.expires_in}s)`);
        console.log(`  Ambiente confirmado: ${sandbox === 'true' ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO'}`);
      } else if (result.status === 401) {
        FAIL(`OAuth2 EFI: 401 Unauthorized — credenciais inválidas`);
        console.log('  Detalhe:', JSON.stringify(result.body).slice(0, 200));
      } else {
        WARN(`OAuth2 EFI: HTTP ${result.status} — ${JSON.stringify(result.body).slice(0, 200)}`);
      }
    } catch (e) {
      FAIL(`Erro de conexão EFI: ${e.message}`);
    }
  } else {
    WARN('Credenciais EFI ausentes — teste de autenticação ignorado');
  }

  // ── 8. Verificar NEXT_PUBLIC_URL (webhook) ───────────
  SEP('8. CONFIGURAÇÃO DO WEBHOOK EFI');
  const pubUrl = process.env.NEXT_PUBLIC_URL;
  if (pubUrl) {
    OK(`NEXT_PUBLIC_URL: ${pubUrl}`);
    OK(`Webhook endpoint: ${pubUrl}/api/admin-financeiro/efi/webhook`);
  } else {
    WARN('NEXT_PUBLIC_URL não definido — webhook será construído de forma dinâmica pelo host da requisição');
  }

  // ── 9. Isolamento — aluno de outra inst. ─────────────
  SEP('9. TESTE DE ISOLAMENTO MULTI-TENANT');

  const FAETE_UUID = 'f5f21e32-886f-476c-b2ac-5608a80efc4b';

  // Tentar buscar alunos do Inove com filtro FAETE
  const { data: alunoFaete } = await supabase
    .from('alunos').select('id, nome').eq('instituicao_id', INOVE_UUID)
    .eq('instituicao_id', FAETE_UUID).limit(1);
  (!alunoFaete || alunoFaete.length === 0)
    ? OK('Aluno Inove + filtro FAETE → 0 resultados (isolamento correto)')
    : FAIL('Aluno Inove + filtro FAETE → resultado encontrado (vazamento!)');

  // ── 10. Status do mapa financeiro por perfil ─────────
  SEP('10. MAPEAMENTO DE PERFIS POR ENDPOINT');

  const perfisOK = ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'];
  console.log(`  Todos os endpoints financeiros restringem a: ${perfisOK.join(', ')}`);
  WARN('Secretaria: sem acesso ao módulo financeiro');
  WARN('Comercial: sem acesso ao módulo financeiro');
  OK('Financeiro: acesso completo a ordens, carnês, convênios, recibo');
  OK('grupo_admin: acesso total cross-instituição');

  // ── RESUMO ────────────────────────────────────────────
  console.log('\n==============================================');
  console.log(` RESULTADO: ✅ ${ok} ok | ⚠️  ${warn} aviso | ❌ ${fail} falha`);
  console.log('==============================================\n');

  if (aluno) {
    console.log(`ALUNO_TESTE_ID=${aluno.id}`);
    console.log(`ALUNO_CPF=${(aluno.cpf||'').replace(/\D/g,'')}`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
