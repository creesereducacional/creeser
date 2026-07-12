-- Cria tabela de vendas comerciais para controle de transações no funil comercial
-- Local: c:\PROJETOS\creeser\supabase\migrations\20260712_create_vendas_comerciais.sql

CREATE TABLE IF NOT EXISTS public.vendas_comerciais (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  receita_id          UUID REFERENCES public.financeiro_receitas_comerciais(id) ON DELETE SET NULL,
  instituicao_id      UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  curso_id            BIGINT REFERENCES public.cursos(id) ON DELETE SET NULL,
  captador_id         BIGINT REFERENCES public.usuarios(id) ON DELETE SET NULL,
  gateway             VARCHAR(50) DEFAULT 'asaas',
  gateway_payment_id  VARCHAR(100) UNIQUE NOT NULL,
  valor               NUMERIC(10, 2) NOT NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO'
    CHECK (status IN ('AGUARDANDO_PAGAMENTO', 'PAGO', 'MATRICULADO', 'CANCELADO')),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendas_comerciais_lead_id ON public.vendas_comerciais(lead_id);
CREATE INDEX IF NOT EXISTS idx_vendas_comerciais_payment_id ON public.vendas_comerciais(gateway_payment_id);
