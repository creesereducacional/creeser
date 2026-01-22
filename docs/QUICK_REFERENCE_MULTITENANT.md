# ⚡ QUICK REFERENCE: MULTI-TENANT EM UMA PÁGINA

## 📌 VISÃO GERAL EM 60 SEGUNDOS

```
ANTES (Atual)           →    DEPOIS (Novo)
─────────────────           ──────────────
JSON files              →    PostgreSQL
1 empresa               →    ∞ empresas
0 isolamento            →    ✅ isolado por empresaId
Sem auth segura         →    JWT + tenant validation
0 auditoria             →    Logs completos
```

---

## 🏗️ ARQUITETURA SIMPLIFICADA

```
FRONTEND (Next.js)
       ↓ POST /login { email, senha, empresaId }
BACKEND (Express)
       ├─ Gera JWT: { userId, empresaId, tipo }
       └─ Retorna token
       
TODAS REQUISIÇÕES
       ↓ Authorization: Bearer <token>
       ↓ X-Empresa-Id: <do token>
BACKEND MIDDLEWARE
       ├─ Valida JWT
       ├─ Compara empresaId
       └─ Se match ✅ → Continua
          Se não ❌ → 403 Forbidden

DATABASE
       ├─ SELECT * FROM alunos
       └─ WHERE empresaId = 'emp_123'
          (ISOLAMENTO SEGURO)
```

---

## 🔑 CONCEITOS PRINCIPAIS

| Conceito | Explicação | Exemplo |
|----------|-----------|---------|
| **Tenant** | Uma empresa/cliente isolado | Empresa A, Empresa B |
| **empresaId** | ID único do tenant | `emp_123`, `emp_456` |
| **JWT Token** | Autenticação stateless | `eyJhbGciOi...` |
| **Row-Level** | Isolamento por linha BD | `WHERE empresaId = ?` |
| **Multi-Tenant** | 1 app, N empresas | Scalable desde início |

---

## 📁 ESTRUTURA DO PROJETO

```
creeser/ (seu projeto Next.js)
├── 📄 INDICE_DOCUMENTACAO.md ← Você está aqui
├── 📄 SUMARIO_MULTITENANT_PRONTO.md
├── 📄 ARQUITETURA_MULTITENANT_PRODUCAO.md
├── 📄 GUIA_CHATGPT_CRIAR_API.md ← Use para criar backend
├── 📄 INTEGRACAO_FRONTEND_BACKEND.md
├── 📄 GUIA_TESTES_MULTITENANT.md
├── pages/
├── components/
└── ...

creeser-api/ (novo backend na VPS)
├── src/
├── prisma/schema.prisma
├── .env
├── package.json
└── ... (ChatGPT vai criar)
```

---

## 🚀 ROADMAP EM 4 FASES

### Fase 1: ALINHAMENTO ✅ (Concluído)
```
Criados 5 documentos de arquitetura
Esquema Prisma definido
Fluxo de autenticação planejado
```

### Fase 2: BACKEND ⏳ (Próximo)
```
Você: Chama ChatGPT com GUIA_CHATGPT_CRIAR_API.md
ChatGPT: Cria Express + Prisma + PostgreSQL
Resultado: API rodando em https://api.creeser.com
```

### Fase 3: INTEGRAÇÃO ⏳ (Depois)
```
Você: Atualiza Next.js conforme INTEGRACAO_FRONTEND_BACKEND.md
Resultado: Frontend falando com API
```

### Fase 4: VALIDAÇÃO ⏳ (Final)
```
Você: Testa isolamento com GUIA_TESTES_MULTITENANT.md
Eu: Validarei dados, criarei migrações, finalizaremos
```

---

## 🔐 SEGURANÇA: 3 CAMADAS

### 1️⃣ CAMADA: Frontend
```javascript
// Armazenar token com segurança
localStorage.setItem('auth', JSON.stringify({
  token: 'eyJ...',
  empresaId: 'emp_123'
}));

// Enviar em todo request
fetch('/api/v1/alunos', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2️⃣ CAMADA: Backend Middleware
```javascript
// Validar JWT
const decoded = jwt.verify(token, JWT_SECRET);
// Confirmar empresaId
if (decoded.empresaId !== req.body.empresaId) {
  return res.status(403).json({ erro: 'Acesso negado' });
}
```

### 3️⃣ CAMADA: Database
```sql
-- Query SEMPRE inclui empresaId
SELECT * FROM alunos 
WHERE empresaId = $1;

-- Índices para performance
CREATE INDEX idx_alunos_empresa ON alunos(empresaId);
```

---

## 📊 TABELAS PRINCIPAIS

```
Empresa
├── id, nome, cnpj, email
└── (raiz de tudo)

Usuario
├── id, email, senha_hash, tipo, empresaId
└── (admin, professor, aluno, funcionario)

Aluno
├── id, nomeCompleto, email, cpf, empresaId
└── (matriculados em turmas)

Turma
├── id, codigo, nome, anoLetivo, empresaId, cursoId
└── (com alunos matriculados)

Disciplina
├── id, nome, codigo, empresaId, cursoId
└── (em turmas, com professores)

Nota
├── id, valor, alunoId, disciplinaId, empresaId
└── (relacionada a avaliação)

AuditoriaLog
├── id, usuarioId, empresaId, acao, tabela, dados
└── (rastreia tudo)
```

---

## 🔄 FLUXO: LOGIN → LISTAR ALUNOS

```
1. Frontend POST /api/v1/auth/login
   {
     "email": "prof@creeser.com",
     "senha": "123456",
     "empresaId": "emp_123"
   }

