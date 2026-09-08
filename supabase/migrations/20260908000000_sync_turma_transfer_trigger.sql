-- ============================================================
-- Migration: Fase 3.3.2 - Mudança Transacional de Turma
-- Data: 2026-09-08
-- Descrição: Cria a função e o trigger AFTER UPDATE OF turmaid ON public.alunos
--            para sincronizar a alteração de turma com public.matriculas 
--            e gerar o registro histórico em public.movimentacoes_matricula.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_sincronizar_mudanca_turma_aluno()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_matricula_id UUID;
  v_curso_id BIGINT;
  v_ano_letivo INTEGER;
  v_status_admin VARCHAR(50);
  v_nova_turma_curso_id BIGINT;
  v_nova_grade_id BIGINT;
  v_turma_origem_curso_id BIGINT;
BEGIN
  -- 1. Executa apenas se houver alteração real de turmaid (idempotência)
  IF OLD.turmaid IS NOT DISTINCT FROM NEW.turmaid THEN
    RETURN NEW;
  END IF;

  -- 2. Se a nova turma for NULL, não atualiza nem transfere (tratativa de desvinculação simples se aplicável)
  IF NEW.turmaid IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3. Buscar a matrícula principal ativa do aluno
  SELECT 
    id, 
    curso_id, 
    ano_letivo, 
    status_administrativo 
  INTO 
    v_matricula_id, 
    v_curso_id, 
    v_ano_letivo, 
    v_status_admin
  FROM public.matriculas
  WHERE aluno_id = NEW.id
    AND is_principal = TRUE
  LIMIT 1;

  -- Se não existir matrícula principal para o aluno, encerra sem criar movimentação
  IF v_matricula_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 4. Inspecionar a nova turma para obter curso_id e grade_id
  SELECT 
    cursoid, 
    gradeid 
  INTO 
    v_nova_turma_curso_id, 
    v_nova_grade_id
  FROM public.turmas
  WHERE id = NEW.turmaid;

  IF v_nova_turma_curso_id IS NULL THEN
    RAISE EXCEPTION 'A nova turma selecionada (ID %) não existe ou é inválida.', NEW.turmaid;
  END IF;

  -- 5. Validar se a nova turma pertence ao mesmo curso da matrícula atual
  IF v_nova_turma_curso_id <> v_curso_id THEN
    RAISE EXCEPTION 'Transferência de turma inválida: A turma % pertence a um curso diferente (%) do curso atual da matrícula (%).', 
      NEW.turmaid, v_nova_turma_curso_id, v_curso_id;
  END IF;

  -- 6. Obter o curso_id da turma de origem (se existia)
  IF OLD.turmaid IS NOT NULL THEN
    SELECT cursoid INTO v_turma_origem_curso_id
    FROM public.turmas
    WHERE id = OLD.turmaid;
  END IF;

  -- 7. Atualizar a matrícula principal com a nova turma e nova grade
  UPDATE public.matriculas
  SET 
    turma_id = NEW.turmaid,
    grade_id = v_nova_grade_id,
    updated_at = NOW()
  WHERE id = v_matricula_id;

  -- 8. Inserir o registro histórico de movimentação acadêmica
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
    v_matricula_id,
    'TRANSFERENCIA_TURMA',
    OLD.turmaid,
    NEW.turmaid,
    COALESCE(v_turma_origem_curso_id, v_curso_id),
    v_nova_turma_curso_id,
    v_ano_letivo,
    v_ano_letivo,
    v_status_admin,
    v_status_admin,
    'Transferência de turma realizada via atualização de aluno'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar e recriar o Trigger AFTER UPDATE OF turmaid em public.alunos
DROP TRIGGER IF EXISTS trigger_sincronizar_mudanca_turma_aluno ON public.alunos;
CREATE TRIGGER trigger_sincronizar_mudanca_turma_aluno
  AFTER UPDATE OF turmaid ON public.alunos
  FOR EACH ROW
  WHEN (OLD.turmaid IS DISTINCT FROM NEW.turmaid)
  EXECUTE FUNCTION public.fn_sincronizar_mudanca_turma_aluno();
