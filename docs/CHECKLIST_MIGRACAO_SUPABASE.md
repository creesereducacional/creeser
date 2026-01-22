# Checklist: Migração MVP VPS → Supabase

**Objetivo**: Checklist detalhado para migração segura após MVP validado em VPS

**Quando usar**: Quando MVP estiver 100% testado e validado em VPS, e quiser mover para Supabase gerenciado

**Tempo estimado**: 3-4 horas de execução completa

---

## Fase 1: Preparação (VPS - Antes de Migrar)

### 1.1 Validação Final em VPS

- [ ] **Backup completo criado**
  ```bash
  ~/bin/backup-postgresql.sh
  ls -lh ~/backups/postgresql/ | head -1
  ```

- [ ] **Todos os testes passam**
  - [ ] Testes de autenticação (login, JWT refresh)
  - [ ] Testes de isolação multi-tenant
  - [ ] Testes de rate limiting
  - [ ] Testes de logs/auditoria
  - Usar: `GUIA_TESTES_MULTITENANT.md`

- [ ] **Aplicação sem erros em produção**
  ```bash
  pm2 logs creeser-api --err | tail -20
  # Deve estar vazio ou apenas warnings não críticos
  ```

- [ ] **Database íntegro**
  ```bash
  psql -h localhost -U creeser_user -d creeser_mvp -c "SELECT COUNT(*) FROM usuario;"
  # Deve retornar número de usuários
  ```

- [ ] **Dados críticos identificados**
  - [ ] Listar empresas importantes
  - [ ] Contar registros por tabela
  - [ ] Salvar queries de validação

---

### 1.2 Documentação de Ambiente VPS Atual

**Arquivo**: `~/BACKUP_VPS_CONFIG.md`

```bash
# Copiar este bloco e preencher
# Depois fazer backup do arquivo

## Ambiente VPS - ANTES da Migração

Data: $(date)
Node.js: $(node -v)
npm: $(npm -v)
PostgreSQL: $(psql --version)
PM2: $(pm2 -v)

### Database Stats
psql -h localhost -U creeser_user -d creeser_mvp << EOF
SELECT 
  schemaname,
  tablename,
  ROUND(pg_total_relation_size(schemaname||'.'||tablename)/1024/1024, 2) AS size_mb
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF

### Contagem de Registros por Tabela
psql -h localhost -U creeser_user -d creeser_mvp << EOF
SELECT tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
EOF

### Verificar Índices
psql -h localhost -U creeser_user -d creeser_mvp -c "\di+"
```

- [ ] Executar script acima
- [ ] Salvar output em arquivo
- [ ] Fazer backup deste arquivo

---

### 1.3 Preparar Dump para Transferência

```bash
# Criar dump SQL (sem gzip para upload mais fácil)
pg_dump -h localhost -U creeser_user -d creeser_mvp \
  --format=plain \
  --no-privileges \
  > ~/creeser_mvp_dump.sql

# Verificar tamanho
ls -lh ~/creeser_mvp_dump.sql

# Comprimir para envio
gzip ~/creeser_mvp_dump.sql
# Resultado: ~/creeser_mvp_dump.sql.gz
```

- [ ] Dump criado sem erros
- [ ] Arquivo `.sql.gz` pronto para upload
- [ ] Tamanho anotado para validação

---

### 1.4 Parar Aplicação em VPS (antes de migração)

**NÃO execute ainda - apenas prepare!**

```bash
# Parar PM2 (vai interromper requisições)
pm2 stop creeser-api
pm2 stop all
pm2 kill

# Parar PostgreSQL (vai desconectar clientes)
sudo systemctl stop postgresql

# Criar dump final
pg_dump -h localhost -U creeser_user -d creeser_mvp \
  --format=plain \
  > ~/creeser_mvp_dump_final.sql
```

---

## Fase 2: Setup Supabase (Supabase.com)

### 2.1 Criar Conta Supabase

- [ ] Ir para https://supabase.com/
- [ ] Criar conta (com GitHub é mais fácil)
- [ ] Criar novo projeto
  - Name: `creeser-mvp`
  - Region: (escolher mais perto - ex: São Paulo se disponível)
  - Database Password: (gerar forte)
