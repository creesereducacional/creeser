# ⚡ QUICK COMMANDS - REFERÊNCIA RÁPIDA

**Para consultar quando precisar de um comando rapidamente**

---

## 🚀 INICIAR PROJETO

```powershell
cd "c:\BACKUP\DESENVOLVIMENTO\CREESER EDUCACIONAL\creeser"
npm run dev
```
**Resultado:** http://localhost:3000 rodando ✅

---

## 📝 CRIAR/MODIFICAR BANCO DE DADOS

### Criar Migration (Quando precisar alterar BD)
```powershell
npx supabase migration new "descricao_bem_clara"
```
**Cria:** `supabase/migrations/20260122HHMMSS_descricao.sql`  
**Próximo:** Editar o arquivo SQL criado

### Editar Migration
```powershell
notepad supabase/migrations/20260122HHMMSS_descricao.sql
# Ou abrir no VS Code
code supabase/migrations/20260122HHMMSS_descricao.sql
```

### Ver Migrations Criadas
```powershell
Get-ChildItem supabase/migrations/ -Name
```

### Listar Todas (Requer Docker)
```powershell
npx supabase migration list
```
⚠️ Requer Docker (opcional - use Dashboard se não tiver)

---

## 🔍 TESTAR & VALIDAR

### Testar Acesso ao Supabase
```powershell
node scripts/test-supabase-access.js
```
**Mostra:** Status de todas as conexões

### Sincronizar Schema
```powershell
node scripts/sync-schema.js
```
**Gera:** `supabase/schema-info.json` com info das tabelas

### Verificar Variáveis de Ambiente
```powershell
cat .env.local
```

---

## 📊 BANCO DE DADOS VIA DASHBOARD

### Acessar SQL Editor
```
https://app.supabase.com/project/wjcbobcqyqdkludsbqgf
→ SQL Editor → New Query
```

### Testar SQL
```sql
-- Exemplo: criar tabela
CREATE TABLE exemplo (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100)
);

-- Exemplo: listar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Exemplo: ver colunas
SELECT * FROM information_schema.columns 
WHERE table_name = 'alunos';
```

---

## 📦 NPM SCRIPTS

### Desenvolvimento
```powershell
npm run dev          # Iniciar servidor (port 3000)
npm run build        # Compilar para produção
npm start            # Rodar build compilado
```

### Supabase
```powershell
npm run supabase:status           # Ver status (requer Docker)
npm run supabase:pull             # Puxar schema (requer Docker)
npm run supabase:push             # Fazer push (requer Docker)
npm run supabase:migration:new    # Criar migration ✅
npm run supabase:logs             # Ver logs JWT
```

### Usando npm script para migration
```powershell
npm run supabase:migration:new "seu_nome"
```

---

## 🔐 ACESSOS & CHAVES

### URLs Importantes
```
Dashboard:     https://app.supabase.com/project/wjcbobcqyqdkludsbqgf
Projeto Local: http://localhost:3000
BD URL:        https://wjcbobcqyqdkludsbqgf.supabase.co
```

### Chaves (Em .env.local)
```
Anon Key:      sb_publishable_EpWHRpMB_HxVI0Afb6SnXw_M48qjBxY
Service Key:   sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ
JWT Key:       34913A3-31C8-4841-92AE-3F2078B99AE8
```

---

## 📤 GIT & DEPLOY

### Versionar Alterações
```powershell
git add .                    # Adicionar tudo
git status                   # Ver o que vai commitar
git commit -m "mensagem"     # Commitar
git push origin main         # Fazer push
```

### Exemplo Completo (Migration)
```powershell
npx supabase migration new "adicionar_campo_x"
# [editar arquivo criado]
git add supabase/migrations/
git commit -m "migration: add campo_x to table_y"
git push
# Vercel detecta e faz deploy automático ✅
```

### Ver Histórico
```powershell
git log --oneline -10       # Últimos 10 commits
git diff                    # Ver diferenças
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### npm install falha
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### Porta 3000 ocupada
```powershell
# Encontrar quem está usando
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Ou simplesmente reiniciar PC
```

### .env.local não carrega
```powershell
# Verificar se existe
Test-Path .env.local

# Verificar conteúdo
cat .env.local

# Recrear se necessário (copiar .env.local.example)
```

### Migration syntax error
```powershell
# 1. Testar SQL no Dashboard primeiro
# 2. Copiar SQL validado para o arquivo
# 3. Fazer push depois
```

### Git conflict
```powershell
git pull origin main        # Puxar versão remota
# Resolver conflitos manualmente
git add .
git commit -m "resolve: merge conflict"
git push
```

---

## 🔄 FLUXO COMPLETO: ADICIONAR CAMPO À TABELA

```powershell
# 1. Criar migration
npx supabase migration new "adicionar_email_funcionarios"

