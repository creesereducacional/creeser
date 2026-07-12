-- Cria tabela de receitas comerciais oriundas de conversão de leads
-- Local: c:\PROJETOS\creeser\supabase\migrations\20260712_create_financeiro_receitas_comerciais.sql

CREATE TABLE IF NOT EXISTS public.financeiro_receitas_comerciais (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  instituicao_id      UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  curso_nome          TEXT,
  captador_id         BIGINT REFERENCES public.usuarios(id) ON DELETE SET NULL,
  forma_pagamento     VARCHAR(50),
  gateway             VARCHAR(50) DEFAULT 'asaas',
  gateway_payment_id  VARCHAR(100) UNIQUE NOT NULL,
  valor_bruto         NUMERIC(10, 2) NOT NULL,
  valor_liquido       NUMERIC(10, 2),
  data_pagamento      TIMESTAMPTZ NOT NULL,
  status              VARCHAR(50) DEFAULT 'Recebido',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receitas_comerciais_lead_id ON public.financeiro_receitas_comerciais(lead_id);
CREATE INDEX IF NOT EXISTS idx_receitas_comerciais_payment_id ON public.financeiro_receitas_comerciais(gateway_payment_id);