- [ ] Aguardar provisioning (~2 minutos)

### 2.2 Notar Credenciais Supabase

**No dashboard Supabase**:
- [ ] Project URL (ex: `https://xxxxx.supabase.co`)
- [ ] Anon Key (para cliente - NÃO usar em backend)
- [ ] Service Role Key (para backend - GUARDAR SEGURO)
- [ ] Database Password (anotada durante criação)
- [ ] Database Host: `db.xxxxx.supabase.co`
- [ ] Database Name: `postgres`
- [ ] Database User: `postgres`

**Construir DATABASE_URL**:
```
postgresql://postgres:SuaSenhaAqui@db.xxxxx.supabase.co:5432/postgres
```

- [ ] DATABASE_URL anotada e testada
  ```bash
  psql "postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres" -c "SELECT version();"
  ```

### 2.3 Configurar Row Level Security (RLS) - IMPORTANTE

Supabase oferece Row Level Security nativa - configurar para produção:

```bash
# Conectar ao banco Supabase
psql "postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres"

# Habilitar RLS em tabelas importantes
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;

# Criar policy de isolação por empresaId
CREATE POLICY isolate_empresa_usuario 
  ON usuario 
  USING (empresaId = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY isolate_empresa_aluno 
  ON aluno 
  USING (empresaId = current_setting('app.current_empresa_id')::uuid);

# ... etc para outras tabelas
```

- [ ] RLS habilitado em tabelas críticas
- [ ] Policies de isolação criadas

---

## Fase 3: Migração de Dados (VPS → Supabase)

### 3.1 Opção A: Dump + Restore (Recomendado para <1GB)

```bash
# No seu laptop/máquina local

# 1. Baixar dump do VPS
scp usuario@seu-ip-vps:~/creeser_mvp_dump.sql.gz .

# 2. Descompactar
gunzip creeser_mvp_dump.sql.gz

# 3. Restaurar no Supabase
psql "postgresql://postgres:SenhaSupabase@db.xxxxx.supabase.co:5432/postgres" < creeser_mvp_dump.sql

# 4. Validar dados
psql "postgresql://postgres:SenhaSupabase@db.xxxxx.supabase.co:5432/postgres" << EOF
SELECT COUNT(*) FROM usuario;
SELECT COUNT(*) FROM empresa;
SELECT COUNT(*) FROM aluno;
EOF
```

- [ ] Dump baixado
- [ ] Restauração concluída sem erros
- [ ] Contagem de registros validada
- [ ] Comparar com stats do VPS (1.2)

### 3.2 Opção B: Migração Incremental (Para >1GB ou com downtime mínimo)

```bash
# 1. Criar tabela de controle de migração
psql "postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres" << EOF
CREATE TABLE migration_log (
  id SERIAL PRIMARY KEY,
  tabela TEXT,
  status TEXT, -- 'pendente', 'em_progresso', 'concluido', 'validado'
  registros_migrados INT,
  data_inicio TIMESTAMP,
  data_fim TIMESTAMP
);
EOF

# 2. Exportar tabelas por tamanho (maiores primeiro)
pg_dump -h localhost -U creeser_user -d creeser_mvp \
  --table=empresa > empresa.sql

pg_dump -h localhost -U creeser_user -d creeser_mvp \
  --table=usuario > usuario.sql

# 3. Restaurar em estágios
psql "postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres" < empresa.sql
# validar
psql "postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres" < usuario.sql
# validar

# 4. Marcar progresso
psql "postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres" << EOF
INSERT INTO migration_log (tabela, status, registros_migrados, data_inicio, data_fim)
VALUES ('empresa', 'validado', (SELECT COUNT(*) FROM empresa), NOW(), NOW());
EOF
```

- [ ] Tabelas maiores migradas primeiro
- [ ] Validações feitas após cada tabela
- [ ] Log de migração preenchido

### 3.3 Validação Completa de Dados

