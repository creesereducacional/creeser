#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspecionarSchema() {
  console.log('\n📋 INSPECIONANDO SCHEMA DO SUPABASE\n');
  
  const tabelas = ['usuarios', 'unidades', 'cursos', 'alunos'];
  
  for (const tabela of tabelas) {
    try {
      // Tentar inserir um registro e ver qual erro vem
      const { error } = await supabase.from(tabela).insert({
        nome_teste: 'teste',
        nomeCompleto: 'teste',
        nome: 'teste'
      });
      
      if (error) {
        console.log(`${tabela}: ${error.message}`);
      }
    } catch (e) {
      console.log(`${tabela}: ${e.message}`);
    }
  }
}

inspecionarSchema();
