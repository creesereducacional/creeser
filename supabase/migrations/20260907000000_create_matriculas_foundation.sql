-- ============================================================
-- Migration: Fase 1 - Fundação da Arquitetura de Matrículas
-- Data: 2026-09-07
-- Descrição: Criação das tabelas public.matriculas e public.movimentacoes_matricula
--            com FKs, índices, triggers de validação e geração automática de código.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1️⃣ CRIAR SEQUENCE PARA CÓDIGO DA MATRÍCULA
CREATE SEQUENCE IF NOT EXISTS public.seq_codigo_matricula
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- 2️⃣ CRIAR TABELA public.matriculas
CREATE TABLE IF NOT EXISTS public.matriculas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_matricula        VARCHAR(50) UNIQUE,
  
  -- Vínculos de Entidades (Tipos rigorosamente alinhados com as PKs reais: BIGINT / UUID)
  aluno_id                BIGINT NOT NULL REFERENCES public.alunos(id) ON DELETE RESTRICT,
  instituicao_id          UUID NOT NULL REFERENCES public.instituicoes(id) ON DELETE RESTRICT,
  curso_id                BIGINT NOT NULL REFERENCES public.cursos(id) ON DELETE RESTRICT,
  turma_id                BIGINT REFERENCES public.turmas(id) ON DELETE RESTRICT, -- NULL permitido para Pré-Cadastro
  grade_id                BIGINT REFERENCES public.grades(id) ON DELETE SET NULL,
  contrato_id             UUID REFERENCES public.contratos_instituicao(id) ON DELETE SET NULL,
  
  -- Ciclo de Vida e Período
  ano_letivo              INTEGER NOT NULL,
  semestre                VARCHAR(20) NOT NULL DEFAULT '1',
  status_administrativo   VARCHAR(50) NOT NULL DEFAULT 'PRE_CADASTRO'
                          CHECK (status_administrativo IN (
                            'PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_TURMA', 
                            'ATIVO', 'TRANCADO', 'CANCELADO', 'DESISTENTE', 'CONCLUIDO'
                          )),
  situacao_academica      VARCHAR(50) NOT NULL DEFAULT 'EM_ANDAMENTO'
                          CHECK (situacao_academica IN (
                            'EM_ANDAMENTO', 'APROVADO', 'REPROVADO_NOTA', 
                            'REPROVADO_FALTA', 'EM_RECUPERACAO', 'COM_DEPENDENCIA'
                          )),
  
  -- Rematrícula e Referência Legada (DEFAULT FALSE)
  matricula_origem_id     UUID REFERENCES public.matriculas(id) ON DELETE SET NULL,
  tipo_origem             VARCHAR(50) CHECK (tipo_origem IN ('REMATRICULA', 'TRANSFERENCIA_CURSO', 'REINGRESSO')),
  is_principal            BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Datas de Controle
  data_matricula          DATE NOT NULL DEFAULT CURRENT_DATE,
  data_conclusao          DATE,
  data_trancamento        DATE,
  observacao_trancamento  TEXT,

  -- Snapshot de Condições Financeiras Contratuais da Matrícula
  plano_financeiro        VARCHAR(50),
  valor_matricula         NUMERIC(10,2),
  valor_mensalidade       NUMERIC(10,2),
  percentual_desconto     NUMERIC(5,2),
  qtd_parcelas            INTEGER,
  dia_pagamento           INTEGER CHECK (dia_pagamento BETWEEN 1 AND 31),
  qtd_meses_contrato      INTEGER,
  aluno_bolsista          BOOLEAN DEFAULT FALSE,
  percentual_bolsa        NUMERIC(5,2),
  financiamento_estudantil VARCHAR(50),
  percentual_financiamento NUMERIC(5,2),

  -- Auditoria
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validação de Regra de Negócio: Turma é opcional nos pré-status e estritamente obrigatória quando status_administrativo = 'ATIVO'
  CONSTRAINT chk_turma_obrigatoria_quando_ativo CHECK (
    (status_administrativo = 'ATIVO' AND turma_id IS NOT NULL) OR
    (status_administrativo <> 'ATIVO')
  )
);

