// pages/api/test-alunos.js - DEBUG
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    console.log('📋 Test API - Testando conexão com Supabase');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');

    // Teste 1: Listar colunas
    console.log('\n1️⃣ Tentando listar alunos...');
    const { data: listData, error: listError } = await supabase
      .from('alunos')
      .select('*')
      .limit(1);

    if (listError) {
      console.error('❌ Erro ao listar:', listError);
      return res.status(400).json({ 
        teste: 'list',
        erro: listError.message,
        codigo: listError.code
      });
    }

    console.log('✅ Lista OK. Estrutura encontrada:');
    if (listData && listData[0]) {
      console.log('Colunas:', Object.keys(listData[0]));
    }

    // Teste 2: Inserir registro simples
    console.log('\n2️⃣ Tentando inserir registro de teste...');
    const testData = {
      instituicao: 'CREESER',
      statusmatricula: 'ATIVO',
      datamatricula: new Date().toISOString().split('T')[0],
      endereco: 'Rua Teste',
      numeroendereco: '123',
      bairro: 'Bairro Teste',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310100'
    };

    console.log('Dados para inserir:', JSON.stringify(testData, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('alunos')
      .insert([testData])
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError);
      return res.status(400).json({ 
        teste: 'insert',
        erro: insertError.message,
        codigo: insertError.code,
        detalhes: insertError
      });
    }

    console.log('✅ Inserção OK:', insertData);

    res.status(200).json({ 
      sucesso: true,
      mensagem: 'Testes executados com sucesso!',
      listaAlunos: listData,
      novoAluno: insertData
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    res.status(500).json({ 
      erro: error.message,
      stack: error.stack
    });
  }
}
