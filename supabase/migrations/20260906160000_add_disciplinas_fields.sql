-- Migration: Adicionar colunas faltantes para a persistência completa de disciplinas
-- Data: 2026-09-06
-- Tabela: public.disciplinas

ALTER TABLE public.disciplinas
  ADD COLUMN IF NOT EXISTS ementa TEXT,
  ADD COLUMN IF NOT EXISTS credito NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS qtd_aulas INTEGER,
  ADD COLUMN IF NOT EXISTS complementar BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS optativa BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requer_deferimento BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estagio BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avaliacoes INTEGER;