2. Backend valida credenciais
   ✓ Encontra usuário por email
   ✓ Verifica senha
   ✓ Confirma que usuário ∈ empresa_123
   ✓ Gera JWT com { userId, empresaId: "emp_123", tipo }

3. Backend retorna
   {
     "token": "eyJ...",
     "usuario": { id, email, tipo, empresaId }
   }

4. Frontend armazena em localStorage
   auth = { token, empresaId, usuario }

5. Frontend GET /api/v1/alunos
   Headers: {
     Authorization: "Bearer eyJ...",
     X-Empresa-Id: "emp_123"
   }

6. Backend middleware
   ✓ Decodifica token → empresaId = "emp_123"
   ✓ Compara com X-Empresa-Id header
   ✓ Match! Continua
   
7. Backend query
   SELECT * FROM alunos WHERE empresaId = "emp_123"
   (Retorna APENAS alunos da empresa_123)

8. Frontend renderiza lista
```

---

## 🎯 CHECKLIST RÁPIDO

### Antes de Chamar ChatGPT
- [ ] Copiou GUIA_CHATGPT_CRIAR_API.md?
- [ ] Adaptou URL da VPS?
- [ ] Tem dados de SMTP para emails?
- [ ] VPS tem Node.js + PostgreSQL? (ou vai instalar)

### Após ChatGPT Entregar
- [ ] Backend rodando em localhost:3001?
- [ ] Endpoints testados com curl?
- [ ] PostgreSQL com dados iniciais?
- [ ] .env configurado corretamente?

### Integração Frontend
- [ ] AuthContext.js criado?
- [ ] .env.local com API_URL?
- [ ] ProtectedRoute funcionando?
- [ ] Login → redirect → listagem?

### Testes de Isolamento
- [ ] Empresa 1 vê só seus alunos?
- [ ] Empresa 2 vê só seus alunos?
- [ ] Tentar acessar outro tenant → 403?
- [ ] Logs registrando operações?

---

## 🔗 LINKS RÁPIDOS (no seu projeto)

```
Para entender:
→ Leia: SUMARIO_MULTITENANT_PRONTO.md

Para criar API:
→ Use: GUIA_CHATGPT_CRIAR_API.md

Para integrar frontend:
→ Consulte: INTEGRACAO_FRONTEND_BACKEND.md

Para testar:
→ Use: GUIA_TESTES_MULTITENANT.md

Para referência técnica:
→ Consulte: ARQUITETURA_MULTITENANT_PRODUCAO.md
```

---

## 💻 COMANDO RÁPIDOS

### Testar Isolamento (curl)
```bash
# Login Empresa 1
TOKEN1=$(curl -s -X POST http://api/auth/login \
  -d '{"email":"admin@emp1","senha":"123","empresaId":"emp_1"}' \
  | jq -r '.data.token')

# Login Empresa 2
TOKEN2=$(curl -s -X POST http://api/auth/login \
  -d '{"email":"admin@emp2","senha":"123","empresaId":"emp_2"}' \
  | jq -r '.data.token')

# Alunos Empresa 1
curl -H "Authorization: Bearer $TOKEN1" http://api/alunos
# Saída: Apenas alunos de emp_1 ✅

# Alunos Empresa 2
curl -H "Authorization: Bearer $TOKEN2" http://api/alunos
# Saída: Apenas alunos de emp_2 ✅

# Tentar cruzado (deve falhar)
curl -H "Authorization: Bearer $TOKEN1" \
     -H "X-Empresa-Id: emp_2" \
     http://api/alunos
# Saída: 403 Forbidden ✅
```

---

## 🆘 PROBLEMAS COMUNS

| Problema | Solução |
|----------|---------|
| "Token expirado" | Use endpoint `/auth/refresh` |
| "Acesso negado" | Verificar empresaId no token vs requisição |
| "Dados de outro tenant aparecem" | Verificar WHERE empresaId no SQL |
| "CORS bloqueado" | Adicionar domínio em CORS_ORIGINS |
| "Rate limit" | Esperar 15 min ou resetar banco |

---

## 📈 PRÓXIMOS PASSOS

```
Agora:        Ler este documento (2 min)
              ↓
Depois:       Abrir SUMARIO_MULTITENANT_PRONTO.md (5 min)
              ↓
Depois:       Copiar GUIA_CHATGPT_CRIAR_API.md (10 min)
              ↓
Chamar:       ChatGPT com prompt (⏳ 2-4 horas)
              ↓
Receber:      Backend completo
              ↓
Testar:       GUIA_TESTES_MULTITENANT.md (30 min)
              ↓
Integrar:     INTEGRACAO_FRONTEND_BACKEND.md (2 horas)
              ↓
Finalizar:    Comigo via API
```

---

## 🎓 RESUMO

```
MULTI-TENANT = 1 Aplicação + N Empresas
ISOLAMENTO = empresaId em tudo
SEGURANÇA = JWT + Middleware + Database
ESCALABILIDADE = PostgreSQL + Índices
AUDITORIA = Logs de tudo
```

**Status: ✅ PRONTO PARA COMEÇAR!**

---

## 📞 RESUMO DE DOCUMENTOS

| Arquivo | Quando Ler | Tempo |
|---------|-----------|-------|
| Este | Agora | 2 min |
| SUMARIO | Entender status | 5 min |
| ARQUITETURA | Referência técnica | 15 min |
| GUIA_CHATGPT | Criar backend | 10 min |
| INTEGRACAO | Atualizar frontend | 20 min |
| TESTES | Validar tudo | 30 min |

---

**Sua jornada para multi-empresa começa aqui! 🚀**
