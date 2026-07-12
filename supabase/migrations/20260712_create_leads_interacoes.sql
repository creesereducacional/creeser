-- Migration: Criar tabela de interacoes do lead (Timeline 360)
-- Data: 2026-07-12

CREATE TABLE IF NOT EXISTS public.leads_interacoes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      INTEGER REFERENCES public.leads(id) ON DELETE CASCADE,
  instituicao_id INTEGER REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  usuario_id   INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo         VARCHAR(50) NOT NULL, -- 'criacao', 'atualizacao', 'cobranca_asaas', 'link_enviado', 'pagamento_confirmado', 'receita_criada', 'comissao_calculada', 'venda_criada', 'matricula_efetivada', 'ligacao', 'whatsapp', 'email', 'reuniao', 'visita', 'observacao'
  descricao    TEXT NOT NULL,
  data_evento  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_interacoes_lead_id ON public.leads_interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_interacoes_tipo ON public.leads_interacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_leads_interacoes_data_evento ON public.leads_interacoes(data_evento DESC);
