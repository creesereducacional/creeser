-- ==============================================================================
-- Migration: 20261022130000_create_financeiro_negociacoes.sql
-- Módulo: Financeiro - Negociação de Dívidas (Histórico Estruturado e Auditoria)
-- Instrução: Aplicação manual no console do Supabase (SEM execução automática)
-- ==============================================================================

-- 1. Criar tabela estruturada de Negociações / Acordos
CREATE TABLE IF NOT EXISTS public.financeiro_negociacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id UUID REFERENCES public.financeiro_ordens_pagamento(id) ON DELETE SET NULL,
  aluno_id BIGINT NOT NULL REFERENCES public.alunos(id) ON DELETE RESTRICT,
  instituicao_id UUID NOT NULL REFERENCES public.instituicoes(id) ON DELETE RESTRICT,
  unidade_id BIGINT REFERENCES public.unidades(id) ON DELETE SET NULL,
  operador_id BIGINT REFERENCES public.usuarios(id) ON DELETE SET NULL,
  operador_email VARCHAR(255) DEFAULT NULL,
  operador_perfil VARCHAR(100) DEFAULT NULL,
  
  -- Valores e Parâmetros da Negociação com restrições financeiras
  valor_total_original NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (valor_total_original >= 0.00),
  valor_encargos NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (valor_encargos >= 0.00),
  valor_desconto NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (valor_desconto >= 0.00),
  valor_total_negociado NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (valor_total_negociado >= 0.00),
  
  -- Condição de Entrada
  possui_entrada BOOLEAN NOT NULL DEFAULT FALSE,
  valor_entrada NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (valor_entrada >= 0.00),
  tipo_entrada VARCHAR(30) NOT NULL DEFAULT 'sem_entrada' CHECK (tipo_entrada IN ('sem_entrada', 'especie', 'efi')),
  entrada_parcela_id UUID REFERENCES public.financeiro_parcelas(id) ON DELETE SET NULL,
  entrada_paga BOOLEAN NOT NULL DEFAULT FALSE,
  data_pagamento_entrada TIMESTAMPTZ DEFAULT NULL,
  
  -- Saldo e Parcelamento
  valor_saldo NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (valor_saldo >= 0.00),
  quantidade_parcelas INTEGER NOT NULL DEFAULT 1 CHECK (quantidade_parcelas >= 1),
  dia_vencimento_parcelas INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimento_parcelas BETWEEN 1 AND 31),
  
  -- Status da Negociação
  -- 'concluido' (sem entrada ou entrada já quitada com sincronização bancária concluída)
  -- 'pendente_entrada' (aguardando quitação da entrada em dinheiro ou via EFI)
  -- 'sync_pendente' (baixa bancária das originais pendente de sincronização com a EFI)
  -- 'cancelado' (acordo rompido/cancelado)
  status VARCHAR(50) NOT NULL DEFAULT 'concluido' CHECK (status IN ('concluido', 'pendente_entrada', 'sync_pendente', 'cancelado')),
  
  -- Observação Obrigatória do Operador (mínimo 10 caracteres significativos)
  observacao_operador TEXT NOT NULL CHECK (length(trim(observacao_operador)) >= 10),
  
  -- Vínculos estruturados e snapshots (JSONB para consulta rápida e rastreabilidade total)
  parcelas_originais JSONB NOT NULL DEFAULT '[]'::jsonb,
  parcelas_geradas JSONB NOT NULL DEFAULT '[]'::jsonb,
  sincronizacao_efi JSONB NOT NULL DEFAULT '[]'::jsonb,
  eventos_historico JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Restrição de coerência financeira: valor de entrada não pode exceder o total negociado
  CONSTRAINT chk_financeiro_negociacoes_entrada_limite CHECK (valor_entrada <= valor_total_negociado)
);

-- 2. Índices de alta performance e isolamento
CREATE INDEX IF NOT EXISTS idx_financeiro_negociacoes_aluno_id ON public.financeiro_negociacoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_negociacoes_instituicao_id ON public.financeiro_negociacoes(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_negociacoes_ordem_id ON public.financeiro_negociacoes(ordem_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_negociacoes_status ON public.financeiro_negociacoes(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_negociacoes_created_at ON public.financeiro_negociacoes(created_at DESC);

-- 3. Adicionar coluna negociacao_id nas parcelas para rastreabilidade cruzada (segura e sem efeitos colaterais)
ALTER TABLE public.financeiro_parcelas
  ADD COLUMN IF NOT EXISTS negociacao_id UUID NULL REFERENCES public.financeiro_negociacoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financeiro_parcelas_negociacao_id ON public.financeiro_parcelas(negociacao_id);

-- 4. Habilitar Row Level Security (RLS) e Políticas de Segurança
ALTER TABLE public.financeiro_negociacoes ENABLE ROW LEVEL SECURITY;

-- 4.1 Política de Serviço:
-- Toda a persistência e consulta oficial do CREESER é executada via backend com service_role
-- após validação rigorosa de sessão JWT, permissões de perfil ('grupo_admin', 'instituicao_admin', 'financeiro')
-- e isolamento estrito de instituicao_id e unidade_id pelo helper lib/auth-server.js.
DROP POLICY IF EXISTS "service_role_financeiro_negociacoes" ON public.financeiro_negociacoes;
CREATE POLICY "service_role_financeiro_negociacoes" ON public.financeiro_negociacoes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.2 Política de Isolamento Multi-Instituição para usuários autenticados (Supabase Auth Client):
-- Garante que instituicao_id seja sempre estritamente correspondente ao vínculo do usuário autenticado.
-- Faz o join tipado entre auth.uid() (UUID) -> usuarios.uuid -> usuarios.id (INTEGER) -> usuario_instituicoes.usuario_id.
-- Nenhuma negociação com instituição nula ou sem vínculo correspondente é exposta.
DROP POLICY IF EXISTS "instituicao_isolamento_financeiro_negociacoes" ON public.financeiro_negociacoes;
CREATE POLICY "instituicao_isolamento_financeiro_negociacoes" ON public.financeiro_negociacoes
  FOR SELECT
  TO authenticated
  USING (
    instituicao_id IN (
      SELECT ui.instituicao_id 
      FROM public.usuario_instituicoes ui
      INNER JOIN public.usuarios u ON u.id = ui.usuario_id
      WHERE u.uuid = auth.uid()
    )
  );

-- 5. Comentários explicativos de documentação
COMMENT ON TABLE public.financeiro_negociacoes IS 'Histórico consolidado e detalhado das renegociações/acordos financeiros de alunos';
COMMENT ON COLUMN public.financeiro_negociacoes.instituicao_id IS 'ID da instituição à qual pertence o acordo (obrigatório, isolamento multi-tenant estrito)';
COMMENT ON COLUMN public.financeiro_negociacoes.parcelas_originais IS 'Snapshot das parcelas originais canceladas com IDs, valores, vencimentos e vínculos EFI';
COMMENT ON COLUMN public.financeiro_negociacoes.parcelas_geradas IS 'Snapshot das novas parcelas geradas pelo acordo';
COMMENT ON COLUMN public.financeiro_negociacoes.sincronizacao_efi IS 'Log de tentativas e respostas de cancelamento bancário das faturas antigas na EFI';
COMMENT ON COLUMN public.financeiro_negociacoes.eventos_historico IS 'Trilha append-only de eventos posteriores (pagamento entrada, falhas, reprocessamento)';
