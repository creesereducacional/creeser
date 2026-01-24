-- Criar tabela de instituições (grupo educacional)
-- Tabela para armazenar as instituições que fazem parte do grupo CREESER

CREATE TABLE IF NOT EXISTS instituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(100),
  telefone VARCHAR(20),
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(9),
  website VARCHAR(255),
  ativa BOOLEAN DEFAULT true,
  logo TEXT,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_instituicoes_ativa ON instituicoes(ativa);
CREATE INDEX IF NOT EXISTS idx_instituicoes_nome ON instituicoes(nome);
CREATE INDEX IF NOT EXISTS idx_instituicoes_cnpj ON instituicoes(cnpj);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION atualizar_updated_at_instituicoes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_instituicoes ON instituicoes;
CREATE TRIGGER trigger_atualizar_updated_at_instituicoes
BEFORE UPDATE ON instituicoes
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_instituicoes();

