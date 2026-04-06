-- Adicionar campos de nacionalidade e naturalidade na tabela alunos
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);

-- Adicionar comentários nos campos
COMMENT ON COLUMN public.alunos.nacionalidade IS 'País de nacionalidade do aluno (ex: Brasileiro, Português)';
COMMENT ON COLUMN public.alunos.naturalidade IS 'Cidade/Estado de naturalidade do aluno (ex: São Paulo-SP)';
