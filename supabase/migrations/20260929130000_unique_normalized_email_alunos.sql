-- Migration: 20260929130000_unique_normalized_email_alunos.sql
-- Descrição: Garante a unicidade rigorosa de e-mails em alunos e usuários no PostgreSQL,
-- normalizando com TRIM e LOWER, ignorando NULL e strings vazias, e protegendo contra concorrência/race condition.

-- 1. Função de trigger para normalização automática de e-mail antes de INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.fn_normalize_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := NULLIF(LOWER(TRIM(NEW.email)), '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para tabela ALUNOS
DROP TRIGGER IF EXISTS trg_normalize_email_alunos ON public.alunos;
CREATE TRIGGER trg_normalize_email_alunos
BEFORE INSERT OR UPDATE OF email ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.fn_normalize_email();

-- 3. Trigger para tabela USUARIOS
DROP TRIGGER IF EXISTS trg_normalize_email_usuarios ON public.usuarios;
CREATE TRIGGER trg_normalize_email_usuarios
BEFORE INSERT OR UPDATE OF email ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.fn_normalize_email();

-- 4. Índice Único Funcional para ALUNOS
CREATE UNIQUE INDEX IF NOT EXISTS idx_alunos_unique_normalized_email
ON public.alunos (LOWER(TRIM(email)))
WHERE email IS NOT NULL AND TRIM(email) != '';

-- 5. Índice Único Funcional para USUARIOS
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_unique_normalized_email
ON public.usuarios (LOWER(TRIM(email)))
WHERE email IS NOT NULL AND TRIM(email) != '';
