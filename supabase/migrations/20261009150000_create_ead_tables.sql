-- ==============================================================================
-- Migration: 20261009150000_create_ead_tables.sql
-- Módulo EAD: Estrutura relacional dedicada para Cursos, Módulos, Aulas,
--             Materiais de Apoio, Avaliações e Banco de Questões.
-- 
-- IMPORTANTE:
-- - NÃO altera nem sobrescreve a tabela 'public.cursos' (gestão presencial).
-- - Contempla isolamento multi-tenant via 'instituicao_id REFERENCES instituicoes(id)'.
-- - Garante ordenação sequencial e integridade referencial em cascata (ON DELETE CASCADE).
-- ==============================================================================

-- 1. TABELA PRINCIPAL DE CURSOS EAD
CREATE TABLE IF NOT EXISTS public.ead_cursos (
  id                     BIGSERIAL PRIMARY KEY,
  instituicao_id         UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  titulo                 TEXT NOT NULL,
  descricao              TEXT,
  categoria              TEXT DEFAULT 'Geral',
  carga_horaria          INTEGER DEFAULT 15,
  thumbnail_url          TEXT,
  video_apresentacao_url TEXT,
  ativo                  BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ead_cursos_instituicao_id ON public.ead_cursos(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_ead_cursos_ativo          ON public.ead_cursos(ativo);

-- 2. TABELA DE MÓDULOS DO CURSO EAD
CREATE TABLE IF NOT EXISTS public.ead_modulos (
  id          BIGSERIAL PRIMARY KEY,
  curso_id    BIGINT NOT NULL REFERENCES public.ead_cursos(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  ordem       INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ead_modulos_curso_id ON public.ead_modulos(curso_id);
CREATE INDEX IF NOT EXISTS idx_ead_modulos_ordem    ON public.ead_modulos(curso_id, ordem);

-- 3. TABELA DE AULAS DO MÓDULO EAD
CREATE TABLE IF NOT EXISTS public.ead_aulas (
  id              BIGSERIAL PRIMARY KEY,
  modulo_id       BIGINT NOT NULL REFERENCES public.ead_modulos(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  video_url       TEXT,
  duracao_minutos INTEGER DEFAULT 0,
  ordem           INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ead_aulas_modulo_id ON public.ead_aulas(modulo_id);
CREATE INDEX IF NOT EXISTS idx_ead_aulas_ordem     ON public.ead_aulas(modulo_id, ordem);

-- 4. TABELA DE MATERIAIS DE APOIO DAS AULAS EAD
CREATE TABLE IF NOT EXISTS public.ead_materiais (
  id          BIGSERIAL PRIMARY KEY,
  aula_id     BIGINT NOT NULL REFERENCES public.ead_aulas(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  tipo        TEXT DEFAULT 'pdf', -- 'pdf', 'video', 'link', 'documento', 'imagem'
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ead_materiais_aula_id ON public.ead_materiais(aula_id);

-- 5. TABELA DE AVALIAÇÕES FINAIS DO CURSO EAD
CREATE TABLE IF NOT EXISTS public.ead_avaliacoes (
  id              BIGSERIAL PRIMARY KEY,
  curso_id        BIGINT NOT NULL REFERENCES public.ead_cursos(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  nota_minima     INTEGER DEFAULT 70,
  duracao_minutos INTEGER DEFAULT 30,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ead_avaliacoes_curso_id ON public.ead_avaliacoes(curso_id);

-- 6. TABELA DE BANCO DE QUESTÕES DA AVALIAÇÃO / AULA
CREATE TABLE IF NOT EXISTS public.ead_questoes (
  id               BIGSERIAL PRIMARY KEY,
  avaliacao_id     BIGINT REFERENCES public.ead_avaliacoes(id) ON DELETE CASCADE,
  aula_id          BIGINT REFERENCES public.ead_aulas(id) ON DELETE CASCADE,
  enunciado        TEXT NOT NULL,
  opcoes           JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de alternativas (texto)
  resposta_correta INTEGER NOT NULL DEFAULT 0,         -- Índice (0 a N-1) da resposta correta
  explicacao       TEXT,
  ordem            INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ead_questoes_avaliacao_id ON public.ead_questoes(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_ead_questoes_aula_id      ON public.ead_questoes(aula_id);

-- 7. TABELA DE PROGRESSO DO ALUNO NAS AULAS EAD
CREATE TABLE IF NOT EXISTS public.ead_progresso_aulas (
  id           BIGSERIAL PRIMARY KEY,
  aluno_id     TEXT NOT NULL,
  curso_id     BIGINT NOT NULL REFERENCES public.ead_cursos(id) ON DELETE CASCADE,
  aula_id      BIGINT NOT NULL REFERENCES public.ead_aulas(id) ON DELETE CASCADE,
  concluida    BOOLEAN DEFAULT TRUE,
  data_conclusao TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, aula_id)
);

CREATE INDEX IF NOT EXISTS idx_ead_progresso_aluno ON public.ead_progresso_aulas(aluno_id, curso_id);

-- 8. TRIGGER DE ATUALIZAÇÃO DO updated_at
CREATE OR REPLACE FUNCTION public.set_ead_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ead_cursos', 'ead_modulos', 'ead_aulas', 'ead_materiais', 'ead_avaliacoes', 'ead_questoes'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
        AND tgrelid = ('public.' || t)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_ead_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END;
$$;

-- 9. PERMISSÕES E RLS
ALTER TABLE public.ead_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ead_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ead_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ead_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ead_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ead_questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ead_progresso_aulas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura de cursos ativos
CREATE POLICY "Leitura pública de cursos EAD ativos"
  ON public.ead_cursos FOR SELECT
  USING (ativo = TRUE);

CREATE POLICY "Leitura pública de módulos de cursos ativos"
  ON public.ead_modulos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ead_cursos WHERE ead_cursos.id = ead_modulos.curso_id AND ead_cursos.ativo = TRUE));

CREATE POLICY "Leitura pública de aulas de cursos ativos"
  ON public.ead_aulas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ead_modulos
    JOIN public.ead_cursos ON ead_cursos.id = ead_modulos.curso_id
    WHERE ead_modulos.id = ead_aulas.modulo_id AND ead_cursos.ativo = TRUE
  ));

CREATE POLICY "Leitura pública de materiais de cursos ativos"
  ON public.ead_materiais FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ead_aulas
    JOIN public.ead_modulos ON ead_modulos.id = ead_aulas.modulo_id
    JOIN public.ead_cursos ON ead_cursos.id = ead_modulos.curso_id
    WHERE ead_aulas.id = ead_materiais.aula_id AND ead_cursos.ativo = TRUE
  ));

-- Política de leitura pública para avaliações de cursos ativos (metadados da prova)
CREATE POLICY "Leitura pública de avaliacoes de cursos ativos"
  ON public.ead_avaliacoes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ead_cursos WHERE ead_cursos.id = ead_avaliacoes.curso_id AND ead_cursos.ativo = TRUE));

-- Política para progresso das aulas: o próprio aluno pode ler e gravar seu progresso
CREATE POLICY "Aluno pode gerenciar seu proprio progresso"
  ON public.ead_progresso_aulas FOR ALL
  USING (auth.uid()::text = aluno_id)
  WITH CHECK (auth.uid()::text = aluno_id);

-- Permissão irrestrita via Service Role (usado pela API administrativa backend do Next.js)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
