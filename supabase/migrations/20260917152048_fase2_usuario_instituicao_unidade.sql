-- ============================================================
-- FASE 2: Estrutura Global de Escopo Instituicao x Unidade
-- Migration: 20260917152048_fase2_usuario_instituicao_unidade
-- Data: 2026-09-17
-- Tipo: INCREMENTAL, IDEMPOTENTE, NAO-DESTRUTIVA
-- ============================================================
--
-- TIPOS CONFIRMADOS DAS PKs:
--   instituicoes.id  -> UUID     (20260123_create_instituicoes_table.sql)
--   unidades.id      -> INTEGER  (schema.sql original)
--   usuarios.id      -> INTEGER  (schema.sql original + migrations)
--
-- PRESERVACAO:
--   - usuarios.instituicao_id NAO e removido (campo legado mantido)
--   - Nenhum dado existente e alterado
--   - Nenhum backfill automatico de usuarios
--   - Nenhuma exclusao
-- ============================================================


-- ============================================================
-- BLOCO 1: unidades.is_matriz
-- Identifica se a unidade e a Unidade Principal (Matriz)
-- de sua Instituicao. NAO confundir com Matriz Curricular
-- (campo "matriz" em disciplinas/grades - intocado).
-- ============================================================

ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS is_matriz BOOLEAN NOT NULL DEFAULT FALSE;

-- Indice para acelerar queries que buscam a matriz de uma instituicao
CREATE INDEX IF NOT EXISTS idx_unidades_is_matriz
  ON public.unidades(is_matriz);

-- Indice composto: busca rapida de "unidades matriz de uma instituicao"
CREATE INDEX IF NOT EXISTS idx_unidades_inst_is_matriz
  ON public.unidades(instituicao_id, is_matriz)
  WHERE is_matriz = TRUE;

-- NOTA SOBRE UNICIDADE DE MATRIZ:
-- Nao e possivel garantir "apenas uma matriz por instituicao"
-- com um UNIQUE INDEX padrao porque a coluna e booleana e
-- pode haver multiplas linhas com is_matriz = FALSE.
-- A garantia de unicidade da matriz (is_matriz = TRUE por
-- instituicao) deve ser implementada via trigger ou via
-- logica de aplicacao na fase seguinte.
-- Por ora, o indice parcial acima acelera a busca sem criar
-- constraint que poderia bloquear estados transitorios.


-- ============================================================
-- BLOCO 2: Tabela usuario_instituicoes
-- Vinculo N:M entre usuario e suas Instituicoes/Unidades.
-- Um usuario pode ter vinculo com multiplas Instituicoes,
-- e para cada Instituicao possui uma Unidade especifica.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuario_instituicoes (
  -- Chave primaria
  id            BIGSERIAL PRIMARY KEY,

  -- Referencia ao usuario (INTEGER, igual a usuarios.id)
  usuario_id    INTEGER NOT NULL
                REFERENCES public.usuarios(id)
                ON DELETE CASCADE,

  -- Referencia a instituicao (UUID, igual a instituicoes.id)
  instituicao_id UUID NOT NULL
                REFERENCES public.instituicoes(id)
                ON DELETE CASCADE,

  -- Referencia a unidade dentro desta instituicao (INTEGER, igual a unidades.id)
  -- NULL temporariamente permitido para vinculos pendentes de definicao de unidade
  unidade_id    INTEGER
                REFERENCES public.unidades(id)
                ON DELETE SET NULL,

  -- Metadados
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Garantia: o mesmo usuario nao pode ter dois vinculos
  -- para a mesma instituicao (uma unidade por instituicao)
  CONSTRAINT uq_usuario_instituicao
    UNIQUE (usuario_id, instituicao_id)
);

-- ============================================================
-- BLOCO 3: Indices em usuario_instituicoes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ui_usuario_id
  ON public.usuario_instituicoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_ui_instituicao_id
  ON public.usuario_instituicoes(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_ui_unidade_id
  ON public.usuario_instituicoes(unidade_id);

CREATE INDEX IF NOT EXISTS idx_ui_usuario_inst_unidade
  ON public.usuario_instituicoes(usuario_id, instituicao_id, unidade_id);

-- ============================================================
-- BLOCO 4: Trigger para atualizar updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_update_ui_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ui_updated_at ON public.usuario_instituicoes;

CREATE TRIGGER trg_ui_updated_at
  BEFORE UPDATE ON public.usuario_instituicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_ui_updated_at();

-- ============================================================
-- BLOCO 5: Verificacoes de integridade (sem backfill)
-- ============================================================

DO $$
DECLARE
  v_total_usuarios        INTEGER;
  v_usuarios_com_inst     INTEGER;
  v_usuarios_sem_vinculo  INTEGER;
  v_total_unidades        INTEGER;
  v_total_instituicoes    INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_usuarios     FROM public.usuarios;
  SELECT COUNT(*) INTO v_total_unidades     FROM public.unidades;
  SELECT COUNT(*) INTO v_total_instituicoes FROM public.instituicoes;

  SELECT COUNT(*)
  INTO v_usuarios_com_inst
  FROM public.usuarios
  WHERE instituicao_id IS NOT NULL;

  SELECT COUNT(*)
  INTO v_usuarios_sem_vinculo
  FROM public.usuarios u
  WHERE u.instituicao_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.usuario_instituicoes ui
      WHERE ui.usuario_id    = u.id
        AND ui.instituicao_id = u.instituicao_id
    );

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'FASE 2 - Relatorio de Estado Atual';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total de usuarios:                  %', v_total_usuarios;
  RAISE NOTICE 'Usuarios com instituicao_id legado: %', v_usuarios_com_inst;
  RAISE NOTICE 'Usuarios SEM vinculo na nova tabela (pendentes): %', v_usuarios_sem_vinculo;
  RAISE NOTICE 'Total de instituicoes:              %', v_total_instituicoes;
  RAISE NOTICE 'Total de unidades:                  %', v_total_unidades;
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'PENDENCIA: Os vinculos dos % usuario(s) precisam ser', v_usuarios_sem_vinculo;
  RAISE NOTICE '  definidos manualmente via painel de Usuarios,';
  RAISE NOTICE '  apos a Unidade ser identificada para cada usuario.';
  RAISE NOTICE '  NAO realizar backfill automatico.';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- FIM DA MIGRATION
-- Estruturas criadas:
--   - unidades.is_matriz (BOOLEAN, DEFAULT FALSE)
--   - idx_unidades_is_matriz
--   - idx_unidades_inst_is_matriz (parcial WHERE is_matriz=TRUE)
--   - TABLE usuario_instituicoes (id, usuario_id, instituicao_id, unidade_id)
--   - CONSTRAINT UNIQUE(usuario_id, instituicao_id)
--   - idx_ui_usuario_id, idx_ui_instituicao_id
--   - idx_ui_unidade_id, idx_ui_usuario_inst_unidade
--   - TRIGGER trg_ui_updated_at
-- Dados existentes: intocados.
-- Backfill: nao realizado.
-- ============================================================
