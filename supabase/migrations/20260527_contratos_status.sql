-- Migration: status_contrato e datas de rastreio em alunos
-- Executar no Supabase SQL Editor

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS status_contrato        TEXT        NOT NULL DEFAULT 'NAO_GERADO',
  ADD COLUMN IF NOT EXISTS data_envio_contrato     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_assinatura_contrato TIMESTAMPTZ;

-- Índice para buscas por status_contrato
CREATE INDEX IF NOT EXISTS idx_alunos_status_contrato
  ON alunos (status_contrato);

-- Índice composto para dashboard de contratos
CREATE INDEX IF NOT EXISTS idx_alunos_inst_status_contrato
  ON alunos (instituicao_id, status_contrato);
