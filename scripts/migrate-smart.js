#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const mapeamentoCampos = {
  'nomeCompleto': 'nome_completo',
  'numeroEndereco': 'numero_endereco',
  'telefoneCelular': 'telefone_celular',
  'statusMatricula': 'status_matricula',
  'statusVinculo': 'status_vinculo',
  'dtNascimento': 'dt_nascimento',
  'dtAdmissao': 'dt_admissao',
  'dataRealizacao': 'data_realizacao',
  'dataPublicacao': 'data_publicacao',
  'dataPostagem': 'data_postagem',
  'caminhoArquivo': 'caminho_arquivo',
  'uploadadoPor': 'uploaded_por',
  'remetenteId': 'remetente_id',
  'dataEnvio': 'data_envio',
  'dataInicio': 'data_inicio',
  'dataFim': 'data_fim',
  'dataRequisicao': 'data_requisicao',
  'dataResolucao': 'data_resolucao',
  'dataPrimeiraContratacao': 'data_primeira_contratacao',
  'cargaHoraria': 'carga_horaria',
  'descricaoGeral': 'descricao_geral',
  'frequenciaRequerida': 'frequencia_requerida',
  'mediaRequerida': 'media_requerida',
  'layoutNotas': 'layout_notas',
  'idCenso': 'id_censo',
  'exibirCRM': 'exibir_crm',
  'exibirBibliotecaVirtual': 'exibir_biblioteca_virtual',
  'portariaRecredenciamento': 'portaria_recredenciamento',
  'grauConferido': 'grau_conferido',
  'nivelEnsino': 'nivel_ensino',
  'tituloConferido': 'titulo_conferido',
  'valorInscricao': 'valor_inscricao',
  'valorMensalidade': 'valor_mensalidade',
  'cargaHorariaEstagio': 'carga_horaria_estagio',
  'cargaHorariaAtividadesComplementares': 'carga_horaria_atividades_complementares',
  'disciplinaId': 'disciplina_id',
  'turmaId': 'turma_id',
  'unidadeId': 'unidade_id',
  'cursoId': 'curso_id',
  'gradeId': 'grade_id',
  'alunoId': 'aluno_id',
  'professorId': 'professor_id',
  'autorId': 'autor_id',
  'responsavelId': 'responsavel_id',
  'avaliacaoId': 'avaliacao_id',
  'forumId': 'forum_id',
  'usuarioId': 'usuario_id',
  'capacidadeMaxima': 'capacidade_maxima',
  'telefonePrincipal': 'telefone_principal',
  'linkExterno': 'link_externo',
  'pontuacaoMaxima': 'pontuacao_maxima',
  'dataNascimento': 'data_nascimento',
  'dataMatricula': 'data_matricula',
};

// Campos obrigatórios por tabela
const tabelasConfig = {
  usuarios: { obrigatorios: ['nomeCompleto', 'email', 'tipo'] },
  alunos: { obrigatorios: [] },
  professores: { obrigatorios: [] },
  funcionarios: { obrigatorios: [] },
  responsaveis: { obrigatorios: [] },
  unidades: { obrigatorios: ['nome'] },
  cursos: { obrigatorios: ['nome'] },
  disciplinas: { obrigatorios: ['nome'] },
  turmas: { obrigatorios: ['nome'] },
  grades: { obrigatorios: ['nome'] },
  noticias: { obrigatorios: ['titulo'] },
  matriculadores: { obrigatorios: [] }
};

const ordemMigracao = ['unidades', 'usuarios', 'cursos', 'disciplinas', 'grades', 'turmas', 'alunos', 'professores', 'funcionarios', 'responsaveis', 'matriculadores', 'noticias'];

function converterParaSnakeCase(registro) {
  const resultado = {};
  
  for (const [chave, valor] of Object.entries(registro)) {
    if (valor === null || valor === undefined) continue;
    if (chave.includes('dataCriacao') || chave.includes('dataAtualizacao') || chave === 'senha') continue;
    
    let chaveSnake = mapeamentoCampos[chave] || chave;
    
    // Converter valores booleanos e numéricos corretamente
    let novoValor = valor;
    if (typeof valor === 'boolean') novoValor = valor;
    else if (typeof valor === 'number' && chaveSnake.includes('id') && valor > 1000000) continue; // skip grandes IDs
    
    resultado[chaveSnake] = novoValor;
  }
  
  return resultado;
}

async function obterColunasTabela(tabela) {
  try {
    const { data, error } = await supabase.from(tabela).select().limit(1);
    if (data && data[0]) {
      return Object.keys(data[0]);
    }
  } catch (e) {}
  return [];
}

async function migrarTabela(tabela) {
  const caminhoArquivo = path.join(__dirname, '..', 'data', `${tabela}.json`);
  
  if (!fs.existsSync(caminhoArquivo)) {
    return { tabela, sucesso: false, quantidade: 0, msg: 'Arquivo não encontrado' };
  }

  try {
    // Obter colunas reais da tabela
    const colunasReais = await obterColunasTabela(tabela);
    
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
    let dados = JSON.parse(conteudo);

    if (!Array.isArray(dados)) dados = [dados];
    if (dados.length === 0) {
      return { tabela, sucesso: true, quantidade: 0, msg: 'Sem dados' };
    }

    const config = tabelasConfig[tabela] || { obrigatorios: [] };
    
    // Filtrar registros válidos
    const dadosFiltrados = dados
      .filter(r => config.obrigatorios.every(campo => r[campo]))
      .map(r => {
        const convertido = converterParaSnakeCase(r);
        // Manter apenas colunas que existem na tabela real
        const filtrado = {};
        colunasReais.forEach(col => {
          if (convertido.hasOwnProperty(col)) {
            filtrado[col] = convertido[col];
          }
        });
        return Object.keys(filtrado).length > 0 ? filtrado : null;
      })
      .filter(r => r !== null);
    
    if (dadosFiltrados.length === 0) {
      return { tabela, sucesso: true, quantidade: 0, msg: 'Nenhum registro válido' };
    }

    // Tentar limpar tabela
    try {
      await supabase.from(tabela).delete().gte('id', 0);
    } catch (e) {}

    // Inserir em lotes
    let totalInseridos = 0;
    for (let i = 0; i < dadosFiltrados.length; i += 50) {
      const lote = dadosFiltrados.slice(i, i + 50);
      const { error } = await supabase.from(tabela).insert(lote);

      if (error) {
        return { tabela, sucesso: false, quantidade: totalInseridos, msg: error.message };
      }
      totalInseridos += lote.length;
    }

    console.log(`✅ ${tabela}: ${totalInseridos}`);
    return { tabela, sucesso: true, quantidade: totalInseridos };
  } catch (erro) {
    return { tabela, sucesso: false, quantidade: 0, msg: erro.message };
  }
}

async function executar() {
  console.log('\n🚀 MIGRAÇÃO COMPLETA\n');

  let total = 0;
  let sucesso = 0;

  for (const tabela of ordemMigracao) {
    const resultado = await migrarTabela(tabela);
    if (resultado.sucesso) {
      sucesso++;
      total += resultado.quantidade;
    } else {
      console.log(`❌ ${tabela}: ${resultado.msg}`);
    }
  }

  console.log(`\n📊 ${sucesso}/${ordemMigracao.length} tabelas | ${total} registros\n`);
}

executar().catch(console.error);