```bash
# Comparar contagem de registros VPS vs Supabase
psql -h localhost -U creeser_user -d creeser_mvp << EOF > /tmp/vps_counts.txt
SELECT tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY tablename;
EOF

psql "postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres" << EOF > /tmp/supabase_counts.txt
SELECT tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY tablename;
EOF

# Comparar (devem ser idênticas)
diff /tmp/vps_counts.txt /tmp/supabase_counts.txt
```

- [ ] Contagens de registros idênticas
- [ ] Amostra de dados verificada manualmente
- [ ] IDs e relacionamentos intactos
- [ ] Índices recriados (se necessário)

---

## Fase 4: Atualizar Aplicação para Supabase

### 4.1 Backend - Mudar DATABASE_URL

**Arquivo**: `.env` (em VPS ou ambiente de produção)

```bash
# ANTES (VPS PostgreSQL)
DATABASE_URL="postgresql://creeser_user:senha@localhost:5432/creeser_mvp"

# DEPOIS (Supabase)
DATABASE_URL="postgresql://postgres:SenhaSupabase@db.xxxxx.supabase.co:5432/postgres"

# Resto permanece igual
PORT=3001
NODE_ENV="production"
JWT_SECRET="..."
```

- [ ] .env atualizado
- [ ] DATABASE_URL testado: `psql $DATABASE_URL -c "SELECT 1"`

### 4.2 Verificar Schema Prisma

```bash
# Gerar Prisma schema a partir do novo banco
cd ~/projects/creeser-backend

# Fazer backup do schema.prisma atual
cp prisma/schema.prisma prisma/schema.prisma.vps.backup

# Introspect do Supabase
npx prisma db pull

# Comparar com original
diff prisma/schema.prisma.vps.backup prisma/schema.prisma
```

- [ ] Schema Prisma gerado corretamente
- [ ] Diferenças (se houver) documentadas
- [ ] Gerar novo cliente Prisma: `npx prisma generate`

### 4.3 Testar Conexão

```bash
# No backend, testar conexão
cd ~/projects/creeser-backend

# Parar app atual
pm2 stop creeser-api

# Atualizar .env
nano .env
# Colar novo DATABASE_URL

# Testar startup
npm start

# Deve conectar sem erros
# Ctrl+C para parar
```

- [ ] Aplicação conecta ao banco Supabase
- [ ] Sem erros de conexão
- [ ] Queries funcionam

### 4.4 Reiniciar PM2

```bash
# Voltar a rodar com PM2
pm2 start ecosystem.config.js

# Ou se já existia
pm2 reload creeser-api

# Verificar
pm2 logs creeser-api
# Deve mostrar logs normais de execução
```

- [ ] PM2 iniciado com sucesso
- [ ] Status "online": `pm2 list`
- [ ] Logs sem erros de conexão

---

## Fase 5: Testes Pós-Migração

### 5.1 Testes Funcionais Básicos

```bash
# Health check
curl http://seu-ip-vps:3001/health
# Response: {"status":"ok"}

# Login
curl -X POST http://seu-ip-vps:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"senha"}'
# Response: token JWT + refreshToken
```

- [ ] Health check retorna 200
- [ ] Login funciona
- [ ] Token JWT é gerado

### 5.2 Testes de Isolação (CRÍTICO!)

```bash
# Usar GUIA_TESTES_MULTITENANT.md
# Testar isolação entre empresas
# Testar que Company 1 não vê dados de Company 2
# Testar rate limiting ainda funciona
```

- [ ] Isolação multi-tenant mantida
- [ ] Rate limiting funcionando
- [ ] Logs sendo gravados

### 5.3 Testes de Performance

```bash
# Comparar tempo de resposta VPS vs Supabase
curl -w "\n%{time_total}s\n" -o /dev/null -s \
  -H "Authorization: Bearer SEU_TOKEN" \
  http://seu-ip-vps:3001/api/usuarios

# Deve ser comparável ao VPS (talvez mesmo mais rápido!)
```

- [ ] Performance aceitável (< 500ms para queries simples)
- [ ] Sem latência excessiva
- [ ] Escalamento automático do Supabase funcionando

---

## Fase 6: Finalização VPS

### 6.1 Parar VPS PostgreSQL (opcional)

