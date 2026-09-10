-- ============================================================
-- Migration: 20260910000000_backfill_matriculas_legadas_e_ajuste_rpc.sql
-- Data: 2026-09-10
-- Descrição:
--   1. Função e execução de BACKFILL idempotente de matrículas para alunos legados
--      (Grupo A: alunos sem nenhuma matrícula em public.matriculas)
--      (Grupo B: alunos com matrículas existentes mas sem is_principal = TRUE)
--   2. Atualização de public.fn_executar_rematricula_aluno para validar
--      rigorosamente a matrícula principal com status_administrativo = 'ATIVO'.
-- ============================================================

-- 1️⃣ FUNÇÃO TRANSACIONAL E IDEMPOTENTE DE BACKFILL
CREATE OR REPLACE FUNCTION public.fn_executar_backfill_matriculas_legadas()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec_aluno RECORD;
  v_rec_mat RECORD;
  v_curso_id BIGINT;
  v_grade_id BIGINT;
  v_status_admin VARCHAR(50);
  v_ano_letivo INTEGER;
  v_semestre VARCHAR(20);
  v_nova_mat_id UUID;
  
  v_count_grupo_a INTEGER := 0;
  v_count_grupo_b INTEGER := 0;
  v_count_ambiguos INTEGER := 0;
  v_count_consistentes INTEGER := 0;
  v_ambiguos_ids BIGINT[] := ARRAY[]::BIGINT[];
