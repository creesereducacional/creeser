-- Tabela de auditoria para operacoes do perfil Recepcao
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS recepcao_auditoria (
  id          BIGSERIAL PRIMARY KEY,
  aluno_id    BIGINT    REFERENCES alunos(id) ON DELETE SET NULL,
  usuario_id  BIGINT    REFERENCES usuarios(id) ON DELETE SET NULL,
  acao        TEXT      NOT NULL,   -- CRIAR_PRE_CADASTRO | EDITAR_PRE_CADASTRO
  dados       TEXT,                 -- JSON serializado com detalhes da operacao
  data_hora   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recepcao_auditoria_aluno_id    ON recepcao_auditoria(aluno_id);
CREATE INDEX IF NOT EXISTS idx_recepcao_auditoria_usuario_id  ON recepcao_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_recepcao_auditoria_data_hora   ON recepcao_auditoria(data_hora DESC);
