#!/usr/bin/env node

/**
 * Script para exportar dados dos alunos para CSV
 * Uso: node scripts/exportar-alunos-csv.js [output-file.csv]
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE não configuradas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define os campos que serão exportados
const CAMPOS_ALUNOS = [
  'id',
  'nome',
  'email',
  'cpf',
  'telefone_celular',
  'data_nascimento',
  'rg',
  'sexo',
  'estadocivil',
  'pai',
  'mae',
  'turmaid',
  'cursoid',
  'statusmatricula',
  'datamatricula',
  'ano_letivo',
  'apelido',
  'valor_mensalidade',
  'valor_matricula',
  'qtd_parcelas',
  'dia_pagamento',
  'plano_financeiro',
  'aluno_bolsista',
  'percentual_bolsa',
  'financiamento_estudantil',
  'percentual_financiamento',
  'created_at',
  'updated_at'
];

// Função para escapar e formatar valores para CSV
function escaparCSV(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }
  
  const str = String(valor);
  
  // Se contém aspas, vírgulas, quebras de linha, envolve em aspas e escapa
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

// Função para criar header do CSV
function criarHeader() {
  return CAMPOS_ALUNOS.map(campo => escaparCSV(campo)).join(',');
}

// Função para converter linha para CSV
function converterLinhaCSV(aluno) {
  return CAMPOS_ALUNOS.map(campo => escaparCSV(aluno[campo])).join(',');
}

async function exportarAlunos() {
  try {
    console.log('📥 Iniciando exportação de alunos...\n');

    // Buscar todos os alunos (com paginação se necessário)
    let todosAlunos = [];
    let pagina = 0;
    const tamanhoPagina = 500;
    let temMais = true;

    while (temMais) {
      const { data, error, count } = await supabase
        .from('alunos')
        .select('*', { count: 'exact' })
        .range(pagina * tamanhoPagina, (pagina + 1) * tamanhoPagina - 1)
        .order('id', { ascending: true });

      if (error) {
        console.error(`❌ Erro ao buscar alunos (página ${pagina}):`, error.message);
        process.exit(1);
      }

      if (!data || data.length === 0) {
        temMais = false;
      } else {
        todosAlunos = todosAlunos.concat(data);
        console.log(`✅ Página ${pagina + 1}: ${data.length} alunos carregados (Total: ${todosAlunos.length})`);
        pagina++;
      }
    }

    if (todosAlunos.length === 0) {
      console.log('⚠️  Nenhum aluno encontrado no banco de dados');
      process.exit(0);
    }

    // Preparar caminho do arquivo de saída
    const nomeArquivo = process.argv[2] || `alunos-export-${new Date().toISOString().split('T')[0]}.csv`;
    const caminhoArquivo = path.resolve(nomeArquivo);

    // Criar conteúdo CSV
    let conteudoCSV = criarHeader() + '\n';
    
    for (const aluno of todosAlunos) {
      conteudoCSV += converterLinhaCSV(aluno) + '\n';
    }

    // Escrever arquivo
    fs.writeFileSync(caminhoArquivo, conteudoCSV, 'utf-8');

    console.log('\n✅ Exportação concluída com sucesso!\n');
    console.log('📊 RESUMO:');
    console.log(`   • Total de alunos: ${todosAlunos.length}`);
    console.log(`   • Campos por aluno: ${CAMPOS_ALUNOS.length}`);
    console.log(`   • Arquivo salvo: ${caminhoArquivo}\n`);

    // Exibir primeiros registros como amostra
    console.log('📋 AMOSTRA DOS PRIMEIROS 3 ALUNOS:');
    console.log('---');
    for (let i = 0; i < Math.min(3, todosAlunos.length); i++) {
      const aluno = todosAlunos[i];
      console.log(`\nAluno ${i + 1}:`);
      console.log(`   • ID: ${aluno.id}`);
      console.log(`   • Nome: ${aluno.nome || 'N/A'}`);
      console.log(`   • Email: ${aluno.email || 'N/A'}`);
      console.log(`   • CPF: ${aluno.cpf || 'N/A'}`);
      console.log(`   • Turma ID: ${aluno.turmaid || 'N/A'}`);
      console.log(`   • Curso ID: ${aluno.cursoid || 'N/A'}`);
      console.log(`   • Status: ${aluno.statusmatricula || 'N/A'}`);
      console.log(`   • Valor Mensalidade: ${aluno.valor_mensalidade || 'N/A'}`);
    }

  } catch (erro) {
    console.error('❌ Erro durante exportação:', erro);
    process.exit(1);
  }
}

// Executar
exportarAlunos();
