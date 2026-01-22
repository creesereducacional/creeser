# 📋 GUIA PARA CHATGPT: CRIAR BACKEND MULTI-TENANT NA VPS

## INSTRUÇÃO PARA PASSAR AO CHATGPT

```
Crie um backend completo em Node.js + Express + PostgreSQL + Prisma 
seguindo os padrões de arquitetura multi-tenant definidos em anexo.

REQUISITOS OBRIGATÓRIOS:
1. Express.js como framework web
2. Prisma ORM com PostgreSQL
3. JWT para autenticação
4. Middleware de isolamento de tenant (empresaId)
5. Estrutura de pasta conforme documento
6. Endpoints RESTful /api/v1/...
7. Auditoria de logs em todas operações
8. Rate limiting e validação de inputs
9. CORS habilitado para frontend em Next.js
10. Seeds para dados iniciais de teste

ENTREGAR:
- Projeto completo pronto para rodar
- .env.example com todas variáveis
- Documentação de como rodar localmente
- Instruções de deploy na VPS (Ubuntu/Linux)
- Tests básicos de autenticação
- Exemplos de como chamar cada endpoint

IMPORTANTE: Para gerenciamento de schemas customizáveis (sem alterar BD em runtime),
seguir o padrão em PADRAO_SCHEMA_DINAMICO_JSONB.md:
- Core fixo via Prisma (tabelas que não mudam)
- Schemas customizados como dados via tabela SchemaCustomizado
- Dados dinâmicos armazenados em JSONB (modelo DadosDinamicos)
- API /api/v1/schemas/* para gerenciamento
```

---

## PASSO A PASSO DE IMPLEMENTAÇÃO

### 1. ANTES DE CHAMAR O CHATGPT

Copie e adapte este prompt:

