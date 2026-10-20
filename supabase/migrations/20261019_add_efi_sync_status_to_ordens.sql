-- Migration: 20261019_add_efi_sync_status_to_ordens.sql
-- Descrição: Adiciona colunas de controle para a sincronização automática de baixas com a API do EFI Bank
-- Instrução: Aplicação manual no banco Supabase

ALTER TABLE financeiro_ordens_pagamento
ADD COLUMN IF NOT EXISTS efi_sync_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS efi_sync_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS efi_sync_erro TEXT DEFAULT NULL;

COMMENT ON COLUMN financeiro_ordens_pagamento.efi_sync_status IS 'Status da sincronização com a EFI: sincronizado, pendente, nao_aplicavel';
COMMENT ON COLUMN financeiro_ordens_pagamento.efi_sync_at IS 'Data e hora da última sincronização com a EFI';
COMMENT ON COLUMN financeiro_ordens_pagamento.efi_sync_erro IS 'Mensagem de erro da última tentativa de sincronização';

CREATE INDEX IF NOT EXISTS idx_financeiro_ordens_efi_sync ON financeiro_ordens_pagamento(efi_sync_status);
