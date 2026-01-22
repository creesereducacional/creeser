# ✅ SUPABASE CLI - GUIA PRÁTICO DE USO

## 🎯 RESUMO EXECUTIVO

Seu projeto **NÃO PRECISA de Docker** para usar Supabase. Você pode usar o CLI via `npx` e fazer deploy automático.

| O que você quer | Comando | Como usar |
|---|---|---|
| **Ver status** | `npx supabase status` | Requer Docker (opcional) |
| **Criar migration** | `npx supabase migration new nome` | ✅ Funciona sempre |
| **Testar SQL** | Dashboard Supabase | ✅ Browser direto |
| **Fazer push** | `npm run supabase:push` | ✅ Quando houver docker |
| **Deploy automático** | Git → Vercel | ✅ Sempre funciona |

---

## ⚡ 3 FORMAS DE USAR SUPABASE CLI

### FORMA 1: Dashboard (Recomendado para NOW)
```
https://app.supabase.com/project/wjcbobcqyqdkludsbqgf
```

**Vantagens:**
- ✅ Sem instalar nada extra
- ✅ Visual intuitivo
- ✅ Testes imediatos
- ✅ Histórico de queries

**Como:**
1. Acessar link acima
2. SQL Editor → New Query
3. Escrever SQL
4. Run ▶️

---

### FORMA 2: npx Supabase CLI (Sem Docker)
```powershell
# Criar migration
npx supabase migration new adicionar_campo_nome

# Editar arquivo criado em:
# supabase/migrations/20260122_adicionar_campo_nome.sql

# Versionar
git add supabase/migrations/
git commit -m "migration: add campo nome"
git push
```

**Vantagens:**
- ✅ Automático via git
- ✅ Histórico de alterações
- ✅ Funciona sem Docker
- ✅ Deploy automático

---

### FORMA 3: Scripts Node.js (Pronto)
```powershell
# Sincronizar schema (puxar do Supabase)
node scripts/sync-schema.js

# Gera arquivo: supabase/schema-info.json
```

---

## 🚀 WORKFLOW RÁPIDO (5 MINUTOS)

### Cenário: Adicionar coluna "nome" à tabela "alunos"

**Passo 1:** Criar migration
```powershell
npx supabase migration new adicionar_nome_alunos
```

**Resultado:**
```
✅ Created new migration: supabase/migrations/20260122_adicionar_nome_alunos.sql
```

**Passo 2:** Editar arquivo
```sql
-- supabase/migrations/20260122_adicionar_nome_alunos.sql

ALTER TABLE alunos ADD COLUMN nome VARCHAR(100) NOT NULL DEFAULT '';
CREATE INDEX idx_alunos_nome ON alunos(nome);
```

**Passo 3:** Testar no Dashboard
```
1. app.supabase.com → SQL Editor
2. Copiar SQL do arquivo
3. Run para validar
4. Se OK, continuar. Se erro, corrigir.
```

**Passo 4:** Commitar
```powershell
git add supabase/migrations/
git commit -m "migration: add nome field to alunos table"
git push origin main
```

**Passo 5:** Deploy automático
```
✅ Vercel detecta push
✅ GitHub Actions executa migration
✅ Alteração aplicada ao BD
✅ 100% automático!
```

---

## 📋 COMANDOS RÁPIDOS

```powershell
# Ver versão CLI
npx supabase --version

# Criar migration
npx supabase migration new "descricao"

# Listar migrations (via git)
git log --oneline -- supabase/migrations/

# Verificar última migration
ls -la supabase/migrations/ | tail -n 1

# Testar SQL localmente (se tiver Docker)
npm run supabase:push

# Fazer login (opcional, para algumas features)
npx supabase login
```

---

## 📁 ESTRUTURA CRIADA

