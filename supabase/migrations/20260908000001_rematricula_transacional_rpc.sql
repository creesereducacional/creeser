-- ============================================================
-- Migration: Fase 3.3.3 - Rematrícula Transacional
-- Data: 2026-09-08
-- Descrição: Cria a função PL/pgSQL transacional public.fn_executar_rematricula_aluno
--            que encerra a matrícula atual e cria a nova matrícula de rematrícula
--            com is_principal = TRUE, registrando a movimentação histórica.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_executar_rematricula_aluno(
  p_aluno_id BIGINT,
  p_novo_ano_letivo INTEGER,
  p_novo_semestre VARCHAR(20) DEFAULT '1',
  p_nova_turma_id BIGINT DEFAULT NULL,
  p_plano_financeiro VARCHAR(50) DEFAULT NULL,
  p_valor_mensalidade NUMERIC(10,2) DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mat_antiga_id UUID;
  v_instituicao_id UUID;
  v_curso_id BIGINT;
  v_turma_id_atual BIGINT;
  v_grade_id_atual BIGINT;
  v_ano_letivo_atual INTEGER;
  v_status_anterior VARCHAR(50);
  
  v_turma_id_destino BIGINT;
  v_grade_id_destino BIGINT;
  v_curso_id_destino BIGINT;
  
  v_nova_matricula_id UUID;
BEGIN
  -- 1. Buscar e validar a matrícula principal ativa/operacional do aluno
  SELECT 
    id,
    instituicao_id,
    curso_id,
    turma_id,
    grade_id,
    ano_letivo,
    status_administrativo
  INTO 
    v_mat_antiga_id,
    v_instituicao_id,
    v_curso_id,
    v_turma_id_atual,
    v_grade_id_atual,
    v_ano_letivo_atual,
    v_status_anterior
  FROM public.matriculas
  WHERE aluno_id = p_aluno_id
    AND is_principal = TRUE
  LIMIT 1;

  IF v_mat_antiga_id IS NULL THEN
    RAISE EXCEPTION 'Aluno ID % não possui uma matrícula principal ativa para realizar rematrícula.', p_aluno_id;
  END IF;

  -- 2. Validar o novo ano letivo
  IF p_novo_ano_letivo <= v_ano_letivo_atual THEN
    RAISE EXCEPTION 'O novo ano letivo (%) deve ser maior que o ano letivo atual (%).', p_novo_ano_letivo, v_ano_letivo_atual;
  END IF;

  -- 3. Definir turma e grade da nova matrícula
  IF p_nova_turma_id IS NOT NULL THEN
    SELECT cursoid, gradeid 
    INTO v_curso_id_destino, v_grade_id_destino
    FROM public.turmas
    WHERE id = p_nova_turma_id;

    IF v_curso_id_destino IS NULL THEN
      RAISE EXCEPTION 'A nova turma informada (ID %) não existe.', p_nova_turma_id;
    END IF;

    IF v_curso_id_destino <> v_curso_id THEN
      RAISE EXCEPTION 'A nova turma informada (ID %) pertence a um curso diferente do curso da matrícula atual.', p_nova_turma_id;
    END IF;

    v_turma_id_destino := p_nova_turma_id;
  ELSE
    v_turma_id_destino := v_turma_id_atual;
    v_grade_id_destino := v_grade_id_atual;
  END IF;

  -- 4. Atualizar a matrícula anterior desmarcando is_principal e alterando o status
  -- Libera o índice uq_aluno_matricula_principal e o idx_uq_matricula_operacional_curso
  UPDATE public.matriculas
  SET 
    is_principal = FALSE,
    status_administrativo = 'CONCLUIDO',
    data_conclusao = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = v_mat_antiga_id;

  -- 5. Criar a nova matrícula com is_principal = TRUE e status ATIVO
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
    matricula_origem_id,
    tipo_origem,
    is_principal,
    data_matricula,
    plano_financeiro,
    valor_mensalidade
  ) VALUES (
    p_aluno_id,
    v_instituicao_id,
    v_curso_id,
    v_turma_id_destino,
    v_grade_id_destino,
    p_novo_ano_letivo,
    COALESCE(p_novo_semestre, '1'),
    'ATIVO',
    'EM_ANDAMENTO',
    v_mat_antiga_id,
    'REMATRICULA',
    TRUE, -- Nova matrícula assume como Principal
    CURRENT_DATE,
    p_plano_financeiro,
    p_valor_mensalidade
  ) RETURNING id INTO v_nova_matricula_id;

  -- 6. Atualizar a referência de turma/ano letivo na tabela public.alunos
  UPDATE public.alunos
  SET 
    turmaid = v_turma_id_destino,
    ano_letivo = p_novo_ano_letivo,
    semestre = p_novo_semestre,
    statusmatricula = 'ATIVO'
  WHERE id = p_aluno_id;

  -- 7. Registrar a movimentação de REMATRICULA no histórico
  INSERT INTO public.movimentacoes_matricula (
    matricula_id,
    tipo_movimentacao,
    turma_origem_id,
    turma_destino_id,
    curso_origem_id,
    curso_destino_id,
    ano_letivo_origem,
    ano_letivo_destino,
    status_anterior,
    status_novo,
    observacao
  ) VALUES (
    v_nova_matricula_id,
    'REMATRICULA',
    v_turma_id_atual,
    v_turma_id_destino,
    v_curso_id,
    v_curso_id,
    v_ano_letivo_atual,
    p_novo_ano_letivo,
    v_status_anterior,
    'ATIVO',
    COALESCE(p_observacao, 'Rematrícula transacional realizada com sucesso')
  );

  RETURN v_nova_matricula_id;
END;
$$ LANGUAGE plpgsql;
