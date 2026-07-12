// Verificar colunas da tabela public.leads
// Local: c:\PROJETOS\creeser\scripts\check-leads-columns.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('alunos').select('*').limit(1);
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Colunas encontradas:', Object.keys(data[0] || {}));
  }
}

check();
