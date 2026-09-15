const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = 'https://wjcbobcqyqdkludsbqgf.supabase.co';
let supabaseKey = 'sb_publishable_EpWHRpMB_HxVI0Afb6SnXw_M48qjBxY';

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine && !cleanLine.startsWith('#')) {
      const match = cleanLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEndpointLogic() {
  console.log('====================================================');
  console.log(' AUDITORIA DE ISOLAMENTO E VALIDAÇÕES DO ENDPOINT');
  console.log('====================================================\n');

  // Simular checagem de isolamento multi-tenant
  const userInstituicaoId = '1f140f5f-cf75-489d-8ab3-d99cf28d1414';
  
  // Buscar aluno legadom ID 1 (Alan Almeida)
  const { data: aluno1 } = await supabase
    .from('alunos')
    .select('id, nome, instituicao_id, ano_letivo')
    .eq('id', 1)
    .single();

  console.log('📌 Aluno de teste selecionado (ID 1):', aluno1);
  const belongsToTenant = (aluno1.instituicao_id === userInstituicaoId);
  console.log(`✅ Validação de pertencimento à instituição (${userInstituicaoId}): ${belongsToTenant ? 'APROVADO' : 'REPROVADO'}`);

  // Testar chamada inválida da RPC (novo_ano_letivo menor/igual ao atual 2026)
  console.log('\n--- TESTANDO CENÁRIO INVÁLIDO (Ano Letivo 2026 <= 2026) ---');
  const { data: resInv, error: errInv } = await supabase.rpc('fn_executar_rematricula_aluno', {
    p_aluno_id: 1,
    p_novo_ano_letivo: 2026, // Inválido! Ano atual do aluno já é 2026
    p_novo_semestre: '1',
    p_nova_turma_id: null,
    p_plano_financeiro: null,
    p_valor_mensalidade: null,
    p_observacao: 'Teste de falha controlada'
  });

  if (errInv) {
    console.log('✅ REJEIÇÃO CONTROLADA CAPTURADA DA RPC:');
    console.log(`   Mensagem do Erro: "${errInv.message}"`);
    console.log(`   Status Esperado na API: HTTP 422 Unprocessable Entity`);
  } else {
    console.error('❌ FALHA NO TESTE: A RPC deveria ter rejeitado o ano 2026!');
  }

  console.log('\n====================================================');
}

testEndpointLogic().catch(console.error);
