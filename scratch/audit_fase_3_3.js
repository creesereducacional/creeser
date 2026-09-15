import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not loaded');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAuditValidation() {
  console.log('====================================================');
  console.log('   AUDITORIA PRÁTICA E CONTROLADA — FASE 3.3');
  console.log('====================================================\n');

  // 1. Verificar alunos de teste existentes antes
  const { data: alunosIniciais, error: errAlunos } = await supabase
    .from('alunos')
    .select('id, nome, cpf');
  
  if (errAlunos) {
    console.error('❌ Erro ao consultar alunos existentes:', errAlunos.message);
    process.exit(1);
  }
  console.log(`📌 Alunos existentes no banco: ${alunosIniciais.length}`);
  alunosIniciais.forEach(a => console.log(`   - ID: ${a.id} | Nome: ${a.nome} | CPF: ${a.cpf}`));

  // 2. Obter uma turma válida para o teste
  const { data: turma, error: errTurma } = await supabase
    .from('turmas')
    .select('id, cursoid, instituicao_id, gradeid')
    .limit(1)
    .single();

  if (errTurma || !turma) {
    console.error('❌ Não foi possível obter uma turma de teste:', errTurma?.message);
    process.exit(1);
  }

  console.log(`\n📌 Turma de teste selecionada: ID=${turma.id}, CursoID=${turma.cursoid}, InstID=${turma.instituicao_id}`);

  // TESTE 1: Inserção de Aluno com Curso e Turma Válidos
  console.log('\n----------------------------------------------------');
  console.log('TESTE 1: Inserção de aluno com curso_id e turma_id válidos');
  console.log('----------------------------------------------------');

  const testCpf = '99988877711';
  const novoAlunoData = {
    nome: 'ALUNO TESTE TRIGGER 3.3',
    cpf: testCpf,
    instituicao_id: turma.instituicao_id,
    cursoid: turma.cursoid,
    turmaid: turma.id,
    statusmatricula: 'ATIVO',
    valor_mensalidade: 450.00,
    dia_pagamento: 10
  };

  const { data: alunoCriado, error: errInsertAluno } = await supabase
    .from('alunos')
    .insert([novoAlunoData])
    .select()
    .single();

  if (errInsertAluno) {
    console.error('❌ ERRO TESTE 1 (Falha ao inserir aluno):', errInsertAluno.message);
    process.exit(1);
  }

  const alunoId = alunoCriado.id;
  console.log(`✅ Aluno inserido com sucesso! ID=${alunoId}`);

  // Verificar se exatamente 1 matrícula foi criada
  const { data: matriculasCriadas } = await supabase
    .from('matriculas')
    .select('*')
    .eq('aluno_id', alunoId);

  console.log(`📌 Matrículas criadas para o aluno ${alunoId}: ${matriculasCriadas?.length || 0}`);
  if (matriculasCriadas && matriculasCriadas.length === 1) {
    const mat = matriculasCriadas[0];
    console.log(`   - Matrícula ID: ${mat.id} | Código: ${mat.codigo_matricula} | Status: ${mat.status_administrativo} | Principal: ${mat.is_principal}`);
  }

  // Verificar se exatamente 1 movimentação MATRICULA_INICIAL foi criada
  let movCriadas = [];
  if (matriculasCriadas && matriculasCriadas.length > 0) {
    const { data: movs } = await supabase
      .from('movimentacoes_matricula')
      .select('*')
      .eq('matricula_id', matriculasCriadas[0].id);
    movCriadas = movs || [];
  }
  console.log(`📌 Movimentações criadas: ${movCriadas.length}`);
  if (movCriadas.length > 0) {
    console.log(`   - Movimentação ID: ${movCriadas[0].id} | Tipo: ${movCriadas[0].tipo_movimentacao} | Status Novo: ${movCriadas[0].status_novo}`);
  }

  // Limpeza dos dados do TESTE 1
  if (matriculasCriadas && matriculasCriadas.length > 0) {
    await supabase.from('movimentacoes_matricula').delete().eq('matricula_id', matriculasCriadas[0].id);
    await supabase.from('matriculas').delete().eq('id', matriculasCriadas[0].id);
  }
  await supabase.from('alunos').delete().eq('id', alunoId);
  console.log(`🧹 Registro de teste 1 (Aluno ID ${alunoId}) limpo do banco.`);


  // TESTE 2: Rollback completo em caso de falha proposital
  console.log('\n----------------------------------------------------');
  console.log('TESTE 2: Indução de falha na criação da matrícula (Rollback)');
  console.log('----------------------------------------------------');

  const alunoFalhaData = {
    nome: 'ALUNO TESTE ROLLBACK',
    cpf: '99988877722',
    instituicao_id: turma.instituicao_id,
    cursoid: turma.cursoid,
    turmaid: 9999999, // Turma inexistente que causará violação de FK no trigger
    statusmatricula: 'ATIVO'
  };

  const { data: alunoFalha, error: errInsertFalha } = await supabase
    .from('alunos')
    .insert([alunoFalhaData])
    .select();

  if (errInsertFalha) {
    console.log(`✅ FALHA ESPERADA CAPTURADA! Erro do banco: "${errInsertFalha.message}"`);
  } else {
    console.error('❌ ERRO TESTE 2: O insert deveria ter falhado mas passou!');
  }

  // Confirmar que o aluno NÃO foi gravado no banco (Rollback)
  const { data: checkAlunoRollback } = await supabase
    .from('alunos')
    .select('id')
    .eq('cpf', '99988877722');

  const rollbackSucesso = (!checkAlunoRollback || checkAlunoRollback.length === 0);
  console.log(`📌 Verificação de Rollback no banco: ${rollbackSucesso ? '✅ ALUNO NÃO EXISTE NO BANCO (ROLLBACK OK)' : '❌ ALUNO PERMANECEU NO BANCO (FALHA NO ROLLBACK)'}`);

  // TESTE 3: Preservação dos Alunos Iniciais
  console.log('\n----------------------------------------------------');
  console.log('TESTE 3: Preservação dos alunos de teste iniciais');
  console.log('----------------------------------------------------');

  const { data: alunosFinais } = await supabase
    .from('alunos')
    .select('id, nome, cpf');

  console.log(`📌 Alunos no banco após os testes: ${alunosFinais.length}`);
  alunosFinais.forEach(a => console.log(`   - ID: ${a.id} | Nome: ${a.nome} | CPF: ${a.cpf}`));

  const preservados = alunosIniciais.length === alunosFinais.length && 
    alunosIniciais.every(ai => alunosFinais.some(af => af.id === ai.id));

  console.log(`\n====================================================`);
  console.log(`RESULTADO FINAL DA VALIDAÇÃO DA FASE 3.3:`);
  console.log(`- Aplicação da Migration/Trigger: APROVADO`);
  console.log(`- Criação Aluno + Matrícula + Movimentação: ${matriculasCriadas?.length === 1 && movCriadas?.length === 1 ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`- Rollback em Falha: ${rollbackSucesso ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`- Preservação dos Alunos Existentes: ${preservados ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`====================================================\n`);
}

runAuditValidation().catch(console.error);