BEGIN

  -- -------------------------------------------------------------
  -- GRUPO A: Alunos existentes em public.alunos sem nenhuma matrícula em public.matriculas
  -- -------------------------------------------------------------
  FOR v_rec_aluno IN 
    SELECT a.*
    FROM public.alunos a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.matriculas m WHERE m.aluno_id = a.id
    )
    ORDER BY a.id ASC
  LOOP
    -- 1. Determinar o curso_id: usa a.cursoid ou extrai da turma a.turmaid
    v_curso_id := v_rec_aluno.cursoid;
    IF v_curso_id IS NULL AND v_rec_aluno.turmaid IS NOT NULL THEN
      SELECT cursoid INTO v_curso_id FROM public.turmas WHERE id = v_rec_aluno.turmaid;
    END IF;

    -- Se não houver curso nem turma para determinar curso, registrar como ambíguo
    IF v_curso_id IS NULL THEN
      v_count_ambiguos := v_count_ambiguos + 1;
      v_ambiguos_ids := array_append(v_ambiguos_ids, v_rec_aluno.id);
      CONTINUE;
    END IF;

    -- 2. Determinar a grade_id a partir da turma (se vinculada)
    v_grade_id := NULL;
    IF v_rec_aluno.turmaid IS NOT NULL THEN
      SELECT gradeid INTO v_grade_id FROM public.turmas WHERE id = v_rec_aluno.turmaid;
    END IF;

    -- 3. Mapeamento estrito do status legado (statusmatricula) para status_administrativo
    IF v_rec_aluno.turmaid IS NULL THEN
      v_status_admin := 'AGUARDANDO_TURMA';
    ELSE
      CASE UPPER(COALESCE(v_rec_aluno.statusmatricula, 'ATIVO'))
        WHEN 'ATIVO' THEN v_status_admin := 'ATIVO';
        WHEN 'PRE_CADASTRO' THEN v_status_admin := 'PRE_CADASTRO';
        WHEN 'AGUARDANDO_PAGAMENTO' THEN v_status_admin := 'AGUARDANDO_PAGAMENTO';
        WHEN 'AGUARDANDO_TURMA' THEN v_status_admin := 'AGUARDANDO_TURMA';
        WHEN 'TRANCADO' THEN v_status_admin := 'TRANCADO';
        WHEN 'CANCELADO' THEN v_status_admin := 'CANCELADO';
        WHEN 'DESISTENTE' THEN v_status_admin := 'DESISTENTE';
        WHEN 'CONCLUIDO' THEN v_status_admin := 'CONCLUIDO';
        ELSE v_status_admin := 'ATIVO';
      END CASE;
    END IF;

    -- 4. Ano letivo e Semestre
    v_ano_letivo := COALESCE(v_rec_aluno.ano_letivo, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    v_semestre := COALESCE(NULLIF(v_rec_aluno.semestre, ''), '1');

    -- 5. Inserir a Matrícula Inicial
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
      is_principal,
      data_matricula,
      plano_financeiro,
      valor_matricula,
      valor_mensalidade,
      percentual_desconto,
      qtd_parcelas,
      dia_pagamento,
      qtd_meses_contrato,
      aluno_bolsista,
      percentual_bolsa,
      financiamento_estudantil,
      percentual_financiamento
    ) VALUES (
      v_rec_aluno.id,
      v_rec_aluno.instituicao_id,
      v_curso_id,
      v_rec_aluno.turmaid,
      v_grade_id,
      v_ano_letivo,
      v_semestre,
      v_status_admin,
      'EM_ANDAMENTO',
      TRUE, -- Primeira/Única matrícula definida como Principal
      COALESCE(v_rec_aluno.datamatricula, CURRENT_DATE),
      v_rec_aluno.plano_financeiro,
      v_rec_aluno.valor_matricula,
      v_rec_aluno.valor_mensalidade,
      v_rec_aluno.percentual_desconto,
      v_rec_aluno.qtd_parcelas,
      v_rec_aluno.dia_pagamento,
      v_rec_aluno.qtd_meses_contrato,
      COALESCE(v_rec_aluno.aluno_bolsista, FALSE),
      v_rec_aluno.percentual_bolsa,
      v_rec_aluno.financiamento_estudantil,
      v_rec_aluno.percentual_financiamento
    ) RETURNING id INTO v_nova_mat_id;

    -- 6. Inserir a Movimentação Inicial de Histórico
    INSERT INTO public.movimentacoes_matricula (
      matricula_id,
      tipo_movimentacao,
      turma_destino_id,
      curso_destino_id,
      ano_letivo_destino,
      status_novo,
      observacao
    ) VALUES (
      v_nova_mat_id,
      'MATRICULA_INICIAL',
      v_rec_aluno.turmaid,
      v_curso_id,
      v_ano_letivo,
      v_status_admin,
      'Criação de matrícula inicial via migração/backfill de dados legados'
    );

    v_count_grupo_a := v_count_grupo_a + 1;
  END LOOP;


  -- -------------------------------------------------------------
  -- GRUPO B: Alunos com matrículas em public.matriculas mas sem nenhuma com is_principal = TRUE
  -- -------------------------------------------------------------
  FOR v_rec_aluno IN
    SELECT a.id, a.nome
    FROM public.alunos a
    WHERE EXISTS (
      SELECT 1 FROM public.matriculas m WHERE m.aluno_id = a.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.matriculas m WHERE m.aluno_id = a.id AND m.is_principal = TRUE
    )
    ORDER BY a.id ASC
  LOOP
    -- Buscar a matrícula mais recente com status operacional (ATIVO, AGUARDANDO_TURMA, AGUARDANDO_PAGAMENTO, PRE_CADASTRO)
    SELECT id INTO v_nova_mat_id
    FROM public.matriculas
    WHERE aluno_id = v_rec_aluno.id
      AND status_administrativo IN ('ATIVO', 'AGUARDANDO_TURMA', 'AGUARDANDO_PAGAMENTO', 'PRE_CADASTRO')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Se não houver operacional, buscar a última matrícula cadastrada (desde que não ambígua)
    IF v_nova_mat_id IS NULL THEN
      SELECT id INTO v_nova_mat_id
      FROM public.matriculas
      WHERE aluno_id = v_rec_aluno.id
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;

    IF v_nova_mat_id IS NOT NULL THEN
      UPDATE public.matriculas
      SET is_principal = TRUE, updated_at = NOW()
      WHERE id = v_nova_mat_id;

      v_count_grupo_b := v_count_grupo_b + 1;
    ELSE
      v_count_ambiguos := v_count_ambiguos + 1;
      v_ambiguos_ids := array_append(v_ambiguos_ids, v_rec_aluno.id);
    END IF;
  END LOOP;

  -- Contagem de alunos que já estavam consistentes
  SELECT COUNT(DISTINCT aluno_id) INTO v_count_consistentes
  FROM public.matriculas
  WHERE is_principal = TRUE;

  RETURN jsonb_build_object(
    'grupo_a_inseridos', v_count_grupo_a,
    'grupo_b_promovidos', v_count_grupo_b,
    'consistentes_total', v_count_consistentes,
    'ambiguos_total', v_count_ambiguos,
    'ambiguos_aluno_ids', v_ambiguos_ids
  );
END;
$$ LANGUAGE plpgsql;

-- Execução do Backfill na aplicação da migration
SELECT public.fn_executar_backfill_matriculas_legadas();


-- -------------------------------------------------------------
-- 2️⃣ ATUALIZAÇÃO DA RPC public.fn_executar_rematricula_aluno
-- -------------------------------------------------------------
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
  -- 1. Buscar a matrícula principal ativa/operacional do aluno
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
    AND status_administrativo = 'ATIVO'
  LIMIT 1;

  IF v_mat_antiga_id IS NULL THEN
    RAISE EXCEPTION 'Aluno ID % não possui uma matrícula principal com status ATIVO para realizar a rematrícula.', p_aluno_id;
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

-- Permissões de Segurança da RPC
REVOKE EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fn_executar_rematricula_aluno(BIGINT, INTEGER, VARCHAR, BIGINT, VARCHAR, NUMERIC, TEXT) TO service_role;
