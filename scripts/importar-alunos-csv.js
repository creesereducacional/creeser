#!/usr/bin/env node

/**
 * Script para importar alunos a partir de arquivo CSV
 * Uso: node scripts/importar-alunos-csv.js <caminho-arquivo.csv> [--skip-duplicates] [--dry-run]
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE não configuradas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parâmetros
const caminhoArquivo = process.argv[2];
const skipDuplicates = process.argv.includes('--skip-duplicates');
const dryRun = process.argv.includes('--dry-run');

if (!caminhoArquivo) {
  console.error('❌ Erro: É necessário fornecer o caminho do arquivo CSV');
  console.error('\nUso: node scripts/importar-alunos-csv.js <arquivo.csv> [--skip-duplicates] [--dry-run]');
  console.error('\nOpções:');
  console.error('  --skip-duplicates  Pula alunos com CPF duplicado');
  console.error('  --dry-run         Simula a importação sem alterar banco');
  process.exit(1);
}

// Verificar se arquivo existe
if (!fs.existsSync(caminhoArquivo)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${caminhoArquivo}`);
  process.exit(1);
}

// Função para fazer parsing de CSV simples
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Aspas duplas = aspas escapadas
        current += '"';
        i++; // Pular próxima aspas
      } else {
        // Alternar estado de aspas
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Fim de campo
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Adicionar último campo
  result.push(current.trim());

  return result;
}

// Função para converter valores para tipos corretos
function converterValor(valor, nomeCampo) {
  if (!valor || valor === '') {
    return null;
  }

  // Campos booleanos
  if (['aluno_bolsista'].includes(nomeCampo)) {
    return valor.toLowerCase() === 'true' || valor === '1' || valor.toLowerCase() === 'sim';
  }

  // Campos numéricos inteiros
  if (['id', 'turmaid', 'cursoid', 'ano_letivo', 'qtd_parcelas', 'dia_pagamento'].includes(nomeCampo)) {
    return parseInt(valor, 10) || null;
  }

  // Campos numéricos decimais
  if (['valor_mensalidade', 'valor_matricula', 'percentual_bolsa', 'percentual_financiamento'].includes(nomeCampo)) {
    return parseFloat(valor) || null;
  }

  // Campos de data
  if (['data_nascimento', 'data_expedicao_rg', 'datamatricula'].includes(nomeCampo)) {
    // Validar se é data válida
    const data = new Date(valor);
    if (!isNaN(data.getTime())) {
      return valor;
    }
    return null;
  }

  // Campos de timestamp
  if (['created_at', 'updated_at'].includes(nomeCampo)) {
    return valor;
  }

  return valor || null;
}

async function importarAlunos() {
  try {
    console.log('📥 Iniciando importação de alunos...\n');

    if (dryRun) {
      console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita no banco\n');
    }

    // Ler arquivo
    const fileStream = fs.createReadStream(caminhoArquivo);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let header = null;
    let linhaAtual = 0;
    const alunosParaInserir = [];
    const erros = [];
    const cpfsDuplicados = new Set();

    console.log('📖 Lendo arquivo CSV...');

    for await (const line of rl) {
      linhaAtual++;

      // Pular linhas vazias
      if (!line.trim()) continue;

      if (header === null) {
        // Primeira linha = headers
        header = parseCSVLine(line);
        console.log(`✅ Headers encontrados: ${header.length} campos\n`);
        continue;
      }

      // Parse da linha
      const valores = parseCSVLine(line);

      if (valores.length !== header.length) {
        erros.push(`Linha ${linhaAtual}: Número de campos incorreto (esperado ${header.length}, encontrado ${valores.length})`);
        continue;
      }

      // Montar objeto aluno
      const aluno = {};
      for (let i = 0; i < header.length; i++) {
        const nomeCampo = header[i];
        const valor = valores[i];
        aluno[nomeCampo] = converterValor(valor, nomeCampo);
      }

      // Validações
      if (!aluno.nome || !aluno.nome.trim()) {
        erros.push(`Linha ${linhaAtual}: Nome é obrigatório`);
        continue;
      }

      // Checar CPF duplicado
      if (aluno.cpf) {
        if (cpfsDuplicados.has(aluno.cpf)) {
          erros.push(`Linha ${linhaAtual}: CPF duplicado no arquivo: ${aluno.cpf}`);
          continue;
        }
        cpfsDuplicados.add(aluno.cpf);
      }

      alunosParaInserir.push({ linha: linhaAtual, aluno });
    }

    console.log(`✅ Leitura concluída: ${alunosParaInserir.length} alunos para importar\n`);

    if (erros.length > 0) {
      console.log('⚠️  ERROS ENCONTRADOS NA LEITURA:');
      erros.slice(0, 10).forEach(erro => console.log(`   • ${erro}`));
      if (erros.length > 10) {
        console.log(`   ... e mais ${erros.length - 10} erros`);
      }
      console.log();
    }

    if (alunosParaInserir.length === 0) {
      console.log('❌ Nenhum aluno válido para importar');
      process.exit(1);
    }

    // Se skip-duplicates, checar CPFs existentes
    if (skipDuplicates) {
      console.log('🔍 Verificando CPFs duplicados no banco...');
      const cpfsNoCSV = alunosParaInserir.map(a => a.aluno.cpf).filter(c => c);
      
      if (cpfsNoCSV.length > 0) {
        const { data: alunosExistentes } = await supabase
          .from('alunos')
          .select('cpf')
          .in('cpf', cpfsNoCSV);

        const cpfsExistentes = new Set(alunosExistentes?.map(a => a.cpf) || []);
        
        const antesCount = alunosParaInserir.length;
        for (let i = alunosParaInserir.length - 1; i >= 0; i--) {
          if (cpfsExistentes.has(alunosParaInserir[i].aluno.cpf)) {
            alunosParaInserir.splice(i, 1);
          }
        }
        
        const removidos = antesCount - alunosParaInserir.length;
        if (removidos > 0) {
          console.log(`⏭️  Pulados ${removidos} alunos com CPF duplicado\n`);
        }
      }
    }

    if (alunosParaInserir.length === 0) {
      console.log('⚠️  Nenhum aluno para importar após validação');
      process.exit(0);
    }

    if (dryRun) {
      console.log('📋 PREVIEW - Primeiros 3 alunos que seriam importados:');
      for (let i = 0; i < Math.min(3, alunosParaInserir.length); i++) {
        const { aluno } = alunosParaInserir[i];
        console.log(`\n  ${i + 1}. ${aluno.nome}`);
        console.log(`     Email: ${aluno.email || 'N/A'}`);
        console.log(`     CPF: ${aluno.cpf || 'N/A'}`);
        if (aluno.turmaid) console.log(`     Turma ID: ${aluno.turmaid}`);
        if (aluno.cursoid) console.log(`     Curso ID: ${aluno.cursoid}`);
      }
      console.log('\n✅ Simulação concluída. Execute sem --dry-run para importar.');
      process.exit(0);
    }

    // Inserir alunos
    console.log(`📌 Importando ${alunosParaInserir.length} alunos...\n`);

    let sucesso = 0;
    let falhas = 0;

    for (const { linha, aluno } of alunosParaInserir) {
      // Remover campos com null para deixar o Supabase usar defaults
      const alunoLimpo = Object.fromEntries(
        Object.entries(aluno).filter(([_, v]) => v !== null && v !== '')
      );

      const { error } = await supabase
        .from('alunos')
        .insert([alunoLimpo]);

      if (error) {
        console.log(`   ❌ Erro na linha ${linha} (${aluno.nome}): ${error.message}`);
        falhas++;
      } else {
        sucesso++;
      }
    }

    console.log('\n✅ IMPORTAÇÃO CONCLUÍDA:\n');
    console.log(`   • Sucesso: ${sucesso} alunos`);
    console.log(`   • Falhas: ${falhas} alunos`);
    console.log(`   • Total: ${sucesso + falhas} alunos processados\n`);

  } catch (erro) {
    console.error('❌ Erro durante importação:', erro);
    process.exit(1);
  }
}

// Executar
importarAlunos();
