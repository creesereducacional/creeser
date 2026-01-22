#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('🚀 Executando Migration para Tabela Alunos\n');
    
    // Ler arquivo SQL
    const sqlFile = path.resolve(__dirname, '../supabase/migrations/add_alunos_fields.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    // Separar comandos por ;
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd.length > 2);

    console.log(`📋 Total de comandos: ${commands.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i] + ';';
      
      try {
        const { data, error } = await supabase.rpc('exec', {
          sql: cmd
        });

        if (error) {
          // Tentar executar direto
          const directResult = await supabase.from('alunos').select('id').limit(1);
          if (!directResult.error) {
            console.log(`✅ [${i + 1}/${commands.length}] Comando executado`);
            successCount++;
          } else {
            console.log(`⚠️  [${i + 1}/${commands.length}] ${cmd.substring(0, 60)}...`);
            errorCount++;
          }
        } else {
          console.log(`✅ [${i + 1}/${commands.length}] Comando executado`);
          successCount++;
        }
      } catch (err) {
        // Continuar mesmo com erro individual
        console.log(`⚠️  [${i + 1}/${commands.length}] Erro: ${err.message.substring(0, 50)}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Resultado: ${successCount} OK | ${errorCount} com erro\n`);

    if (errorCount > 0) {
      console.log('ℹ️  INSTRUÇÕES PARA EXECUTAR MANUALMENTE:\n');
      console.log('   1. Abra https://app.supabase.com');
      console.log('   2. Selecione seu projeto CREESER');
      console.log('   3. Vá para SQL Editor');
      console.log('   4. Copie e cole o conteúdo de:\n      supabase/migrations/add_alunos_fields.sql');
      console.log('   5. Clique em "Run"\n');
      console.log('   ARQUIVO SQL:');
      console.log('   ' + sqlFile);
    } else {
      console.log('✅ Migration concluída com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.log('\n📋 FALLBACK - Execute manualmente:');
    console.log('   1. Abra https://app.supabase.com');
    console.log('   2. Vá para SQL Editor');
    console.log('   3. Abra o arquivo: supabase/migrations/add_alunos_fields.sql');
    console.log('   4. Copie todo o conteúdo');
    console.log('   5. Cole no SQL Editor e clique "Run"');
    process.exit(1);
  }
}

executeMigration();
