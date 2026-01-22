# 🧪 GUIA DE TESTES: VALIDAÇÃO MULTI-TENANT

## COMO TESTAR O ISOLAMENTO DE DADOS

Depois que o ChatGPT criar a API e você fazer deploy na VPS, use este guia para validar que tudo está funcionando corretamente.

---

## 1. TESTES COM CURL

### 1.1 Login - Empresa 1

```bash
curl -X POST https://api.creeser.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@creeser.com",
    "senha": "admin123",
    "empresaId": "empresa_1"
  }'

# Resposta esperada:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": "user_123",
      "email": "admin@creeser.com",
      "tipo": "admin",
      "empresaId": "empresa_1",
      "nomeCompleto": "João Silva"
    }
  }
}
```

**Guardar o token em uma variável:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EMPRESA_ID="empresa_1"
```

---

### 1.2 Listar Alunos - Empresa 1

```bash
curl -X GET https://api.creeser.com/api/v1/alunos \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Empresa-Id: $EMPRESA_ID"

# Resposta: Lista de alunos APENAS da empresa 1
{
  "success": true,
  "data": [
    {
      "id": "aluno_001",
      "nomeCompleto": "Maria Silva",
      "email": "maria@aluno.com",
      "empresaId": "empresa_1"  // ← Note: empresa_1
    },
    {
      "id": "aluno_002",
      "nomeCompleto": "José Santos",
      "email": "jose@aluno.com",
      "empresaId": "empresa_1"  // ← Note: empresa_1
    }
  ]
}
```

---

### 1.3 ✅ TESTE CRÍTICO: Tentar acessar outro tenant

**Tentar listar alunos da empresa 2 com token da empresa 1:**

```bash
curl -X GET https://api.creeser.com/api/v1/alunos \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Empresa-Id: empresa_2"  # ← DIFERENTE DO TOKEN!

# Resposta esperada: 403 Forbidden
{
  "success": false,
  "erro": "Acesso negado a outro tenant",
  "code": "PERMISSION_DENIED"
}
```

**✅ Se receber 403, está correto! Isolamento funcionando!**

---

### 1.4 Criar Aluno

```bash
curl -X POST https://api.creeser.com/api/v1/alunos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCompleto": "Ana Costa",
    "email": "ana@aluno.com",
    "cpf": "123.456.789-10",
    "dataNascimento": "2005-05-15",
    "statusAcademico": "ativo"
  }'

# Resposta: Aluno criado AUTOMATICAMENTE com empresaId do token
{
  "success": true,
  "data": {
    "id": "aluno_003",
    "nomeCompleto": "Ana Costa",
    "email": "ana@aluno.com",
    "empresaId": "empresa_1"  // ← Automático, do token!
  }
}
```

---

### 1.5 Login - Empresa 2 (Outro Usuário)

```bash
curl -X POST https://api.creeser.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa2.com",
    "senha": "admin123",
    "empresaId": "empresa_2"
  }'

# Guardar novo token
TOKEN_EMP2="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 1.6 ✅ TESTE CRÍTICO: Isolamento de Dados

**Empresa 2 lista alunos (deve ser vazio ou diferente):**

```bash
curl -X GET https://api.creeser.com/api/v1/alunos \
  -H "Authorization: Bearer $TOKEN_EMP2" \
  -H "X-Empresa-Id: empresa_2"

# Resposta: Alunos APENAS da empresa_2 (não inclui alunos da empresa_1)
{
  "success": true,
  "data": [
    // Aqui NUNCA aparece "Maria Silva" ou "José Santos"
    // Apenas alunos de empresa_2
  ]
}
```

**✅ Isolamento comprovado!**

---

### 1.7 Logout

```bash
curl -X POST https://api.creeser.com/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Resposta
{
  "success": true,
  "mensagem": "Logout realizado com sucesso"
}
```

---

## 2. TESTES COM POSTMAN

### 2.1 Importar Collection

O ChatGPT vai fornecer uma `postman_collection.json`. Importe em:
- Abra Postman
- File → Import → Selecione o arquivo JSON

### 2.2 Configurar Variáveis

```
Variáveis globais:
- base_url: https://api.creeser.com
- token: (será preenchido após login)
- empresa_id: empresa_1
```

### 2.3 Executar Testes Sequencialmente

1. **Auth → Login Empresa 1**
   - POST /api/v1/auth/login
   - Body: { email, senha, empresaId: "empresa_1" }
   - Script pós-requisição: Salva token em variável

