-- ============================================================
-- Migration: Fase 2B - Função RPC Transacional para Backfill
-- Data: 2026-09-07
-- Descrição: Função PL/pgSQL transacional que executa INSERT em public.matriculas 
--            e public.movimentacoes_matricula em um único bloco atômico no PostgreSQL.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_backfill_processar_aluno_transacional(
  p_aluno_id BIGINT,
  p_instituicao_id UUID,
  p_curso_id BIGINT,
  p_turma_id BIGINT,
  p_ano_letivo INTEGER,
  p_semestre VARCHAR(20),
  p_status_administrativo VARCHAR(50),
  p_is_principal BOOLEAN,
  p_data_matricula DATE,
  p_plano_financeiro VARCHAR(50),
  p_valor_matricula NUMERIC(10,2),
  p_valor_mensalidade NUMERIC(10,2),
  p_percentual_desconto NUMERIC(5,2),
  p_qtd_parcelas INTEGER,
  p_dia_pagamento INTEGER,
  p_aluno_bolsista BOOLEAN,
  p_percentual_bolsa NUMERIC(5,2)
)
RETURNS UUID AS $$
DECLARE
  v_matricula_id UUID;
BEGIN
  -- 1. Inserir a Matrícula
  INSERT INTO public.matriculas (
    aluno_id,
    instituicao_id,
    curso_id,
    turma_id,
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
    aluno_bolsista,
    percentual_bolsa
  ) VALUES (
    p_aluno_id,
    p_instituicao_id,
    p_curso_id,
    p_turma_id,
    p_ano_letivo,
    p_semestre,
    p_status_administrativo,
    'EM_ANDAMENTO',
    p_is_principal,
    p_data_matricula,
    p_plano_financeiro,
    p_valor_matricula,
    p_valor_mensalidade,
    p_percentual_desconto,
    p_qtd_parcelas,
    p_dia_pagamento,
    p_aluno_bolsista,
    p_percentual_bolsa
  ) RETURNING id INTO v_matricula_id;

  -- 2. Inserir a Movimentação Histórica Transacionalmente no mesmo bloco
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
    p_turma_id,
    p_curso_id,
    p_ano_letivo,
    p_status_administrativo,
    'Migração de histórico do cadastro legado'
  );

  RETURN v_matricula_id;
END;
$$ LANGUAGE plpgsql;
