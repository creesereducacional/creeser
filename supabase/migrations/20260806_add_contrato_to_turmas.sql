-- Migration: 20260806_add_contrato_to_turmas.sql
-- Objetivo: Adicionar coluna contrato_id (UUID, NULLABLE) na tabela public.turmas
-- referenciando public.contratos_instituicao(id) de forma idempotente.

ALTER TABLE public.turmas
ADD COLUMN IF NOT EXISTS contrato_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_turmas_contrato_id'
  ) THEN
    ALTER TABLE public.turmas
    ADD CONSTRAINT fk_turmas_contrato_id
    FOREIGN KEY (contrato_id)
    REFERENCES public.contratos_instituicao(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_turmas_contrato_id
  ON public.turmas(contrato_id);
