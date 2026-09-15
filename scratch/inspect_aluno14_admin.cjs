const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = 'https://wjcbobcqyqdkludsbqgf.supabase.co';
let supabaseKey = 'sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ'; // Usar Service Role Key para ignorar RLS no SELECT

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
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAluno14WithServiceRole() {
  console.log('====================================================');
  console.log(' INSPEÇÃO ADMINISTRATIVA DIRETA DO ALUNO ID 14');
  console.log('====================================================\n');

  // Buscar aluno 14 com LEFT JOIN em matriculas e movimentacoes_matricula via Service Role (Bypass RLS)
  const { data: aluno, error: errA } = await supabase
    .from('alunos')
    .select(`
      id,
      nome,
      cursoid,
      turmaid,
      matriculas (
        id,
        aluno_id,
        curso_id,
        turma_id,
        grade_id,
        status_administrativo,
        is_principal,
        movimentacoes_matricula (
          id,
          tipo_movimentacao,
          matricula_id
        )
      )
    `)
    .eq('id', 14)
    .maybeSingle();

  if (errA) {
    console.error('❌ Erro ao consultar via Service Role:', errA.message);
  } else {
    console.log('📌 RESULTADO DA INSPEÇÃO ADMINISTRATIVA (BYPASS RLS):');
    console.log(`- Aluno ID: ${aluno?.id}`);
    console.log(`- Aluno Nome: ${aluno?.nome}`);
    console.log(`- Aluno CursoID: ${aluno?.cursoid}`);
    console.log(`- Aluno TurmaID: ${aluno?.turmaid}`);
    console.log(`- Matrículas Vinculadas: ${aluno?.matriculas?.length || 0}`);
    
    if (aluno?.matriculas && aluno.matriculas.length > 0) {
      aluno.matriculas.forEach((m, i) => {
        console.log(`  [Matrícula ${i + 1}] ID: ${m.id} | Status: ${m.status_administrativo} | Principal: ${m.is_principal}`);
        console.log(`    - Movimentações: ${m.movimentacoes_matricula?.length || 0}`);
        if (m.movimentacoes_matricula && m.movimentacoes_matricula.length > 0) {
          m.movimentacoes_matricula.forEach(mov => {
            console.log(`      * MovID: ${mov.id} | Tipo: ${mov.tipo_movimentacao}`);
          });
        }
      });
    }
  }

  // Verificar também se existem registros soltos em public.matriculas para aluno_id = 14
  const { data: rawMatriculas } = await supabase
    .from('matriculas')
    .select('*')
    .eq('aluno_id', 14);

  console.log(`\n📌 Consulta direta à tabela public.matriculas via Service Role para aluno_id = 14: ${rawMatriculas?.length || 0} registros encontrados.`);

  // Verificar também na tabela public.movimentacoes_matricula
  const { data: rawMovs } = await supabase
    .from('movimentacoes_matricula')
    .select('*');

  console.log(`📌 Total de registros na tabela public.movimentacoes_matricula via Service Role: ${rawMovs?.length || 0}`);
}

inspectAluno14WithServiceRole().catch(console.error);
