-- Add MEC code field to instituicoes
ALTER TABLE instituicoes
  ADD COLUMN IF NOT EXISTS cod_mec VARCHAR(50);
