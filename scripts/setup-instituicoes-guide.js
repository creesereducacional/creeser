#!/usr/bin/env node

/**
 * Script para setup final da tabela instituicoes
 * Executa SQL via Dashboard do Supabase (manual one-time setup)
 */

const fs = require('fs');

console.log('🚀 SETUP FINAL - Tabela Instituicoes\n');
console.log('Como a REST API do Supabase não permite executar DDL direto,');
console.log('você precisa executar ESTE SQL UMA VEZ no Dashboard:\n');
console.log('=' .repeat(80));

const sql = fs.readFileSync('supabase/setup-instituicoes.sql', 'utf-8');
console.log(sql);

console.log('=' .repeat(80));
console.log('\n📝 Passo a passo:\n');
console.log('1. Acesse: https://app.supabase.com/project/wjcbobcqyqdkludsbqgf');
console.log('2. Clique em: SQL Editor (menu esquerdo)');
console.log('3. Cole o SQL acima');
console.log('4. Clique em: Run');
console.log('5. Pronto! A tabela será criada\n');
console.log('💡 Depois disso, vocêpoderá:');
console.log('   - Cadastrar instituições via interface');
console.log('   - Ver instituições no dropdown de alunos');
console.log('   - Tudo funciona automaticamente\n');

console.log('⏰ Tempo estimado: 30 segundos\n');
