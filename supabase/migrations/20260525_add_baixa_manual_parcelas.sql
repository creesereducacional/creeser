-- ============================================================
-- BAIXA MANUAL DE PARCELAS
-- Adicionado em: 2026-05-25
-- Objetivo: Suporte a registro de pagamentos fora do boleto EFI
--           (PIX, dinheiro, transferência, cartão, cheque)
-- ============================================================

-- 1. Novas colunas em financeiro_parcelas
ALTER TABLE public.financeiro_parcelas
  ADD COLUMN IF NOT EXISTS metodo_pagamento  VARCHAR(30)    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS baixado_por_id    BIGINT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS baixado_em        TIMESTAMPTZ    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS observacao_baixa  TEXT           DEFAULT NULL;

-- 2. Tabela de auditoria financeira
CREATE TABLE IF NOT EXISTS public.financeiro_logs (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id        UUID          REFERENCES public.financeiro_parcelas(id) ON DELETE SET NULL,
  aluno_id          BIGINT        REFERENCES public.alunos(id)              ON DELETE SET NULL,
  instituicao_id    UUID          REFERENCES public.instituicoes(id)        ON DELETE SET NULL,
  usuario_id        BIGINT        DEFAULT NULL,
  acao              VARCHAR(50)   NOT NULL,
  valor_pago        NUMERIC(12,2),
  metodo_pagamento  VARCHAR(30),
  data_pagamento    DATE,
  observacao        TEXT,
  dados_extras      JSONB,
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_financeiro_logs_parcela_id     ON public.financeiro_logs(parcela_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_logs_aluno_id       ON public.financeiro_logs(aluno_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_logs_instituicao_id ON public.financeiro_logs(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_logs_created_at     ON public.financeiro_logs(created_at DESC);
