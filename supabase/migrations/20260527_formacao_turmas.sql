-- Migration: Formação de Turmas
-- Executar no Supabase SQL Editor

-- 1. Adicionar colunas na tabela turmas
ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS qtd_minima_alunos    INTEGER     DEFAULT 20,
  ADD COLUMN IF NOT EXISTS data_prevista_inicio  DATE,
  ADD COLUMN IF NOT EXISTS status_formacao       TEXT        DEFAULT 'EM_FORMACAO';

-- 2. Criar tabela de auditoria de formacao
CREATE TABLE IF NOT EXISTS formacao_auditoria (
  id          BIGSERIAL   PRIMARY KEY,
  turma_id    BIGINT      REFERENCES turmas(id) ON DELETE SET NULL,
  usuario_id  BIGINT      REFERENCES usuarios(id) ON DELETE SET NULL,
  acao        TEXT        NOT NULL,  -- ALTERAR_QTD_MINIMA | ALTERAR_DATA_INICIO | ALTERAR_STATUS_FORMACAO
  dados       TEXT,                  -- JSON serializado com { campo: { de, para } }
  data_hora   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formacao_auditoria_turma_id   ON formacao_auditoria(turma_id);
CREATE INDEX IF NOT EXISTS idx_formacao_auditoria_usuario_id ON formacao_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_formacao_auditoria_data_hora  ON formacao_auditoria(data_hora DESC);
