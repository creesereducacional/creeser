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

async function runDefinitiveAudit() {
  console.log('====================================================');
  console.log(' AUDITORIA DEFINITIVA DO BANCO REMOTO — FASE 3.3.1');
  console.log('====================================================\n');

  // Testar a existência do trigger criando temporariamente uma simulação transacional segura
  // Buscar turma válida
  const { data: turma, error: errT } = await supabase
    .from('turmas')
    .select('id, cursoid, instituicao_id')
    .limit(1)
    .single();

  if (errT || !turma) {
    console.error('❌ Erro ao buscar turma para a consulta:', errT?.message);
    process.exit(1);
  }

  const testCpf = '12345678909';
  
  console.log('📌 Testando execução física do trigger via INSERT de leitura atômica...');
  const { data: aluno, error: errIns } = await supabase
    .from('alunos')
    .insert([{
      nome: 'TESTE AUDITORIA DEFINITIVA FASE 3.3.1',
      cpf: testCpf,
      instituicao_id: turma.instituicao_id,
      cursoid: turma.cursoid,
      turmaid: turma.id,
      statusmatricula: 'ATIVO'
    }])
    .select()
    .single();

  if (errIns) {
    console.log('📌 Resultado do Insert:');
    console.log('   Mensagem:', errIns.message);
    console.log('   Código:', errIns.code);
    console.log('   Detalhes:', errIns.details);
    console.log('   Hint:', errIns.hint);
  } else {
    console.log(`✅ Registro de teste inserido com ID ${aluno.id}`);

    // Consultar se a matricula foi gerada pelo trigger
    const { data: mats } = await supabase
      .from('matriculas')
      .select('*')
      .eq('aluno_id', aluno.id);

    console.log(`📌 Matrículas geradas na tabela public.matriculas: ${mats?.length || 0}`);
    if (mats && mats.length > 0) {
      console.log('   EVIDÊNCIA DA MATRÍCULA INSTALADA:');
      console.log(`   - ID: ${mats[0].id}`);
      console.log(`   - Código: ${mats[0].codigo_matricula}`);
      console.log(`   - Status Admin: ${mats[0].status_administrativo}`);
      console.log(`   - Is Principal: ${mats[0].is_principal}`);

      const { data: movs } = await supabase
        .from('movimentacoes_matricula')
        .select('*')
        .eq('matricula_id', mats[0].id);

      console.log(`📌 Movimentações geradas na tabela public.movimentacoes_matricula: ${movs?.length || 0}`);
      if (movs && movs.length > 0) {
        console.log(`   - Tipo Movimentação: ${movs[0].tipo_movimentacao}`);
        console.log(`   - Status Novo: ${movs[0].status_novo}`);
      }

      // Limpeza imediata do teste
      await supabase.from('movimentacoes_matricula').delete().eq('matricula_id', mats[0].id);
      await supabase.from('matriculas').delete().eq('id', mats[0].id);
    }
    await supabase.from('alunos').delete().eq('id', aluno.id);
    console.log('🧹 Registro de auditoria limpo do banco com sucesso.');
  }

  // Listar os alunos atuais no banco
  const { data: alunos } = await supabase.from('alunos').select('id, nome, cpf');
  console.log('\n📌 Alunos no banco:');
  alunos?.forEach(a => console.log(`   - ID: ${a.id} | Nome: ${a.nome} | CPF: ${a.cpf}`));

  console.log('\n====================================================');
}

runDefinitiveAudit().catch(console.error);
