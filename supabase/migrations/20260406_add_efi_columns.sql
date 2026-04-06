-- Adiciona colunas de integração EFI Bank nas tabelas financeiras
-- Aplicar no Supabase SQL Editor: https://app.supabase.com/project/wjcbobcqyqdkludsbqgf/sql/new

-- Em financeiro_ordens_pagamento:
--   efi_charge_id  → charge_id retornado pela EFI ao criar boleto único
--   efi_carnet_id  → carnet_id retornado pela EFI ao criar carnê
--   efi_status     → último status conhecido na EFI (new, waiting, paid, canceled...)

ALTER TABLE public.financeiro_ordens_pagamento
  ADD COLUMN IF NOT EXISTS efi_charge_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS efi_carnet_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS efi_status    VARCHAR(50);

-- Índices para facilitar consulta por ID da EFI
CREATE INDEX IF NOT EXISTS idx_financeiro_ordens_efi_charge_id
  ON public.financeiro_ordens_pagamento(efi_charge_id)
  WHERE efi_charge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financeiro_ordens_efi_carnet_id
  ON public.financeiro_ordens_pagamento(efi_carnet_id)
  WHERE efi_carnet_id IS NOT NULL;

-- Em financeiro_parcelas: armazena o charge_id individual de cada parcela do carnê
ALTER TABLE public.financeiro_parcelas
  ADD COLUMN IF NOT EXISTS efi_charge_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_financeiro_parcelas_efi_charge_id
  ON public.financeiro_parcelas(efi_charge_id)
  WHERE efi_charge_id IS NOT NULL;
