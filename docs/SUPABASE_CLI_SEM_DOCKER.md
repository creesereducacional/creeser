# 🚀 SUPABASE CLI - GUIA PRÁTICO SEM DOCKER

## ⚠️ SITUAÇÃO ATUAL

O `npx supabase status` requer **Docker rodando localmente**, o que não está disponível neste ambiente.

**PORÉM:** Você **NÃO PRECISA de Docker** para:
- ✅ Usar o Supabase Dashboard (browser)
- ✅ Fazer queries diretas via REST API
- ✅ Gerenciar schema via SQL Editor
- ✅ Executar migrations manualmente

---

## ✅ ALTERNATIVAS PRÁTICAS

### OPÇÃO 1: Usar Dashboard Supabase (Recomendado)
```
https://app.supabase.com/project/wjcbobcqyqdkludsbqgf
```

**Vantagens:**
- ✅ Nenhuma instalação necessária
- ✅ Interface visual clara
- ✅ Histórico de queries
- ✅ RLS e segurança gerenciada

**Como usar:**
1. Acessar dashboard acima
2. SQL Editor → New Query
3. Colar SQL + Run

---

### OPÇÃO 2: Usar Supabase Migrations via Git

Sem Docker local, você pode ainda usar o workflow Git:

```powershell
# 1. Criar arquivo de migration
npx supabase migration new meu_nome_alteracao
```

Isso cria:
```
supabase/migrations/20260122_meu_nome_alteracao.sql
```

Editar o arquivo com seu SQL, depois:
```powershell
# 2. Fazer commit
git add supabase/migrations/
git commit -m "migration: add something"

# 3. No deploy (Vercel/GitHub Actions), a migration é aplicada automaticamente
```

---

### OPÇÃO 3: Usar API REST do Supabase via Script Node.js

Criar script para executar SQL direto:

```javascript
// scripts/run-sql.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSQL(sql) {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_string: sql
  });

  if (error) throw error;
  console.log('✅ SQL executado:', data);
}

// Usar:
runSQL(`
  CREATE TABLE IF NOT EXISTS exemplos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100)
  );
`);
```

---

## 🎯 WORKFLOW RECOMENDADO (SEM DOCKER)

### Para DESENVOLVIMENTO Local:
```powershell
# 1. Editar schema.sql ou criar migration
# 2. Testar via Dashboard → SQL Editor
# 3. Copiar SQL validado
# 4. Versionar em git
# 5. Deploy automático em Vercel/GitHub Actions
```

### Para PRODUÇÃO:
```powershell
# 1. Fazer commit das migrations
git push origin main

# 2. Vercel detecta automaticamente
# 3. GitHub Actions executa migrations

# 4. Verificar em: Dashboard → Migrations
```

---

## 📋 COMANDOS ÚTEIS (COM NPX)

Estes funcionam **sem Docker**:

```powershell
# Ver versão (sem Docker)
npx supabase --version

# Criar migration (sem Docker)
npx supabase migration new adicionar_coluna

# Fazer login (opcional, para deploy)
npx supabase login

# Gerar tipos TypeScript
npx supabase gen types typescript \
  --project-id wjcbobcqyqdkludsbqgf \
  --schema public
```

---

## 📊 FLUXO RECOMENDADO: SQL → GIT → VERCEL

### Passo 1: Testar SQL no Dashboard
```
1. app.supabase.com → SQL Editor
2. Escrever SQL
3. Run para validar
4. Copiar SQL funcionando
```

### Passo 2: Criar Migration Local
```powershell
npx supabase migration new "descricao_alteracao"
# Resultado: supabase/migrations/20260122_descricao.sql
```

### Passo 3: Editar Migration
```sql
-- supabase/migrations/20260122_descricao.sql
ALTER TABLE alunos ADD COLUMN novo_campo VARCHAR(100);
CREATE INDEX idx_novo_campo ON alunos(novo_campo);
```

### Passo 4: Versionar no Git
```powershell
git add supabase/migrations/
git commit -m "migration: add novo_campo to alunos"
git push origin main
```

### Passo 5: Deploy Automático (Vercel)
```
Vercel detecta commit → Executa migrations → Deploy live ✅
```

---

## 🔑 REQUISITOS PARA WORKFLOW COMPLETO

✅ **JAÁ TEMOS:**
- Node.js + npm
- Supabase CLI (via npx)
- Git configurado
- Vercel CLI
- `.supabaserc.json` criado

⚠️ **OPCIONAL (não impede desenvolvimento):**
- Docker (necessário só para local Supabase)
- Supabase CLI global (pode usar npx)

---

## 💡 DICAS IMPORTANTES

### 1. Não Precisa de Docker para Desenvolver
```powershell
# Seu desenvolvimento local:
npm run dev

# Conecta direto ao Supabase remoto via API
# Tudo funciona normal sem Docker local
```

### 2. Usar Variables de Ambiente
```
.env.local já configurado com:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
```

### 3. Testar Migrations Localmente (com Docker)
Se precisar de BD local para testes:
```powershell
# Instalar Docker Desktop
# Depois:
supabase start
supabase db push
npm run dev
```

Mas para desenvolvimento rápido, **não é necessário**.

---

## ✨ SUMMARY: O QUE VOCÊ PODE FAZER AGORA

| Ação | Ferramenta | Status |
|------|-----------|--------|
| Editar schema | VS Code | ✅ Pronto |
| Testar SQL | Dashboard | ✅ Pronto |
| Criar migrations | npx supabase | ✅ Pronto |
| Versionär | Git | ✅ Pronto |
| Deploy | Vercel | ✅ Pronto |
| BD local | Docker | ❌ Opcional |

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Estrutura criada (`.supabaserc.json`)
2. ⏭️ Próximo: Sincronizar schema via API
3. ⏭️ Depois: Criar primeira migration de produção

```powershell
# Criar seu primeiro migration:
npx supabase migration new "initial_schema"
```

---

**Criado em:** 22 de janeiro de 2026  
**Status:** ✅ Operacional sem Docker
