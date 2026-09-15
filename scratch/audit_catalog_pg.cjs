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

async function runCatologAudit() {
  console.log('====================================================');
  console.log(' AUDITORIA SQL ESTRUTURAL DIRETA DO CATÁLOGO PG');
  console.log('====================================================\n');

  // 1. Diagnóstico dos dados gravados do aluno 12
  const { data: aluno12, error: errA12 } = await supabase
    .from('alunos')
    .select('id, nome, cpf, instituicao_id, cursoid, turmaid, statusmatricula, ano_letivo, semestre, datamatricula')
    .eq('id', 12)
    .maybeSingle();

  console.log('📌 Dados gravados no aluno ID 12:');
  if (errA12 || !aluno12) {
    console.log('  Aluno 12 não encontrado ou erro:', errA12?.message);
  } else {
    console.log(`  - ID: ${aluno12.id}`);
    console.log(`  - Nome: ${aluno12.nome}`);
    console.log(`  - CPF: ${aluno12.cpf}`);
    console.log(`  - instituicao_id: ${aluno12.instituicao_id}`);
    console.log(`  - cursoid: ${aluno12.cursoid} (Tipo: ${typeof aluno12.cursoid})`);
    console.log(`  - turmaid: ${aluno12.turmaid} (Tipo: ${typeof aluno12.turmaid})`);
    console.log(`  - statusmatricula: ${aluno12.statusmatricula}`);
  }

  // 2. Verificar a turma vinculada ao aluno 12 (turmaid = 1)
  if (aluno12 && aluno12.turmaid) {
    const { data: turma1, error: errT1 } = await supabase
      .from('turmas')
      .select('id, cursoid, instituicao_id, gradeid')
      .eq('id', aluno12.turmaid)
      .maybeSingle();

    console.log('\n📌 Dados da turma ID 1 vinculada:');
    if (errT1 || !turma1) {
      console.log('  Turma 1 não encontrada ou erro:', errT1?.message);
    } else {
      console.log(`  - ID: ${turma1.id}`);
      console.log(`  - cursoid na turma: ${turma1.cursoid}`);
      console.log(`  - instituicao_id na turma: ${turma1.instituicao_id}`);
      console.log(`  - gradeid na turma: ${turma1.gradeid}`);
    }
  }

  // 3. Checar se existe alguma matrícula prévia para aluno_id = 12
  const { data: mats12 } = await supabase
    .from('matriculas')
    .select('*')
    .eq('aluno_id', 12);
  console.log(`\n📌 Matrículas existentes para aluno_id = 12: ${mats12?.length || 0}`);

  // 4. Testar a execução do INSERT diretamente para capturar a exceção exata do PostgreSQL (se houver)
  console.log('\n--- TESTE DE INSIGHT COMPORTAMENTAL DE EXCEÇÃO ---');
  const testCpfDiagnostic = '77766655544';

  // Buscar uma turma válida
  const { data: turmaValida } = await supabase
    .from('turmas')
    .select('id, cursoid, instituicao_id')
    .limit(1)
    .single();

  const { data: novoInsert, error: errDiagnostic } = await supabase
    .from('alunos')
    .insert([{
      nome: 'DIAGNOSTICO ESTRUTURAL COMPLETO',
      cpf: testCpfDiagnostic,
      instituicao_id: turmaValida.instituicao_id,
      cursoid: turmaValida.cursoid,
      turmaid: turmaValida.id,
      statusmatricula: 'ATIVO'
    }])
    .select()
    .single();

  if (errDiagnostic) {
    console.log('❌ EXCEÇÃO EXATA RETORNADA PELO POSTGRESQL:');
    console.log(`   Message: "${errDiagnostic.message}"`);
    console.log(`   Code: "${errDiagnostic.code}"`);
    console.log(`   Details: "${errDiagnostic.details}"`);
    console.log(`   Hint: "${errDiagnostic.hint}"`);
  } else {
    console.log(`✅ Insert de diagnóstico executado com sucesso! ID=${novoInsert.id}`);
    
    // Verificar se gerou matricula para este novo aluno
    const { data: mDiag } = await supabase
      .from('matriculas')
      .select('*')
      .eq('aluno_id', novoInsert.id);
    console.log(`📌 Matrículas geradas para o aluno de diagnóstico (ID ${novoInsert.id}): ${mDiag?.length || 0}`);
    
    // Deletar aluno de diagnóstico
    if (mDiag && mDiag.length > 0) {
      await supabase.from('movimentacoes_matricula').delete().eq('matricula_id', mDiag[0].id);
      await supabase.from('matriculas').delete().eq('id', mDiag[0].id);
    }
    await supabase.from('alunos').delete().eq('id', novoInsert.id);
  }

  // 5. Exibir todos os alunos atualmente na tabela
  const { data: todosAlunos } = await supabase.from('alunos').select('id, nome, cpf');
  console.log('\n📌 Alunos atualmente na tabela public.alunos:');
  todosAlunos?.forEach(a => console.log(`   - ID: ${a.id} | Nome: ${a.nome} | CPF: ${a.cpf}`));

  console.log('\n====================================================');
}

runCatologAudit().catch(console.error);
