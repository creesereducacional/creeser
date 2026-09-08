-- ============================================================
-- Migration: Fase 3.3.1 - Correção de RLS via SECURITY DEFINER no Trigger
-- Data: 2026-09-07
-- Descrição: Recria a função public.fn_auto_criar_matricula_aluno()
--            adicionando SECURITY DEFINER e SET search_path = public, pg_temp
--            para permitir a inserção nas tabelas matriculas e movimentacoes_matricula
--            mesmo quando a requisição vier de um contexto com RLS ativado.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_auto_criar_matricula_aluno()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_curso_id BIGINT;
  v_grade_id BIGINT;
  v_status_admin VARCHAR(50);
  v_matricula_id UUID;
  v_ano_letivo INTEGER;
  v_semestre VARCHAR(20);
BEGIN
  -- 1. Resolver o curso_id: usa NEW.cursoid se preenchido; se nulo, busca o curso_id da turma em public.turmas
  v_curso_id := NEW.cursoid;
  
  IF v_curso_id IS NULL AND NEW.turmaid IS NOT NULL THEN
    SELECT cursoid INTO v_curso_id
    FROM public.turmas
    WHERE id = NEW.turmaid;
  END IF;

  -- Se não for possível determinar o curso_id, encerra a execução do trigger sem criar matrícula
  IF v_curso_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Proteção contra duplicação de matrícula operacional para o mesmo (aluno_id, curso_id)
  IF EXISTS (
    SELECT 1 FROM public.matriculas
    WHERE aluno_id = NEW.id
      AND curso_id = v_curso_id
      AND status_administrativo IN ('PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_TURMA', 'ATIVO')
  ) THEN
    RETURN NEW;
  END IF;

  -- 3. Obter a grade_id vinculada à turma (se turma informada)
  IF NEW.turmaid IS NOT NULL THEN
    SELECT gradeid INTO v_grade_id
    FROM public.turmas
    WHERE id = NEW.turmaid;
  END IF;

  -- 4. Mapeamento do statusmatricula do aluno legado para status_administrativo
  -- Regra: Se turmaid for NULL, NUNCA pode ser ATIVO (usa AGUARDANDO_TURMA)
  IF NEW.turmaid IS NULL THEN
    v_status_admin := 'AGUARDANDO_TURMA';
  ELSE
    CASE UPPER(COALESCE(NEW.statusmatricula, 'ATIVO'))
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

  -- 5. Tratamento de Ano Letivo e Semestre
  v_ano_letivo := COALESCE(NEW.ano_letivo, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_semestre := COALESCE(NULLIF(NEW.semestre, ''), '1');

  -- 6. Inserir a primeira Matrícula (is_principal = TRUE)
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
    NEW.id,
    NEW.instituicao_id,
    v_curso_id,
    NEW.turmaid,
    v_grade_id,
    v_ano_letivo,
    v_semestre,
    v_status_admin,
    'EM_ANDAMENTO',
    TRUE, -- is_principal = TRUE para a primeira matrícula
    COALESCE(NEW.datamatricula, CURRENT_DATE),
    NEW.plano_financeiro,
    NEW.valor_matricula,
    NEW.valor_mensalidade,
    NEW.percentual_desconto,
    NEW.qtd_parcelas,
    NEW.dia_pagamento,
    NEW.qtd_meses_contrato,
    COALESCE(NEW.aluno_bolsista, FALSE),
    NEW.percentual_bolsa,
    NEW.financiamento_estudantil,
    NEW.percentual_financiamento
  ) RETURNING id INTO v_matricula_id;

  -- 7. Inserir a Movimentação Inicial na mesma transação implícita
  INSERT INTO public.movimentacoes_matricula (
    matricula_id,
    tipo_movimentacao,
    turma_destino_id,
    curso_destino_id,
    ano_letivo_destino,
    status_novo,
    observacao
  ) VALUES (
    v_matricula_id,
    'MATRICULA_INICIAL',
    NEW.turmaid,
    v_curso_id,
    v_ano_letivo,
    v_status_admin,
    'Matrícula inicial gerada automaticamente via criação de aluno'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o trigger AFTER INSERT esteja vinculado à função recriada
DROP TRIGGER IF EXISTS trigger_auto_criar_matricula_aluno ON public.alunos;
CREATE TRIGGER trigger_auto_criar_matricula_aluno
  AFTER INSERT ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_criar_matricula_aluno();
