/**
 * supabase/migrations/20260527_audit_logs.sql
 *
 * Tabela de auditoria operacional centralizada.
 * Execute este script no SQL Editor do Supabase Dashboard.
 */

-- Tabela principal de logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id            bigserial PRIMARY KEY,
  usuario_id    integer,
  usuario_email text,
  perfil        text,
  acao          text NOT NULL,
  modulo        text,
  entidade      text,
  id_entidade   text,
  ip            text,
  detalhes      jsonb,
  instituicao_id integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_id    ON audit_logs (usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo        ON audit_logs (modulo);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao          ON audit_logs (acao);
CREATE INDEX IF NOT EXISTS idx_audit_logs_instituicao   ON audit_logs (instituicao_id);

-- RLS: apenas service_role pode inserir/ler (a API usa supabaseAdmin)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Comentários de documentação
COMMENT ON TABLE  audit_logs                IS 'Log centralizado de ações operacionais do sistema CREESER';
COMMENT ON COLUMN audit_logs.acao           IS 'Ação realizada em UPPER_SNAKE_CASE (ex: LOGIN, CRIAR_LEAD)';
COMMENT ON COLUMN audit_logs.modulo         IS 'Módulo do sistema (auth, comercial, financeiro, admin…)';
COMMENT ON COLUMN audit_logs.entidade       IS 'Tipo da entidade afetada (lead, aluno, contrato…)';
COMMENT ON COLUMN audit_logs.id_entidade    IS 'ID da entidade afetada (string para suportar UUIDs e integers)';
COMMENT ON COLUMN audit_logs.detalhes       IS 'Dados extras em JSONB (campos alterados, valores anteriores…)';
