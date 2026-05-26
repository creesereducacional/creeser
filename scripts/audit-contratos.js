/**
 * Script de auditoria do módulo Contratos — Inove Técnico
 * Uso: node scripts/audit-contratos.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('\n========================================');
  console.log(' AUDITORIA CONTRATOS — INOVE TÉCNICO');
  console.log('========================================\n');

  // ── 1. Todas as instituições ────────────────────────────
  console.log('=== 1. INSTITUIÇÕES CADASTRADAS ===');
  const { data: instituicoes, error: instErr } = await supabase
    .from('instituicoes')
    .select('id, nome')
    .order('nome');
  if (instErr) { console.error('Erro:', instErr.message); }
  else { instituicoes.forEach(i => console.log(`  [${i.id}] ${i.nome}`)); }

  // Identificar Inove Técnico
  const inove = (instituicoes || []).find(i =>
    /inove\s*t[eé]cnico/i.test(i.nome)
  );
  if (!inove) {
    console.log('\n❌ INOVE TÉCNICO NÃO ENCONTRADO — Listando nomes disponíveis:');
    (instituicoes || []).forEach(i => console.log('  •', i.nome));
    console.log('\nAjuste o regex acima para bater com o nome correto.');
    process.exit(1);
  }
  console.log(`\n✅ Inove Técnico encontrado: ${inove.nome} [${inove.id}]`);

  // ── 2. Contratos do Inove Técnico ───────────────────────
  console.log('\n=== 2. CONTRATOS DA INSTITUIÇÃO ===');
  const { data: contratos, error: contErr } = await supabase
    .from('contratos_instituicao')
    .select('id, nome, ativo, padrao, ordem, created_at')
    .eq('instituicao_id', inove.id)
    .order('padrao', { ascending: false });

  if (contErr) { console.error('Erro:', contErr.message); }
  else if (!contratos || contratos.length === 0) {
    console.log('❌ Nenhum contrato cadastrado para o Inove Técnico.');
  } else {
    contratos.forEach(c => {
      const padrao = c.padrao ? '⭐ PADRÃO' : '  normal';
      const ativo  = c.ativo ? '✅ ativo' : '⛔ inativo';
      console.log(`  ${padrao} | ${ativo} | ordem=${c.ordem} | [${c.id}] ${c.nome}`);
    });
  }

  const contratosPadrao = (contratos || []).filter(c => c.padrao && c.ativo);
  if (contratosPadrao.length === 0) {
    console.log('\n⚠️  BLOQUEADOR B-01: Nenhum contrato ativo+padrão encontrado!');
  } else {
    console.log(`\n✅ Contrato padrão ativo: "${contratosPadrao[0].nome}"`);
  }

  // ── 3. Verificar vínculo com curso/situação ─────────────
  console.log('\n=== 3. VÍNCULO CONTRATO × CURSO/SITUAÇÃO ===');
  const { data: sampleContrato } = await supabase
    .from('contratos_instituicao')
    .select('*')
    .limit(1);
  if (sampleContrato && sampleContrato.length > 0) {
    const colNames = Object.keys(sampleContrato[0]);
    const hasCurso = colNames.includes('curso_id');
    const hasSituacao = colNames.includes('situacao') || colNames.includes('tipo');
    console.log(`  Colunas: ${colNames.join(', ')}`);
    console.log(`  Vínculo curso_id:       ${hasCurso    ? '✅ existe' : '❌ não existe (só por instituição)'}`);
    console.log(`  Vínculo situacao/tipo:  ${hasSituacao ? '✅ existe' : '❌ não existe (só por instituição)'}`);
  } else {
    console.log('  ⚠️  Sem dados para inspecionar colunas');
  }

  // ── 4. Alunos sem instituicao_id ────────────────────────
  console.log('\n=== 4. ALUNOS SEM instituicao_id (BACKFILL) ===');
  const { data: alunosSemId, error: alunosErr, count: totalSemId } = await supabase
    .from('alunos')
    .select('id, nome, instituicao', { count: 'exact' })
    .is('instituicao_id', null)
    .order('id')
    .limit(10);

  if (alunosErr) { console.error('Erro:', alunosErr.message); }
  else {
    console.log(`  Total alunos sem instituicao_id (primeiros 10): ${alunosSemId?.length || 0}`);
    (alunosSemId || []).forEach(a =>
      console.log(`    [id=${a.id}] ${a.nome} | campo texto: "${a.instituicao}"`)
    );
  }

  // Alunos sem id que parecem ser do Inove Técnico
  const { data: alunosInove } = await supabase
    .from('alunos')
    .select('id, nome, instituicao', { count: 'exact' })
    .is('instituicao_id', null)
    .ilike('instituicao', '%inove%t%cnico%');

  console.log(`\n  Alunos sem instituicao_id com nome ILIKE '%inove%tecnico%': ${alunosInove?.length || 0}`);
  (alunosInove || []).slice(0, 5).forEach(a =>
    console.log(`    [id=${a.id}] ${a.nome} | "${a.instituicao}"`)
  );

  if ((alunosInove?.length || 0) > 0) {
    console.log('\n  📋 SQL DE BACKFILL PREPARADO (NÃO EXECUTADO):');
    console.log(`  UPDATE public.alunos`);
    console.log(`    SET instituicao_id = '${inove.id}'`);
    console.log(`    WHERE instituicao_id IS NULL`);
    console.log(`      AND instituicao ILIKE '%inove%tecnico%';`);
    console.log(`  -- Linhas afetadas estimadas: ${alunosInove?.length}`);
  }

  // ── 5. Amostra de 1 aluno COM instituicao_id para teste ─
  console.log('\n=== 5. AMOSTRA DE ALUNO PARA TESTE DE CONTRATO ===');
  const { data: alunosTeste } = await supabase
    .from('alunos')
    .select('id, nome, email, cpf, instituicao_id, turmaid')
    .eq('instituicao_id', inove.id)
    .limit(5);

  if (!alunosTeste || alunosTeste.length === 0) {
    console.log('⚠️  Nenhum aluno com instituicao_id preenchido para o Inove Técnico.');
    console.log('    Backfill necessário antes do teste de geração.');
  } else {
    alunosTeste.forEach(a => {
      const temEmail = a.email ? '📧' : '⚠️ sem email';
      const temTurma = a.turmaid ? `turma=${a.turmaid}` : '⚠️ sem turma';
      console.log(`  [id=${a.id}] ${a.nome} | ${temEmail} | ${temTurma}`);
    });
    console.log(`\n  Aluno de teste: ID=${alunosTeste[0].id} — "${alunosTeste[0].nome}"`);
  }

  // ── 6. Verificar variáveis de ambiente ASSINAFY ─────────
  console.log('\n=== 6. VARIÁVEIS DE AMBIENTE — ASSINAFY ===');
  const apiKey    = process.env.ASSINAFY_API_KEY;
  const accountId = process.env.ASSINAFY_ACCOUNT_ID;
  const baseUrl   = process.env.ASSINAFY_BASE_URL;
  console.log(`  ASSINAFY_API_KEY:     ${apiKey    ? '✅ presente (' + apiKey.length + ' chars)' : '❌ ausente'}`);
  console.log(`  ASSINAFY_ACCOUNT_ID:  ${accountId ? '✅ presente (' + accountId.length + ' chars)' : '❌ ausente'}`);
  console.log(`  ASSINAFY_BASE_URL:    ${baseUrl   ? '✅ ' + baseUrl : '❌ ausente'}`);

  // ── 7. Testar conectividade Assinafy ─────────────────────
  console.log('\n=== 7. CONECTIVIDADE ASSINAFY ===');
  if (apiKey && accountId && baseUrl) {
    try {
      const https = require('https');
      const url = new URL(`${baseUrl}/accounts/${accountId}`);
      const result = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: url.hostname,
          path: url.pathname,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        }, (res) => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 300) }));
        });
        req.on('error', reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
      });
      console.log(`  HTTP Status: ${result.status}`);
      if (result.status === 200) {
        console.log('  ✅ Assinafy acessível e credenciais válidas');
      } else if (result.status === 401 || result.status === 403) {
        console.log('  ❌ Credenciais inválidas ou sem permissão');
        console.log('  Resposta:', result.body.slice(0, 200));
      } else if (result.status === 404) {
        console.log('  ⚠️  Conta não encontrada (ASSINAFY_ACCOUNT_ID pode estar errado)');
        console.log('  Resposta:', result.body.slice(0, 200));
      } else {
        console.log('  ⚠️  Status inesperado:', result.status);
        console.log('  Resposta:', result.body.slice(0, 200));
      }
    } catch (e) {
      console.log(`  ❌ Erro de conexão: ${e.message}`);
    }
  } else {
    console.log('  ❌ Variáveis ausentes — teste impossível');
  }

  // ── 8. Tabela contratos_assinaturas ─────────────────────
  console.log('\n=== 8. TABELA contratos_assinaturas ===');
  const { data: assTbl, error: assTblErr } = await supabase
    .from('contratos_assinaturas')
    .select('id, status, provider, requested_at')
    .limit(3);

  if (assTblErr) {
    if (assTblErr.code === '42P01' || assTblErr.message?.includes('does not exist')) {
      console.log('  ❌ Tabela contratos_assinaturas NÃO EXISTE — migration pendente!');
    } else {
      console.log('  ❌ Erro:', assTblErr.message);
    }
  } else {
    console.log(`  ✅ Tabela existe. Registros encontrados: ${assTbl?.length || 0}`);
    (assTbl || []).forEach(r =>
      console.log(`    [${r.id}] status=${r.status} | provider=${r.provider} | ${r.requested_at}`)
    );
  }

  console.log('\n========================================');
  console.log(' FIM DA AUDITORIA');
  console.log('========================================\n');

  // retornar id do aluno de teste para próxima etapa
  if (alunosTeste && alunosTeste.length > 0) {
    console.log(`ALUNO_TESTE_ID=${alunosTeste[0].id}`);
  }
  if (inove) {
    console.log(`INOVE_UUID=${inove.id}`);
  }
}

main().catch(e => { console.error('Erro fatal:', e); process.exit(1); });
