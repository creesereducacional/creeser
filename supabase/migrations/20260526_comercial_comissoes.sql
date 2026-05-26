-- Migration: Criar tabela comercial_comissoes
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.comercial_comissoes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id       UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  aluno_id             UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  lead_id              UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  comercial_id         UUID NOT NULL,  -- referencias public.usuarios(id)
  ordem_id             UUID REFERENCES public.financeiro_ordens_pagamento(id) ON DELETE SET NULL,
  valor_base           NUMERIC(10,2),
  valor_comissao       NUMERIC(10,2),
  percentual_comissao  NUMERIC(5,2),
  status               TEXT NOT NULL DEFAULT 'pendente'
                         CHECK (status IN ('pendente','pendente_configuracao','liberada','repassada','cancelada')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_liberacao       TIMESTAMPTZ,
  data_repasse         TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comercial_comissoes_comercial_id   ON public.comercial_comissoes(comercial_id);
CREATE INDEX IF NOT EXISTS idx_comercial_comissoes_aluno_id        ON public.comercial_comissoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_comercial_comissoes_lead_id         ON public.comercial_comissoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_comercial_comissoes_ordem_id        ON public.comercial_comissoes(ordem_id);
CREATE INDEX IF NOT EXISTS idx_comercial_comissoes_status          ON public.comercial_comissoes(status);
CREATE INDEX IF NOT EXISTS idx_comercial_comissoes_instituicao_id  ON public.comercial_comissoes(instituicao_id);

-- RLS: comercial só vê as próprias comissões
ALTER TABLE public.comercial_comissoes ENABLE ROW LEVEL SECURITY;

-- Política: service_role bypassa RLS (usado pelas APIs)
-- Políticas de leitura por JWT podem ser adicionadas depois conforme necessário

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_comercial_comissoes_updated_at ON public.comercial_comissoes;
CREATE TRIGGER trg_comercial_comissoes_updated_at
  BEFORE UPDATE ON public.comercial_comissoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Adicionar campo origem na tabela leads (caso não exista)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origem_captacao TEXT;

-- Adicionar campo data_matricula na tabela alunos (caso não exista)
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS data_matricula DATE;
