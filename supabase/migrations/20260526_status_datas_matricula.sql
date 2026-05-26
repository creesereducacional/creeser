-- Migration: campos de rastreabilidade de matrícula e status
-- Data: 2026-05-26
-- Scope: tabela alunos

-- 1. Campos de datas para rastreabilidade
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS origem_captacao      VARCHAR(100)  DEFAULT NULL;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_captacao         DATE          DEFAULT NULL;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_pagamento_matricula DATE       DEFAULT NULL;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_ativacao         DATE          DEFAULT NULL;

-- 2. captado_por_id já deve existir (da migration 20260526_comercial_comissoes.sql)
-- Preservado intacto.

-- 3. Índices úteis para relatórios
CREATE INDEX IF NOT EXISTS idx_alunos_statusmatricula ON alunos (statusmatricula);
CREATE INDEX IF NOT EXISTS idx_alunos_data_captacao   ON alunos (data_captacao);
CREATE INDEX IF NOT EXISTS idx_alunos_data_ativacao   ON alunos (data_ativacao);

-- 4. Status suportados (documentação — sem constraint para evitar lock em dados antigos):
-- PRE_CADASTRO
-- AGUARDANDO_PAGAMENTO_MATRICULA
-- AGUARDANDO_FORMACAO_TURMA
-- ATIVO
-- DESISTENTE   (desistência antes de virar ATIVO)
-- CANCELADO    (cancelamento após ter sido ATIVO)
