#!/usr/bin/env node

/**
 * Script para testar cadastro de instituição
 * Simula o envio de dados para a API
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testarCadastroInstituicao() {
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

  console.log('🚀 Testando cadastro de instituição...\n');
  console.log('📋 Dados:');
  console.log(JSON.stringify(novaInstituicao, null, 2));
  console.log('\n⏳ Enviando para API...\n');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/instituicoes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novaInstituicao)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCESSO! Instituição cadastrada!\n');
      console.log('📊 Resposta da API:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n🎉 Instituição salva com ID:', data.id);
      console.log('\n👉 Próxima ação: Recarregue a página ou clique em "Adicionar Instituição"');
      console.log('   O dropdown em "Inserir Aluno" agora mostrará esta instituição!');
    } else {
      console.log('❌ ERRO ao cadastrar:\n');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (erro) {
    console.error('❌ Erro na requisição:', erro.message);
  }
}

testarCadastroInstituicao();
