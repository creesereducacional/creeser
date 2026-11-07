-- ==============================================================================
-- Migration: Adicionar suporte a Cabeçalho e Rodapé em modelos de contrato
-- Tabela: contratos_instituicao
-- ==============================================================================

-- 1. Colunas para Cabeçalho
ALTER TABLE public.contratos_instituicao
  ADD COLUMN IF NOT EXISTS cabecalho_html TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cabecalho_ativo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cabecalho_primeira_pagina BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cabecalho_repetir_demais BOOLEAN NOT NULL DEFAULT true;

-- 2. Colunas para Rodapé
ALTER TABLE public.contratos_instituicao
  ADD COLUMN IF NOT EXISTS rodape_html TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rodape_ativo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rodape_primeira_pagina BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rodape_repetir_demais BOOLEAN NOT NULL DEFAULT true;

-- 3. Comentários para documentação
COMMENT ON COLUMN public.contratos_instituicao.cabecalho_html IS 'Conteúdo HTML formatado do cabeçalho do contrato';
COMMENT ON COLUMN public.contratos_instituicao.cabecalho_ativo IS 'Se o cabeçalho está ativado no modelo';
COMMENT ON COLUMN public.contratos_instituicao.cabecalho_primeira_pagina IS 'Exibir cabeçalho na primeira página impressa';
COMMENT ON COLUMN public.contratos_instituicao.cabecalho_repetir_demais IS 'Repetir cabeçalho nas páginas seguintes';

COMMENT ON COLUMN public.contratos_instituicao.rodape_html IS 'Conteúdo HTML formatado do rodapé do contrato';
COMMENT ON COLUMN public.contratos_instituicao.rodape_ativo IS 'Se o rodapé está ativado no modelo';
COMMENT ON COLUMN public.contratos_instituicao.rodape_primeira_pagina IS 'Exibir rodapé na primeira página impressa';
COMMENT ON COLUMN public.contratos_instituicao.rodape_repetir_demais IS 'Repetir rodapé nas páginas seguintes';