2. **Alunos → Get All (Empresa 1)**
   - GET /api/v1/alunos
   - Headers: Authorization: Bearer {{token}}
   - Verificar: Todos com empresaId = "empresa_1"

3. **Auth → Login Empresa 2**
   - POST /api/v1/auth/login
   - Body: { email, senha, empresaId: "empresa_2" }
   - Script pós-requisição: Salva novo token

4. **Alunos → Get All (Empresa 2)**
   - GET /api/v1/alunos
   - Headers: Authorization: Bearer {{token}}
   - Verificar: NENHUM aluno de empresa_1 deve aparecer ✅

5. **Security → Acesso Negado**
   - GET /api/v1/alunos
   - Headers: Authorization: Bearer {{token_emp1}}
   - Header: X-Empresa-Id: empresa_2
   - Esperado: 403 Forbidden ✅

---

## 3. TESTES AUTOMATIZADOS (JavaScript)

### 3.1 Script Node.js para Testar Isolamento

Crie arquivo `test-isolation.js`:

```javascript
const BASE_URL = 'https://api.creeser.com';

async function test() {
  console.log('🧪 Iniciando testes de isolamento multi-tenant...\n');

  try {
    // 1. Login Empresa 1
    console.log('1️⃣ Login - Empresa 1');
    const login1 = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@creeser.com',
        senha: 'admin123',
        empresaId: 'empresa_1',
      }),
    });
    const { data: data1 } = await login1.json();
    const token1 = data1.token;
    console.log('✅ Login bem-sucedido. Token:', token1.substring(0, 20) + '...\n');

    // 2. Listar alunos Empresa 1
    console.log('2️⃣ Listar alunos - Empresa 1');
    const alunos1 = await fetch(`${BASE_URL}/api/v1/alunos`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
        'X-Empresa-Id': 'empresa_1',
      },
    });
    const { data: alunosEmp1 } = await alunos1.json();
    console.log(`✅ ${alunosEmp1.length} alunos encontrados em empresa_1`);
    console.log(
      '   Alunos:',
      alunosEmp1.map((a) => a.nomeCompleto).join(', ')
    );
    console.log();

    // 3. Login Empresa 2
    console.log('3️⃣ Login - Empresa 2');
    const login2 = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@empresa2.com',
        senha: 'admin123',
        empresaId: 'empresa_2',
      }),
    });
    const { data: data2 } = await login2.json();
    const token2 = data2.token;
    console.log('✅ Login bem-sucedido. Token:', token2.substring(0, 20) + '...\n');

    // 4. Listar alunos Empresa 2
    console.log('4️⃣ Listar alunos - Empresa 2');
    const alunos2 = await fetch(`${BASE_URL}/api/v1/alunos`, {
      headers: {
        'Authorization': `Bearer ${token2}`,
        'X-Empresa-Id': 'empresa_2',
      },
    });
    const { data: alunosEmp2 } = await alunos2.json();
    console.log(`✅ ${alunosEmp2.length} alunos encontrados em empresa_2`);
    console.log(
      '   Alunos:',
      alunosEmp2.map((a) => a.nomeCompleto).join(', ')
    );
    console.log();

    // 5. TESTE CRÍTICO: Validar isolamento
    console.log('5️⃣ VALIDAR ISOLAMENTO');
    const alunosIsolados = alunosEmp1.every(
      (a) => a.empresaId === 'empresa_1'
    );
    const alunosCruzados = alunosEmp1.some(
      (a) => alunosEmp2.find((b) => b.id === a.id)
    );

    if (alunosIsolados && !alunosCruzados) {
      console.log('✅ ISOLAMENTO FUNCIONANDO!');
      console.log('   - Alunos empresa_1 isolados');
      console.log('   - Alunos empresa_2 isolados');
      console.log('   - Nenhum cruzamento de dados\n');
    } else {
      console.log('❌ ISOLAMENTO FALHOU!');
      console.log('   - Dados cruzados entre empresas\n');
      process.exit(1);
    }

    // 6. Tentar acessar outro tenant
    console.log('6️⃣ TESTE DE SEGURANÇA: Acessar outro tenant');
    const unautorized = await fetch(`${BASE_URL}/api/v1/alunos`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
        'X-Empresa-Id': 'empresa_2', // ← Diferente do token!
      },
    });

    if (unautorized.status === 403) {
      console.log('✅ ACESSO NEGADO (403)');
      console.log('   - Middleware de tenant está protegendo\n');
    } else {
      console.log('❌ ACESSO PERMITIDO (errado!)');
      console.log(`   - Status: ${unautorized.status}\n`);
      process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    process.exit(1);
  }
}

test();
```

