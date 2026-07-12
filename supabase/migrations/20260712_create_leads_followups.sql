-- Migration: Criar tabela de follow-ups do lead (Agenda Comercial)
-- Data: 2026-07-12

CREATE TABLE IF NOT EXISTS public.leads_followups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  usuario_id    INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo          VARCHAR(50) NOT NULL, -- 'ligacao', 'whatsapp', 'email', 'reuniao', 'visita'
  assunto       VARCHAR(255) NOT NULL,
  observacao    TEXT,
  data_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
  prioridade    VARCHAR(20) DEFAULT 'media', -- 'baixa', 'media', 'alta'
  status        VARCHAR(20) DEFAULT 'PENDENTE', -- 'PENDENTE', 'CONCLUIDO', 'CANCELADO'
  concluido_em  TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_followups_lead_id ON public.leads_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_followups_usuario_id ON public.leads_followups(usuario_id);
CREATE INDEX IF NOT EXISTS idx_leads_followups_status ON public.leads_followups(status);
CREATE INDEX IF NOT EXISTS idx_leads_followups_data_agendada ON public.leads_followups(data_agendada ASC);
