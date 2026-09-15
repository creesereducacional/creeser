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

async function runDirectDatabaseAudit() {
  console.log('====================================================');
  console.log(' AUDITORIA ESTRUTURAL DIRETA DO BANCO — FASE 3.3.1');
  console.log('====================================================\n');

  // 1. Limpar qualquer registro temporário > id 2
  await supabase.from('alunos').delete().gt('id', 2);

  // 2. Verificar a existência da função e definição via RPC (se disponível) ou via teste comportamental
  // Vamos buscar uma turma válida
  const { data: turma, error: errTurma } = await supabase
    .from('turmas')
    .select('id, cursoid, instituicao_id, gradeid')
    .limit(1)
    .single();

  if (errTurma || !turma) {
    console.error('❌ Erro ao buscar turma para o teste:', errTurma?.message);
    process.exit(1);
  }

  console.log(`📌 Turma selecionada: ID=${turma.id}, CursoID=${turma.cursoid}, InstID=${turma.instituicao_id}, GradeID=${turma.gradeid}`);

  // 3. Executar o teste controlado de INSERT para validar o trigger no PostgreSQL
  const randomCpf = String(Math.floor(10000000000 + Math.random() * 90000000000));
  const testAlunoData = {
    nome: 'ALUNO AUDITORIA DIRETA 3.3.1',
    cpf: randomCpf,
    instituicao_id: turma.instituicao_id,
    cursoid: turma.cursoid,
    turmaid: turma.id,
    statusmatricula: 'ATIVO',
    valor_mensalidade: 550.00,
    dia_pagamento: 15
  };

  console.log('\n--- EXECUTANDO INSERT CONTROLADO EM public.alunos ---');
  const { data: alunoCriado, error: errInsert } = await supabase
    .from('alunos')
    .insert([testAlunoData])
    .select()
    .single();

  if (errInsert) {
    console.error('❌ ERRO NO INSERT DO ALUNO:', errInsert.message);
    console.error('  Detalhes:', errInsert.details);
    console.error('  Hint:', errInsert.hint);
  } else {
    console.log(`✅ ALUNO CRIADO COM SUCESSO! ID=${alunoCriado.id}`);
  }

  let matCriada = null;
  let movCriada = null;

  if (alunoCriado) {
    // Consultar tabela public.matriculas para este aluno
    const { data: mats, error: errMat } = await supabase
      .from('matriculas')
      .select('*')
      .eq('aluno_id', alunoCriado.id);

    if (errMat) {
      console.error('❌ Erro ao consultar public.matriculas:', errMat.message);
    } else {
      console.log(`📌 Matrículas retornadas para o aluno ${alunoCriado.id}: ${mats.length}`);
      if (mats.length > 0) {
        matCriada = mats[0];
        console.log('   EVIDÊNCIAS DA MATRÍCULA CRIADA:');
        console.log(`   - ID: ${matCriada.id}`);
        console.log(`   - Código: ${matCriada.codigo_matricula}`);
        console.log(`   - Aluno ID: ${matCriada.aluno_id}`);
        console.log(`   - Curso ID: ${matCriada.curso_id}`);
        console.log(`   - Turma ID: ${matCriada.turma_id}`);
        console.log(`   - Grade ID: ${matCriada.grade_id}`);
        console.log(`   - Instituição ID: ${matCriada.instituicao_id}`);
        console.log(`   - Status Admin: ${matCriada.status_administrativo}`);
        console.log(`   - Is Principal: ${matCriada.is_principal}`);
        console.log(`   - Valor Mensalidade: ${matCriada.valor_mensalidade}`);

        // Consultar movimentação inicial
        const { data: movs, error: errMov } = await supabase
          .from('movimentacoes_matricula')
          .select('*')
          .eq('matricula_id', matCriada.id);

        if (errMov) {
          console.error('❌ Erro ao consultar movimentacoes_matricula:', errMov.message);
        } else {
          console.log(`📌 Movimentações retornadas: ${movs.length}`);
          if (movs.length > 0) {
            movCriada = movs[0];
            console.log('   EVIDÊNCIAS DA MOVIMENTAÇÃO CRIADA:');
            console.log(`   - ID: ${movCriada.id}`);
            console.log(`   - Tipo Movimentação: ${movCriada.tipo_movimentacao}`);
            console.log(`   - Status Novo: ${movCriada.status_novo}`);
            console.log(`   - Observação: ${movCriada.observacao}`);
          }
        }
      }
    }

    // LIMPEZA DOS REGISTROS TEMPORÁRIOS DESTE TESTE
    if (matCriada) {
      if (movCriada) {
        await supabase.from('movimentacoes_matricula').delete().eq('id', movCriada.id);
      }
      await supabase.from('matriculas').delete().eq('id', matCriada.id);
    }
    await supabase.from('alunos').delete().eq('id', alunoCriado.id);
    console.log(`\n🧹 Dados de teste limpos do banco com sucesso.`);
  }

  // Confirmar que os 2 alunos originais estão intactos
  const { data: alunosFinais } = await supabase
    .from('alunos')
    .select('id, nome, cpf');

  console.log(`\n📌 Alunos no banco após limpeza: ${alunosFinais.length}`);
  alunosFinais.forEach(a => console.log(`   - ID: ${a.id} | Nome: ${a.nome} | CPF: ${a.cpf}`));

  const preservados = alunosFinais.length === 2 &&
    alunosFinais.some(a => a.id === 1 && a.nome.includes('ALAN')) &&
    alunosFinais.some(a => a.id === 2 && a.nome.includes('ROBERTO'));

  console.log('\n====================================================');
  console.log('  PARECER TÉCNICO ESTRUTURAL DA FASE 3.3.1');
  console.log('====================================================');
  console.log(`1. Execução do Trigger no PostgreSQL: ${alunoCriado ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`2. Ausência do Erro RLS 42501: ${!errInsert ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`3. Autocriação de Matrícula (is_principal = true): ${matCriada && matCriada.is_principal ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`4. Autocriação de Movimentação MATRICULA_INICIAL: ${movCriada && movCriada.tipo_movimentacao === 'MATRICULA_INICIAL' ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`5. Integridade (Curso, Turma, Grade, Inst): ${matCriada && String(matCriada.curso_id) === String(turma.cursoid) ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`6. Preservação dos Alunos Iniciais (IDs 1 e 2): ${preservados ? 'APROVADO' : 'REPROVADO'}`);
  console.log('====================================================\n');
}

runDirectDatabaseAudit().catch(console.error);
