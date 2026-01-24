#!/usr/bin/env node

/**
 * Script automático para aplicar migrations do Supabase
 * Executa sem necessidade de intervençã manual
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const path = require('path');

const projectId = process.env.SUPABASE_PROJECT_ID || 'wjcbobcqyqdkludsbqgf';

async function aplicarMigrations() {
  try {
    console.log('🚀 Aplicando migrations do Supabase...\n');

    // Tentar usar supabase db push (requer acesso autenticado)
    console.log('⏳ Executando: npx supabase db push');
    
    try {
      execSync('npx supabase db push', {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      console.log('\n✅ Migrations aplicadas com sucesso!\n');
      console.log('📝 Próximos passos:');
      console.log('   1. Teste em http://localhost:3000/admin/configuracoes/empresa');
      console.log('   2. Vá para aba "Instituições"');
      console.log('   3. Crie uma nova instituição\n');
      
    } catch (err) {
      if (err.message.includes('requires Docker')) {
        console.log('\n⚠️  Docker não está disponível');
        console.log('\n💡 Alternativa: Use o Supabase Dashboard');
        console.log('   1. Acesse: https://app.supabase.com/project/' + projectId);
        console.log('   2. Vá para: SQL Editor');
        console.log('   3. Execute as migrations em: supabase/migrations/20260123_fix_instituicoes_table.sql\n');
      } else {
        throw err;
      }
    }

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    process.exit(1);
  }
}

aplicarMigrations();
