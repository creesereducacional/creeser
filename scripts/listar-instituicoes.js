#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function listarInstituicoes() {
  console.log('🏫 Listando todas as instituições...\n');

  try {
    const response = await fetch('http://localhost:3000/api/instituicoes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Instituições cadastradas:\n');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n📊 Total:', data.length, 'instituição(ões)');
    } else {
      console.log('❌ ERRO:', JSON.stringify(data, null, 2));
    }
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  }
}

listarInstituicoes();
