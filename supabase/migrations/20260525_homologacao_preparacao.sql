-- ============================================================
-- HOMOLOGAÇÃO INOVE TÉCNICO — SQL DE PREPARAÇÃO
-- Executar no Supabase SQL Editor ANTES do Go-Live
-- Data: 2026-05-25
-- ============================================================

-- 1. Adicionar coluna senha à tabela usuarios
-- (necessário para que o login funcione — campo verificado em pages/api/auth/login.js)
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS senha TEXT DEFAULT NULL;

-- 2. Criar usuários iniciais de cada perfil para Inove Técnico
-- ATENÇÃO: trocar as senhas antes do Go-Live em produção

INSERT INTO public.usuarios (nomecompleto, email, tipo, status, perfil, instituicao_id, senha)
VALUES
  -- Admin geral do grupo (bypassa multi-tenant)
  ('Administrador Sistema', 'admin@inovetecnico.com.br', 'admin', 'ativo', 'grupo_admin', '1f140f5f-cf75-489d-8ab3-d99cf28d1414', 'Inove@2026!'),
  -- Admin da instituição Inove
  ('Admin Inove Tecnico',   'adm.inove@inovetecnico.com.br', 'admin', 'ativo', 'instituicao_admin', '1f140f5f-cf75-489d-8ab3-d99cf28d1414', 'Inove@2026!'),
  -- Tesouraria / Financeiro
  ('Tesouraria Inove',      'financeiro@inovetecnico.com.br', 'usuario', 'ativo', 'financeiro', '1f140f5f-cf75-489d-8ab3-d99cf28d1414', 'Inove@2026!'),
  -- Secretaria
  ('Secretaria Inove',      'secretaria@inovetecnico.com.br', 'usuario', 'ativo', 'secretaria', '1f140f5f-cf75-489d-8ab3-d99cf28d1414', 'Inove@2026!'),
  -- Comercial / Captação
  ('Captacao Inove',        'comercial@inovetecnico.com.br', 'usuario', 'ativo', 'comercial', '1f140f5f-cf75-489d-8ab3-d99cf28d1414', 'Inove@2026!')
ON CONFLICT (email) DO NOTHING;

-- 3. Atualizar instituicao_id das ordens e parcelas do aluno 16 (dados de teste)
-- (ordens estavam com instituicao_id = NULL, bloqueando filtros multi-tenant)
UPDATE public.financeiro_ordens_pagamento
  SET instituicao_id = '1f140f5f-cf75-489d-8ab3-d99cf28d1414'
  WHERE aluno_id = 16 AND instituicao_id IS NULL;

UPDATE public.financeiro_parcelas
  SET instituicao_id = '1f140f5f-cf75-489d-8ab3-d99cf28d1414'
  WHERE aluno_id IN (16, 20) AND instituicao_id IS NULL;

-- 4. Atualizar instituicao_id das ordens do aluno 20
UPDATE public.financeiro_ordens_pagamento
  SET instituicao_id = '1f140f5f-cf75-489d-8ab3-d99cf28d1414'
  WHERE aluno_id = 20 AND instituicao_id IS NULL;

-- 5. Vincular cursoid ao aluno 16 (estava NULL)
-- Curso "Tecnico de Enfermagem" = id=2 (Inove Técnico)
UPDATE public.alunos
  SET cursoid = 2
  WHERE id = 16 AND cursoid IS NULL;

-- 6. Definir senha nos usuarios já existentes (ON CONFLICT DO NOTHING pulou o INSERT)
UPDATE public.usuarios
  SET senha = 'Inove@2026!'
  WHERE instituicao_id = '1f140f5f-cf75-489d-8ab3-d99cf28d1414'
    AND (senha IS NULL OR senha = '');

-- 7. Verificar resultado
SELECT 'usuarios' as tabela, count(*) FROM usuarios
UNION ALL
SELECT 'usuarios_com_senha', count(*) FROM usuarios WHERE senha IS NOT NULL
UNION ALL
SELECT 'ordens_com_instituicao', count(*) FROM financeiro_ordens_pagamento WHERE instituicao_id IS NOT NULL
UNION ALL
SELECT 'parcelas_com_instituicao', count(*) FROM financeiro_parcelas WHERE instituicao_id IS NOT NULL;
