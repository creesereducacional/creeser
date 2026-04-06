-- Criar tabela curso_unidade se não existir
CREATE TABLE IF NOT EXISTS curso_unidade (
  id SERIAL PRIMARY KEY,
  cursoId INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  unidadeId INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cursoId, unidadeId)
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_curso_unidade_cursoId ON curso_unidade(cursoId);
CREATE INDEX IF NOT EXISTS idx_curso_unidade_unidadeId ON curso_unidade(unidadeId);
