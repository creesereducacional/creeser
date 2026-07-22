-- Migration: Adição de colunas de Valor Nominal e Desconto Condicional na tabela financeiro_parcelas
ALTER TABLE public.financeiro_parcelas
  ADD COLUMN IF NOT EXISTS valor_nominal          numeric(10,2) NULL,
  ADD COLUMN IF NOT EXISTS valor_desconto         numeric(10,2) NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_final            numeric(10,2) NULL,
  ADD COLUMN IF NOT EXISTS data_limite_desconto   date NULL;

-- Atualizar registros históricos: popular valor_final com o campo valor para manter compatibilidade
UPDATE public.financeiro_parcelas
SET valor_final = valor
WHERE valor_final IS NULL;
