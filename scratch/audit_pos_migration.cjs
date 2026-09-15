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

async function runPostMigrationAudit() {
  console.log('====================================================');
  console.log('   AUDITORIA PÓS-APLICAÇÃO DA MIGRATION FASE 3.3.1');
  console.log('====================================================\n');

  // Deletar especificamente os alunos residuais pelo CPF
  await supabase.from('alunos').delete().eq('cpf', '99911122233');
  await supabase.from('alunos').delete().eq('cpf', '88877766655');

  // 1. Confirmar alunos de teste legados intactos
  const { data: alunos, error: errAlunos } = await supabase
    .from('alunos')
    .select('id, nome, cpf');

  if (errAlunos) {
    console.error('❌ Erro ao consultar alunos:', errAlunos.message);
    process.exit(1);
  }

  console.log(`📌 Alunos no banco antes do teste: ${alunos.length}`);
  alunos.forEach(a => console.log(`   - ID: ${a.id} | Nome: ${a.nome} | CPF: ${a.cpf}`));

  // 2. Testar inserção real no Supabase
  const { data: turma, error: errTurma } = await supabase
    .from('turmas')
    .select('id, cursoid, instituicao_id, gradeid')
    .limit(1)
    .single();

  if (errTurma || !turma) {
    console.error('❌ Erro ao buscar turma:', errTurma?.message);
    process.exit(1);
  }

  console.log(`\n📌 Turma de teste: ID=${turma.id}, CursoID=${turma.cursoid}, InstID=${turma.instituicao_id}, GradeID=${turma.gradeid}`);

  // Gerar um CPF único aleatório para o teste
  const randomCpf = String(Math.floor(10000000000 + Math.random() * 90000000000));
  const novoAlunoData = {
    nome: 'ALUNO TESTE FASE 3.3.1 AUDIT',
    cpf: randomCpf,
    instituicao_id: turma.instituicao_id,
    cursoid: turma.cursoid,
    turmaid: turma.id,
    statusmatricula: 'ATIVO'
  };

  // Inserir aluno para verificar se o trigger disparou
  const { data: alunoCriado, error: errInsert } = await supabase
    .from('alunos')
    .insert([novoAlunoData])
    .select()
    .single();

  if (errInsert) {
    console.error('❌ ERRO NO INSERT DO ALUNO:', errInsert.message);
    process.exit(1);
  }

  console.log(`✅ Aluno criado com sucesso! ID=${alunoCriado.id}`);

  // Buscar matricula criada
  const { data: mats, error: errMats } = await supabase
    .from('matriculas')
    .select('*')
    .eq('aluno_id', alunoCriado.id);

  console.log(`📌 Matrículas encontradas: ${mats?.length || 0}`);
  if (errMats) console.error('  Erro ao consultar matriculas:', errMats.message);
  
  let mat = null;
  if (mats && mats.length > 0) {
    mat = mats[0];
    console.log('   Dados da Matrícula:');
    console.log(`   - ID: ${mat.id}`);
    console.log(`   - Código: ${mat.codigo_matricula}`);
    console.log(`   - AlunoID: ${mat.aluno_id}`);
    console.log(`   - CursoID: ${mat.curso_id}`);
    console.log(`   - TurmaID: ${mat.turma_id}`);
    console.log(`   - GradeID: ${mat.grade_id}`);
    console.log(`   - InstID: ${mat.instituicao_id}`);
    console.log(`   - Status Admin: ${mat.status_administrativo}`);
    console.log(`   - Is Principal: ${mat.is_principal}`);
  }

  // Buscar movimentacao criada
  let mov = null;
  if (mat) {
    const { data: movs, error: errMovs } = await supabase
      .from('movimentacoes_matricula')
      .select('*')
      .eq('matricula_id', mat.id);
    
    console.log(`📌 Movimentações encontradas: ${movs?.length || 0}`);
    if (errMovs) console.error('  Erro ao consultar movimentacoes:', errMovs.message);

    if (movs && movs.length > 0) {
      mov = movs[0];
      console.log('   Dados da Movimentação:');
      console.log(`   - ID: ${mov.id}`);
      console.log(`   - Tipo: ${mov.tipo_movimentacao}`);
      console.log(`   - Status Novo: ${mov.status_novo}`);
      console.log(`   - Observação: ${mov.observacao}`);
    }
  }

  // Limpeza controlada do teste
  if (mat) {
    if (mov) {
      await supabase.from('movimentacoes_matricula').delete().eq('id', mov.id);
    }
    await supabase.from('matriculas').delete().eq('id', mat.id);
  }
  await supabase.from('alunos').delete().eq('id', alunoCriado.id);
  console.log(`\n🧹 Dados de teste limpos do banco com sucesso.`);

  // 3. Confirmar que os 2 alunos legados continuam intactos
  const { data: alunosFinais } = await supabase
    .from('alunos')
    .select('id, nome, cpf');

  const preservados = alunosFinais.length === 2 &&
    alunosFinais.some(a => a.id === 1 && a.nome.includes('ALAN')) &&
    alunosFinais.some(a => a.id === 2 && a.nome.includes('ROBERTO'));

  console.log('\n====================================================');
  console.log('RESULTADOS FINAIS DA VALIDAÇÃO PÓS-APLICAÇÃO (FASE 3.3.1):');
  console.log(`1. Criação do Aluno no Banco: APROVADO`);
  console.log(`2. Disparo do Trigger Sem Erro de RLS 42501: APROVADO`);
  console.log(`3. Autocriação de Matrícula (is_principal = true): ${mat && mat.is_principal ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`4. Consistência (Curso, Turma, Grade, Inst): ${mat && String(mat.curso_id) === String(turma.cursoid) && String(mat.turma_id) === String(turma.id) ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`5. Respeito ao Status da Turma: ${mat && mat.status_administrativo === 'ATIVO' ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`6. Autocriação de Movimentação MATRICULA_INICIAL: ${mov && mov.tipo_movimentacao === 'MATRICULA_INICIAL' ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`7. Preservação dos Alunos Legados Intactos: ${preservados ? 'APROVADO' : 'REPROVADO'}`);
  console.log('====================================================\n');
}

runPostMigrationAudit().catch(console.error);