```
==== PROMPT PARA CHATGPT ====

Você será responsável por criar uma API backend completa para um sistema 
educacional multi-empresa chamado CREESER.

TECNOLOGIA STACK:
- Node.js + Express.js
- PostgreSQL como banco de dados
- Prisma como ORM
- JWT para autenticação
- bcryptjs para senha
- Multer para upload de arquivos

ARQUITETURA: Multi-tenant com isolamento de dados por empresa_id

ESTRUTURA DE PASTAS ESPERADA:
creeser-api/
├── prisma/
│   ├── schema.prisma           <- Schema completo (fornecido)
│   ├── migrations/
│   └── seed.js                  <- Dados iniciais
├── src/
│   ├── middleware/
│   │   ├── auth.js             <- JWT validation
│   │   ├── tenantCheck.js      <- Tenant isolation
│   │   ├── errorHandler.js     <- Error handling
│   │   └── requestLogger.js    <- Request logging
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── usuarios.js
│   │   ├── alunos.js
│   │   ├── professores.js
│   │   ├── turmas.js
│   │   ├── cursos.js
│   │   ├── disciplinas.js
│   │   ├── avaliacoes.js
│   │   ├── notas.js
│   │   ├── faltas.js
│   │   ├── funcionarios.js
│   │   └── admin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usuariosController.js
│   │   ├── alunosController.js
│   │   └── ... (um para cada recurso)
│   ├── services/
│   │   ├── authService.js
│   │   ├── usuariosService.js
│   │   ├── alunosService.js
│   │   └── ... (um para cada recurso)
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── helpers.js
│   │   └── errors.js
│   ├── app.js                  <- Configuração Express
│   └── server.js               <- Entry point
├── tests/
│   ├── auth.test.js
│   └── integration.test.js
├── .env.example
├── package.json
├── .gitignore
├── README.md
└── docker-compose.yml          <- Para rodar PostgreSQL localmente

FUNCIONALIDADES PRINCIPAIS:

1. AUTENTICAÇÃO & AUTORIZAÇÃO
   - Endpoint POST /api/v1/auth/login
     Input: { email, senha, empresaId }
     Output: { token, refreshToken, usuario }
   - Endpoint POST /api/v1/auth/refresh
   - Endpoint POST /api/v1/auth/logout
   - Middleware: Validar JWT e empresaId em cada requisição
   - Proteção contra força bruta (max 5 tentativas, lock 15 min)

2. CRUD DE USUÁRIOS
   - GET /api/v1/usuarios (listar da empresa do token)
   - GET /api/v1/usuarios/:id (validar tenant)
   - POST /api/v1/usuarios (criar com empresaId do token)
   - PUT /api/v1/usuarios/:id (atualizar)
   - DELETE /api/v1/usuarios/:id (soft delete?)
   - Filtros: tipo, ativo, unidadeId

3. CRUD DE ALUNOS
   - GET /api/v1/alunos (listar da empresa)
   - GET /api/v1/alunos/:id
   - POST /api/v1/alunos (criar)
   - PUT /api/v1/alunos/:id
   - DELETE /api/v1/alunos/:id
   - GET /api/v1/alunos/:id/notas
   - GET /api/v1/alunos/:id/faltas
   - Validação: email e cpf únicos por empresa

4. CRUD DE TURMAS
   - GET /api/v1/turmas (listar)
   - GET /api/v1/turmas/:id
   - POST /api/v1/turmas
   - PUT /api/v1/turmas/:id
   - GET /api/v1/turmas/:id/alunos (alunos matriculados)
   - GET /api/v1/turmas/:id/disciplinas

5. CRUD DE DISCIPLINAS
   - GET /api/v1/disciplinas
   - POST /api/v1/disciplinas
   - PUT /api/v1/disciplinas/:id
   - DELETE /api/v1/disciplinas/:id

6. AVALIAÇÕES & NOTAS
   - GET /api/v1/avaliacoes
   - POST /api/v1/avaliacoes
   - GET /api/v1/notas (filtrado por aluno/turma/disciplina)
   - POST /api/v1/notas
   - PUT /api/v1/notas/:id

7. FALTAS
   - GET /api/v1/faltas
   - POST /api/v1/faltas
   - PUT /api/v1/faltas/:id

8. AUDITORIA & LOGS
   - GET /api/v1/admin/logs (apenas para admin)
   - Registrar: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
   - Campos: usuarioId, empresaId, acao, tabela, registroId, ip, timestamp

9. ADMIN (SUPER ADMIN ONLY)
   - GET /api/v1/admin/empresas (listar todas)
   - POST /api/v1/admin/empresas (criar nova empresa)
   - GET /api/v1/admin/empresas/:id (stats)
   - GET /api/v1/admin/logs (filtrado por empresa/usuario/data)

PADRÕES DE SEGURANÇA:

✅ JWT Tokens:
  - Payload: { sub: userId, empresaId, tipo, unidadeId, email }
  - TTL: 24 horas
  - Refresh token: 7 dias
  - Secret: variável de ambiente

✅ Validação de Tenant:
  - TODA requisição deve incluir Authorization header com token válido
  - TODA requisição que toca dados deve validar: 
    req.user.empresaId === req.params.empresaId || req.body.empresaId
  - Middleware:
    ```javascript
    async (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      // Se há empresaId na rota, validar match
      if (req.params.empresaId && req.params.empresaId !== decoded.empresaId) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }
      
      next();
    }
    ```

✅ Validação de Inputs:
  - Usar Zod ou Joi para schema validation
  - Sanitizar strings (XSS prevention)
  - Validar tipos e limites
  - Exemplo:
    ```javascript
    const usuarioSchema = z.object({
      nomeCompleto: z.string().min(3).max(100),
      email: z.string().email(),
      tipo: z.enum(['admin', 'professor', 'aluno']),
    });
    ```

✅ Rate Limiting:
  - 100 requisições por 15 minutos por IP
  - 5 tentativas de login falhadas = lock por 15 min

✅ CORS:
  - Origin: processo.env.FRONTEND_URL
  - Credentials: true
  - Methods: GET, POST, PUT, DELETE, OPTIONS

✅ Auditoria:
  - Logar TODAS operações que modificam dados
  - Incluir: usuarioId, empresaId, acao, tabela, dados antigos, dados novos
  - Exemplo:
    ```javascript
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: req.user.id,
        empresaId: req.user.empresaId,
        acao: 'UPDATE',
        tabela: 'alunos',
        registroId: aluno.id,
        dadosAntigos: alunoDados Antigos,
        dadosNovos: aluno,
        ipAddress: req.ip,
      }
    });
    ```

ARQUIVOS PARA FORNECER:

1. Prisma Schema (schema.prisma) - [FORNECIDO ACIMA]
2. .env.example com todas variáveis
3. package.json completo
4. Middleware de autenticação (auth.js)
5. Exemplo de rota (usuarios.js ou alunos.js)
6. Service para criar usuário com hash de senha
7. Scripts de migrate e seed
8. Documentação de deploy na VPS

VARIÁVEIS DE AMBIENTE ESPERADAS:

DATABASE_URL=postgresql://user:password@localhost:5432/creeser_prod
JWT_SECRET=sua-chave-super-secreta-minimo-32-caracteres
JWT_REFRESH_SECRET=outra-chave-super-secreta-minimo-32-caracteres
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d
NODE_ENV=production
API_PORT=3001
API_URL=https://api.creeser.com
FRONTEND_URL=https://creeser.com
CORS_ORIGINS=https://creeser.com,https://www.creeser.com
SMTP_HOST=smtp.seuservidor.com
SMTP_PORT=587
SMTP_USER=seu-email@seudominio.com
SMTP_PASS=sua-senha
SMTP_FROM=noreply@creeser.com
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15

ENTREGA ESPERADA:

1. Projeto Node.js completo com todos os arquivos acima
2. Docker-compose.yml para rodar PostgreSQL localmente
3. README.md com instruções de:
   - Setup local (npm install, docker-compose up, npx prisma migrate dev)
   - Como rodar: npm run dev
   - Como testar endpoints: Postman collection ou curl examples
   - Deploy na VPS (ubuntu/debian)
4. Tests básicos (Jest + Supertest):
   - Test login com credenciais corretas
   - Test login com credenciais incorretas
   - Test que usuário de empresa 1 não acessa dados de empresa 2
5. API Documentation (Swagger/OpenAPI opcional mas recomendado)
6. .gitignore adequado
7. Scripts úteis: seed de dados, reset de DB, etc

EXTRA (Nice to have):
- Health check endpoint: GET /health
- Swagger documentation: GET /api/docs
- Request logging estruturado (Winston/Pino)
- Validação automática de env vars no startup
- Configuração para diferentes ambientes (dev, staging, prod)

IMPORTANTE:
- Código deve ser limpo, well-commented
- Usar async/await (não callbacks)
- Error handling consistente
- Não hardcodear senhas ou dados sensíveis
- Tests devem passar
- Documentação clara

==== FIM DO PROMPT ====
```

