-- Migration: hierarquia comercial (master + operador)
-- Data: 2026-05-27

-- 1. Novos campos em usuarios para hierarquia comercial
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS criado_por_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS comercial_master_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_usuarios_comercial_master_id ON usuarios(comercial_master_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_criado_por_id       ON usuarios(criado_por_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil              ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_usuarios_status              ON usuarios(status);

-- 3. Migrar perfil 'comercial' para 'comercial_master'
--    - Usuários com tipo='comercial' e perfil NULL ou 'comercial' passam a perfil='comercial_master'
--    - O campo tipo permanece intacto (backward compat com tokens existentes)
--    - O auth-server.js adiciona alias comercial <-> comercial_master para tokens antigos
UPDATE usuarios
SET    perfil = 'comercial_master'
WHERE  perfil = 'comercial'
   OR  (perfil IS NULL AND tipo = 'comercial');

-- 4. Garantir campo 'senha' existe (em sistemas sem a migration anterior)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha TEXT DEFAULT NULL;
