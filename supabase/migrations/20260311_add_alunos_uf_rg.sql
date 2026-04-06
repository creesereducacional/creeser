-- Adiciona UF do RG ao cadastro de alunos
ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS uf_rg CHAR(2);
