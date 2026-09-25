-- Migration: campos de captação, rastreabilidade e vínculo de captador em alunos
-- Data: 2026-09-24
-- Scope: tabela public.alunos
-- Motivação: pré-cadastro falhava com "Could not find column 'origem_captacao'" porque
--            as migrations 20260525_create_leads_comercial.sql e
--            20260526_status_datas_matricula.sql nunca foram aplicadas neste ambiente.
-- Idempotente: todos os statements usam ADD COLUMN IF NOT EXISTS e CREATE INDEX IF NOT EXISTS.

-- ─── 1. captado_por_id ────────────────────────────────────────────────────────
-- Originalmente em 20260525_create_leads_comercial.sql (L44-46)
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS captado_por_id BIGINT
    REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alunos_captado_por_id
  ON public.alunos (captado_por_id);

-- ─── 2. origem_captacao ───────────────────────────────────────────────────────
-- Originalmente em 20260526_status_datas_matricula.sql (L6)
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS origem_captacao VARCHAR(100) DEFAULT NULL;

-- ─── 3. data_captacao ─────────────────────────────────────────────────────────
-- Originalmente em 20260526_status_datas_matricula.sql (L7)
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS data_captacao DATE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_alunos_data_captacao
  ON public.alunos (data_captacao);

-- ─── 4. data_pagamento_matricula ──────────────────────────────────────────────
-- Originalmente em 20260526_status_datas_matricula.sql (L8)
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS data_pagamento_matricula DATE DEFAULT NULL;

-- ─── 5. data_ativacao ─────────────────────────────────────────────────────────
-- Originalmente em 20260526_status_datas_matricula.sql (L9) e
-- 20260527_formacao_fase2.sql (TIMESTAMPTZ).
-- IF NOT EXISTS garante idempotência: se a coluna já existir (de 20260527),
-- o statement é silenciosamente ignorado e o tipo vigente é preservado.
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS data_ativacao DATE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_alunos_data_ativacao
  ON public.alunos (data_ativacao);

-- ─── 6. statusmatricula — índice apenas ──────────────────────────────────────
-- A coluna statusMatricula já existe desde o schema original (schema.sql L128).
-- O PostgreSQL normaliza para lowercase; nenhum ADD COLUMN necessário.
-- Índice estava em 20260526_status_datas_matricula.sql (L15); criado aqui se ausente.
CREATE INDEX IF NOT EXISTS idx_alunos_statusmatricula
  ON public.alunos (statusmatricula);

-- ─── 7. Recarregar schema cache do PostgREST ─────────────────────────────────
NOTIFY pgrst, 'reload schema';
