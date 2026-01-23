# 📘 REFERÊNCIA DIÁRIA - CREESER EDUCACIONAL

**Última atualização:** 23 de janeiro de 2026  
**Versão:** 2.0 (Next.js 16 + React 19 + Supabase)  
**Status:** 🟢 **DEPLOYADO EM PRODUÇÃO**  
**URL:** https://creeser.vercel.app  
**Para:** Leitura diária antes de começar trabalhos

---

## 📍 IDENTIDADE DO PROJETO

| Item | Valor |
|------|-------|
| **Nome** | CREESER Educacional |
| **Versão** | 2.0 (Next.js + Supabase) |
| **Tipo** | SaaS Multi-tenant EAD |
| **Status** | Em desenvolvimento |
| **Diretório** | `c:\BACKUP\DESENVOLVIMENTO\CREESER EDUCACIONAL\creeser` |

---

## 🏗️ ESTRUTURA DO PROJETO

```
creeser/
├── pages/                 → Rotas Next.js (páginas + API)
├── components/            → React components reutilizáveis
├── lib/                   → Funções auxiliares (supabase.js, etc)
├── styles/                → CSS/Tailwind
├── public/                → Assets estáticos
├── supabase/              → Schema SQL + migrations
├── scripts/               → Scripts Node.js (testes, sync, etc)
├── data/                  → JSONs legados (gradualmente migrados)
├── docs/                  → Documentação completa
│   └── INDICE_SUPABASE_CLI.md
├── .env.local             → Credenciais (NUNCA commitar)
├── .supabaserc.json       → Config Supabase
├── package.json           → Dependências + scripts
└── PROJECT_REFERENCE.md   → Este arquivo (leia diariamente!)
```

---

## 🔐 ACESSO SUPABASE

### IDs & URLs
```
Project ID:           wjcbobcqyqdkludsbqgf
Project URL:          https://wjcbobcqyqdkludsbqgf.supabase.co
Dashboard:            https://app.supabase.com/project/wjcbobcqyqdkludsbqgf
```

### Chaves de Acesso
```
🔑 Anon Key (Frontend):
   sb_publishable_EpWHRpMB_HxVI0Afb6SnXw_M48qjBxY

🔐 Service Key (Admin - Backend):
   sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ

🔒 JWT Key (P-256):
   34913A3-31C8-4841-92AE-3F2078B99AE8
```

### Status de Acesso
```
✅ CLI Supabase:      Funcionando via npx (2.70.5)
✅ Service Key:       OK (acesso admin total)
✅ Dashboard:         Acessível
✅ Migrations:        4 criadas
✅ Sem restrições:    Confirmar ao acessar
```

---

## 🚀 TECNOLOGIAS USADAS

### Frontend
```
Framework:    Next.js 16.0.8 ✅
React:        19.2.0 ✅
UI:           Tailwind CSS 3.3.6
Animation:    Framer Motion 11.0.0 ✅ (atualizado)
Form Input:   React Input Mask 2.0.4
```

### Backend & Banco de Dados
```
Node.js:      v18.17.0 (.nvmrc) ✅
Banco:        PostgreSQL (via Supabase)
ORM:          Prisma (schema.prisma)
Auth:         Supabase Auth + JWT
```

### DevOps & Deployment
```
Git:          2.51.2.windows.1 ✅
GitHub:       creesereducacional/creeser ✅
npm:          11.6.1 ✅
Vercel CLI:   50.4.9 ✅
Deployment:   Vercel (automático) 🟢
URL:          https://creeser.vercel.app
```

### Dependências Principais
```
@supabase/supabase-js: 2.38.4
bcryptjs:              3.0.3
formidable:            3.5.4 (upload)
nodemailer:            7.0.10 (email)
uuid:                  13.0.0
dotenv:                17.2.3
```

---

## 💻 COMANDOS DIÁRIOS ESSENCIAIS

### ✅ Iniciar Desenvolvimento
```powershell
cd "c:\BACKUP\DESENVOLVIMENTO\CREESER EDUCACIONAL\creeser"
npm run dev
# Acesso: http://localhost:3000
```

### ✅ Criar Migration (Modificar BD)
```powershell
npx supabase migration new "descricao_da_alteracao"
# Editar: supabase/migrations/20260122HHMMSS_descricao.sql
# Fazer push: git add + git commit + git push
```

### ✅ Ver Migrations Criadas
```powershell
Get-ChildItem supabase/migrations/ -Name
```

### ✅ Testar Acesso à API
```powershell
node scripts/test-supabase-access.js
# Retorna status de todas as conexões
```

### ✅ Sincronizar Schema (Baixar do remoto)
```powershell
node scripts/sync-schema.js
# Gera: supabase/schema-info.json
```

### ✅ Fazer Deploy
```powershell
git add .
git commit -m "message"
git push origin main
# Vercel detecta automaticamente e faz deploy
```

---

## 📝 NÃO USE ESSES COMANDOS (Não funcionam sem Docker)

```powershell
❌ supabase status            → Requer Docker
❌ supabase db push            → Requer Docker
❌ supabase db pull            → Requer Docker
❌ supabase projects list      → Requer supabase login
```

**Alternativa:** Use as migrations + git + Vercel ✅

---

## 🎨 LAYOUTS & DESIGN

### Tema & Cores
```
Primária:     Teal (#008080)
Secundária:   Branco
Acentos:      Cinza/Preto
Fonte:        System fonts (sans-serif)
```

### Páginas Principais
```
/login                    → Login (novo design teal)
/dashboard                → Dashboard principal
/admin/*                  → Painel administrativo
/professor/*              → Dashboard professor
/aluno/*                  → Dashboard aluno
```

