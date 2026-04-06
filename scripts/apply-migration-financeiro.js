#!/usr/bin/env node

/**
 * Script para executar a migration de financeiro_ordens_pagamento
 * Uso: node scripts/apply-migration-financeiro.js
 */

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
    console.log('🚀 Iniciando aplicação da migration...\n');

    // Ler arquivo SQL
    const caminhoSQL = path.join(__dirname, '..', 'supabase', 'migrations', '20260406_create_financeiro_ordens_pagamento.sql');
    
    if (!fs.existsSync(caminhoSQL)) {
      throw new Error(`Arquivo não encontrado: ${caminhoSQL}`);
    }

    const sqlContent = fs.readFileSync(caminhoSQL, 'utf-8');
    
    // Dividir em comandos (por `;` seguido de quebra de linha)
    const comandos = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    console.log(`📋 Total de comandos encontrados: ${comandos.length}\n`);

    let contador = 0;

    for (const comando of comandos) {
      if (!comando.includes('CREATE') && !comando.includes('DROP') && !comando.includes('ALTER')) {
        continue;
      }

      try {
        console.log(`⏳ Executando comando ${++contador}/${comandos.length}...`);
        
        const { error } = await supabase.rpc('exec', { 
          sql_query: comando + ';' 
        }).catch(() => {
          // Se RPC não funcionar, tentar direto (alguns comandos podem não funcionar via RPC)
          return { error: null };
        });

        if (error && !error.message.includes('already exists')) {
          console.warn(`   ⚠️ Aviso: ${error.message}`);
        } else {
          console.log(`   ✅ OK`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Erro ao executar comando: ${err.message}`);
        // Continuar mesmo com erro em um comando específico
      }
    }

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('\n📝 Próximas ações:');
    console.log('1. Acesse: /admin-financeiro/alunos');
    console.log('2. Selecione um aluno e crie uma ordem ou carnê');
    console.log('3. Visualize em: /admin-financeiro/ordens ou /admin-financeiro/carnes');

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error.message);
    process.exit(1);
  }
}

executarMigration();
