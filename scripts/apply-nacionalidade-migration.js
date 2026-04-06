#!/usr/bin/env node

/**
 * Script para aplicar migration - Nacionalidade e Naturalidade
 * Uso: node scripts/apply-nacionalidade-migration.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE não configuradas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function aplicarMigration() {
  try {
    console.log('🚀 Aplicando migration: Nacionalidade e Naturalidade\n');

    // Executar os comandos SQL
    const sql = `
      ALTER TABLE public.alunos
      ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(100),
      ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);
      
      COMMENT ON COLUMN public.alunos.nacionalidade IS 'País de nacionalidade do aluno (ex: Brasileiro, Português)';
      COMMENT ON COLUMN public.alunos.naturalidade IS 'Cidade/Estado de naturalidade do aluno (ex: São Paulo-SP)';
    `;

    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Tentar com query simples (Supabase pode não ter exec_sql)
      console.log('⚠️  Metodo 1 falhou, tentando metodo alternativo...\n');

      // Tenta apenas verificar se as colunas existem
      const { data: alunos, error: checkError } = await supabase
        .from('alunos')
        .select('nacionalidade, naturalidade')
        .limit(1);

      if (checkError && !checkError.message.includes('undefined column')) {
        // Erro real, não é coluna ausente
        console.error('❌ Erro ao verificar colunas:', checkError.message);
        process.exit(1);
      }

      if (checkError) {
        console.log('📋 Campos não existem ainda. A migration será aplicada via console Supabase.');
        console.log('\n📌 Para aplicar a migration manualmente:');
        console.log('1. Abra: https://app.supabase.com/project/wjcbobcqyqdkludsbqgf/sql/new');
        console.log('2. Cole o SQL abaixo e execute:');
        console.log('\n---');
        console.log(sql);
        console.log('---\n');
        process.exit(0);
      }

      console.log('✅ Colunas já existem!');
    } else {
      console.log('✅ Migration aplicada com sucesso!');
    }

    console.log('\n📊 RESUMO:');
    console.log('   • Campo: nacionalidade (VARCHAR 100)');
    console.log('   • Campo: naturalidade (VARCHAR 100)');
    console.log('   • Status: ✅ Pronto para uso\n');

  } catch (erro) {
    console.error('❌ Erro durante migration:', erro);
    process.exit(1);
  }
}

// Executar
aplicarMigration();
