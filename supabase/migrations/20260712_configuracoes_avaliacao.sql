-- Migration: Criar estrutura para Avaliações Parametrizáveis
-- Data: 2026-07-12
-- Descrição: Cria as tabelas de cabeçalho e itens de configuração de notas e adiciona o campo detalhes_notas JSONB à tabela notas_faltas.

CREATE TABLE IF NOT EXISTS public.configuracoes_avaliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  curso_id INTEGER REFERENCES public.cursos(id) ON DELETE CASCADE,
  media_minima_aprovacao NUMERIC(4,2) DEFAULT 6.00,
  media_minima_exame NUMERIC(4,2) DEFAULT 4.00,
  criterio_aprovacao TEXT DEFAULT 'AMBOS', -- 'NOTA', 'FREQUENCIA', 'AMBOS'
  frequencia_minima_aprovacao NUMERIC(5,2) DEFAULT 75.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uniq_inst_curso_avaliacao UNIQUE (instituicao_id, curso_id)
);

CREATE TABLE IF NOT EXISTS public.avaliacoes_estrutura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuracao_id UUID REFERENCES public.configuracoes_avaliacao(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- Ex: 'AP1', 'Trabalho de Campo'
  sigla TEXT NOT NULL, -- Ex: 'AP1', 'T1'
  peso NUMERIC(4,2) NOT NULL, -- Ex: 0.30 (representa 30% da nota)
  nota_maxima NUMERIC(4,2) DEFAULT 10.00,
  ordem INTEGER DEFAULT 0,
  eh_recuperacao BOOLEAN DEFAULT FALSE,
  eh_exame_final BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar o campo detalhes_notas JSONB na tabela notas_faltas
ALTER TABLE public.notas_faltas
  ADD COLUMN IF NOT EXISTS detalhes_notas JSONB DEFAULT '{}'::jsonb;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_config_aval_instituicao ON public.configuracoes_avaliacao(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_aval_curso ON public.configuracoes_avaliacao(curso_id);
CREATE INDEX IF NOT EXISTS idx_aval_est_config ON public.avaliacoes_estrutura(configuracao_id);

-- Desabilitar RLS
ALTER TABLE public.configuracoes_avaliacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_estrutura DISABLE ROW LEVEL SECURITY;

-- Rotina de migração de dados existentes para detalhes_notas JSONB
UPDATE public.notas_faltas
SET detalhes_notas = jsonb_build_object(
  'AP1', COALESCE(ap1, 0),
  'AP2', COALESCE(ap2, 0),
  'AP3', COALESCE(ap3, 0)
)
WHERE detalhes_notas IS NULL OR detalhes_notas = '{}'::jsonb;

