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

async function testDirectMatriculaInsert() {
  console.log('====================================================');
  console.log(' TESTE DIRETO DE INSERÇÃO NA TABELA PUBLIC.MATRICULAS');
  console.log('====================================================\n');

  // Inserir os mesmos dados exatos que o trigger tentaria inserir para o Aluno 14
  const { data, error } = await supabase
    .from('matriculas')
    .insert([{
      aluno_id: 14,
      instituicao_id: '1f140f5f-cf75-489d-8ab3-d99cf28d1414',
      curso_id: 1,
      turma_id: 1,
      grade_id: 4,
      ano_letivo: 2026,
      semestre: '1',
      status_administrativo: 'ATIVO',
      situacao_academica: 'EM_ANDAMENTO',
      is_principal: true,
      data_matricula: '2026-09-07'
    }])
    .select();

  if (error) {
    console.log('❌ EXCEÇÃO/ERRO EXATO RETORNADO:');
    console.log('  Message:', error.message);
    console.log('  Code:', error.code);
    console.log('  Details:', error.details);
    console.log('  Hint:', error.hint);
  } else {
    console.log('✅ INSERT EM MATRICULAS EXECUTADO COM SUCESSO! ID:', data[0].id);
    // Limpar registro do teste direto
    await supabase.from('matriculas').delete().eq('id', data[0].id);
  }
}

testDirectMatriculaInsert().catch(console.error);
