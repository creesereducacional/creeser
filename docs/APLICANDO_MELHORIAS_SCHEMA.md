# Aplicando Melhorias do Schema - Guia Prático

**Data**: 27 de dezembro de 2025  
**Versão Prisma**: 6.16.1  
**Status**: Pronto para aplicar em produção

---

## 📋 Resumo das Mudanças

### ✅ Adicionado a Todos os Modelos
- `deletedAt: DateTime?` - Soft delete para auditoria
- `@@index([deletedAt])` - Índice para queries de registros ativos

### ✅ Adicionado a Empresa
- `logoUrl: String?` - URL alternativa para logo
- `corPrimaria: String` - Cor tema da empresa
- `timeZone: String` - Fuso horário (padrão: America/Sao_Paulo)
- `planoPagamento: String?` - Tipo de plano (gratis/pro/enterprise)
- `limiteUsuarios: Int?` - Limite de usuários (null = ilimitado)

### ✅ Adicionado a Usuario
- `emailVerificado: Boolean` - Flag de verificação de email
- `telefoneVerificado: Boolean` - Flag de verificação de telefone
- `autenticacao2FA: Boolean` - Flag de autenticação 2FA ativada
- Índices compostos: `[empresaId, tipo]` e `[empresaId, ativo]`

### ✅ Adicionado a Nota
- Índices compostos para queries de boletim: `[empresaId, alunoId, turmaId]`
- Índice para avaliações: `[disciplinaId, avaliacaoId]`

### ✅ Adicionado a AuditoriaLog
- `versao: Int` - Rastreia versão da mudança
- `@@index([tabela, registroId])` - Histórico de um registro específico
- Foreign key para `Empresa` (relação direta para melhor query)

---

## 🚀 Como Aplicar (Passo-a-Passo)

### OPÇÃO A: Deixar Prisma Gerar Migration Automaticamente (RECOMENDADO)

```bash
# 1. Na sua máquina local, copiar o schema.prisma.improved para prisma/schema.prisma
cp prisma/schema.prisma.improved prisma/schema.prisma

# 2. Gerar migration automaticamente
npx prisma migrate dev --name improve_schema

# Responde: sim (ou 'y') se perguntar sobre deletar dados
# Prisma vai:
# - Criar arquivo em prisma/migrations/20250127_improve_schema/
# - Gerar SQL automático
# - Aplicar no banco local de dev

# 3. Verificar migration criada
ls -la prisma/migrations/
cat prisma/migrations/20250127_improve_schema/migration.sql

# 4. Commit e push
git add prisma/
git commit -m "feat: improve schema with soft deletes, indexes, and new fields"
git push origin main
```

### OPÇÃO B: Aplicar SQL Manualmente (Se preferir mais controle)

```bash
# 1. Na VPS, conectar ao PostgreSQL
psql -h localhost -U creeser_user -d creeser_mvp

# 2. Copiar o conteúdo de migration_improve_schema.sql
# E colar no psql, ou:
psql -h localhost -U creeser_user -d creeser_mvp < migration_improve_schema.sql

# 3. Verificar que tudo foi criado
\d usuario          # Ver colunas da tabela usuario
\di                 # Listar índices
```

### OPÇÃO C: Via Prisma na VPS (Recomendado para Produção)

```bash
# Na VPS
cd ~/projects/creeser-backend

# 1. Garantir que tem versão mais recente do schema
git pull origin main

# 2. Aplicar migration
npx prisma migrate deploy

# Mostra tudo que vai aplicar

# 3. Gerar cliente Prisma atualizado
npx prisma generate

# 4. Testar que banco funciona
npx prisma db execute --stdin << EOF
SELECT COUNT(*) FROM "Empresa";
SELECT COUNT(*) FROM "Usuario";
EOF

# 5. Restart do backend
pm2 restart creeser-api
```

---

## 📊 Verificação Pós-Aplicação

### Validar que tudo foi criado

```sql
-- Conectar ao banco
psql -h localhost -U creeser_user -d creeser_mvp

-- Verificar colunas em Empresa
\d "Empresa"
-- Deve mostrar: logoUrl, corPrimaria, timeZone, planoPagamento, limiteUsuarios, deletedAt

-- Verificar colunas em Usuario
\d "Usuario"
-- Deve mostrar: emailVerificado, telefoneVerificado, autenticacao2FA, deletedAt

-- Verificar índices
\di
-- Deve mostrar novos índices: Usuario_empresaId_tipo_idx, Nota_empresaId_alunoId_turmaId_idx, etc

-- Listar migrations aplicadas
SELECT * FROM "_prisma_migrations" ORDER BY "finishedAt" DESC;
```

### Testar aplicação

