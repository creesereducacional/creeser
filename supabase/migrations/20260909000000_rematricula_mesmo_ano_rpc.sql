-- ============================================================
-- Migration Incremental: Fase 3.3.6.1 - Rematrícula no Mesmo Ano e Ajustes de Segurança da RPC
-- Data: 2026-09-09
-- Descrição: Atualiza a RPC public.fn_executar_rematricula_aluno para permitir
--            avançar períodos sequenciais no mesmo ano letivo (ex: 2026/1 -> 2026/2),
--            bloqueando mesmo período, semestres anteriores ou retrocesso de ano.
--            Configura SECURITY DEFINER e revoga execução direta para anon/authenticated
--            garantindo que o fluxo seja obrigatoriamente intermediado pelo backend.
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
  v_semestre_atual VARCHAR(20);
  v_status_anterior VARCHAR(50);
  
  v_semestre_atual_num INTEGER;
  v_novo_semestre_num INTEGER;
  v_periodo_atual_abs INTEGER;
  v_periodo_novo_abs INTEGER;
  
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
    COALESCE(semestre, '1'),
    status_administrativo
  INTO 
    v_mat_antiga_id,
    v_instituicao_id,
    v_curso_id,
    v_turma_id_atual,
    v_grade_id_atual,
    v_ano_letivo_atual,
    v_semestre_atual,
    v_status_anterior
  FROM public.matriculas
  WHERE aluno_id = p_aluno_id
    AND is_principal = TRUE
  LIMIT 1;

  IF v_mat_antiga_id IS NULL THEN
    RAISE EXCEPTION 'Aluno ID % não possui uma matrícula principal ativa para realizar rematrícula.', p_aluno_id;
  END IF;

  -- 2. Converter semestres/períodos para inteiros seguros para comparação numérica sequencial
  v_semestre_atual_num := COALESCE(NULLIF(REGEXP_REPLACE(v_semestre_atual, '\D', '', 'g'), ''), '1')::INTEGER;
  v_novo_semestre_num   := COALESCE(NULLIF(REGEXP_REPLACE(p_novo_semestre, '\D', '', 'g'), ''), '1')::INTEGER;

  -- Período absoluto ponderado: (Ano * 100) + Semestre (ex: 2026/1 -> 202601; 2026/2 -> 202602)
  v_periodo_atual_abs := (v_ano_letivo_atual * 100) + v_semestre_atual_num;
  v_periodo_novo_abs  := (p_novo_ano_letivo * 100) + v_novo_semestre_num;

  -- 3. Validar a sequência de períodos (Deve ser estritamente superior ao período atual)
  IF v_periodo_novo_abs <= v_periodo_atual_abs THEN
    IF p_novo_ano_letivo < v_ano_letivo_atual THEN
      RAISE EXCEPTION 'O novo ano letivo (%) não pode ser inferior ao ano letivo atual (%).', p_novo_ano_letivo, v_ano_letivo_atual;
    ELSIF p_novo_ano_letivo = v_ano_letivo_atual AND v_novo_semestre_num = v_semestre_atual_num THEN
      RAISE EXCEPTION 'Não é permitido realizar rematrícula para o mesmo período acadêmico (%/%).', p_novo_ano_letivo, COALESCE(p_novo_semestre, '1');
    ELSIF p_novo_ano_letivo = v_ano_letivo_atual AND v_novo_semestre_num < v_semestre_atual_num THEN
      RAISE EXCEPTION 'O novo semestre (%) não pode ser anterior ao semestre atual (%) no ano de %.', COALESCE(p_novo_semestre, '1'), v_semestre_atual, p_novo_ano_letivo;
    ELSE
      RAISE EXCEPTION 'O período de rematrícula (%/%) deve ser estritamente posterior ao período atual (%/%).', p_novo_ano_letivo, COALESCE(p_novo_semestre, '1'), v_ano_letivo_atual, v_semestre_atual;
    END IF;
  END IF;

  -- 4. Definir turma e grade da nova matrícula
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

  -- 5. Atualizar a matrícula anterior desmarcando is_principal e alterando o status para CONCLUIDO
  UPDATE public.matriculas
  SET 
    is_principal = FALSE,
    status_administrativo = 'CONCLUIDO',
    data_conclusao = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = v_mat_antiga_id;

  -- 6. Criar a nova matrícula com is_principal = TRUE e status ATIVO
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
    TRUE,
    CURRENT_DATE,
    p_plano_financeiro,
    p_valor_mensalidade
  ) RETURNING id INTO v_nova_matricula_id;

  -- 7. Atualizar a referência de turma/ano letivo/semestre na tabela public.alunos
  UPDATE public.alunos
  SET 
    turmaid = v_turma_id_destino,
    ano_letivo = p_novo_ano_letivo,
    semestre = p_novo_semestre,
    statusmatricula = 'ATIVO'
  WHERE id = p_aluno_id;

  -- 8. Registrar a movimentação de REMATRICULA no histórico
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

-- SEGURANÇA: Revogar permissões diretas de chamada da RPC via PostgREST/Cliente
REVOKE EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) FROM authenticated;

-- Garantir acesso exclusivo para a role service_role utilizada pelo backend
GRANT EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) TO service_role;
