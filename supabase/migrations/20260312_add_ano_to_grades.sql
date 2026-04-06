-- Adiciona o ano de execução da matriz curricular nas grades.
ALTER TABLE public.grades
ADD COLUMN IF NOT EXISTS ano INTEGER;
