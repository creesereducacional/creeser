-- ✅ ADICIONAR IDS NUMÉRICOS SEQUENCIAIS EM TODAS AS TABELAS
-- Cada tabela ganha um campo "numero_id" SERIAL auto-incremento

-- 1️⃣ ALUNOS - ID SEQUENCIAL
ALTER TABLE alunos 
ADD COLUMN IF NOT EXISTS numero_id SERIAL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_alunos_numero_id ON alunos(numero_id);

-- 2️⃣ PROFESSORES - ID SEQUENCIAL
ALTER TABLE professores 
ADD COLUMN IF NOT EXISTS numero_id SERIAL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_professores_numero_id ON professores(numero_id);

-- 3️⃣ TURMAS - ID SEQUENCIAL
ALTER TABLE turmas 
ADD COLUMN IF NOT EXISTS numero_id SERIAL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_turmas_numero_id ON turmas(numero_id);

-- 4️⃣ CURSOS - ID SEQUENCIAL
ALTER TABLE cursos 
ADD COLUMN IF NOT EXISTS numero_id SERIAL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_cursos_numero_id ON cursos(numero_id);

-- 5️⃣ FUNCIONÁRIOS - ID SEQUENCIAL
ALTER TABLE funcionarios 
ADD COLUMN IF NOT EXISTS numero_id SERIAL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_funcionarios_numero_id ON funcionarios(numero_id);

-- 6️⃣ DISCIPLINAS - ID SEQUENCIAL (se existir)
ALTER TABLE disciplinas 
ADD COLUMN IF NOT EXISTS numero_id SERIAL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_disciplinas_numero_id ON disciplinas(numero_id);

-- 7️⃣ AVALIAÇÕES - ID SEQUENCIAL (se existir)
ALTER TABLE avaliacoes 
ADD COLUMN IF NOT EXISTS numero_id SERIAL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_numero_id ON avaliacoes(numero_id);
