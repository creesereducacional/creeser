-- Add missing CNPJ column to unidades
ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
