-- Migration: Módulo de Comissões Comerciais
-- Data: 2026-05-27

-- ─── TABELA: comissoes_config ─────────────────────────────────────────────────
-- Cada instituição define sua regra de comissionamento.
CREATE TABLE IF NOT EXISTS public.comissoes_config (
  id              SERIAL PRIMARY KEY,
  instituicao_id  UUID    NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  modo            TEXT    NOT NULL CHECK (modo IN ('PERCENTUAL', 'VALOR_FIXO')),
  percentual      NUMERIC(5,2)  CHECK (percentual IS NULL OR (percentual >= 0 AND percentual <= 100)),
  valor_fixo      NUMERIC(12,2) CHECK (valor_fixo IS NULL OR valor_fixo >= 0),
  ativo           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT comissoes_config_instituicao_unique UNIQUE (instituicao_id)
);

-- ─── TABELA: comissoes_comerciais ─────────────────────────────────────────────
-- Registra cada comissão gerada automaticamente após pagamento de matrícula.
CREATE TABLE IF NOT EXISTS public.comissoes_comerciais (
  id                   SERIAL PRIMARY KEY,
  instituicao_id       UUID    NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  aluno_id             BIGINT  REFERENCES public.alunos(id) ON DELETE SET NULL,
  captado_por_id       BIGINT  NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  ordem_pagamento_id   UUID    REFERENCES public.financeiro_ordens_pagamento(id) ON DELETE SET NULL,
  parcela_id           UUID    REFERENCES public.financeiro_parcelas(id) ON DELETE SET NULL,
  valor_base           NUMERIC(12,2) NOT NULL CHECK (valor_base >= 0),
  tipo_comissao        TEXT    NOT NULL CHECK (tipo_comissao IN ('percentual', 'fixa')),
  percentual           NUMERIC(5,2),
  valor_comissao       NUMERIC(12,2) NOT NULL CHECK (valor_comissao >= 0),
  status               TEXT    NOT NULL DEFAULT 'PENDENTE_REPASSE'
                         CHECK (status IN ('PENDENTE_REPASSE', 'REPASSADO', 'CANCELADO')),
  data_credito         DATE    NOT NULL DEFAULT CURRENT_DATE,
  data_repasse         DATE,
  repassado_por_id     BIGINT  REFERENCES public.usuarios(id) ON DELETE SET NULL,
  observacao           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Previne duplicidade: uma comissão por ordem de pagamento
  CONSTRAINT comissoes_ordem_unique UNIQUE (ordem_pagamento_id)
);

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comissoes_config_instituicao
  ON public.comissoes_config(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_comissoes_comerciais_instituicao
  ON public.comissoes_comerciais(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_comissoes_comerciais_captado_por
  ON public.comissoes_comerciais(captado_por_id);

CREATE INDEX IF NOT EXISTS idx_comissoes_comerciais_status
  ON public.comissoes_comerciais(status);

CREATE INDEX IF NOT EXISTS idx_comissoes_comerciais_data_credito
  ON public.comissoes_comerciais(data_credito);

CREATE INDEX IF NOT EXISTS idx_comissoes_comerciais_aluno
  ON public.comissoes_comerciais(aluno_id);

-- ─── TRIGGER: updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_comissoes_comerciais_updated_at ON public.comissoes_comerciais;
CREATE TRIGGER trg_comissoes_comerciais_updated_at
  BEFORE UPDATE ON public.comissoes_comerciais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── EXTENSÃO DE TIPO EM ORDENS (compatibilidade com pagamento de matrícula) ─
-- Permite que ordens sejam criadas com tipo='matricula'
ALTER TABLE public.financeiro_ordens_pagamento
  DROP CONSTRAINT IF EXISTS financeiro_ordens_pagamento_tipo_check;

ALTER TABLE public.financeiro_ordens_pagamento
  ADD CONSTRAINT financeiro_ordens_pagamento_tipo_check
  CHECK (tipo IN ('ordem_simples', 'carne', 'matricula'));
