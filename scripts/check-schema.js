#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSchema() {
  console.log('📋 VERIFICANDO SCHEMA DAS TABELAS NO SUPABASE\n');
  
  const tabelas = ['usuarios', 'alunos', 'professores', 'cursos', 'disciplinas', 'turmas', 'noticias', 'responsaveis'];
  
  for (const tabela of tabelas) {
    try {
      // Tentar fazer um SELECT para ver os nomes das colunas
      const { data, error } = await supabase
        .from(tabela)
        .select()
        .limit(0);
      
      if (error) {
        console.log(`❌ ${tabela}: ${error.message}`);
      } else {
        const colunas = data ? Object.keys(data[0] || {}) : [];
        console.log(`✅ ${tabela}: ${Object.keys(data ? data[0] || {} : {}).join(', ')}`);
      }
    } catch (e) {
      // Tentar outro método
      const { data, error } = await supabase.from(tabela).select().limit(1);
      if (data && data[0]) {
        console.log(`✅ ${tabela}: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log(`❌ ${tabela}: sem dados ou erro`);
      }
    }
  }
}

verificarSchema().catch(console.error);
