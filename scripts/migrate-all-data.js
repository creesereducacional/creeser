#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento CamelCase -> snake_case
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

// Tabelas e campos permitidos
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
  avaliacoes: { obrigatorios: ['nome'] },
  noticias: { obrigatorios: ['titulo'] },
  matriculadores: { obrigatorios: [] },
  slider: { obrigatorios: ['imagem'] },
  blog: { obrigatorios: ['titulo', 'conteudo'] }
};

const ordemMigracao = ['unidades', 'usuarios', 'cursos', 'disciplinas', 'grades', 'turmas', 'alunos', 'professores', 'funcionarios', 'responsaveis', 'matriculadores', 'noticias', 'slider', 'blog'];

function converterParaSnakeCase(registro) {
  const resultado = {};
  
  for (const [chave, valor] of Object.entries(registro)) {
    let chaveSnake = mapeamentoCampos[chave] || chave;
    
    // Pular campos de timestamp gerados automaticamente
    if (!chave.includes('dataCriacao') && !chave.includes('dataAtualizacao') && !chave.includes('senha') && valor !== null && valor !== undefined) {
      resultado[chaveSnake] = valor;
    }
  }
  
  return resultado;
}

async function migrarTabela(tabela) {
  const caminhoArquivo = path.join(__dirname, '..', 'data', `${tabela}.json`);
  
  if (!fs.existsSync(caminhoArquivo)) {
    console.log(`⏭️  ${tabela}: Arquivo não encontrado`);
    return { tabela, sucesso: false, quantidade: 0 };
  }

  try {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
    let dados = JSON.parse(conteudo);

    if (!Array.isArray(dados)) {
      dados = [dados];
    }

    if (dados.length === 0) {
      console.log(`⏸️  ${tabela}: Sem dados`);
      return { tabela, sucesso: true, quantidade: 0 };
    }

    const config = tabelasConfig[tabela] || { obrigatorios: [] };
    const dadosFiltrados = dados
      .filter(r => {
        for (const campo of config.obrigatorios) {
          if (!r[campo]) return false;
        }
        return true;
      })
      .map(r => converterParaSnakeCase(r))
      .filter(r => Object.keys(r).length > 0);
    
    if (dadosFiltrados.length === 0) {
      console.log(`⏸️  ${tabela}: Nenhum registro válido`);
      return { tabela, sucesso: true, quantidade: 0 };
    }

    // Limpar tabela
    try {
      await supabase.from(tabela).delete().gt('id', 0);
    } catch (e) {}

    // Inserir em lotes
    let totalInseridos = 0;
    for (let i = 0; i < dadosFiltrados.length; i += 50) {
      const lote = dadosFiltrados.slice(i, i + 50);
      const { error } = await supabase.from(tabela).insert(lote);

      if (error) {
        console.error(`❌ ${tabela}: ${error.message}`);
        return { tabela, sucesso: false, quantidade: totalInseridos };
      }
      totalInseridos += lote.length;
    }

    console.log(`✅ ${tabela}: ${totalInseridos} registros`);
    return { tabela, sucesso: true, quantidade: totalInseridos };
  } catch (erro) {
    console.error(`❌ ${tabela}: ${erro.message}`);
    return { tabela, sucesso: false, quantidade: 0 };
  }
}

async function executar() {
  console.log('\n🚀 MIGRAÇÃO COMPLETA DE DADOS\n');

  let total = 0;
  let sucesso = 0;

  for (const tabela of ordemMigracao) {
    const resultado = await migrarTabela(tabela);
    if (resultado.sucesso) {
      sucesso++;
      total += resultado.quantidade;
    }
  }

  console.log(`\n📊 ${sucesso}/${ordemMigracao.length} tabelas | ${total} registros\n`);
}

executar().catch(console.error);
