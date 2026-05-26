-- ============================================================
-- Migration: Substituição completa de JSON local por Supabase
-- Data: 2026-05-20
-- ============================================================

-- ============================================================
-- 1. FUNCIONARIOS
-- Tabela pode já existir (ALTER TABLE na migração fase1).
-- CREATE TABLE IF NOT EXISTS garante que seja criada se faltar.
-- ALTER TABLE ADD COLUMN IF NOT EXISTS adiciona os campos novos.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id        BIGSERIAL PRIMARY KEY,
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome      TEXT NOT NULL,
  email     TEXT,
  cpf       TEXT,
  rg        TEXT,
  funcao    TEXT,
  telefone_celular TEXT,
  whatsapp  TEXT,
  cep       TEXT,
  endereco  TEXT,
  numero    TEXT,
  cidade    TEXT,
  bairro    TEXT,
  uf        VARCHAR(2),
  dt_nascimento DATE,
  dt_admissao   DATE,
  status    TEXT DEFAULT 'ATIVO',
  banco     TEXT,
  agencia   TEXT,
  conta_corrente TEXT,
  pix       TEXT,
  obs       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS rg TEXT,
  ADD COLUMN IF NOT EXISTS funcao TEXT,
  ADD COLUMN IF NOT EXISTS telefone_celular TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS uf VARCHAR(2),
  ADD COLUMN IF NOT EXISTS dt_nascimento DATE,
  ADD COLUMN IF NOT EXISTS dt_admissao DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ATIVO',
  ADD COLUMN IF NOT EXISTS banco TEXT,
  ADD COLUMN IF NOT EXISTS agencia TEXT,
  ADD COLUMN IF NOT EXISTS conta_corrente TEXT,
  ADD COLUMN IF NOT EXISTS pix TEXT,
  ADD COLUMN IF NOT EXISTS obs TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_funcionarios_instituicao_id ON public.funcionarios(instituicao_id);