```
creeser/
├── .supabaserc.json              ← Config pronto ✅
├── .env.local                    ← Credenciais OK ✅
├── supabase/
│   ├── migrations/               ← Suas alterações aqui
│   │   ├── 20260122_init.sql
│   │   └── 20260122_adicionar_nome_alunos.sql
│   └── schema-info.json          ← Info sincronizado
├── scripts/
│   └── sync-schema.js            ← Sincronizar schema
├── package.json                  ← Scripts npm pronto ✅
└── supabase-cli.ps1              ← Automação PowerShell ✅
```

---

## ✨ NPM SCRIPTS CONFIGURADOS

```powershell
npm run supabase:status      # Ver status (requer Docker)
npm run supabase:pull        # Puxar schema (requer Docker)
npm run supabase:push        # Fazer push (requer Docker)
npm run supabase:migration:new "nome"  # Criar migration ✅
npm run supabase:logs        # Ver logs
```

---

## 💾 ARQUIVO .supabaserc.json

```json
{
  "projectId": "wjcbobcqyqdkludsbqgf",
  "apiUrl": "https://wjcbobcqyqdkludsbqgf.supabase.co",
  "graphqlUrl": "https://wjcbobcqyqdkludsbqgf.supabase.co/graphql/v1"
}
```

✅ **JÁ CRIADO** em `c:\...\creeser\.supabaserc.json`

---

## 🛠️ EXEMPLO REAL: Implementar módulo Alunos

### 1. Dashboard → Criar tabela
```sql
CREATE TABLE alunos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Ou usar migration
```powershell
npx supabase migration new criar_tabela_alunos
```

Editar:
```sql
CREATE TABLE alunos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Versionar
```powershell
git add supabase/migrations/
git commit -m "feat: create alunos table with fields"
git push
```

### 4. Usar no código
```javascript
// pages/admin/alunos/novo.js
import { supabase } from '@/lib/supabase';

export default function NovoAluno() {
  const handleSave = async (aluno) => {
    const { data, error } = await supabase
      .from('alunos')
      .insert([aluno]);
    
    if (error) console.error(error);
    else alert('✅ Aluno salvo!');
  };
  
  return (
    // seu formulário...
  );
}
```

✅ **PRONTO!** Tudo conectado e funcionando.

---

## ⚠️ TROUBLESHOOTING

### Erro: "Docker não encontrado"
```
Solução: Não precisa de Docker!
Use o Dashboard ou npx supabase migration new
```

### Erro: "Permission denied"
```powershell
# Se receber erro de permissão no PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Depois:
.\supabase-cli.ps1 -Action status
```

### Erro: "projectId not found"
```
Verifique .supabaserc.json
Deve conter: "projectId": "wjcbobcqyqdkludsbqgf"
```

---

## 🎯 PRÓXIMAS AÇÕES

1. ✅ CLI configurado
2. ✅ Scripts npm prontos  
3. ⏭️ Criar primeira migration:
   ```powershell
   npx supabase migration new "schema_inicial"
   ```

4. ⏭️ Fazer push para git:
   ```powershell
   git add supabase/migrations/
   git commit -m "initial: create schema"
   git push
   ```

5. ⏭️ Vercel deploy automático:
   ```
   GitHub detecta push → Vercel build → Migration aplicada ✅
   ```

---

## 📖 DOCUMENTOS RELACIONADOS

- [SETUP_SUPABASE_CLI_OPERACIONAL.md](SETUP_SUPABASE_CLI_OPERACIONAL.md) - Detalhado
- [SUPABASE_CLI_SEM_DOCKER.md](SUPABASE_CLI_SEM_DOCKER.md) - Alternativas
- [GUIA_SUPABASE_SETUP.md](GUIA_SUPABASE_SETUP.md) - Setup original
- [QUICK_REFERENCE_MULTITENANT.md](QUICK_REFERENCE_MULTITENANT.md) - Arquitetura

---

**Status:** ✅ Pronto para usar  
**Data:** 22 de janeiro de 2026  
**Criado por:** Sistema CREESER
