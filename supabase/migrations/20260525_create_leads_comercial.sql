-- Módulo Comercial: tabela de leads, auditoria e campo captado_por_id em alunos
-- Aplicar no Supabase SQL Editor: https://app.supabase.com/project/wjcbobcqyqdkludsbqgf/sql/new

-- ─── LEADS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid        NOT NULL REFERENCES public.instituicoes(id) ON DELETE RESTRICT,
  nome          text         NOT NULL,
  telefone      varchar(20),
  whatsapp      varchar(20),
  email         varchar(255),
  curso_interesse text,
  origem        varchar(100),
  observacoes   text,
  status        varchar(20)  NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo', 'contatado', 'interessado', 'matriculado', 'perdido')),
  captado_por_id bigint      REFERENCES public.usuarios(id) ON DELETE SET NULL,
  aluno_convertido_id bigint REFERENCES public.alunos(id)   ON DELETE SET NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_instituicao_id   ON public.leads(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_leads_captado_por_id   ON public.leads(captado_por_id);
CREATE INDEX IF NOT EXISTS idx_leads_status           ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at       ON public.leads(created_at);

-- ─── AUDITORIA DE LEADS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads_auditoria (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid        REFERENCES public.leads(id) ON DELETE CASCADE,
  usuario_id      bigint      REFERENCES public.usuarios(id) ON DELETE SET NULL,
  acao            varchar(50) NOT NULL,  -- 'criacao' | 'edicao' | 'conversao'
  dados_anteriores jsonb,
  dados_novos      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_auditoria_lead_id    ON public.leads_auditoria(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_auditoria_usuario_id ON public.leads_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_leads_auditoria_acao       ON public.leads_auditoria(acao);

-- ─── CAMPO captado_por_id EM ALUNOS ──────────────────────────────────────────
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS captado_por_id bigint
    REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alunos_captado_por_id ON public.alunos(captado_por_id);
