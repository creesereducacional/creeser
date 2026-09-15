// Debugar consultas das APIs do módulo comercial
// Local: c:\PROJETOS\creeser\scripts\debug-comercial-api.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- TESTANDO CONSULTAS ---');

  // Teste 1: Query de matriculas.js
  console.log('\nTeste 1: Query alunos (matriculas.js)');
  const q1 = await supabase
    .from('alunos')
    .select('id, nome, email, telefone_celular, statusmatricula, cursoid, turmaid, captado_por_id, datacriacao')
    .order('datacriacao', { ascending: false })
    .limit(5);
  
  if (q1.error) {
    console.error('❌ Erro q1:', q1.error);
  } else {
    console.log('✅ Sucesso q1:', q1.data.length, 'registros');
  }

  // Teste 2: Query leads (matriculas.js)
  console.log('\nTeste 2: Query leads (matriculas.js)');
  const q2 = await supabase
    .from('leads')
    .select('aluno_convertido_id, curso_interesse, status')
    .limit(5);
  
  if (q2.error) {
    console.error('❌ Erro q2:', q2.error);
  } else {
    console.log('✅ Sucesso q2:', q2.data.length, 'registros');
  }

  // Teste 3: Query comissoes_comerciais (dashboard.js)
  console.log('\nTeste 3: Query comissoes_comerciais (dashboard.js)');
  const q3 = await supabase
    .from('comissoes_comerciais')
    .select('valor_comissao, status')
    .limit(5);
  
  if (q3.error) {
    console.error('❌ Erro q3:', q3.error);
  } else {
    console.log('✅ Sucesso q3:', q3.data.length, 'registros');
  }

  // Teste 4: Query count matriculas (dashboard.js)
  console.log('\nTeste 4: Query count alunos (dashboard.js)');
  const q4 = await supabase
    .from('alunos')
    .select('id', { count: 'exact', head: true })
    .not('captado_por_id', 'is', null);

  // Teste 5: Operador leads (dashboard.js)
  console.log('\nTeste 5: Query leads operador');
  const q5 = await supabase
    .from('leads')
    .select('status')
    .eq('captado_por_id', 1); // Exemplo ID
  if (q5.error) console.error('❌ Erro q5:', q5.error);
  else console.log('✅ Sucesso q5:', q5.data.length, 'registros');

  // Teste 6: Master operadores (dashboard.js)
  console.log('\nTeste 6: Query operadores do master');
  const q6 = await supabase
    .from('usuarios')
    .select('id, nomecompleto')
    .eq('comercial_master_id', 1)
    .eq('perfil', 'comercial_operador');
  if (q6.error) console.error('❌ Erro q6:', q6.error);
  else console.log('✅ Sucesso q6:', q6.data.length, 'registros');
}

test();