-- ============================================================
-- 2. NOTAS_FALTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notas_faltas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome_aluno  TEXT,
  matricula   TEXT,
  turma       TEXT,
  disciplina  TEXT,
  ap1         NUMERIC(5,2),
  ap2         NUMERIC(5,2),
  ap3         NUMERIC(5,2),
  media_prova NUMERIC(5,2),
  exame_final NUMERIC(5,2),
  frequencia  NUMERIC(5,2),
  media_final NUMERIC(5,2),
  situacao    TEXT DEFAULT 'CURSANDO',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notas_faltas_instituicao_id ON public.notas_faltas(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_notas_faltas_matricula      ON public.notas_faltas(matricula);

-- ============================================================
-- 3. LIVRO_REGISTRO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.livro_registro (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id   UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome_aluno       TEXT NOT NULL,
  numero_registro  TEXT,
  livro            TEXT,
  folha            TEXT,
  data             DATE,
  curso            TEXT,
  turma            TEXT,
  periodo          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_livro_registro_instituicao_id ON public.livro_registro(instituicao_id);

-- ============================================================
-- 4. DISCIPLINAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disciplinas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  codigo         TEXT,
  nome           TEXT NOT NULL,
  curso          TEXT,
  periodo        TEXT,
  carga_horaria  INTEGER,
  matriz         BOOLEAN DEFAULT TRUE,
  grade          TEXT,
  situacao       TEXT DEFAULT 'ATIVO',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_instituicao_id ON public.disciplinas(instituicao_id);

-- ============================================================
-- 5. GRADES (grade curricular)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id  UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  instituicao_nome TEXT,
  curso_id        TEXT,
  curso_nome      TEXT,
  ano             INTEGER,
  nome            TEXT NOT NULL,
  situacao        TEXT DEFAULT 'ATIVO',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_instituicao_id ON public.grades(instituicao_id);

-- ============================================================
-- 6. ATIVIDADES_COMPLEMENTARES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.atividades_complementares (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id     UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome_aluno         TEXT,
  matricula          TEXT,
  curso              TEXT,
  turma              TEXT,
  tipo_atividade     TEXT,
  descricao          TEXT,
  data_realizacao    DATE,
  carga_horaria      INTEGER,
  documento_enviado  BOOLEAN DEFAULT FALSE,
  status             TEXT DEFAULT 'PENDENTE',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atividades_complementares_instituicao_id ON public.atividades_complementares(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_atividades_complementares_matricula      ON public.atividades_complementares(matricula);

-- ============================================================
-- 7. PLANEJAMENTO_DIARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planejamento_diario (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id       UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  professor            TEXT,
  turma                TEXT,
  disciplina           TEXT,
  data                 DATE,
  data_fim             DATE,
  local                TEXT,
  quantidade_aulas     INTEGER,
  avaliacao_checkbox   BOOLEAN DEFAULT FALSE,
  unidade_bimestral    TEXT,
  conteudo_vivenciado  TEXT,
  objetivo_aula        TEXT,
  metodologias         TEXT,
  recursos             TEXT,
  avaliacao            TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planejamento_diario_instituicao_id ON public.planejamento_diario(instituicao_id);

-- ============================================================
-- 8. AVALIACOES (avaliações de aulas / cursos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  curso_id       TEXT,
  aula_id        TEXT,
  aluno_id       TEXT,
  aluno_nome     TEXT,
  estrelas       INTEGER CHECK (estrelas BETWEEN 1 AND 5),
  comentario     TEXT,
  data           TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_instituicao_id ON public.avaliacoes(instituicao_id);

-- ============================================================
-- 9. DOCUMENTOS (tabela pode já existir — adiciona colunas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos (
  id               BIGSERIAL PRIMARY KEY,
  instituicao_id   UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  curso_id         TEXT,
  curso_nome       TEXT,
  aula_id          TEXT,
  aula_nome        TEXT,
  aluno_id         TEXT,
  aluno_nome       TEXT,
  descricao        TEXT,
  arquivo          TEXT,
  arquivo_original TEXT,
  tamanho          BIGINT,
  tipo             TEXT,
  url              TEXT,
  status           TEXT DEFAULT 'pendente',
  comentario       TEXT,
  visualizado      BOOLEAN DEFAULT FALSE,
  data_atualizacao TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS curso_id         TEXT,
  ADD COLUMN IF NOT EXISTS curso_nome       TEXT,
  ADD COLUMN IF NOT EXISTS aula_id          TEXT,
  ADD COLUMN IF NOT EXISTS aula_nome        TEXT,
  ADD COLUMN IF NOT EXISTS aluno_id         TEXT,
  ADD COLUMN IF NOT EXISTS aluno_nome       TEXT,
  ADD COLUMN IF NOT EXISTS descricao        TEXT,
  ADD COLUMN IF NOT EXISTS arquivo          TEXT,
  ADD COLUMN IF NOT EXISTS arquivo_original TEXT,
  ADD COLUMN IF NOT EXISTS tamanho          BIGINT,
  ADD COLUMN IF NOT EXISTS tipo             TEXT,
  ADD COLUMN IF NOT EXISTS url              TEXT,
  ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS comentario       TEXT,
  ADD COLUMN IF NOT EXISTS visualizado      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_documentos_instituicao_id ON public.documentos(instituicao_id);

-- ============================================================
-- 10. EMAILS_ENVIADOS (log de emails)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emails_enviados (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  destinatario   TEXT NOT NULL,
  assunto        TEXT,
  corpo          TEXT,
  status         TEXT DEFAULT 'ENVIADO',
  erro           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_enviados_instituicao_id ON public.emails_enviados(instituicao_id);

-- ============================================================
-- 11. USUARIOS_SISTEMA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome           TEXT NOT NULL,
  email          TEXT,
  tipo           TEXT DEFAULT 'OPERADOR',
  ativo          BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_instituicao_id ON public.usuarios_sistema(instituicao_id);

-- ============================================================
-- 12. MATRICULADORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matriculadores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome           TEXT NOT NULL,
  email          TEXT,
  telefone       TEXT,
  ativo          BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matriculadores_instituicao_id ON public.matriculadores(instituicao_id);

-- ============================================================
-- 13. SOLICITACOES_TIPOS (catálogo de tipos de solicitação)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.solicitacoes_tipos (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id            UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome                      TEXT NOT NULL,
  dias_entrega              INTEGER DEFAULT 5,
  tolerancia                TEXT,
  observacoes               TEXT,
  paga                      BOOLEAN DEFAULT FALSE,
  valor_solicitacao         NUMERIC(10,2) DEFAULT 0,
  dias_vencimento           TEXT,
  solicitacao_negociacao    BOOLEAN DEFAULT FALSE,
  solicitacao_contestacao   BOOLEAN DEFAULT FALSE,
  situacao                  TEXT DEFAULT 'ATIVO',
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_tipos_instituicao_id ON public.solicitacoes_tipos(instituicao_id);

-- ============================================================
-- 14. NOTICIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.noticias (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id   UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  titulo           TEXT NOT NULL,
  resumo           TEXT,
  conteudo         TEXT,
  imagem           TEXT,
  autor            TEXT,
  categoria        TEXT DEFAULT 'Geral',
  ativo            BOOLEAN DEFAULT TRUE,
  data_criacao     TIMESTAMPTZ DEFAULT NOW(),
  data_publicacao  TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_noticias_instituicao_id ON public.noticias(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_noticias_ativo          ON public.noticias(ativo);

-- ============================================================
-- 15. FORUM_TOPICOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_topicos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id        UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  curso_id              INTEGER,
  autor_id              TEXT,
  autor_nome            TEXT,
  autor_tipo            TEXT,
  titulo                TEXT NOT NULL,
  conteudo              TEXT,
  visualizacoes         INTEGER DEFAULT 0,
  fixado                BOOLEAN DEFAULT FALSE,
  fechado               BOOLEAN DEFAULT FALSE,
  data_ultima_resposta  TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_topicos_instituicao_id ON public.forum_topicos(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_forum_topicos_curso_id       ON public.forum_topicos(curso_id);

-- ============================================================
-- 16. FORUM_RESPOSTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_respostas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id      UUID NOT NULL REFERENCES public.forum_topicos(id) ON DELETE CASCADE,
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  autor_id       TEXT,
  autor_nome     TEXT,
  autor_tipo     TEXT,
  conteudo       TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_respostas_topico_id ON public.forum_respostas(topico_id);

-- ============================================================
-- 17. CAMPANHAS_MATRICULAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campanhas_matriculas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome           TEXT NOT NULL,
  data_inicio    TIMESTAMPTZ,
  data_fim       TIMESTAMPTZ,
  desconto       NUMERIC(5,2),
  ativa          BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanhas_matriculas_instituicao_id ON public.campanhas_matriculas(instituicao_id);

-- ============================================================
-- 18. SLIDER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.slider (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  file_name      TEXT NOT NULL,
  title          TEXT,
  description    TEXT,
  ordem          INTEGER DEFAULT 0,
  ativo          BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slider_instituicao_id ON public.slider(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_slider_ordem          ON public.slider(ordem);

-- ============================================================
-- Trigger: atualiza updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'funcionarios','notas_faltas','livro_registro','disciplinas','grades',
    'atividades_complementares','planejamento_diario','avaliacoes','documentos',
    'usuarios_sistema','matriculadores','solicitacoes_tipos','noticias',
    'forum_topicos','forum_respostas','campanhas_matriculas','slider'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || tbl || '_updated_at'
        AND tgrelid = ('public.' || tbl)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END;
$$;