**Rodar:**
```bash
node test-isolation.js
```

**Saída esperada:**
```
🧪 Iniciando testes de isolamento multi-tenant...

1️⃣ Login - Empresa 1
✅ Login bem-sucedido. Token: eyJhbGciOiJIUzI1NiIs...

2️⃣ Listar alunos - Empresa 1
✅ 3 alunos encontrados em empresa_1
   Alunos: Maria Silva, José Santos, Ana Costa

3️⃣ Login - Empresa 2
✅ Login bem-sucedido. Token: eyJhbGciOiJIUzI1NiIs...

4️⃣ Listar alunos - Empresa 2
✅ 2 alunos encontrados em empresa_2
   Alunos: Pedro Costa, Julia Mendes

5️⃣ VALIDAR ISOLAMENTO
✅ ISOLAMENTO FUNCIONANDO!
   - Alunos empresa_1 isolados
   - Alunos empresa_2 isolados
   - Nenhum cruzamento de dados

6️⃣ TESTE DE SEGURANÇA: Acessar outro tenant
✅ ACESSO NEGADO (403)
   - Middleware de tenant está protegendo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TODOS OS TESTES PASSARAM!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 4. TESTES DE AUDITORIA

### 4.1 Verificar Logs de Auditoria

```bash
# Listar todos os logs (SUPER ADMIN ONLY)
curl -X GET "https://api.creeser.com/api/v1/admin/logs?empresa=empresa_1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Esperado: Logs de todas operações
{
  "success": true,
  "data": [
    {
      "id": "log_001",
      "usuarioId": "user_123",
      "empresaId": "empresa_1",
      "acao": "LOGIN",
      "tabela": "usuarios",
      "ipAddress": "203.0.113.45",
      "criadoEm": "2025-12-27T10:30:00Z"
    },
    {
      "id": "log_002",
      "usuarioId": "user_123",
      "empresaId": "empresa_1",
      "acao": "CREATE",
      "tabela": "alunos",
      "registroId": "aluno_003",
      "dadosNovos": {
        "nomeCompleto": "Ana Costa",
        "email": "ana@aluno.com"
      },
      "criadoEm": "2025-12-27T10:35:00Z"
    }
  ]
}
```

---

## 5. TESTES DE VALIDAÇÃO

### 5.1 Testar Rate Limiting

```bash
# Fazer 6 logins falhados (máximo é 5)
for i in {1..6}; do
  curl -X POST https://api.creeser.com/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@creeser.com",
      "senha": "SENHA_ERRADA",
      "empresaId": "empresa_1"
    }'
  echo "Tentativa $i"
  sleep 1
done

# Esperado na 6ª tentativa:
{
  "success": false,
  "erro": "Usuário bloqueado. Tente novamente em 15 minutos.",
  "code": "USER_LOCKED"
}
```

---

### 5.2 Testar Validação de Inputs

```bash
# Tentar criar aluno com email inválido
curl -X POST https://api.creeser.com/api/v1/alunos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCompleto": "Maria",
    "email": "EMAIL_INVALIDO",
    "cpf": "123.456.789-10"
  }'

# Esperado:
{
  "success": false,
  "erro": "Email inválido",
  "code": "VALIDATION_ERROR"
}
```

---

## 6. CHECKLIST DE VALIDAÇÃO

- [ ] Login retorna token com empresaId correto
- [ ] Token inclui empresaId no payload JWT
- [ ] Alunos empresa 1 isolados de empresa 2
- [ ] Tentar acessar outro tenant retorna 403
- [ ] Criar aluno adiciona empresaId automaticamente
- [ ] Logs de auditoria registram operações
- [ ] Rate limiting bloqueia após 5 tentativas
- [ ] Validação rejeita dados inválidos
- [ ] CORS funciona com seu domínio
- [ ] Refresh token renova acesso corretamente

---

## 7. TROUBLESHOOTING

### Token expirado
```bash
# Renovar token
curl -X POST https://api.creeser.com/api/v1/auth/refresh \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

### CORS bloqueando requisições
```
Erro: Access to XMLHttpRequest blocked by CORS policy
Solução: Verificar se CORS_ORIGINS no .env do backend inclui seu domínio
```

### Dados não aparecem
```
Verificar:
1. Token está sendo enviado?
2. empresaId do token matches empresa da requisição?
3. Dados existem na empresa? (verificar em PostgreSQL)
```

---

**Pronto para testar? Boa sorte! 🚀**
