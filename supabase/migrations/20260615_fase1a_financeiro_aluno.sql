-- Migration: Fase 1A - Melhorias no Financeiro e Alunos
-- Criado em: 2026-06-15

-- 1. Alterações na tabela alunos
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS observacao_trancamento TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_trancamento TIMESTAMPTZ DEFAULT NULL;

-- 2. Alterações na tabela financeiro_parcelas
ALTER TABLE public.financeiro_parcelas
  ADD COLUMN IF NOT EXISTS detalhes_baixa_multipla JSONB DEFAULT NULL;
