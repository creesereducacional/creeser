const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = 'https://wjcbobcqyqdkludsbqgf.supabase.co';
let supabaseKey = 'sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ';

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

async function purgeWithServiceRole() {
  console.log('📌 Executando expurgo com Service Role Key...');
  
  const { data: res, error } = await supabase
    .from('alunos')
    .delete()
    .gt('id', 2)
    .select();

  if (error) {
    console.error('❌ Erro no expurgo:', error.message);
  } else {
    console.log(`✅ Registros expurgados: ${res.length}`);
  }

  const { data: restantes } = await supabase.from('alunos').select('id, nome, cpf');
  console.log('📌 Alunos remanescentes no banco (deve ser exatamente 2):');
  restantes.forEach(a => console.log(`   - ID: ${a.id} | Nome: ${a.nome} | CPF: ${a.cpf}`));
}

purgeWithServiceRole().catch(console.error);
