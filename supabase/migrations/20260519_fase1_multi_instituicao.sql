-- FASE 1: Seguranca e multi-instituicao
-- Adiciona tipo_instituicao e instituicao_id nas tabelas criticas.

-- Instituicoes: tipo
ALTER TABLE public.instituicoes
  ADD COLUMN IF NOT EXISTS tipo_instituicao VARCHAR(30);

ALTER TABLE public.instituicoes
  DROP CONSTRAINT IF EXISTS chk_instituicoes_tipo_instituicao;

ALTER TABLE public.instituicoes
  ADD CONSTRAINT chk_instituicoes_tipo_instituicao
  CHECK (tipo_instituicao IS NULL OR tipo_instituicao IN ('faculdade', 'tecnico', 'colegio', 'ead', 'outro'));

-- Configuracoes por instituicao
ALTER TABLE public.configuracoes_empresa
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_configuracoes_empresa_instituicao
  ON public.configuracoes_empresa(instituicao_id);

-- Usuarios e equipe
ALTER TABLE IF EXISTS public.usuarios
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS perfil TEXT;

CREATE INDEX IF NOT EXISTS idx_usuarios_instituicao_id
  ON public.usuarios(instituicao_id);

ALTER TABLE IF EXISTS public.professores
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_professores_instituicao_id
  ON public.professores(instituicao_id);

ALTER TABLE IF EXISTS public.funcionarios
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_funcionarios_instituicao_id
  ON public.funcionarios(instituicao_id);

-- Alunos
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alunos_instituicao_id
  ON public.alunos(instituicao_id);

-- Outros cadastros
ALTER TABLE IF EXISTS public.responsaveis
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_responsaveis_instituicao_id
  ON public.responsaveis(instituicao_id);

ALTER TABLE IF EXISTS public.documentos
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documentos_instituicao_id
  ON public.documentos(instituicao_id);

-- Financeiro
ALTER TABLE public.financeiro_ordens_pagamento
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_financeiro_ordens_instituicao_id
  ON public.financeiro_ordens_pagamento(instituicao_id);

ALTER TABLE public.financeiro_parcelas
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_financeiro_parcelas_instituicao_id
  ON public.financeiro_parcelas(instituicao_id);

ALTER TABLE public.financeiro_boletos
  ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_financeiro_boletos_instituicao_id
  ON public.financeiro_boletos(instituicao_id);

-- Backfill basico para financeiro
UPDATE public.financeiro_ordens_pagamento AS o
SET instituicao_id = a.instituicao_id
FROM public.alunos AS a
WHERE o.aluno_id = a.id
  AND o.instituicao_id IS NULL
  AND a.instituicao_id IS NOT NULL;

UPDATE public.financeiro_parcelas AS p
SET instituicao_id = o.instituicao_id
FROM public.financeiro_ordens_pagamento AS o
WHERE p.ordem_pagamento_id = o.id
  AND p.instituicao_id IS NULL
  AND o.instituicao_id IS NOT NULL;

-- ============================================================
-- BACKFILL MANUAL — execute SEPARADAMENTE após esta migration
-- Substitua <UUID-DA-INSTITUICAO> pelo ID real da instituição
-- principal antes de executar os comandos abaixo.
-- ============================================================
-- UPDATE public.alunos SET instituicao_id = '<UUID-DA-INSTITUICAO>' WHERE instituicao_id IS NULL;
-- UPDATE public.professores SET instituicao_id = '<UUID-DA-INSTITUICAO>' WHERE instituicao_id IS NULL;
-- UPDATE public.funcionarios SET instituicao_id = '<UUID-DA-INSTITUICAO>' WHERE instituicao_id IS NULL;
-- UPDATE public.usuarios SET instituicao_id = '<UUID-DA-INSTITUICAO>' WHERE instituicao_id IS NULL;

UPDATE public.financeiro_boletos AS b
SET instituicao_id = p.instituicao_id
FROM public.financeiro_parcelas AS p
WHERE b.parcela_id = p.id
  AND b.instituicao_id IS NULL
  AND p.instituicao_id IS NOT NULL;
