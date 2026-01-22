# 🔗 VINCULAR SUPABASE CLI - INSTRUÇÕES

## ⏳ Passo 1: Obter Token de Acesso

1. Acesse: https://app.supabase.com/account/tokens
2. Clique em "Create new token"
3. Dê um nome: "Local Development CLI"
4. Copie o token gerado

## 🔑 Passo 2: Configurar Variável de Ambiente

Execute no PowerShell:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "seu_token_aqui"
```

**Ou adicione permanentemente ao `.env.local`:**

```dotenv
SUPABASE_ACCESS_TOKEN=seu_token_aqui
```

## 🔗 Passo 3: Vincular Projeto

```powershell
cd "c:\BACKUP\DESENVOLVIMENTO\CREESER EDUCACIONAL\creeser"
npx supabase link --project-ref wjcbobcqyqdkludsbqgf
```

## ✅ Verificar Conexão

```powershell
npx supabase status
```

## 📤 Aplicar Migrations

```powershell
npx supabase db push
```

---

**Quer fazer isso? Envie-me o token e eu vinculo para você.**