-- Índices da Tabela matriculas
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id ON public.matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_instituicao_id ON public.matriculas(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_curso_id ON public.matriculas(curso_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_turma_id ON public.matriculas(turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON public.matriculas(status_administrativo);

-- 1️⃣ Garante apenas UMA matrícula principal por aluno
CREATE UNIQUE INDEX IF NOT EXISTS uq_aluno_matricula_principal 
  ON public.matriculas (aluno_id) 
  WHERE is_principal = TRUE;

-- 2️⃣ Impede mais de uma matrícula operacional simultânea do mesmo aluno no mesmo curso (independente de ano_letivo ou semestre)
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_matricula_operacional_curso 
  ON public.matriculas (aluno_id, curso_id)
  WHERE status_administrativo IN ('PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_TURMA', 'ATIVO');


-- 3️⃣ CRIAR TABELA public.movimentacoes_matricula
CREATE TABLE IF NOT EXISTS public.movimentacoes_matricula (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id                    UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  
  tipo_movimentacao               VARCHAR(50) NOT NULL CHECK (tipo_movimentacao IN (
                                    'MATRICULA_INICIAL', 'REMATRICULA', 'TRANSFERENCIA_TURMA', 
                                    'TRANSFERENCIA_CURSO', 'TRANCAMENTO', 'CANCELAMENTO', 
                                    'REINGRESSO', 'CONCLUSAO'
                                  )),
  
  -- Contexto Histórico de Origem e Destino
  turma_origem_id                 BIGINT REFERENCES public.turmas(id) ON DELETE SET NULL,
  turma_destino_id                BIGINT REFERENCES public.turmas(id) ON DELETE SET NULL,
  curso_origem_id                 BIGINT REFERENCES public.cursos(id) ON DELETE SET NULL,
  curso_destino_id                BIGINT REFERENCES public.cursos(id) ON DELETE SET NULL,
  ano_letivo_origem               INTEGER,
  ano_letivo_destino              INTEGER,
  status_anterior                 VARCHAR(50),
  status_novo                     VARCHAR(50),
  
  -- Auditoria Operacional
  usuario_id                      UUID,
  usuario_email                   VARCHAR(255),
  data_movimentacao               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo_cancelamento_trancamento TEXT,
  observacao                      TEXT,
  
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices da Tabela movimentacoes_matricula
CREATE INDEX IF NOT EXISTS idx_mov_matricula_id ON public.movimentacoes_matricula(matricula_id);
CREATE INDEX IF NOT EXISTS idx_mov_tipo ON public.movimentacoes_matricula(tipo_movimentacao);
CREATE INDEX IF NOT EXISTS idx_mov_data ON public.movimentacoes_matricula(data_movimentacao);


-- 4️⃣ TRIGGER DE UPDATED_AT AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.atualizar_updated_at_matriculas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_matriculas ON public.matriculas;
CREATE TRIGGER trigger_atualizar_updated_at_matriculas
  BEFORE UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at_matriculas();


-- 5️⃣ TRIGGER DE VALIDAÇÃO DE CONSISTÊNCIA (INSTITUIÇÃO × CURSO × TURMA)
CREATE OR REPLACE FUNCTION public.fn_validar_consistencia_matricula()
RETURNS TRIGGER AS $$
DECLARE
  v_turma_inst_id UUID;
  v_turma_curso_id BIGINT;
BEGIN
  -- Só valida se turma_id estiver preenchido
  IF NEW.turma_id IS NOT NULL THEN
    SELECT instituicao_id, cursoid INTO v_turma_inst_id, v_turma_curso_id
    FROM public.turmas WHERE id = NEW.turma_id;

    IF v_turma_inst_id IS NOT NULL AND v_turma_inst_id <> NEW.instituicao_id THEN
      RAISE EXCEPTION 'A turma selecionada (%) pertence a outra instituição.', NEW.turma_id;
    END IF;

    IF v_turma_curso_id IS NOT NULL AND v_turma_curso_id <> NEW.curso_id THEN
      RAISE EXCEPTION 'A turma selecionada (%) pertence a um curso diferente (%).', NEW.turma_id, NEW.curso_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_consistencia_matricula ON public.matriculas;
CREATE TRIGGER trigger_validar_consistencia_matricula
  BEFORE INSERT OR UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.fn_validar_consistencia_matricula();


-- 6️⃣ TRIGGER DE GERAÇÃO TRANSACIONAL DO CÓDIGO DA MATRÍCULA
CREATE OR REPLACE FUNCTION public.fn_gerar_codigo_matricula()
RETURNS TRIGGER AS $$
DECLARE
  v_ano VARCHAR(4);
  v_semestre VARCHAR(2);
  v_seq BIGINT;
BEGIN
  IF NEW.codigo_matricula IS NULL OR NEW.codigo_matricula = '' THEN
    v_ano := COALESCE(NEW.ano_letivo::VARCHAR, TO_CHAR(CURRENT_DATE, 'YYYY'));
    v_semestre := COALESCE(NULLIF(NEW.semestre, ''), '1');
    v_seq := NEXTVAL('public.seq_codigo_matricula');
    
    NEW.codigo_matricula := v_ano || LPAD(v_semestre, 2, '0') || LPAD(v_seq::VARCHAR, 5, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gerar_codigo_matricula ON public.matriculas;
CREATE TRIGGER trigger_gerar_codigo_matricula
  BEFORE INSERT ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_codigo_matricula();

