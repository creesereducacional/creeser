#!/usr/bin/env node

/**
 * Script para executar migration no Supabase
 * Adiciona novos campos à tabela alunos para suportar o formulário completo
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SQL_MIGRATION = `
-- Adicionar campos pessoais
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estadoCivil VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS sexo VARCHAR(10);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_expedicao_rg DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS orgao_expedidor_rg VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone_celular VARCHAR(20);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Adicionar filiação
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pai VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS mae VARCHAR(255);

-- Adicionar campos administrativos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS instituicao VARCHAR(255) DEFAULT 'CREESER';
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_letivo INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS turno_integral BOOLEAN DEFAULT false;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS semestre VARCHAR(10);

-- Adicionar campos de registro de nascimento
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS termo VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS folha VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS livro VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_cartorio VARCHAR(255);

-- Adicionar campos de endereço completo
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS complemento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_naturalidade CHAR(2);

-- Adicionar informações de ensino médio
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estabelecimento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_conclusao INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS endereco_dem VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS municipio_dem VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_dem CHAR(2);

-- Adicionar informações de deficiência
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pessoa_com_deficiencia BOOLEAN DEFAULT false;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_deficiencia VARCHAR(255);

-- Adicionar foto
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS foto TEXT;

-- Adicionar informações INEP
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_escola_anterior VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pais_origem VARCHAR(100) DEFAULT 'BRA - Brasil';
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_social BOOLEAN DEFAULT false;
`;

async function executarMigration() {
  console.log('\n🚀 Executando Migration para Tabela Alunos\n');
  
  try {
    // Dividir SQL em comandos individuais
    const comandos = SQL_MIGRATION
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    console.log(`📋 Total de comandos: ${comandos.length}`);
    console.log('');

    let sucesso = 0;
    let erros = 0;

    for (let i = 0; i < comandos.length; i++) {
      const cmd = comandos[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: cmd });
        
        if (error) {
          // Se é erro "coluna já existe", não é fatal
          if (error.message.includes('already exists') || error.message.includes('já existe')) {
            console.log(`⏭️  ${cmd.substring(0, 60)}... (já existe)`);
          } else {
            console.log(`⚠️  ${cmd.substring(0, 60)}... : ${error.message}`);
            erros++;
          }
        } else {
          console.log(`✅ ${cmd.substring(0, 60)}...`);
          sucesso++;
        }
      } catch (e) {
        console.log(`❌ Erro ao executar comando ${i + 1}: ${e.message}`);
        erros++;
      }
    }

    console.log(`\n📊 Resultado: ${sucesso} OK | ${erros} com problema\n`);

    // Como o RPC talvez não exista, tentar abordagem alternativa
    console.log('ℹ️  Se houver erros, execute manualmente no Supabase SQL Editor:');
    console.log('   1. Abra https://app.supabase.com');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá para SQL Editor');
    console.log('   4. Copie e cole o conteúdo de: supabase/migrations/add_alunos_fields.sql');
    console.log('   5. Clique em "Run"\n');

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.log('\n💡 Alternativa: Execute manualmente via Supabase Dashboard');
  }
}

executarMigration();
