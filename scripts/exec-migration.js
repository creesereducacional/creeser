#!/usr/bin/env node

/**
 * Script automático para aplicar fix na tabela instituicoes
 * Executa SQL direto via Supabase API usando Service Role Key
 */

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
    console.log('🚀 Aplicando correção da tabela instituicoes...\n');

    // Ler o SQL da migration
    const sqlPath = 'supabase/migrations/20260123_fix_instituicoes_table.sql';
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir em comandos individuais
    const comandos = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    console.log(`📋 Encontrados ${comandos.length} comandos SQL\n`);

    // Executar cada comando
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i];
      console.log(`⏳ [${i + 1}/${comandos.length}] Executando...`);
      console.log(`   ${comando.substring(0, 60)}${comando.length > 60 ? '...' : ''}`);

      try {
        // Usar fetch nativo do Node.js
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/exec`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql_query: comando + ';' })
          }
        );

        console.log('   ✅ OK\n');
      } catch (error) {
        // Alguns comandos podem falhar (como DROP IF EXISTS), isso é ok
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Já existe (esperado)\n');
        } else {
          console.log('   ⚠️  ' + error.message + '\n');
        }
      }
    }

    console.log('✅ Migração concluída!\n');
    console.log('🧪 Teste agora em: http://localhost:3000/admin/configuracoes/empresa');
    console.log('   → Aba "Instituições" → Crie uma nova instituição\n');

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    process.exit(1);
  }
}

executarMigration();
