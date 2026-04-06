-- Vincula turma a uma instituição do grupo educacional.
ALTER TABLE public.turmas
ADD COLUMN IF NOT EXISTS instituicao_id UUID;

-- Backfill com base na unidade vinculada, quando houver instituição na unidade.
UPDATE public.turmas AS t
SET instituicao_id = u.instituicao_id
FROM public.unidades AS u
WHERE t.instituicao_id IS NULL
  AND t.unidadeid IS NOT NULL
  AND u.id = t.unidadeid
  AND u.instituicao_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_turmas_instituicao_id'
  ) THEN
    ALTER TABLE public.turmas
    ADD CONSTRAINT fk_turmas_instituicao_id
    FOREIGN KEY (instituicao_id)
    REFERENCES public.instituicoes(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_turmas_instituicao_id
  ON public.turmas(instituicao_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.turmas
    WHERE instituicao_id IS NULL
  ) THEN
    ALTER TABLE public.turmas
    ALTER COLUMN instituicao_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Coluna turmas.instituicao_id permanece NULLABLE: existem turmas sem instituição para backfill.';
  END IF;
END $$;
