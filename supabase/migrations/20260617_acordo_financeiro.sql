-- supabase/migrations/20260617_acordo_financeiro.sql
-- Adiciona suporte a Acordo Financeiro nas ordens de pagamento

ALTER TABLE public.financeiro_ordens_pagamento
  DROP CONSTRAINT IF EXISTS financeiro_ordens_pagamento_tipo_check;

ALTER TABLE public.financeiro_ordens_pagamento
  ADD CONSTRAINT financeiro_ordens_pagamento_tipo_check
  CHECK (tipo IN ('ordem_simples', 'carne', 'matricula', 'acordo'));

ALTER TABLE public.financeiro_ordens_pagamento
  ADD COLUMN IF NOT EXISTS parcelas_origem_acordo JSONB NULL,
  ADD COLUMN IF NOT EXISTS entrada_parcela_id UUID NULL REFERENCES public.financeiro_parcelas(id) ON DELETE SET NULL;
