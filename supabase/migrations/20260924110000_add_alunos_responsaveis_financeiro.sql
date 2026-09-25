-- ============================================================
-- Migration: Adicionar campos de responsável legal e financeiro na tabela alunos
-- Data: 2026-09-24
-- Contexto: Pré-cadastro de alunos (Recepção) e dados de responsáveis direto no aluno
-- ============================================================

-- 1. Campos de Responsável Legal e Responsável Financeiro
ALTER TABLE public.alunos
  -- Responsável Legal (utilizado principalmente para alunos menores de idade)
  ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS responsavel_cpf VARCHAR(20),
  ADD COLUMN IF NOT EXISTS responsavel_rg VARCHAR(20),
  ADD COLUMN IF NOT EXISTS responsavel_telefone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS responsavel_parentesco VARCHAR(50),

  -- Responsável Financeiro (caso seja diferente do responsável legal ou específico)
  ADD COLUMN IF NOT EXISTS responsavel_financeiro_mesmo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS financeiro_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS financeiro_cpf VARCHAR(20),
  ADD COLUMN IF NOT EXISTS financeiro_rg VARCHAR(20),
  ADD COLUMN IF NOT EXISTS financeiro_telefone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS financeiro_parentesco VARCHAR(50);

-- 2. Índices opcionais para busca e conferência por CPF do responsável
CREATE INDEX IF NOT EXISTS idx_alunos_responsavel_cpf ON public.alunos (responsavel_cpf) WHERE responsavel_cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_financeiro_cpf  ON public.alunos (financeiro_cpf)  WHERE financeiro_cpf IS NOT NULL;

-- 3. Notificar o PostgREST para recarregar o schema cache imediatamente
NOTIFY pgrst, 'reload schema';