# 2. Editar arquivo criado (supabase/migrations/...)
# Adicionar:
# ALTER TABLE funcionarios ADD COLUMN email VARCHAR(100) UNIQUE;
# CREATE INDEX idx_funcionarios_email ON funcionarios(email);

# 3. Testar no Dashboard (opcional)
# App Supabase → SQL Editor → Colar SQL → Run

# 4. Se OK, versionar
git add supabase/migrations/
git commit -m "migration: add email to funcionarios"
git push origin main

# 5. Vercel faz deploy automático
# Pronto! Campo adicionado em produção ✅
```

---

## 📋 FLUXO COMPLETO: CRIAR NOVO MÓDULO

```powershell
# 1. Criar migration com schema
npx supabase migration new "create_table_novo_modulo"

# 2. Editar com DDL (CREATE TABLE)
# Adicionar schema completo

# 3. Criar arquivo API
# pages/api/novo_modulo/index.js
# pages/api/novo_modulo/[id].js

# 4. Criar componentes
# components/NovoModulo.js
# pages/admin/novo_modulo/novo.js
# pages/admin/novo_modulo/index.js

# 5. Testar localmente
npm run dev
# http://localhost:3000/admin/novo_modulo/novo

# 6. Commitar tudo
git add .
git commit -m "feat: implement novo_modulo module"
git push

# 7. Deploy automático no Vercel ✅
```

---

## ✨ COMANDOS POR SITUAÇÃO

### Situação: "Preciso listar as tabelas"
```powershell
# Opção 1: Dashboard (melhor)
# App Supabase → SQL Editor → 
# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# Opção 2: Via script
node scripts/sync-schema.js
# Gera: supabase/schema-info.json
```

### Situação: "Preciso resetar meu BD local"
```powershell
# Requer Docker:
npx supabase db reset

# Sem Docker: Use Dashboard → Table Editor
```

### Situação: "Preciso salvar o código"
```powershell
git add .
git commit -m "seu_mensagem_descritiva"
git push origin main
```

### Situação: "Preciso ver o que mudou"
```powershell
git diff                    # Não commitado
git diff HEAD~1             # Último commit
git log --oneline           # Histórico
```

### Situação: "Preciso desfazer algo"
```powershell
# Desfazer arquivo
git checkout -- arquivo.js

# Desfazer commit (mas manter código)
git reset --soft HEAD~1

# Desfazer commit e código
git reset --hard HEAD~1
```

---

## 📚 REFERÊNCIAS COMPLETAS

```
Referência Geral:       PROJECT_REFERENCE.md
Status do Projeto:      PROJECT_STATUS.md
CLI (rápido):           docs/GUIA_SUPABASE_CLI_RAPIDO.md
CLI (detalhado):        docs/SETUP_SUPABASE_CLI_OPERACIONAL.md
Índice de Guias:        docs/INDICE_SUPABASE_CLI.md
Teste de Acesso:        docs/SUPABASE_CLI_TESTE_ACESSO_COMPLETO.md
```

---

## ✅ CHECKLIST PRÉ-COMMITAR

Antes de fazer `git push`:

- [ ] Testei localmente? (`npm run dev`)
- [ ] Não há erros no console?
- [ ] BD está OK? (testado no Dashboard)
- [ ] Código está formatado?
- [ ] Atualizei PROJECT_STATUS.md?
- [ ] Mensagem de commit é descritiva?

```powershell
# Pronto? Então faça:
git add .
git commit -m "feat/fix/refactor: mensagem clara"
git push
```

---

## 🎯 PRÓXIMO PASSO?

**Se estiver começando agora:**
1. Ler: `PROJECT_REFERENCE.md`
2. Ler: `PROJECT_STATUS.md`
3. Executar: `npm run dev`
4. Começar: `npm run dev` é o comando!

**Se precisa alterar BD:**
1. Executar: `npx supabase migration new "descricao"`
2. Editar: arquivo criado em `supabase/migrations/`
3. Fazer push: `git add + git commit + git push`

**Se precisa de ajuda:**
1. Consulte: `PROJECT_REFERENCE.md` (estrutura + acessos)
2. Consulte: `PROJECT_STATUS.md` (módulos + tabelas)
3. Consulte: `docs/GUIA_SUPABASE_CLI_RAPIDO.md` (CLI)

---

**Tempo de leitura:** 2-3 minutos  
**Uso:** Quando precisar de um comando rápido

Abra este arquivo sempre que não souber um comando! 📖

