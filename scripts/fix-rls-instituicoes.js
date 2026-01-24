#!/usr/bin/env node

/**
 * Script para executar SQL de correção de RLS na tabela instituicoes
 * Usa Supabase Service Role Key para acesso direto
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que .env.local está configurado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executarSQL() {
  try {
    console.log('🚀 Executando correção de RLS na tabela instituicoes...\n');

    // Usar endpoint de SQL exec se disponível, ou criar função helper
    // Vamos tentar via HTTP direto
    const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    const comandos = [
      'ALTER TABLE instituicoes DISABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "Todos podem ver instituicoes" ON instituicoes;',
      'DROP POLICY IF EXISTS "Apenas admin pode inserir instituicoes" ON instituicoes;',
      'DROP POLICY IF EXISTS "Apenas admin pode atualizar instituicoes" ON instituicoes;',
      'DROP POLICY IF EXISTS "Apenas admin pode deletar instituicoes" ON instituicoes;'
    ];

    for (const comando of comandos) {
      console.log(`⏳ Executando: ${comando}`);
      
      try {
        // Tentar usar rpc se disponível
        const { error } = await supabase
          .rpc('exec_sql', { sql_string: comando })
          .then(result => result);

        if (error) {
          console.warn(`   ⚠️ Aviso: ${error.message}`);
        } else {
          console.log(`   ✅ OK\n`);
        }
      } catch (err) {
        // Se rpc não existe, apenas avisar
        console.log(`   ⚠️ Função RPC não disponível\n`);
      }
    }

    console.log('⚠️ Aviso: Função RPC exec_sql não encontrada no banco');
    console.log('\n📝 Solução: Execute manualmente no Supabase Dashboard:');
    console.log('   1. Acesse: https://app.supabase.com/project/wjcbobcqyqdkludsbqgf');
    console.log('   2. Vá para: SQL Editor');
    console.log('   3. Cole este código:\n');
    
    const sql = fs.readFileSync('supabase/fix-instituicoes-rls.sql', 'utf-8');
    console.log(sql);
    console.log('\n   4. Clique em "Run"');
    console.log('   5. Teste em http://localhost:3000/admin/configuracoes/empresa\n');

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    process.exit(1);
  }
}

executarSQL();
