#!/usr/bin/env node

/**
 * Script para validar as tabelas criadas no Supabase
 * Uso: node scripts/validar-tabelas.js
 */

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

async function validarTabelas() {
  try {
    console.log('🔍 Validando tabelas no Supabase...\n');

    // 1. Validar tabela financeiro_ordens_pagamento
    console.log('📋 Tabela: financeiro_ordens_pagamento');
    const { data: ordensData, error: ordensError, count: ordensCount } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (ordensError) {
      console.log(`   ❌ Erro: ${ordensError.message}`);
    } else {
      console.log(`   ✅ Tabela existe`);
      console.log(`   📊 Total de registros: ${ordensCount}`);
    }

    // 2. Validar tabela financeiro_parcelas
    console.log('\n📋 Tabela: financeiro_parcelas');
    const { data: parcelasData, error: parcelasError, count: parcelasCount } = await supabase
      .from('financeiro_parcelas')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (parcelasError) {
      console.log(`   ❌ Erro: ${parcelasError.message}`);
    } else {
      console.log(`   ✅ Tabela existe`);
      console.log(`   📊 Total de registros: ${parcelasCount}`);
    }

    // 3. Validar tabela financeiro_boletos
    console.log('\n📋 Tabela: financeiro_boletos');
    const { data: boletosData, error: boletosError, count: boletosCount } = await supabase
      .from('financeiro_boletos')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (boletosError) {
      console.log(`   ❌ Erro: ${boletosError.message}`);
    } else {
      console.log(`   ✅ Tabela existe`);
      console.log(`   📊 Total de registros: ${boletosCount}`);
    }

    // 4. Validar relacionamentos
    console.log('\n🔗 Validando relacionamentos...');
    
    // Verificar se alunos tem dados
    const { count: alunosCount, error: alunosError } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (!alunosError) {
      console.log(`   ✅ Tabela alunos: ${alunosCount} registros`);
    } else {
      console.log(`   ❌ Erro ao verificar alunos: ${alunosError.message}`);
    }

    // 5. Listar primeiras ordens se existirem
    if (ordensCount > 0) {
      console.log('\n📝 Primeiras ordens cadastradas:');
      const { data: primeirasOrdens, error: erroOrdens } = await supabase
        .from('financeiro_ordens_pagamento')
        .select('id, aluno_id, tipo, descricao, valor_total, status, created_at')
        .limit(5)
        .order('created_at', { ascending: false });

      if (!erroOrdens) {
        primeirasOrdens.forEach((ordem, i) => {
          console.log(`   ${i + 1}. [${ordem.tipo}] ${ordem.descricao} - R$ ${ordem.valor_total} (${ordem.status})`);
        });
      }
    } else {
      console.log('\n📝 Nenhuma ordem cadastrada ainda');
    }

    console.log('\n✅ Validação concluída com sucesso!');
    console.log('\n📊 RESUMO:');
    console.log(`   • Ordens de Pagamento: ${ordensCount} registros`);
    console.log(`   • Parcelas: ${parcelasCount} registros`);
    console.log(`   • Boletos: ${boletosCount} registros`);
    console.log(`   • Alunos disponíveis: ${alunosCount} registros`);

  } catch (error) {
    console.error('\n❌ Erro ao validar tabelas:', error.message);
    process.exit(1);
  }
}

validarTabelas();
