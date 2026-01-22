# 🚀 SUPABASE CLI - SETUP AUTOMÁTICO

## ✅ STATUS ATUAL

- **Supabase CLI**: ✅ Disponível via `npx`
- **Versão**: 2.70.5 (atualização disponível: 2.72.7)
- **Projeto ID**: `wjcbobcqyqdkludsbqgf`
- **Configuração**: `.supabaserc.json` criado ✅

---

## 🔑 COMO USAR O CLI SEM INSTALAÇÃO GLOBAL

Todos os comandos Supabase podem ser executados via **npx**:

```powershell
npx supabase [comando]
```

---

## 📋 COMANDOS PRINCIPAIS

### 1️⃣ **STATUS DO PROJETO**
```powershell
npx supabase status
```

Mostra:
- ✅ Conexão com Supabase
- 📊 Schema version
- 🔄 Migrations aplicadas
- 📁 Tabelas e funções

---

### 2️⃣ **SINCRONIZAR SCHEMA (Pull)**
```powershell
npx supabase db pull
```

**O que faz:**
- 📥 Baixa schema remoto do Supabase
- 💾 Salva em `supabase/migrations/` localmente
- 🔄 Atualiza `supabase/schema.sql`

**Resultado esperado:**
```
✓ Pulled schema with 12 migrations
✓ Schema file updated at ./supabase/schema.sql
```

---

### 3️⃣ **FAZER PUSH DO SCHEMA**
```powershell
npx supabase db push
```

**O que faz:**
- 📤 Envia migrations locais para Supabase
- 🔄 Aplica novas alterações ao BD
- ✅ Atualiza schema remoto

**Antes de usar:**
```powershell
# 1. Fazer alterações no schema.sql
# 2. Criar migration:
npx supabase migration new nome_da_alteracao

# 3. Editar arquivo em supabase/migrations/
# 4. Fazer push
npx supabase db push
```

---

### 4️⃣ **CRIAR NOVA MIGRATION**
```powershell
npx supabase migration new adicionar_coluna_usuarios
```

Cria arquivo:
```
supabase/migrations/20260122111500_adicionar_coluna_usuarios.sql
```

---

### 5️⃣ **VER HISTÓRICO DE MIGRATIONS**
```powershell
npx supabase migration list
```

Mostra todas as migrações aplicadas com timestamps.

---

## 🔐 AUTENTICAÇÃO (Opcional - Para Produção)

Se precisar fazer login (para fazer deploy em produção):

```powershell
npx supabase login
```

Abrirá navegador para autenticar. Será criado arquivo:
```
~/.supabase/access-token
```

---

## 📁 ESTRUTURA CRIADA

```
creeser/
├── .supabaserc.json          ← Config do projeto ✅
├── supabase/
│   ├── schema.sql            ← Schema completo
│   ├── migrations/           ← Histórico de alterações
│   │   ├── 20250101_init.sql
│   │   ├── 20250115_add_users.sql
│   │   └── ...
│   └── functions/            ← Functions PostgreSQL
└── ...
```

---

## ⚡ WORKFLOW PRÁTICO

### Cenário 1: PUXAR SCHEMA DO SUPABASE (Primeira vez)
```powershell
# 1. Verificar status
npx supabase status

# 2. Puxar schema remoto
npx supabase db pull

# 3. Confirmar que tudo está sincronizado
git status
git add supabase/
git commit -m "sync: pull schema from Supabase"
```

### Cenário 2: FAZER ALTERAÇÃO LOCAL E ENVIAR PARA SUPABASE
```powershell
# 1. Criar nova migration
npx supabase migration new adicionar_campo_notas

# 2. Editar arquivo criado em supabase/migrations/
# Adicionar seu SQL:
# ALTER TABLE alunos ADD COLUMN notas_finais FLOAT;

# 3. Fazer push para Supabase
npx supabase db push

# 4. Commitar
git add supabase/
git commit -m "feat: add notas_finais field to alunos"
```

### Cenário 3: RESOLVER CONFLITO DE SCHEMA
```powershell
# Se o schema local difere do remoto:

# 1. Puxar versão remota
npx supabase db pull

# 2. Verificar diferenças
git diff supabase/

# 3. Se tudo OK, commitar
git add supabase/
git commit -m "sync: resolve schema conflict"

# 4. Se precisar sobrescrever remoto:
npx supabase db push --force
```

---

## 🛠️ ADICIONAR AOS SCRIPTS DO package.json

Para facilitar, já temos scripts configurados:

```json
{
  "scripts": {
    "supabase:link": "supabase link --project-ref wjcbobcqyqdkludsbqgf",
    "supabase:push": "supabase db push",
    "supabase:pull": "supabase db pull",
    "supabase:status": "supabase status",
    "supabase:logs": "supabase functions get-jwt"
  }
}
```

**Usar assim:**
```powershell
npm run supabase:status
npm run supabase:pull
npm run supabase:push
```

---

## 🚨 ERROS COMUNS & SOLUÇÕES

### ❌ "Erro: Não consegue conectar a Supabase"
```powershell
# Solução: Verificar .supabaserc.json
cat .supabaserc.json
# Deve conter: projectId, apiUrl, graphqlUrl
```

### ❌ "Migration failed"
```powershell
# Solução: Verificar syntax do SQL
# Abrir arquivo em: supabase/migrations/
# Testar SQL no Supabase Dashboard → SQL Editor

# Se estiver muito errado, reverter:
npx supabase db reset
```

### ❌ "Access token not provided"
```powershell
# Solução para dev: não precisa fazer login
# A configuração em .supabaserc.json é suficiente

# Se mesmo assim der erro, fazer login:
npx supabase login
```

---

## 📊 COMANDOS AVANÇADOS

### Ver logs do Supabase
```powershell
npx supabase functions get-jwt
```

### Executar função local
```powershell
npx supabase functions serve
```

### Gerar client TypeScript
```powershell
npx supabase gen types typescript --project-id wjcbobcqyqdkludsbqgf
```

---

## ✨ RESUMO RÁPIDO

| Ação | Comando |
|------|---------|
| Ver status | `npx supabase status` |
| Puxar schema | `npx supabase db pull` |
| Fazer push | `npx supabase db push` |
| Criar migration | `npx supabase migration new nome` |
| Ver migrations | `npx supabase migration list` |
| Resetar BD | `npx supabase db reset` |

---

## 🎯 PRÓXIMO PASSO

1. ✅ Supabase CLI configurado
2. ⏳ Próximo: Fazer `npm run supabase:pull` para sincronizar schema
3. ⏳ Depois: Aplicar SQL de alunos se não estiver sincronizado

```powershell
cd "c:\BACKUP\DESENVOLVIMENTO\CREESER EDUCACIONAL\creeser"
npm run supabase:pull
```

---

**Data**: 22 de janeiro de 2026  
**Status**: ✅ CLI Pronto para uso
