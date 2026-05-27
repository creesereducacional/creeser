-- Migration Fase 2: data_ativacao em alunos
-- Executar no Supabase SQL Editor

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS data_ativacao TIMESTAMPTZ;
