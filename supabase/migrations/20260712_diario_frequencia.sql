-- Migration: Criar tabela de frequencia diario
-- Data: 2026-07-12
-- Descrição: Cria a tabela para registro de frequência aula a aula (presença/falta) dos alunos.

CREATE TABLE IF NOT EXISTS public.diario_frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  aula_id UUID REFERENCES public.planejamento_diario(id) ON DELETE CASCADE,
  aluno_id INTEGER REFERENCES public.alunos(id) ON DELETE CASCADE,
  presenca BOOLEAN DEFAULT TRUE,
  justificativa TEXT,
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restrição única para evitar duplicados da mesma aula/aluno
ALTER TABLE public.diario_frequencia
  DROP CONSTRAINT IF EXISTS uniq_aula_aluno_frequencia;

ALTER TABLE public.diario_frequencia
  ADD CONSTRAINT uniq_aula_aluno_frequencia
  UNIQUE (aula_id, aluno_id);

CREATE INDEX IF NOT EXISTS idx_diario_freq_aula_id ON public.diario_frequencia(aula_id);
CREATE INDEX IF NOT EXISTS idx_diario_freq_aluno_id ON public.diario_frequencia(aluno_id);
CREATE INDEX IF NOT EXISTS idx_diario_freq_instituicao_id ON public.diario_frequencia(instituicao_id);

-- Desabilitar RLS
ALTER TABLE public.diario_frequencia DISABLE ROW LEVEL SECURITY;