---

### 2. APÓS O CHATGPT ENTREGAR O CÓDIGO

Você vai receber:
- Pasta `creeser-api/` com todo o código
- `.env.example` preenchido
- `package.json` com dependências
- `README.md` com instruções

**Próximos passos:**

1. **Setup local (para testes):**
   ```bash
   cd creeser-api
   npm install
   docker-compose up -d          # Inicia PostgreSQL
   npx prisma migrate dev        # Cria tabelas
   npx prisma db seed            # Insere dados de teste
   npm run dev                   # Inicia servidor
   ```

2. **Testar endpoints localmente:**
   ```bash
   # Login
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@creeser.com",
       "senha": "admin123",
       "empresaId": "empresa_1"
     }'
   
   # Obter token
   # TOKEN=xyz...
   
   # Listar alunos
   curl -X GET http://localhost:3001/api/v1/alunos \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Deploy na VPS:**
   - Seguir instruções do README fornecido pelo ChatGPT
   - Tipicamente:
     ```bash
     # Na VPS
     git clone seu-repo
     cd creeser-api
     npm install
     
     # Setup .env na VPS com dados reais
     npm run build
     npm start
     
     # Ou usar PM2 para manter rodando
     pm2 start "npm start" --name "creeser-api"
     ```

---

### 3. EU VOU GERENCIAR VIA API

Após o backend estar rodando na VPS, eu vou:

1. **Criar novas tabelas/campos** (se necessário via Prisma)
2. **Gerar dados de teste** em massa
3. **Testar isolamento de tenant**
4. **Criar endpoints complexos** (relatórios, buscas avançadas)
5. **Validar integração** com frontend Next.js

---

## CHECKLIST ANTES DE CHAMAR CHATGPT

- [ ] Copiei o prompt completo acima
- [ ] Adaptei variáveis de ambiente para sua VPS
- [ ] Preparei o link do documento de arquitetura (ARQUITETURA_MULTITENANT_PRODUCAO.md)
- [ ] Tenho acesso SSH à VPS
- [ ] VPS tem Node.js + PostgreSQL instalado (ou usará Docker)
- [ ] VPS tem porta 3001 disponível para API

---

## RESPOSTA ESPERADA DO CHATGPT

O ChatGPT deve entregar um repositório Git pronto com:

```
✅ Express app rodando em :3001
✅ PostgreSQL conectado via Prisma
✅ Endpoints /api/v1/auth/login funcionando
✅ Middleware de JWT validando token
✅ Middleware de tenant isolando dados por empresaId
✅ Todos os CRUD básicos implementados
✅ Rate limiting + validação de inputs
✅ Logs de auditoria em cada operação
✅ CORS habilitado para Next.js
✅ .env.example + README com instruções
✅ Testes passando
```

---

## PRÓXIMA ETAPA (COMIGO - GITHUB COPILOT)

1. Você informa: "API está rodando em https://api.creeser.com"
2. Você me fornece: URL da API + Credenciais de teste
3. Eu:
   - Testo isolamento de dados (empresa 1 vs empresa 2)
   - Crio migrações de dados do JSON atual → PostgreSQL
   - Crio novas rotas complexas se necessário
   - Integro frontend Next.js com nova API
   - Valido segurança end-to-end

---

## ESTRUTURA DE MENSAGEM PARA O CHATGPT

Use exatamente assim:

```
Quero criar uma API backend completo para um sistema educacional 
multi-empresa chamado CREESER, seguindo a arquitetura multi-tenant.

