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

async function simulateAluno14Logic() {
  console.log('====================================================');
  console.log(' SIMULAÇÃO LÓGICA PASSO A PASSO PARA O ALUNO ID 14');
  console.log('====================================================\n');

  // Query dados brutos reais do aluno 14
  const { data: a14, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('id', 14)
    .maybeSingle();

  if (error || !a14) {
    console.error('❌ Não foi possível carregar o aluno ID 14:', error?.message);
    process.exit(1);
  }

  console.log('📌 VALORES REAIS DE NEW NO ALUNO ID 14:');
  console.log(`- NEW.id: ${a14.id}`);
  console.log(`- NEW.instituicao_id: ${a14.instituicao_id}`);
  console.log(`- NEW.cursoid: ${a14.cursoid}`);
  console.log(`- NEW.turmaid: ${a14.turmaid}`);
  console.log(`- NEW.statusmatricula: ${a14.statusmatricula}`);
  console.log(`- NEW.ano_letivo: ${a14.ano_letivo}`);
  console.log(`- NEW.semestre: ${a14.semestre}`);
  console.log(`- NEW.datamatricula: ${a14.datamatricula}`);
  console.log(`- NEW.plano_financeiro: ${a14.plano_financeiro}`);
  console.log(`- NEW.valor_mensalidade: ${a14.valor_mensalidade}`);

  // Passo 1: Resolução de v_curso_id
  let v_curso_id = a14.cursoid;
  console.log(`\n1️⃣ Passo 1: v_curso_id inicial = ${v_curso_id}`);
  if (v_curso_id === null && a14.turmaid !== null) {
    const { data: t } = await supabase.from('turmas').select('cursoid').eq('id', a14.turmaid).maybeSingle();
    v_curso_id = t?.cursoid || null;
    console.log(`   Recuperado da turma ID ${a14.turmaid}: cursoid = ${v_curso_id}`);
  }
  console.log(`   Resultado v_curso_id: ${v_curso_id} -> Condição IF v_curso_id IS NULL acionada? ${v_curso_id === null}`);

  // Passo 2: IF EXISTS
  let exists = false;
  if (v_curso_id !== null) {
    const { data: mExist } = await supabase
      .from('matriculas')
      .select('id')
      .eq('aluno_id', a14.id)
      .eq('curso_id', v_curso_id)
      .in('status_administrativo', ['PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_TURMA', 'ATIVO']);
    exists = mExist && mExist.length > 0;
  }
  console.log(`\n2️⃣ Passo 2: Condição IF EXISTS (...) acionada? ${exists}`);

  // Passo 3: v_grade_id
  let v_grade_id = null;
  if (a14.turmaid !== null) {
    const { data: tGrade } = await supabase.from('turmas').select('gradeid').eq('id', a14.turmaid).maybeSingle();
    v_grade_id = tGrade?.gradeid || null;
  }
  console.log(`\n3️⃣ Passo 3: v_grade_id obtido da turma = ${v_grade_id}`);

  // Passo 4: v_status_admin
  let v_status_admin = 'ATIVO';
  if (a14.turmaid === null) {
    v_status_admin = 'AGUARDANDO_TURMA';
  } else {
    const statusUpper = String(a14.statusmatricula || 'ATIVO').toUpperCase();
    v_status_admin = statusUpper;
  }
  console.log(`\n4️⃣ Passo 4: v_status_admin final = ${v_status_admin}`);

  // Passo 5: Inspecionar Turma 1 real no banco
  const { data: turma1 } = await supabase.from('turmas').select('*').eq('id', 1).maybeSingle();
  console.log('\n📌 ESTRUTURA E INSTITUIÇÃO DA TURMA ID 1:');
  console.log(`- Turma ID 1 instituicao_id: ${turma1?.instituicao_id}`);
  console.log(`- Aluno 14 instituicao_id: ${a14.instituicao_id}`);
  console.log(`- Instituições conferem? ${String(turma1?.instituicao_id) === String(a14.instituicao_id)}`);
}

simulateAluno14Logic().catch(console.error);
