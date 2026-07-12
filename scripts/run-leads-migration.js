// Executar a migration de Leads via Supabase RPC
// Local: c:\PROJETOS\creeser\scripts\run-leads-migration.js

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

async function executarMigration() {
  try {
    const sql = fs.readFileSync('supabase/migrations/20260712_create_vendas_comerciais.sql', 'utf-8');
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: sql })
      }
    );

    if (response.ok) {
      console.log('✅ Migration de colunas do leads aplicada com sucesso via RPC!');
    } else {
      const err = await response.text();
      console.error('❌ Erro ao aplicar migration:', err);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

executarMigration();
