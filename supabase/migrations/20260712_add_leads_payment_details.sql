-- Adiciona campos de pagamento e valores recebidos na tabela public.leads
-- Local: c:\PROJETOS\creeser\supabase\migrations\20260712_add_leads_payment_details.sql

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valor_pago     NUMERIC(10, 2);