```bash
# Na VPS
pm2 logs creeser-api | head -20

# Deve mostrar: ✓ Conectado ao PostgreSQL
# Sem erros de schema

# Testar health check
curl http://localhost:3001/health
# { "status": "ok" }

# Testar login (se houver usuário admin)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"senha"}'
```

---

## ⚠️ Importante: Código que Precisa Ser Atualizado

Após aplicar migration, atualizar seu código para usar novos campos/soft deletes:

### 1. Queries Deve Incluir `deletedAt IS NULL`

**ANTES** (retorna registros deletados):
```javascript
const usuarios = await prisma.usuario.findMany({
  where: { empresaId }
});
```

**DEPOIS** (apenas ativos):
```javascript
const usuarios = await prisma.usuario.findMany({
  where: { 
    empresaId,
    deletedAt: null  // ← ADICIONAR
  }
});
```

### 2. Soft Delete (não usar `.delete()`, usar `.update()`)

**ANTES** (deletava do banco):
```javascript
await prisma.usuario.delete({ where: { id } });
```

**DEPOIS** (marca como deletado):
```javascript
await prisma.usuario.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

### 3. Usar Novos Índices em Queries

```javascript
// Query que se beneficia de novo índice
const usuarios = await prisma.usuario.findMany({
  where: { 
    empresaId,
    tipo: 'professor',
    deletedAt: null
  }
  // ← Usa índice: Usuario_empresaId_tipo_idx + deletedAt_idx
});

// Query para boletim (beneficia do novo índice composto)
const notas = await prisma.nota.findMany({
  where: { 
    empresaId,
    alunoId,
    turmaId
  }
  // ← Usa índice: Nota_empresaId_alunoId_turmaId_idx
});
```

### 4. Aproveitar Novos Campos de Empresa

```javascript
// Ao criar empresa
const empresa = await prisma.empresa.create({
  data: {
    nome: "CREESER",
    cnpj: "123456789012345",
    email: "contato@creeser.com",
    corPrimaria: "#ff6b00",      // ← Cor tema
    timeZone: "America/Sao_Paulo", // ← Fuso
    planoPagamento: "pro",        // ← Plano
    limiteUsuarios: 100           // ← Limite
  }
});
```

### 5. Validar Email/Telefone 2FA

```javascript
// Ao fazer login
const usuario = await prisma.usuario.findUnique({
  where: { email }
});

if (!usuario.emailVerificado) {
  // Requerer verificação de email antes de continuar
  return res.status(403).json({ erro: "Email não verificado" });
}

if (usuario.autenticacao2FA) {
  // Requerer código 2FA
  return res.status(403).json({ erro: "2FA requerido" });
}
```

---

## 📚 Arquivos Criados

1. **`prisma/schema.prisma.improved`** - Schema.prisma atualizado
2. **`migration_improve_schema.sql`** - SQL puro da migration (reference)
3. **`APLICANDO_MELHORIAS_SCHEMA.md`** - Este arquivo (instruções)

---

## ✅ Checklist Final

- [ ] Leu este documento completamente
- [ ] Escolheu OPÇÃO A, B ou C acima
- [ ] Aplicou a migration na sua máquina (dev) ou VPS
- [ ] Executou validação pós-aplicação (SQL queries)
- [ ] Testou que aplicação iniciou sem erros
- [ ] Atualizou seu código para usar `deletedAt` em queries
- [ ] Atualizou seu código para soft delete (`.update()` ao invés de `.delete()`)
- [ ] Fez commit das mudanças no código
- [ ] Testou novamente em produção

---

## 🆘 Troubleshooting

### Erro: "Migration conflict" ou "multiple migration branches"

```bash
# Verificar status das migrations
npx prisma migrate status

# Se houver conflito:
npx prisma migrate resolve --rolled-back 20250127_improve_schema
npx prisma migrate deploy
```

### Erro: "Foreign key constraint fails"

Pode ser que haja registros antigos criados manualmente. Ignorar por agora, é apenas para AuditoriaLog:

```bash
# Verificar registros em AuditoriaLog sem empresaId
SELECT * FROM "AuditoriaLog" WHERE "empresaId" IS NULL;

# Se houver, deletar (dados de teste)
DELETE FROM "AuditoriaLog" WHERE "empresaId" IS NULL;

# Depois retentar
npx prisma migrate deploy
```

### Erro: "Prisma client out of sync"

```bash
# Regenerar cliente Prisma
npx prisma generate

# Restart aplicação
pm2 restart creeser-api
```

---

## 📞 Próximos Passos

1. **Aplicar migration** (escolher opção A, B ou C acima)
2. **Atualizar código** (usar `deletedAt` em queries, soft delete em deletions)
3. **Testar em dev** (antes de produção)
4. **Deploy em produção** (quando validado)

---

**Status**: ✅ Pronto para aplicar!

Quando terminar, me avisa o status e qualquer erro que encontrar.
