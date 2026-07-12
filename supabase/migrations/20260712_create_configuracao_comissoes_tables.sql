-- Tabelas para controle de comissão comercial por receitas de leads
-- Local: c:\PROJETOS\creeser\supabase\migrations\20260712_create_configuracao_comissoes_tables.sql

CREATE TABLE IF NOT EXISTS public.configuracao_comissoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id  UUID NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  percentual      NUMERIC(5, 2) NOT NULL CHECK (percentual >= 0 AND percentual <= 100),
  vigencia_inicio DATE,
  vigencia_fim    DATE,
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financeiro_comissoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id      UUID REFERENCES public.financeiro_receitas_comerciais(id) ON DELETE SET NULL,
  lead_id         UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  captador_id     BIGINT REFERENCES public.usuarios(id) ON DELETE SET NULL,
  instituicao_id  UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  percentual_aplicado NUMERIC(5, 2) NOT NULL,
  valor_base      NUMERIC(10, 2) NOT NULL,
  valor_comissao  NUMERIC(10, 2) NOT NULL,
  status          VARCHAR(50) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'LIBERADA', 'PAGA')),
  data_calculo    TIMESTAMPTZ DEFAULT now(),
  data_pagamento  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT financeiro_comissao_receita_unique UNIQUE (receita_id)
);

CREATE INDEX IF NOT EXISTS idx_financeiro_comissoes_receita ON public.financeiro_comissoes(receita_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_comissoes_captador ON public.financeiro_comissoes(captador_id);