**SÓ fazer se tiver 100% certeza que tudo funciona no Supabase!**

```bash
# Desabilitar auto-start do PostgreSQL
sudo systemctl disable postgresql

# Parar serviço
sudo systemctl stop postgresql

# Verificar que parou
sudo systemctl status postgresql
```

- [ ] Decidido: manter VPS PostgreSQL ou parar?
- [ ] Se parar: PostgreSQL desabilitado
- [ ] Se parar: Backup final em mãos

### 6.2 Manter Backup Final VPS

```bash
# Guardar dump final por segurança (indefinidamente)
ls -lh ~/creeser_mvp_dump_final.sql

# Talvez fazer backup para cloud storage
# Ex: AWS S3, Google Cloud Storage, Azure Blob
# scp ~/creeser_mvp_dump_final.sql seu-cloud-storage:/backups/
```

- [ ] Backup final guardado
- [ ] Documentação de restauração salva
- [ ] Acesso ao backup documentado

### 6.3 Atualizar Documentação

**Arquivo**: `AMBIENTE_PRODUCAO_SUPABASE.md` (criar novo)

```markdown
# Ambiente de Produção - Supabase

## Database
- Host: db.xxxxx.supabase.co
- Database: postgres
- User: postgres

## Backup
- Supabase faz backup automático diário
- Retenção: 30 dias

## Disaster Recovery
- Dump final salvo em: ~/creeser_mvp_dump_final.sql
- Restauração: psql $DATABASE_URL < dump.sql

## Monitoramento
- URL: https://app.supabase.com/
- Alertas configurados? [sim/não]
```

- [ ] Documentação atualizada
- [ ] Credenciais documentadas (seguro!)
- [ ] Processo de restauração documentado

---

## Fase 7: Checklist Final

### Tudo Funcionando?

- [ ] **Backend**
  - [ ] Conecta a Supabase
  - [ ] PM2 rodando com "online" status
  - [ ] Sem erros em logs

- [ ] **Database**
  - [ ] Dados migrados completamente
  - [ ] Contagem de registros validada
  - [ ] Índices funcionando

- [ ] **Aplicação**
  - [ ] Health check passa
  - [ ] Login funciona
  - [ ] Isolação multi-tenant mantida
  - [ ] Rate limiting ativo

- [ ] **Backups**
  - [ ] Supabase backup automático ativo
  - [ ] Dump VPS guardado
  - [ ] Restauração testada (em banco de teste)

- [ ] **Documentação**
  - [ ] Credenciais anotadas
  - [ ] Processo de restauração documentado
  - [ ] Contatos de suporte anotados

---

## Fase 8: Rollback Plan (Se Algo Errar)

**SE descobrir problema em Supabase depois de migrar**:

```bash
# 1. Parar backend
pm2 stop creeser-api

# 2. Voltar DATABASE_URL para VPS
nano .env
# DATABASE_URL="postgresql://creeser_user:senha@localhost:5432/creeser_mvp"

# 3. Garantir PostgreSQL VPS está rodando
sudo systemctl start postgresql

# 4. Reiniciar backend
pm2 start creeser-api

# 5. Testar
curl http://localhost:3001/health
```

- [ ] Plano de rollback documentado
- [ ] Todos sabem como executar
- [ ] .env.vps backup salvo para fácil reverter

---

## Próximas Etapas Após Supabase

1. **Escalabilidade**: Agora Supabase cuida de database scaling
2. **Frontend**: Atualizar `.env.local` com novo API_URL (se hospedagem mudou)
3. **Monitoramento**: Configurar alertas do Supabase
4. **Otimização**: Ajustar RLS policies conforme necessário

---

## Contatos / Referências

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Prisma + Supabase: https://www.prisma.io/docs/guides/databases/postgresql

---

**Migração completa!** 

Agora MVP está em Supabase gerenciado, sem preocupação com database DevOps. 🚀

---

**Checklist de Conclusão**:
- [ ] MVP validado em VPS
- [ ] Supabase account criado
- [ ] Dados migrados
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] Rollback plan testado
- [ ] Time informado

**Status**: Pronto para migração ✓
