-- Adiciona colunas ausentes na tabela financeiro_parcelas
-- (caso a tabela tenha sido criada antes da migration completa)

ALTER TABLE public.financeiro_parcelas
  ADD COLUMN IF NOT EXISTS data_vencimento  date,
  ADD COLUMN IF NOT EXISTS data_pagamento   date,
  ADD COLUMN IF NOT EXISTS valor_pago       numeric(10,2),
  ADD COLUMN IF NOT EXISTS boleto_numero    varchar(50),
  ADD COLUMN IF NOT EXISTS boleto_barcode   varchar(100),
  ADD COLUMN IF NOT EXISTS boleto_url       text,
  ADD COLUMN IF NOT EXISTS observacoes      text;

-- Adiciona colunas ausentes em financeiro_ordens_pagamento
ALTER TABLE public.financeiro_ordens_pagamento
  ADD COLUMN IF NOT EXISTS referencia           varchar(100),
  ADD COLUMN IF NOT EXISTS percentual_desconto  numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_desconto       numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_parcelas  integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS observacoes          text,
  ADD COLUMN IF NOT EXISTS criado_por           varchar(255);
