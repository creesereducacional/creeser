-- Adiciona campo de nome social textual (apelido) para alunos.
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS apelido VARCHAR(255);
