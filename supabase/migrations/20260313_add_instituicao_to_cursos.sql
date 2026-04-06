-- Vincula curso a uma instituição do grupo educacional.
ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS instituicao_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_cursos_instituicao_id'
  ) THEN
    ALTER TABLE public.cursos
    ADD CONSTRAINT fk_cursos_instituicao_id
    FOREIGN KEY (instituicao_id)
    REFERENCES public.instituicoes(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cursos_instituicao_id
  ON public.cursos(instituicao_id);
