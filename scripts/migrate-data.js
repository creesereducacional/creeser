/**
 * Script de Migração de Dados JSON para Supabase
 * Execução: node scripts/migrate-data.js
 * 
 * Este script lê os arquivos JSON do projeto e os insere no Supabase
 * Precisa ser executado após criar o schema SQL no Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para ler arquivo JSON
function lerJSON(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    return JSON.parse(conteudo);
  } catch (erro) {
    console.error(`Erro ao ler ${caminhoArquivo}:`, erro.message);
    return [];
  }
}

// Função para inserir dados
async function inserirDados(tabela, dados) {
  if (!dados || dados.length === 0) {
    console.log(`⏭️  ${tabela}: Nenhum dado para inserir`);
    return;
  }

  try {
    const { error } = await supabase
      .from(tabela)
      .insert(dados, { returning: 'minimal' });

    if (error) {
      console.error(`❌ Erro ao inserir em ${tabela}:`, error.message);
      return false;
    }

    console.log(`✅ ${tabela}: ${dados.length} registros inseridos`);
    return true;
  } catch (erro) {
    console.error(`❌ Erro na inserção de ${tabela}:`, erro.message);
    return false;
  }
}

// Definir os CAMPOS VÁLIDOS que podem ser inseridos em cada tabela no Supabase
// Campos com DEFAULT (como id, dataCriacao, dataAtualizacao) são omitidos
const colunasTabelasSupabase = {
  'unidades': ['nome', 'descricao', 'endereco', 'cidade', 'estado', 'cep', 'telefonePrincipal', 'email', 'responsavel', 'ativo'],
  'cursos': ['nome', 'descricaoGeral', 'duracao', 'cargaHoraria', 'cargaHorariaEstagio', 'cargaHorariaAtividadesComplementares', 'mediaRequerida', 'frequenciaRequerida', 'nivelEnsino', 'grauConferido', 'tituloConferido', 'valorInscricao', 'valorMensalidade', 'layoutNotas', 'idCenso', 'portariaRecredenciamento', 'exibirCRM', 'exibirBibliotecaVirtual', 'situacao'],
  'curso_unidade': ['cursoId', 'unidadeId'],
  'grades': ['nome', 'descricao', 'cursoId'],
  'turmas': ['nome', 'unidadeId', 'cursoId', 'gradeId', 'situacao', 'dataInicio', 'dataFim', 'capacidadeMaxima', 'descricao'],
  'disciplinas': ['nome', 'codigo', 'cursoId', 'ementa', 'objetivos', 'situacao'],
  'usuarios': ['nomeCompleto', 'email', 'cpf', 'foto', 'whatsapp', 'tipo', 'status'],
  'alunos': ['usuarioId', 'matricula', 'cursoId', 'turmaId', 'statusMatricula', 'dataMatricula', 'responsavelId'],
  'professores': ['usuarioId', 'matricula', 'especialidade', 'titulacao', 'dataPrimeiraContratacao', 'statusVinculo'],
  'professor_disciplina': ['professorId', 'disciplinaId', 'turmaId', 'semestre', 'ano'],
  'funcionarios': ['usuarioId', 'matricula', 'funcao', 'rg', 'telefoneCelular', 'endereco', 'numero', 'bairro', 'cep', 'cidade', 'uf', 'status', 'banco', 'agencia', 'pix', 'obs'],
  'responsaveis': ['usuarioId', 'parentesco', 'profissao', 'endereco', 'cidade', 'estado', 'cep', 'bairro', 'numeroEndereco', 'telefoneCelular'],
  'avaliacoes': ['nome', 'tipo', 'descricao', 'disciplinaId', 'turmaId', 'dataRealizacao', 'peso', 'pontuacaoMaxima'],
  'notas_faltas': ['alunoId', 'disciplinaId', 'turmaId', 'avaliacaoId', 'nota', 'faltas', 'presencas', 'semestre', 'ano'],
  'livro_registro': ['turmaId', 'disciplinaId', 'professorId', 'dataRegistro', 'conteudo', 'observacoes'],
  'planejamento_diario': ['professorId', 'disciplinaId', 'turmaId', 'data', 'conteudo', 'metodologia', 'recursos', 'avaliacoes', 'observacoes'],
  'noticias': ['titulo', 'descricao', 'conteudo', 'imagem', 'autorId', 'destaque', 'publica'],
  'forum': ['titulo', 'descricao', 'conteudo', 'autorId', 'disciplinaId', 'turmaId'],
  'respostas_forum': ['forumId', 'autorId', 'conteudo'],
  'documentos': ['nome', 'descricao', 'tipo', 'caminhoArquivo', 'tamanho', 'uploadadoPor', 'turmaId', 'disciplinaId', 'publica'],
  'emails_enviados': ['destinatario', 'assunto', 'corpo', 'remetenteId', 'tipo', 'status'],
  'campanhas_matriculas': ['nome', 'descricao', 'cursoId', 'dataInicio', 'dataFim', 'ativa', 'desconto', 'observacoes'],
  'matriculadores': ['usuarioId', 'funcao', 'comissao', 'ativo'],
  'solicitacoes': ['alunoId', 'tipo', 'descricao', 'status', 'responsavelId', 'dataRequisicao', 'dataResolucao', 'observacoes'],
  'atividades_complementares': ['nome', 'descricao', 'tipo', 'pontuacao', 'validada'],
  'anos_letivos': ['ano', 'dataInicio', 'dataFim', 'ativo', 'observacoes'],
  'slider': ['titulo', 'descricao', 'imagem', 'linkExterno', 'ordem', 'ativo'],
  'configuracoes_empresa': ['chave', 'valor', 'tipo', 'descricao'],
  'blog': ['titulo', 'slug', 'conteudo', 'resumo', 'imagem', 'autorId', 'categoria', 'tags', 'publicado', 'destaque', 'visualizacoes', 'dataPublicacao']
};

// Definir campos obrigatórios por tabela
const camposObrigatorios = {
  'usuarios': ['nomeCompleto', 'email', 'tipo'],
  'turmas': ['nome', 'unidadeId', 'cursoId'],
  'disciplinas': ['nome', 'cursoId'],
  'notas_faltas': ['alunoId', 'disciplinaId', 'turmaId'],
  'livro_registro': ['turmaId', 'disciplinaId', 'professorId'],
  'planejamento_diario': ['professorId', 'disciplinaId', 'turmaId', 'data'],
  'solicitacoes': ['alunoId', 'tipo'],
  'atividades_complementares': ['nome'],
  'slider': ['imagem'],
  'configuracoes_empresa': ['chave'],
  'campanhas_matriculas': ['nome', 'cursoId', 'dataInicio', 'dataFim']
};

// Função para transformar dados (remover campos desnecessários, renomear, etc)
function transformarDados(tabela, dados) {
  if (!Array.isArray(dados)) {
    dados = [dados];
  }

  return dados.map(item => {
    const transformado = { ...item };

    // Remover senha sempre
    delete transformado.senha;

    // Garantir campo obrigatório nomeCompleto se não existir, mas 'nome' sim
    if (tabela === 'usuarios' && !transformado.nomeCompleto && transformado.nome) {
      transformado.nomeCompleto = transformado.nome;
    }

    // Manter apenas os campos que estão na whitelist para esta tabela
    if (colunasTabelasSupabase[tabela]) {
      const colunasValidas = colunasTabelasSupabase[tabela];
      const novoTransformado = {};
      
      colunasValidas.forEach(coluna => {
        if (transformado.hasOwnProperty(coluna) && transformado[coluna] !== null && transformado[coluna] !== undefined && transformado[coluna] !== '') {
          novoTransformado[coluna] = transformado[coluna];
        }
      });
      
      // Verificar se todos os campos obrigatórios estão presentes
      if (camposObrigatorios[tabela]) {
        const obrigatorios = camposObrigatorios[tabela];
        const temesTodosCampos = obrigatorios.every(campo => novoTransformado.hasOwnProperty(campo));
        
        if (!temesTodosCampos) {
          // Retornar objeto vazio para indicar que não deve ser inserido
          return {};
        }
      }
      
      return novoTransformado;
    }

    return transformado;
  }).filter(item => Object.keys(item).length > 0);  // Filtrar registros vazios
}

// Função principal de migração
async function executarMigracao() {
  console.log('🚀 Iniciando migração de dados para Supabase...\n');

  const dataDir = path.join(__dirname, '../data');

  // Mapeamento de arquivos para tabelas
  const mapeamento = {
    'unidades.json': 'unidades',
    'anos-letivos.json': 'anos_letivos',
    'cursos.json': 'cursos',
    'turmas.json': 'turmas',
    'disciplinas.json': 'disciplinas',
    'usuarios.json': 'usuarios',
    'usuarios-sistema.json': 'usuarios',
    'alunos.json': 'alunos',
    'professores.json': 'professores',
    'funcionarios.json': 'funcionarios',
    'responsaveis.json': 'responsaveis',
    'avaliacoes.json': 'avaliacoes',
    'notas-faltas.json': 'notas_faltas',
    'grades.json': 'grades',
    'livro-registro.json': 'livro_registro',
    'planejamento-diario.json': 'planejamento_diario',
    'noticias.json': 'noticias',
    'forum.json': 'forum',
    'documentos.json': 'documentos',
    'emails-enviados.json': 'emails_enviados',
    'campanhas-matriculas.json': 'campanhas_matriculas',
    'matriculadores.json': 'matriculadores',
    'solicitacoes.json': 'solicitacoes',
    'atividades-complementares.json': 'atividades_complementares',
    'slider.json': 'slider',
    'configuracoes-empresa.json': 'configuracoes_empresa',
    'blog.json': 'blog'
  };

  let sucessos = 0;
  let falhas = 0;

  // Processar cada arquivo
  for (const [arquivo, tabela] of Object.entries(mapeamento)) {
    const caminhoCompleto = path.join(dataDir, arquivo);
    
    if (!fs.existsSync(caminhoCompleto)) {
      console.log(`⏭️  ${tabela}: Arquivo ${arquivo} não encontrado`);
      continue;
    }

    const dados = lerJSON(caminhoCompleto);
    const dadosTransformados = transformarDados(tabela, dados);
    
    const resultado = await inserirDados(tabela, dadosTransformados);
    resultado ? sucessos++ : falhas++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Migração concluída: ${sucessos} tabelas inseridas`);
  if (falhas > 0) {
    console.log(`⚠️  ${falhas} tabelas com erro`);
  }
  console.log('='.repeat(50));
}

// Executar migração
executarMigracao().catch(erro => {
  console.error('Erro fatal:', erro.message);
  process.exit(1);
});
