-- =====================================================
-- SCHEMA SQL PARA CREESER EDUCACIONAL
-- Database: PostgreSQL (Supabase)
-- Criado em: 2025-12-29
-- =====================================================

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela: unidades
CREATE TABLE IF NOT EXISTS unidades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(10),
  telefonePrincipal VARCHAR(20),
  email VARCHAR(100),
  responsavel VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: cursos
CREATE TABLE IF NOT EXISTS cursos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricaoGeral TEXT,
  duracao INTEGER,
  cargaHoraria INTEGER,
  cargaHorariaEstagio INTEGER DEFAULT 0,
  cargaHorariaAtividadesComplementares INTEGER DEFAULT 0,
  mediaRequerida DECIMAL(3,1) DEFAULT 6.0,
  frequenciaRequerida INTEGER DEFAULT 75,
  nivelEnsino VARCHAR(100),
  grauConferido VARCHAR(100),
  tituloConferido VARCHAR(100),
  valorInscricao DECIMAL(10,2),
  valorMensalidade DECIMAL(10,2),
  layoutNotas VARCHAR(50),
  idCenso VARCHAR(20),
  bibliotecaVirtual VARCHAR(100),
  portariaRecredenciamento VARCHAR(100),
  exibirCRM BOOLEAN DEFAULT false,
  exibirBibliotecaVirtual BOOLEAN DEFAULT false,
  situacao VARCHAR(50) DEFAULT 'ATIVO',
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: curso_unidade (relacionamento many-to-many)
CREATE TABLE IF NOT EXISTS curso_unidade (
  id SERIAL PRIMARY KEY,
  cursoId INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  unidadeId INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cursoId, unidadeId)
);

