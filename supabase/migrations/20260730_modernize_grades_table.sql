-- Migration: Modernização da Tabela public.grades (RC29)
-- Adiciona colunas modernas e migra os dados existentes

-- 1. Adicionar colunas modernizadas mantendo as colunas legadas ativas
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS curso_id INTEGER REFERENCES public.cursos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS instituicao_nome TEXT,
  ADD COLUMN IF NOT EXISTS curso_nome TEXT,
  ADD COLUMN IF NOT EXISTS situacao TEXT DEFAULT 'ATIVO',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Migrar dados existentes das colunas legadas para as novas colunas
UPDATE public.grades
SET
  curso_id = COALESCE(curso_id, cursoid),
  created_at = COALESCE(created_at, datacriacao, NOW()),
  updated_at = COALESCE(updated_at, dataatualizacao, NOW()),
  situacao = COALESCE(situacao, 'ATIVO')
WHERE curso_id IS NULL OR created_at IS NULL OR updated_at IS NULL OR situacao IS NULL;

-- 3. Criar índices para otimização de busca e multitenancy
CREATE INDEX IF NOT EXISTS idx_grades_curso_id ON public.grades(curso_id);
CREATE INDEX IF NOT EXISTS idx_grades_instituicao_id ON public.grades(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_grades_situacao ON public.grades(situacao);
