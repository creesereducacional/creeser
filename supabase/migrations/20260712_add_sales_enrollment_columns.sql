-- Adiciona colunas acadêmicas na tabela public.vendas_comerciais
-- Local: c:\PROJETOS\creeser\supabase\migrations\20260712_add_sales_enrollment_columns.sql

ALTER TABLE public.vendas_comerciais
  ADD COLUMN IF NOT EXISTS matricula_id UUID, -- Referencia opcional para a matrícula
  ADD COLUMN IF NOT EXISTS aluno_id     BIGINT; -- Referencia opcional para o aluno