-- Tabela: grades
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  cursoId INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: turmas
CREATE TABLE IF NOT EXISTS turmas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  unidadeId INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  cursoId INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  gradeId INTEGER REFERENCES grades(id) ON DELETE SET NULL,
  situacao VARCHAR(50) DEFAULT 'ATIVO',
  dataInicio DATE,
  dataFim DATE,
  capacidadeMaxima INTEGER,
  descricao TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) UNIQUE,
  cursoId INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  cargaHoraria INTEGER,
  ementa TEXT,
  objetivos TEXT,
  periodo INTEGER,
  situacao VARCHAR(50) DEFAULT 'ATIVO',
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: usuarios (usuários do sistema)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  nomeCompleto VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  foto TEXT,
  dataNascimento DATE,
  whatsapp VARCHAR(20),
  tipo VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'ativo',
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: alunos
CREATE TABLE IF NOT EXISTS alunos (
  id SERIAL PRIMARY KEY,
  usuarioId INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  matricula VARCHAR(50) UNIQUE,
  cursoId INTEGER REFERENCES cursos(id) ON DELETE SET NULL,
  turmaId INTEGER REFERENCES turmas(id) ON DELETE SET NULL,
  statusMatricula VARCHAR(50) DEFAULT 'ativa',
  dataMatricula DATE,
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(10),
  bairro VARCHAR(100),
  numeroEndereco VARCHAR(10),
  responsavelId INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: professores
CREATE TABLE IF NOT EXISTS professores (
  id SERIAL PRIMARY KEY,
  usuarioId INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  matricula VARCHAR(50) UNIQUE,
  especialidade VARCHAR(255),
  titulacao VARCHAR(100),
  dataPrimeiraContratacao DATE,
  statusVinculo VARCHAR(50) DEFAULT 'ativo',
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: professor_disciplina (relacionamento many-to-many)
CREATE TABLE IF NOT EXISTS professor_disciplina (
  id SERIAL PRIMARY KEY,
  professorId INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  disciplinaId INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  turmaId INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  semestre VARCHAR(10),
  ano INTEGER,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(professorId, disciplinaId, turmaId, semestre, ano)
);

-- Tabela: funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
  id SERIAL PRIMARY KEY,
  usuarioId INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  matricula VARCHAR(50) UNIQUE,
  funcao VARCHAR(100) NOT NULL,
  rg VARCHAR(20),
  telefoneCelular VARCHAR(20),
  endereco VARCHAR(255),
  numero VARCHAR(10),
  bairro VARCHAR(100),
  cep VARCHAR(10),
  cidade VARCHAR(100),
  uf CHAR(2),
  dtNascimento DATE,
  dtAdmissao DATE,
  status VARCHAR(50) DEFAULT 'ATIVO',
  banco VARCHAR(50),
  agencia VARCHAR(10),
  contaCorrente VARCHAR(20),
  pix VARCHAR(100),
  obs TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: responsaveis
CREATE TABLE IF NOT EXISTS responsaveis (
  id SERIAL PRIMARY KEY,
  usuarioId INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  parentesco VARCHAR(50),
  profissao VARCHAR(100),
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(10),
  bairro VARCHAR(100),
  numeroEndereco VARCHAR(10),
  telefoneCelular VARCHAR(20),
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELAS DE CONTEÚDO E AVALIAÇÃO
-- =====================================================

-- Tabela: avaliacoes
CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  descricao TEXT,
  disciplinaId INTEGER REFERENCES disciplinas(id) ON DELETE CASCADE,
  turmaId INTEGER REFERENCES turmas(id) ON DELETE CASCADE,
  dataRealizacao DATE,
  peso DECIMAL(3,1) DEFAULT 1.0,
  pontuacaoMaxima DECIMAL(5,2) DEFAULT 10.0,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: notas_faltas
CREATE TABLE IF NOT EXISTS notas_faltas (
  id SERIAL PRIMARY KEY,
  alunoId INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  disciplinaId INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  turmaId INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  avaliacaoId INTEGER REFERENCES avaliacoes(id) ON DELETE SET NULL,
  nota DECIMAL(5,2),
  faltas INTEGER DEFAULT 0,
  presencas INTEGER DEFAULT 0,
  semestre VARCHAR(10),
  ano INTEGER,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alunoId, disciplinaId, turmaId, avaliacaoId, semestre, ano)
);

-- Tabela: livro_registro
CREATE TABLE IF NOT EXISTS livro_registro (
  id SERIAL PRIMARY KEY,
  turmaId INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplinaId INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  professorId INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  dataRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  conteudo TEXT,
  observacoes TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: planejamento_diario
CREATE TABLE IF NOT EXISTS planejamento_diario (
  id SERIAL PRIMARY KEY,
  professorId INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  disciplinaId INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  turmaId INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  conteudo TEXT,
  metodologia TEXT,
  recursos TEXT,
  avaliacoes TEXT,
  observacoes TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(professorId, disciplinaId, turmaId, data)
);

-- =====================================================
-- TABELAS DE COMUNICAÇÃO E DOCUMENTOS
-- =====================================================

-- Tabela: noticias
CREATE TABLE IF NOT EXISTS noticias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  conteudo TEXT,
  imagem TEXT,
  autorId INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  destaque BOOLEAN DEFAULT false,
  publica BOOLEAN DEFAULT true,
  dataPublicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: forum
CREATE TABLE IF NOT EXISTS forum (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  conteudo TEXT,
  autorId INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  disciplinaId INTEGER REFERENCES disciplinas(id) ON DELETE CASCADE,
  turmaId INTEGER REFERENCES turmas(id) ON DELETE CASCADE,
  dataPostagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: respostas_forum
CREATE TABLE IF NOT EXISTS respostas_forum (
  id SERIAL PRIMARY KEY,
  forumId INTEGER NOT NULL REFERENCES forum(id) ON DELETE CASCADE,
  autorId INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  dataPostagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: documentos
CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),
  caminhoArquivo VARCHAR(255) NOT NULL,
  tamanho INTEGER,
  uploadadoPor INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  turmaId INTEGER REFERENCES turmas(id) ON DELETE CASCADE,
  disciplinaId INTEGER REFERENCES disciplinas(id) ON DELETE SET NULL,
  publica BOOLEAN DEFAULT false,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: emails_enviados
CREATE TABLE IF NOT EXISTS emails_enviados (
  id SERIAL PRIMARY KEY,
  destinatario VARCHAR(100) NOT NULL,
  assunto VARCHAR(255) NOT NULL,
  corpo TEXT NOT NULL,
  remetenteId INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo VARCHAR(50),
  status VARCHAR(50) DEFAULT 'enviado',
  dataEnvio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELAS DE MATRÍCULA E CAMPANHAS
-- =====================================================

-- Tabela: campanhas_matriculas
CREATE TABLE IF NOT EXISTS campanhas_matriculas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  cursoId INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
  dataInicio DATE NOT NULL,
  dataFim DATE NOT NULL,
  ativa BOOLEAN DEFAULT true,
  desconto DECIMAL(5,2),
  observacoes TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: matriculadores
CREATE TABLE IF NOT EXISTS matriculadores (
  id SERIAL PRIMARY KEY,
  usuarioId INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  funcao VARCHAR(100),
  comissao DECIMAL(5,2),
  ativo BOOLEAN DEFAULT true,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: solicitacoes
CREATE TABLE IF NOT EXISTS solicitacoes (
  id SERIAL PRIMARY KEY,
  alunoId INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  descricao TEXT,
  status VARCHAR(50) DEFAULT 'pendente',
  responsavelId INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  dataRequisicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataResolucao TIMESTAMP,
  observacoes TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELAS DE COMPLEMENTAR
-- =====================================================

-- Tabela: atividades_complementares
CREATE TABLE IF NOT EXISTS atividades_complementares (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(100),
  cargaHoraria INTEGER,
  pontuacao DECIMAL(5,2),
  validada BOOLEAN DEFAULT false,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: anos_letivos
CREATE TABLE IF NOT EXISTS anos_letivos (
  id SERIAL PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  dataInicio DATE NOT NULL,
  dataFim DATE NOT NULL,
  ativo BOOLEAN DEFAULT false,
  observacoes TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: slider
CREATE TABLE IF NOT EXISTS slider (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255),
  descricao TEXT,
  imagem TEXT NOT NULL,
  linkExterno VARCHAR(255),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: configuracoes_empresa
CREATE TABLE IF NOT EXISTS configuracoes_empresa (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(50),
  descricao TEXT,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: blog
CREATE TABLE IF NOT EXISTS blog (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  conteudo TEXT NOT NULL,
  resumo TEXT,
  imagem TEXT,
  autorId INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  categoria VARCHAR(100),
  tags VARCHAR(255),
  publicado BOOLEAN DEFAULT false,
  destaque BOOLEAN DEFAULT false,
  visualizacoes INTEGER DEFAULT 0,
  dataPublicacao TIMESTAMP,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_alunos_usuarioId ON alunos(usuarioId);
CREATE INDEX idx_alunos_cursoId ON alunos(cursoId);
CREATE INDEX idx_alunos_turmaId ON alunos(turmaId);
CREATE INDEX idx_alunos_matricula ON alunos(matricula);
CREATE INDEX idx_professores_usuarioId ON professores(usuarioId);
CREATE INDEX idx_professores_matricula ON professores(matricula);
CREATE INDEX idx_funcionarios_usuarioId ON funcionarios(usuarioId);
CREATE INDEX idx_funcionarios_matricula ON funcionarios(matricula);
CREATE INDEX idx_turmas_cursoId ON turmas(cursoId);
CREATE INDEX idx_turmas_unidadeId ON turmas(unidadeId);
CREATE INDEX idx_disciplinas_cursoId ON disciplinas(cursoId);
CREATE INDEX idx_professor_disciplina_professorId ON professor_disciplina(professorId);
CREATE INDEX idx_professor_disciplina_disciplinaId ON professor_disciplina(disciplinaId);
CREATE INDEX idx_notas_faltas_alunoId ON notas_faltas(alunoId);
CREATE INDEX idx_notas_faltas_disciplinaId ON notas_faltas(disciplinaId);
CREATE INDEX idx_noticias_autorId ON noticias(autorId);
CREATE INDEX idx_noticias_dataPublicacao ON noticias(dataPublicacao);
CREATE INDEX idx_forum_autorId ON forum(autorId);
CREATE INDEX idx_forum_turmaId ON forum(turmaId);
CREATE INDEX idx_documentos_turmaId ON documentos(turmaId);
CREATE INDEX idx_blog_autorId ON blog(autorId);
CREATE INDEX idx_blog_slug ON blog(slug);

-- =====================================================
-- TRIGGERS PARA ATUALIZAR dataAtualizacao
-- =====================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dataAtualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas principais
CREATE TRIGGER trigger_update_timestamp_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_alunos
BEFORE UPDATE ON alunos
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_professores
BEFORE UPDATE ON professores
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_funcionarios
BEFORE UPDATE ON funcionarios
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_turmas
BEFORE UPDATE ON turmas
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_disciplinas
BEFORE UPDATE ON disciplinas
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_cursos
BEFORE UPDATE ON cursos
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_noticias
BEFORE UPDATE ON noticias
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_blog
BEFORE UPDATE ON blog
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para contar alunos ativos
CREATE OR REPLACE FUNCTION count_alunos_ativos(p_cursoId INT DEFAULT NULL)
RETURNS INTEGER AS $$
SELECT COUNT(*)
FROM alunos
WHERE statusMatricula = 'ativa'
AND (p_cursoId IS NULL OR cursoId = p_cursoId);
$$ LANGUAGE SQL;

-- Função para obter média do aluno
CREATE OR REPLACE FUNCTION get_media_aluno(p_alunoId INT, p_disciplinaId INT)
RETURNS DECIMAL AS $$
SELECT AVG(nota)
FROM notas_faltas
WHERE alunoId = p_alunoId
AND disciplinaId = p_disciplinaId
AND nota IS NOT NULL;
$$ LANGUAGE SQL;

-- Função para obter frequência do aluno
CREATE OR REPLACE FUNCTION get_frequencia_aluno(p_alunoId INT, p_disciplinaId INT)
RETURNS DECIMAL AS $$
SELECT CASE
  WHEN (presencas + faltas) = 0 THEN 0
  ELSE (presencas::DECIMAL / (presencas + faltas)) * 100
END
FROM notas_faltas
WHERE alunoId = p_alunoId
AND disciplinaId = p_disciplinaId;
$$ LANGUAGE SQL;
