const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE não configuradas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executarMigration() {
  try {
    console.log('🚀 Iniciando aplicação da migration Fase 1A...\n');

    const caminhoSQL = path.join(__dirname, '..', 'supabase', 'migrations', '20260615_fase1a_financeiro_aluno.sql');
    
    if (!fs.existsSync(caminhoSQL)) {
      throw new Error(`Arquivo não encontrado: ${caminhoSQL}`);
    }

    const sqlContent = fs.readFileSync(caminhoSQL, 'utf-8');
    
    console.log('⏳ Executando SQL via RPC exec_sql...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error(`❌ Erro ao aplicar SQL: ${error.message}`);
      process.exit(1);
    } else {
      console.log(`✅ SQL executado com sucesso!`);
    }

    console.log('\n✅ Fim da migração.');

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error.message);
    process.exit(1);
  }
}

executarMigration();
