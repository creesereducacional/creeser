#!/usr/bin/env node

/**
 * MIGRAÇÃO PRAGMÁTICA DE DADOS DE EXEMPLO
 * Para desenvolvimento - migra dados JSON com mapeamento inteligente
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de campos: JSON -> Supabase (CAMELCASE)
const mapeamentos = {
  usuarios: {
    id: 'id',
    nomeCompleto: null,
    nome: 'nome',
    email: 'email',
    cpf: 'cpf',
    dataNascimento: null,
    whatsapp: 'whatsapp',
    tipo: 'tipo',
    status: 'status',
    foto: 'foto'
  },
  unidades: {
    id: 'id',
    nome: 'nome',
    descricao: 'descricao',
    endereco: 'endereco',
    cidade: 'cidade',
    estado: 'estado',
    cep: 'cep',
    telefonePrincipal: 'telefonePrincipal',
    email: 'email',
    responsavel: 'responsavel',
    ativo: 'ativo'
  },
  cursos: {
    id: 'id',
    nome: 'nome',
    descricaoGeral: null,
    duracao: 'duracao',
    cargaHoraria: null,
    cargaHorariaEstagio: null,
    cargaHorariaAtividadesComplementares: null,
    mediaRequerida: null,
    frequenciaRequerida: null,
    nivelEnsino: null,
    grauConferido: null,
    tituloConferido: null,
    valorInscricao: null,
    valorMensalidade: null,
    layoutNotas: null,
    idCenso: null,
    portariaRecredenciamento: null,
    exibirCRM: null,
    exibirBibliotecaVirtual: null,
    situacao: 'situacao'
  },
  disciplinas: {
    id: 'id',
    nome: 'nome',
    codigo: 'codigo',
    cursoId: 'cursoId',
    cargaHoraria: 'cargaHoraria',
    ementa: 'ementa',
    objetivos: 'objetivos',
    periodo: 'periodo',
    situacao: 'situacao'
  },
  grades: {
    id: 'id',
    nome: 'nome',
    descricao: 'descricao',
    cursoId: 'cursoId'
  },
  turmas: {
    id: 'id',
    nome: 'nome',
    unidadeId: 'unidadeId',
    unidade: null,
    cursoId: 'cursoId',
    curso: null,
    gradeId: 'gradeId',
    grade: null,
    situacao: 'situacao',
    dataInicio: 'dataInicio',
    dataFim: 'dataFim',
    capacidadeMaxima: 'capacidadeMaxima',
    descricao: 'descricao'
  },
  alunos: {
    id: null,
    usuarioId: null,
    matricula: 'matricula',
    cursoId: null,
    turmaId: null,
    statusMatricula: null,
    status: null,
    dataMatricula: 'dataMatricula',
    endereco: 'endereco',
    cidade: 'cidade',
    estado: 'estado',
    cep: 'cep',
    bairro: 'bairro',
    numeroEndereco: 'numeroEndereco',
    numero: 'numeroEndereco',
    responsavelId: null
  },
  professores: {
    id: 'id',
    usuarioId: 'usuarioId',
    matricula: 'matricula',
    especialidade: 'especialidade',
    titulacao: 'titulacao',
    dataPrimeiraContratacao: 'dataPrimeiraContratacao',
    statusVinculo: 'statusVinculo',
    status: 'statusVinculo'
  },
  funcionarios: {
    id: 'id',
    usuarioId: null,
    matricula: 'matricula',
    funcao: 'funcao',
    rg: 'rg',
    telefoneCelular: null,
    endereco: 'endereco',
    numero: 'numero',
    bairro: 'bairro',
    cep: 'cep',
    cidade: 'cidade',
    uf: 'uf',
    dtNascimento: null,
    dtAdmissao: null,
    status: 'status',
    banco: 'banco',
    agencia: 'agencia',
    pix: 'pix',
    obs: 'obs'
  },
  responsaveis: {
    id: 'id',
    usuarioId: 'usuarioId',
    parentesco: 'parentesco',
    profissao: 'profissao',
    endereco: 'endereco',
    cidade: 'cidade',
    estado: 'estado',
    cep: 'cep',
    bairro: 'bairro',
    numeroEndereco: 'numeroEndereco',
    numero: 'numeroEndereco',
    telefoneCelular: 'telefoneCelular',
    whatsapp: 'telefoneCelular'
  },
  matriculadores: {
    id: 'id',
    usuarioId: 'usuarioId',
    funcao: 'funcao',
    comissao: 'comissao',
    ativo: 'ativo'
  },
  noticias: {
    id: null,
    titulo: 'titulo',
    descricao: 'descricao',
    conteudo: 'conteudo',
    imagem: 'imagem',
    autorId: null,
    destaque: 'destaque',
    publica: 'publica',
    dataPublicacao: null
  }
};

const ordem = ['unidades', 'usuarios', 'cursos', 'disciplinas', 'grades', 'turmas', 'alunos', 'professores', 'funcionarios', 'responsaveis', 'matriculadores', 'noticias'];

async function migrar(tabela) {
  const arquivo = path.join(__dirname, '..', 'data', `${tabela}.json`);
  
  if (!fs.existsSync(arquivo)) {
    return { tabela, status: 'SKIP', msg: 'Arquivo não encontrado' };
  }

  try {
    let dados = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
    if (!Array.isArray(dados)) dados = [dados];
    if (dados.length === 0) return { tabela, status: 'SKIP', msg: 'Vazio' };

    const mapa = mapeamentos[tabela] || {};
    
    // Converter dados - IGNORAR CAMPOS QUE FALHAM E LIMPAR DADOS INVÁLIDOS
    const convertidos = dados.map(item => {
      const novo = {};
      for (const [campoOrigem, campoDestino] of Object.entries(mapa)) {
        if (campoDestino && item.hasOwnProperty(campoOrigem) && item[campoOrigem] !== null && item[campoOrigem] !== undefined) {
          let valor = item[campoOrigem];
          
          // Limpeza especial de valores
          // IDs: remover se muito grande (timestamp)
          if (campoDestino.endsWith('Id') && typeof valor === 'number' && valor > 100000) {
            continue;
          }
          // Período: converter "01º Período" para 1
          if (campoDestino === 'periodo' && typeof valor === 'string') {
            const match = valor.match(/(\d+)/);
            valor = match ? parseInt(match[1]) : null;
            if (!valor) continue;
          }
          // UUIDs: pular
          if (typeof valor === 'string' && valor.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            continue;
          }
          
          novo[campoDestino] = valor;
        }
      }
      return Object.keys(novo).length > 0 ? novo : null;
    }).filter(Boolean);

    if (convertidos.length === 0) return { tabela, status: 'SKIP', msg: 'Nenhum registro válido' };

    // Limpar
    try {
      await supabase.from(tabela).delete().gte('id', 0);
    } catch (e) {}

    // Inserir com retry - removendo campos que falham
    let inseridos = 0;
    const camposFalhando = new Set();
    
    for (let i = 0; i < convertidos.length; i += 50) {
      let lote = convertidos.slice(i, i + 50);
      
      // Remover campos que sabemos que falham
      lote = lote.map(item => {
        const limpo = { ...item };
        camposFalhando.forEach(campo => delete limpo[campo]);
        return limpo;
      });

      const { error } = await supabase.from(tabela).insert(lote);
      
      if (error) {
        // Se é erro de constraint ou campo inválido, tentar remover o campo problemático
        const match = error.message.match(/Could not find the '([^']+)' column|violates|out of range/);
        if (match) {
          // Se é constraint, skip este lote
          if (error.message.includes('violates') || error.message.includes('out of range')) {
            console.log(`   ⚠️  Dados inválidos neste lote, pulando...`);
            // Continua para próximo lote
            continue;
          }
          
          const campo = match[1];
          if (campo) {
            camposFalhando.add(campo);
            console.log(`   ⚠️  ${campo} não existe, removendo...`);
            
            // Retry sem este campo
            lote = lote.map(item => {
              const limpo = { ...item };
              delete limpo[campo];
              return limpo;
            });
            
            const { error: erro2 } = await supabase.from(tabela).insert(lote);
            if (erro2) {
              // Se ainda falha, skip este lote
              if (!erro2.message.includes('violates')) {
                return { tabela, status: 'ERRO', msg: erro2.message, inseridos };
              }
              continue;
            }
          }
        } else {
          return { tabela, status: 'ERRO', msg: error.message, inseridos };
        }
      }
      inseridos += lote.length;
    }

    return { tabela, status: 'OK', inseridos };
  } catch (e) {
    return { tabela, status: 'ERRO', msg: e.message };
  }
}

async function executar() {
  console.log('\n🚀 MIGRAÇÃO DE DADOS DE EXEMPLO\n');
  
  let totalOk = 0;
  let totalRegistros = 0;

  for (const tabela of ordem) {
    const resultado = await migrar(tabela);
    
    if (resultado.status === 'OK') {
      console.log(`✅ ${tabela}: ${resultado.inseridos} registros`);
      totalOk++;
      totalRegistros += resultado.inseridos;
    } else if (resultado.status === 'SKIP') {
      console.log(`⏭️  ${tabela}: ${resultado.msg}`);
    } else {
      console.log(`❌ ${tabela}: ${resultado.msg}`);
    }
  }

  console.log(`\n📊 Resultado: ${totalOk}/${ordem.length} tabelas | ${totalRegistros} registros\n`);
}

executar().catch(console.error);
