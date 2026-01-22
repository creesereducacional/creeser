-- Atualizar tabela alunos com novos campos do formulário de cadastro

-- Adicionar campo de nome (essencial!)
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT '';

-- Atualizar dataMatricula se ainda não existir com tipo DATE
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS datamatricula DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estadoCivil VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS sexo VARCHAR(10);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_expedicao_rg DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS orgao_expedidor_rg VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone_celular VARCHAR(20);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Adicionar filiação
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pai VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS mae VARCHAR(255);

-- Adicionar campos administrativos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS instituicao VARCHAR(255) DEFAULT 'CREESER';
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_letivo INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS turno_integral BOOLEAN DEFAULT false;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS semestre VARCHAR(10);

-- Adicionar campos de registro de nascimento
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS termo VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS folha VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS livro VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_cartorio VARCHAR(255);

-- Adicionar campos de endereço completo
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS complemento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_naturalidade CHAR(2);

-- Adicionar informações de ensino médio
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estabelecimento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_conclusao INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS endereco_dem VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS municipio_dem VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_dem CHAR(2);

-- Adicionar informações de deficiência
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pessoa_com_deficiencia BOOLEAN DEFAULT false;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_deficiencia VARCHAR(255);

-- Adicionar foto
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS foto TEXT;

-- Adicionar informações INEP
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_escola_anterior VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pais_origem VARCHAR(100) DEFAULT 'BRA - Brasil';
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_social BOOLEAN DEFAULT false;
