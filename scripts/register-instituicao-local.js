#!/usr/bin/env node

/**
 * Script para registrar instituição via API local do Next.js
 */

require('dotenv').config({ path: '.env.local' });

const novaInstituicao = {
  nome: 'INOVE TECNICO',
  cnpj: '24484696000137',
  email: 'inovetec@creeser.com.br',
  telefone: '91993121501',
  website: 'creeser.com.br',
  cidade: 'abaetetuba',
  estado: 'PA',
  cep: '67013012',
  endereco: 'rua central, 652, centro',
  descricao: '',
  ativa: true
};

async function registrarInstituicao() {
  console.log('🚀 Registrando instituição INOVE TECNICO...\n');
  console.log('📋 Dados:');
  console.log(JSON.stringify(novaInstituicao, null, 2));
  console.log('\n⏳ Enviando para API local...\n');

  try {
    // Usar localhost:3000 para a API local
    const response = await fetch('http://localhost:3000/api/instituicoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novaInstituicao)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCESSO! Instituição cadastrada!\n');
      console.log('📊 Resposta da API:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n🎉 Instituição salva com ID:', data[0].id);
      console.log('\n👉 Próxima ação:');
      console.log('   1. Recarregue a página ou vá para /admin/configuracoes/empresa');
      console.log('   2. Vá para /admin/alunos/novo');
      console.log('   3. O dropdown em "INSTITUIÇÃO" agora mostrará "INOVE TECNICO"!');
    } else {
      console.log('❌ ERRO ao cadastrar:\n');
      console.log('Status:', response.status);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (erro) {
    console.error('❌ Erro na requisição:', erro.message);
    console.log('\n💡 Dica: Certifique-se que o servidor Next.js está rodando em http://localhost:3000');
  }
}

registrarInstituicao();