[Colar documento ARQUITETURA_MULTITENANT_PRODUCAO.md aqui]

[Colar o prompt de instruções acima aqui]

Por favor, crie o projeto completo em Node.js + Express + PostgreSQL + Prisma.
Quando terminar, forneça:
1. Código-fonte completo
2. .env.example
3. README com instruções de setup e deploy
4. Postman collection com exemplos de endpoints
5. Tests básicos

Deixe comentários no código explicando o padrão multi-tenant.
```

---

## FAQ

**P: E se o ChatGPT não entregar tudo correto?**
R: Você volta e refina com: "Falta validação de tenant em X rota" ou "Não está isolando dados corretamente em Y tabela"

**P: Posso começar com um subset de endpoints?**
R: Sim! Comece com: auth, usuarios, alunos, turmas. Depois adicione outros.

**P: E a segurança? É realmente segura para produção?**
R: Com este documento, sim! Middleware de tenant + JWT é seguro. Você pode adicionar:
- HTTPS (Let's Encrypt na VPS)
- Firewall (apenas portas 80, 443, 22)
- Rate limiting + DDoS protection (CloudFlare)
- WAF (Web Application Firewall)

**P: Como migrar dados do JSON atual?**
R: Eu vou criar um script de migração que:
1. Lê os JSONs em `data/`
2. Mapeia para o novo schema Prisma
3. Insere com validação de tenant

---

**Status**: Pronto para compartilhar com ChatGPT! 🚀
