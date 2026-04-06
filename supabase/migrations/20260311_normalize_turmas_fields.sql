-- Normalize turma form fields into dedicated columns
ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS cargahoraria VARCHAR(100),
  ADD COLUMN IF NOT EXISTS editalprocessoseletivo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS turno VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tipocobranca VARCHAR(50),
  ADD COLUMN IF NOT EXISTS mensalidade VARCHAR(50),
  ADD COLUMN IF NOT EXISTS desconto VARCHAR(50),
  ADD COLUMN IF NOT EXISTS inscricao VARCHAR(50),
  ADD COLUMN IF NOT EXISTS matricula VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contarecebimento VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mesescontrato INTEGER,
  ADD COLUMN IF NOT EXISTS iesregistradoradiploma VARCHAR(255);

-- Backfill from legacy JSON payload stored in descricao when present
WITH legacy_meta AS (
  SELECT
    id,
    CASE
      WHEN descricao IS NOT NULL AND LEFT(TRIM(descricao), 1) = '{' THEN descricao::jsonb
      ELSE '{}'::jsonb
    END AS meta
  FROM turmas
)
UPDATE turmas t
SET
  cargahoraria = COALESCE(t.cargahoraria, NULLIF(legacy_meta.meta ->> 'cargaHoraria', '')),
  editalprocessoseletivo = COALESCE(t.editalprocessoseletivo, NULLIF(legacy_meta.meta ->> 'edittalProcessoSeletivo', '')),
  turno = COALESCE(t.turno, NULLIF(legacy_meta.meta ->> 'turno', '')),
  tipocobranca = COALESCE(t.tipocobranca, NULLIF(legacy_meta.meta ->> 'tipo', '')),
  mensalidade = COALESCE(t.mensalidade, NULLIF(legacy_meta.meta ->> 'mensalidade', '')),
  desconto = COALESCE(t.desconto, NULLIF(legacy_meta.meta ->> 'desconto', '')),
  inscricao = COALESCE(t.inscricao, NULLIF(legacy_meta.meta ->> 'inscricao', '')),
  matricula = COALESCE(t.matricula, NULLIF(legacy_meta.meta ->> 'matricula', '')),
  contarecebimento = COALESCE(t.contarecebimento, NULLIF(legacy_meta.meta ->> 'contaRecebimento', '')),
  mesescontrato = COALESCE(
    t.mesescontrato,
    CASE
      WHEN (legacy_meta.meta ->> 'mesesContrato') ~ '^[0-9]+$' THEN (legacy_meta.meta ->> 'mesesContrato')::INTEGER
      ELSE NULL
    END
  ),
  iesregistradoradiploma = COALESCE(t.iesregistradoradiploma, NULLIF(legacy_meta.meta ->> 'iesRegistradoraDiploma', '')),
  capacidademaxima = COALESCE(
    t.capacidademaxima,
    CASE
      WHEN (legacy_meta.meta ->> 'limiteCadastroAlunos') ~ '^[0-9]+$' THEN (legacy_meta.meta ->> 'limiteCadastroAlunos')::INTEGER
      ELSE NULL
    END
  ),
  datainicio = COALESCE(
    t.datainicio,
    CASE
      WHEN (legacy_meta.meta ->> 'processoSeletivo') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (legacy_meta.meta ->> 'processoSeletivo')::DATE
      ELSE NULL
    END
  ),
  descricao = COALESCE(NULLIF(legacy_meta.meta ->> 'descricao', ''), t.descricao)
FROM legacy_meta
WHERE t.id = legacy_meta.id;
