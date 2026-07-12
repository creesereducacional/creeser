-- Migration: Atualizar check constraint de status da tabela public.leads
-- Data: 2026-07-12

-- 1. Remover constraint antiga se existir
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 2. Adicionar a nova constraint com os status do Kanban Comercial
ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'novo', 
    'contatado', 
    'interessado', 
    'proposta_enviada', 
    'aguardando_pagamento', 
    'pago', 
    'matriculado', 
    'perdido', 
    'pre_matricula', 
    'desistente'
  ));