### Componentes
```
AdminHeader, AdminSidebar → Admin panel
ProfessorHeader, ProfessorLayout → Professor views
Header, Footer            → Layout geral
DashboardLayout           → Dashboard
```

---

## 📚 DOCUMENTAÇÃO IMPORTANTE

### Para Entender Tudo (Leia nessa ordem)
1. [PROJECT_STATUS.md](PROJECT_STATUS.md) - Status dos módulos (DIARIAMENTE)
2. [docs/SUPABASE_CLI_START_HERE.md](docs/SUPABASE_CLI_START_HERE.md) - CLI (2 min)
3. [docs/GUIA_SUPABASE_CLI_RAPIDO.md](docs/GUIA_SUPABASE_CLI_RAPIDO.md) - Referência rápida
4. [docs/INDICE_SUPABASE_CLI.md](docs/INDICE_SUPABASE_CLI.md) - Todos os guias

### Para Referência Rápida
- [docs/SUPABASE_CLI_TESTE_ACESSO_COMPLETO.md](docs/SUPABASE_CLI_TESTE_ACESSO_COMPLETO.md) - Validação de acesso
- [docs/ARQUITETURA_MULTITENANT_PRODUCAO.md](docs/ARQUITETURA_MULTITENANT_PRODUCAO.md) - Arquitetura

---

## 🔄 FLUXO DE DESENVOLVIMENTO DIÁRIO

### Manhã (Início do dia)
```
1. ✅ Ler este arquivo (PROJECT_REFERENCE.md)
2. ✅ Ler PROJECT_STATUS.md
3. ✅ Entender qual módulo trabalhar
4. ✅ npm run dev
5. ✅ Começar desenvolvimento
```

### Durante (Implementação)
```
1. Editar componentes/pages
2. Testar localmente
3. Se precisar alterar BD: npx supabase migration new
4. Fazer commits: git add + git commit
```

### Fim do dia (Finalização)
```
1. git push origin main
2. Atualizar PROJECT_STATUS.md
3. Documentar o que foi feito
4. Listar próximas ações
```

---

## ✨ CHECKLIST PRÉ-TRABALHO

Sempre antes de começar a trabalhar:

- [ ] Li este arquivo (PROJECT_REFERENCE.md)
- [ ] Atualizei PROJECT_STATUS.md
- [ ] Verifiquei qual módulo trabalhar
- [ ] `cd c:\BACKUP\DESENVOLVIMENTO\CREESER EDUCACIONAL\creeser`
- [ ] `npm run dev` está rodando
- [ ] Acesso: http://localhost:3000 funcionando
- [ ] Credenciais Supabase OK (verificar .env.local)
- [ ] Git status OK (sem conflitos)

---

## 🎯 REFERÊNCIA DE MÓDULOS

**Módulos já implementados:**
- ✅ Alunos (formulário 42 campos)
- ✅ Autenticação/Login
- ✅ Dashboard (layout novo)
- ✅ Admin panel (base)

**Módulos em desenvolvimento:**
- 🚧 Professores
- 🚧 Cursos
- 🚧 Turmas

**Módulos planejados:**
- 📋 Financeiro
- 📋 Avaliações
- 📋 Forum

*Detalhes: Consultar PROJECT_STATUS.md*

---

## 🆘 TROUBLESHOOTING RÁPIDO

| Problema | Solução |
|----------|---------|
| npm ERR! | `npm install` |
| Porta 3000 em uso | `lsof -i :3000` ou reiniciar PC |
| Credenciais inválidas | Verifique .env.local |
| Git conflict | `git pull origin main` |
| Migration error | Testar SQL no Dashboard primeiro |
| Next.js build fail | `npm run build` para testar |

---

## 📞 CONTATOS & LINKS RÁPIDOS

```
Dashboard Supabase:
https://app.supabase.com/project/wjcbobcqyqdkludsbqgf

Vercel Deploy:
https://vercel.com/dashboard

GitHub Repo:
[Seu repositório]

Local Dev:
http://localhost:3000
```

---

## 🔑 CREDENCIAIS (SEGURANÇA)

⚠️ **IMPORTANTE:**
- ✅ Nunca comitar .env.local
- ✅ Nunca publicar chaves em documentos
- ✅ .gitignore já protege (verificar)
- ✅ Se vazar, regenerar no Dashboard Supabase

---

## 📊 QUICK STATS

| Métrica | Valor |
|---------|-------|
| Versão Node | 24.11.0 |
| Versão npm | 11.6.1 |
| Next.js | 16.0.3 |
| Supabase CLI | 2.70.5 |
| Migrations | 4 criadas |
| Documentação | 15+ guias |
| Componentes | 20+ |

---

## ✅ VALIDAÇÃO DE SETUP

Confirme que tudo está OK:

```powershell
# 1. Node instalado?
node --version

# 2. npm instalado?
npm --version

# 3. Git instalado?
git --version

# 4. Supabase CLI?
npx supabase --version

# 5. Next.js roda?
npm run dev

# 6. .env.local existe?
cat .env.local
```

---

## 🎊 RESUMO - JANUARY 2026 UPDATE

Este arquivo é sua **referência diária**. Conteúdo atualizado com:

**✅ Implementado:**
- Deploy bem-sucedido em Vercel (https://creeser.vercel.app)
- GitHub limpo (creesereducacional/creeser)
- Variáveis de ambiente configuradas corretamente
- Dependências atualizadas (React 19, framer-motion 11.0.0)
- Documentação organizada em `/docs`

**Tempo de leitura:** 5-10 minutos  
**Frequência:** Uma vez por sessão (no início do dia)

---

**Status:** 🟢 Em produção e funcionando  
**Próximo:** Continuar desenvolvimento de novos recursos

