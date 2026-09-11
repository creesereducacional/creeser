-- ============================================================
-- Migration: 20260911000000_adicionar_rpc_nova_matricula_curso.sql
-- Data: 2026-09-11
-- Descrição:
--   1. Expansão de tipo_origem e tipo_movimentacao para suportar 'NOVA_MATRICULA_CURSO'
--   2. Implementação da RPC public.fn_executar_nova_matricula_curso
--      para permitir matricular aluno em um curso simultâneo sem encerrar a matrícula atual.
-- ============================================================

-- 1️⃣ AJUSTE DE CONSTRAINTS DE TIPO_ORIGEM E TIPO_MOVIMENTACAO (SE NECESSÁRIO)
DO $$
BEGIN
  -- Expandir CHECK constraint de tipo_origem em public.matriculas se existir
  ALTER TABLE public.matriculas DROP CONSTRAINT IF EXISTS matriculas_tipo_origem_check;
  ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_tipo_origem_check 
    CHECK (tipo_origem IN ('REMATRICULA', 'TRANSFERENCIA_CURSO', 'REINGRESSO', 'NOVA_MATRICULA_CURSO', 'MATRICULA_SIMULTANEA'));

  -- Expandir CHECK constraint de tipo_movimentacao em public.movimentacoes_matricula se existir
  ALTER TABLE public.movimentacoes_matricula DROP CONSTRAINT IF EXISTS movimentacoes_matricula_tipo_movimentacao_check;
  ALTER TABLE public.movimentacoes_matricula ADD CONSTRAINT movimentacoes_matricula_tipo_movimentacao_check 
    CHECK (tipo_movimentacao IN (
      'MATRICULA_INICIAL', 'REMATRICULA', 'TRANSFERENCIA_TURMA', 
      'TRANSFERENCIA_CURSO', 'TRANCAMENTO', 'CANCELAMENTO', 
      'REINGRESSO', 'CONCLUSAO', 'NOVA_MATRICULA_CURSO', 'MATRICULA_SIMULTANEA'
    ));
EXCEPTION WHEN OTHERS THEN
  -- Ignora se constraints não forem padrão
  NULL;
END $$;


