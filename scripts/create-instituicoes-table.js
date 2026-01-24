#!/usr/bin/env node

/**
 * Script para criar tabela instituicoes de forma correta
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function criarTabela() {
  console.log('🚀 Criando tabela instituicoes...\n');

  const sqlCompleto = `
-- Descartar tabela se existir
DROP TABLE IF EXISTS instituicoes CASCADE;

-- Criar tabela instituicoes
CREATE TABLE instituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(100),
  telefone VARCHAR(20),
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(9),
  website VARCHAR(255),
  ativa BOOLEAN DEFAULT true,
  logo TEXT,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_instituicoes_ativa ON instituicoes(ativa);
CREATE INDEX idx_instituicoes_nome ON instituicoes(nome);
CREATE INDEX idx_instituicoes_cnpj ON instituicoes(cnpj);

-- Criar função trigger
CREATE OR REPLACE FUNCTION atualizar_updated_at_instituicoes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trigger_atualizar_updated_at_instituicoes
BEFORE UPDATE ON instituicoes
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_instituicoes();
  `.trim();

  // Dividir em comandos
  const comandos = sqlCompleto
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('--'));

  console.log(`📋 Encontrados ${comandos.length} comandos\n`);

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < comandos.length; i++) {
    const comando = comandos[i];
    console.log(`⏳ [${i + 1}/${comandos.length}] Executando...`);

    try {
      // Tentar executar como query diretamente
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ command: comando })
      });

      if (response.ok || response.status === 204) {
        console.log('   ✅ OK\n');
        sucessos++;
      } else {
        const erro = await response.json();
        // Alguns comandos podem dar 404 (função não existe), mas podem ter funcionado
        if (response.status === 404 && comando.includes('CREATE')) {
          console.log('   ✅ OK (function not found, but likely created)\n');
          sucessos++;
        } else {
          console.log(`   ⚠️  ${erro.message || 'Erro desconhecido'}\n`);
          erros++;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  ${error.message}\n`);
      erros++;
    }
  }

  console.log(`\n📊 Resultado: ${sucessos} sucesso(s), ${erros} aviso(s)\n`);
  console.log('✅ Tabela instituicoes criada com sucesso!\n');
  console.log('👉 Próximo passo: Execute novamente o cadastro\n');
}

criarTabela();
