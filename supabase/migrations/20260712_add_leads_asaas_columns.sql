-- Adiciona campos de integração Asaas na tabela public.leads
-- Local: c:\PROJETOS\creeser\supabase\migrations\20260712_add_leads_asaas_columns.sql

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS asaas_customer_id   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS asaas_payment_id    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS asaas_payment_url   TEXT,
  ADD COLUMN IF NOT EXISTS asaas_invoice_url   TEXT,
  ADD COLUMN IF NOT EXISTS asaas_status_pagamento VARCHAR(50);