-- 2️⃣ RPC public.fn_executar_nova_matricula_curso
CREATE OR REPLACE FUNCTION public.fn_executar_nova_matricula_curso(
  p_aluno_id BIGINT,
  p_turma_id BIGINT,
  p_ano_letivo INTEGER,
  p_semestre VARCHAR(20) DEFAULT '1',
  p_plano_financeiro VARCHAR(50) DEFAULT NULL,
  p_valor_mensalidade NUMERIC(10,2) DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_instituicao_id UUID;
  v_curso_id BIGINT;
  v_grade_id BIGINT;
  v_turma_situacao VARCHAR(50);
  v_aluno_nome VARCHAR(255);
  v_aluno_inst_id UUID;
  v_nova_matricula_id UUID;
  v_ja_possui_matricula_curso BOOLEAN;
BEGIN
  -- 1. Validar existência do aluno
  SELECT nome, instituicao_id 
  INTO v_aluno_nome, v_aluno_inst_id
  FROM public.alunos
  WHERE id = p_aluno_id;

  IF v_aluno_nome IS NULL THEN
    RAISE EXCEPTION 'Aluno ID % não encontrado.', p_aluno_id;
  END IF;

  -- 2. Validar turma de destino
  IF p_turma_id IS NULL THEN
    RAISE EXCEPTION 'A turma de destino é obrigatória para realizar a nova matrícula.';
  END IF;

  SELECT 
    instituicao_id,
    cursoid,
    gradeid,
    COALESCE(situacao, 'ATIVO')
  INTO 
    v_instituicao_id,
    v_curso_id,
    v_grade_id,
    v_turma_situacao
  FROM public.turmas
  WHERE id = p_turma_id;

  IF v_curso_id IS NULL THEN
    RAISE EXCEPTION 'A turma de destino informada (ID %) não existe.', p_turma_id;
  END IF;

  IF v_turma_situacao <> 'ATIVO' THEN
    RAISE EXCEPTION 'A turma de destino informada (ID %) não está ativa (situação: %).', p_turma_id, v_turma_situacao;
  END IF;

  -- 3. Validar consistência de instituição
  IF v_aluno_inst_id IS NOT NULL AND v_instituicao_id IS NOT NULL AND v_aluno_inst_id <> v_instituicao_id THEN
    RAISE EXCEPTION 'A turma selecionada pertence a uma instituição diferente da instituição do aluno.';
  END IF;

  -- Fallback de instituicao_id caso nula
  IF v_instituicao_id IS NULL THEN
    v_instituicao_id := v_aluno_inst_id;
  END IF;

  -- 4. Validar se o aluno já possui matrícula operacional para o MESMO curso
  SELECT EXISTS (
    SELECT 1 
    FROM public.matriculas
    WHERE aluno_id = p_aluno_id
      AND curso_id = v_curso_id
      AND status_administrativo IN ('PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_TURMA', 'ATIVO')
  ) INTO v_ja_possui_matricula_curso;

  IF v_ja_possui_matricula_curso THEN
    RAISE EXCEPTION 'O aluno % já possui uma matrícula ativa/operacional no curso informado. Para avançar de período neste mesmo curso, utilize a opção "Rematrícula / Progressão".', v_aluno_nome;
  END IF;

  -- 5. Criar a nova matrícula com status ATIVO, is_principal = FALSE (para não violar a uq_aluno_matricula_principal)
  INSERT INTO public.matriculas (
    aluno_id,
    instituicao_id,
    curso_id,
    turma_id,
    grade_id,
    ano_letivo,
    semestre,
    status_administrativo,
    situacao_academica,
    tipo_origem,
    is_principal,
    data_matricula,
    plano_financeiro,
    valor_mensalidade
  ) VALUES (
    p_aluno_id,
    v_instituicao_id,
    v_curso_id,
    p_turma_id,
    v_grade_id,
    p_ano_letivo,
    COALESCE(p_semestre, '1'),
    'ATIVO',
    'EM_ANDAMENTO',
    'NOVA_MATRICULA_CURSO',
    FALSE, -- Matrícula simultânea/adicional é criada com is_principal = FALSE
    CURRENT_DATE,
    p_plano_financeiro,
    p_valor_mensalidade
  ) RETURNING id INTO v_nova_matricula_id;

  -- 6. Registrar a movimentação de histórico
  INSERT INTO public.movimentacoes_matricula (
    matricula_id,
    tipo_movimentacao,
    turma_destino_id,
    curso_destino_id,
    ano_letivo_destino,
    status_novo,
    observacao
  ) VALUES (
    v_nova_matricula_id,
    'NOVA_MATRICULA_CURSO',
    p_turma_id,
    v_curso_id,
    p_ano_letivo,
    'ATIVO',
    COALESCE(p_observacao, 'Ingresso em novo curso simultâneo realizado com sucesso')
  );

  RETURN v_nova_matricula_id;
END;
$$ LANGUAGE plpgsql;

-- Permissões de Segurança da RPC
REVOKE EXECUTE ON FUNCTION public.fn_executar_nova_matricula_curso(BIGINT, BIGINT, INTEGER, VARCHAR, VARCHAR, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_executar_nova_matricula_curso(BIGINT, BIGINT, INTEGER, VARCHAR, VARCHAR, NUMERIC, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_executar_nova_matricula_curso(BIGINT, BIGINT, INTEGER, VARCHAR, VARCHAR, NUMERIC, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fn_executar_nova_matricula_curso(BIGINT, BIGINT, INTEGER, VARCHAR, VARCHAR, NUMERIC, TEXT) TO service_role;
