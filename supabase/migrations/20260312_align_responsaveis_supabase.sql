-- Alinha o modulo de responsaveis com o Supabase.

-- Garantia minima da tabela base para ambientes que ainda nao possuem responsaveis.
CREATE TABLE IF NOT EXISTS public.responsaveis (
  id SERIAL PRIMARY KEY,
  usuarioid INTEGER UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  parentesco VARCHAR(50),
  profissao VARCHAR(100),
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(10),
  bairro VARCHAR(100),
  numeroendereco VARCHAR(10),
  telefonecelular VARCHAR(20),
  datacriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataatualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campos usados no formulario atual de responsaveis.
ALTER TABLE public.responsaveis
  ADD COLUMN IF NOT EXISTS nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sexo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50),
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
  ADD COLUMN IF NOT EXISTS telefone_comercial VARCHAR(20),
  ADD COLUMN IF NOT EXISTS complemento VARCHAR(255),
  ADD COLUMN IF NOT EXISTS uf CHAR(2),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS senha VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(20),
  ADD COLUMN IF NOT EXISTS rg VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20),
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS situacao VARCHAR(20) DEFAULT 'ATIVO';

-- Backfill basico para reduzir campos vazios em bases legadas.
UPDATE public.responsaveis
SET whatsapp = telefonecelular
WHERE whatsapp IS NULL
  AND telefonecelular IS NOT NULL;

UPDATE public.responsaveis
SET uf = estado
WHERE uf IS NULL
  AND estado IS NOT NULL;

-- Relacionamento N:N entre responsaveis e alunos.
CREATE TABLE IF NOT EXISTS public.responsavel_aluno (
  id SERIAL PRIMARY KEY,
  responsavel_id INTEGER NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  aluno_id INTEGER NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(responsavel_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_responsavel_aluno_responsavel_id
  ON public.responsavel_aluno(responsavel_id);

CREATE INDEX IF NOT EXISTS idx_responsavel_aluno_aluno_id
  ON public.responsavel_aluno(aluno_id);
