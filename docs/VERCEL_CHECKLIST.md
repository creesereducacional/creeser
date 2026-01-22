# ✅ CHECKLIST VERCEL - PASSO A PASSO

## 🎯 Objetivo
Conectar repositório GitHub ao Vercel para deploy automático do CREESER Educacional

---

## 📋 CHECKLIST DE AÇÕES

### Fase 1: Preparação GitHub ✅
- [x] Repositório criado em GitHub
- [x] URL: `https://github.com/creesereducacional/creeser.git`
- [x] Branch main atualizado
- [x] 393+ arquivos commitados
- [x] .gitignore configurado
- [x] Repositório público/acessível

### Fase 2: Preparação Vercel (AGORA)
- [ ] Acessar https://vercel.com
- [ ] Login com conta pessoal/organizacional
- [ ] Conectar ao GitHub (se não estiver)
- [ ] Autorizar acesso ao repositório

### Fase 3: Importação Projeto
- [ ] Clicar "Add New" → "Project"
- [ ] Selecionar "Import Git Repository"
- [ ] Buscar: "creesereducacional/creeser"
- [ ] Clicar "Import"

### Fase 4: Configuração Build
- [ ] Framework: Next.js (auto-detectado)
- [ ] Root Directory: "/" (deixar padrão)
- [ ] Build Command: `npm run build` (auto)
- [ ] Output Directory: `.next` (auto)
- [ ] Install Command: `npm install` (auto)

### Fase 5: Variáveis de Ambiente
Adicionar estas 6 variáveis:

```
□ NEXT_PUBLIC_SUPABASE_URL
  = https://wjcbobcqyqdkludsbqgf.supabase.co

□ NEXT_PUBLIC_SUPABASE_ANON_KEY
  = sb_publishable_EpWHRpMB_HxVI0Afb6SnXw_M48qjBxY

□ SUPABASE_SERVICE_ROLE_KEY
  = sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ

□ NEXT_PUBLIC_APP_NAME
  = CREESER Educacional

□ NEXT_PUBLIC_APP_URL
  = https://creeser.vercel.app

□ NODE_ENV
  = production
```

### Fase 6: Deploy
- [ ] Revisar configurações
- [ ] Clicar "Deploy"
- [ ] Aguardar build (2-3 minutos)
- [ ] Ver URL do projeto: `https://creeser.vercel.app`

### Fase 7: Teste
- [ ] Acessar URL do app
- [ ] Testar login
- [ ] Verificar console (erros?)
- [ ] Ver ambiente: `Vercel → Deployments`

### Fase 8: Integração GitHub
- [ ] GitHub Integrations ativadas (automático)
- [ ] Preview Deployments habilitados (optional)
- [ ] Branch protection rules (optional)

---

## 🔗 LINKS PRÁTICOS

| Ação | Link |
|------|------|
| Vercel Dashboard | https://vercel.com/dashboard |
| Seu Projeto Vercel | https://vercel.com/creesereducacional/creeser |
| App em Produção | https://creeser.vercel.app |
| GitHub Repo | https://github.com/creesereducacional/creeser |
| Supabase Dashboard | https://app.supabase.com/project/wjcbobcqyqdkludsbqgf |

---

## ⏱️ TEMPO ESTIMADO

| Fase | Tempo |
|------|-------|
| Login Vercel | 1 min |
| Conectar GitHub | 2 min |
| Importar Repo | 2 min |
| Configurar Build | 2 min |
| Adicionar Variáveis | 5 min |
| Deploy | 3 min |
| Teste | 5 min |
| **TOTAL** | **~20 minutos** |

---

## 🚨 ERROS COMUNS & SOLUÇÕES

### Erro: "Could not find repository"
```
❌ Problema: GitHub não conectado a Vercel
✅ Solução: 
  1. Clicar "Connect GitHub"
  2. Autorizar creesereducacional
  3. Tentar novamente
```

### Erro: "Build failed - npm ERR!"
```
❌ Problema: Faltam dependências
✅ Solução:
  1. Verificar package.json
  2. Rodar localmente: npm install
  3. Ver logs do build no Vercel
  4. Corrigir error
  5. Fazer novo push
```

### Erro: "Cannot find module 'supabase'"
```
❌ Problema: Variável de ambiente errada
✅ Solução:
  1. Vercel → Settings → Environment Variables
  2. Verificar todas as 6 variáveis
  3. Garantir sem espaços extras
  4. Redeploy: "Deployments" → "Redeploy"
```

### Erro: "500 Internal Server Error"
```
❌ Problema: App buildou mas falha em runtime
✅ Solução:
  1. Abrir console do navegador (F12)
  2. Ver qual erro aparece
  3. Checar função afetada
  4. Corrigir localmente
  5. Fazer git push (redeploy automático)
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Dashboard Vercel
```
Vercel → Project → Deployments
├── History (todos seus deploys)
├── Latest (versão atual)
├── Build Logs (se houve erro)
└── Runtime Logs (erros em produção)
```

### GitHub Integration
```
GitHub Repo → "Deployments" tab
└── Ver cada push → Status no Vercel
    ├── ✅ Success
    ├── ⏳ Building
    └── ❌ Failed
```

### Monitorar Uptime
```
Vercel → Analytics
├── Requests (volume de uso)
├── Bandwidth (dados trafegados)
└── CLS/LCP/FID (velocidade)
```

---

## 🔄 FLUXO APÓS VERCEL PRONTO

### Local Development
```powershell
# 1. Fazer alterações
code .
npm run dev

# 2. Testar em: http://localhost:3000

# 3. Se alterou BD
npx supabase migration new "desc"
# Testar localmente

# 4. Versionar
git add .
git commit -m "feat: descricao"
git push origin main
```

### Vercel Automático
```
[Seu git push]
        ↓
[GitHub recebe]
        ↓
[Webhook → Vercel]
        ↓
[Vercel inicia build]
        ↓
[~2 min depois]
        ↓
[App atualizado em produção] ✅
```

---

## 💾 BACKUP DE CONFIGURAÇÃO

Se precisar reconfigurar, salve:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "environmentVariables": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://wjcbobcqyqdkludsbqgf.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_EpWHRpMB_HxVI0Afb6SnXw_M48qjBxY",
    "SUPABASE_SERVICE_ROLE_KEY": "sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ",
    "NEXT_PUBLIC_APP_NAME": "CREESER Educacional",
    "NEXT_PUBLIC_APP_URL": "https://creeser.vercel.app",
    "NODE_ENV": "production"
  }
}
```

---

## ✨ SUCESSO! QUANDO VERCEL ESTIVER PRONTO

Você terá:
```
✅ App em produção: https://creeser.vercel.app
✅ Deploy automático: Qualquer git push faz deploy
✅ CI/CD profissional: Sem ações manuais
✅ Monitoramento: Ver uptime, erros, performance
✅ Integração GitHub: PR previews (opcional)
✅ Domínio: Pode mapear domínio personalizado depois
```

---

## 📝 NOTAS

- Você pode fazer tantos deploys quanto quiser (sem limite no plano gratuito)
- Cada deploy é versionado no histórico Vercel
- Rollback é fácil: click em "Redeploy" de um deploy anterior
- Preview URLs são criadas automaticamente para cada PR (quando ativar)
- Logs são guardados por 24h; depois você vê apenas o resumo

---

**Status:** 🟡 PRONTO PARA COMEÇAR  
**Próximo:** Siga o checklist acima e configure Vercel!  
**Tempo:** ~20 minutos do início ao app live  

🚀 **Vamos lá!**

