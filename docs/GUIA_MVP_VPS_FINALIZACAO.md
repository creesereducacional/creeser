# Guia Prático: Finalizando MVP na VPS

**Objetivo**: Completar MVP com auth, tenant middleware, logs e rate limit funcionando 100% na VPS

**Tempo estimado**: 4-6 horas de implementação

---

## 1. Stack de Desenvolvimento

```
Frontend: Next.js 16 (já existe)
Backend: Node.js + Express.js (criar com ChatGPT)
Database: PostgreSQL na VPS
Process Manager: PM2 (próximo passo)
Backup: Cron + pg_dump (vide SETUP_BACKUP_VPS.md)
```

---

## 2. Pré-requisitos na VPS

### 2.1 Verificar Ambiente

```bash
# SSH na VPS
ssh usuario@seu-ip-vps

# Verificar Node.js
node -v  # deve ser 18+
npm -v

# Verificar PostgreSQL
sudo systemctl status postgresql
# Conectar ao PostgreSQL
psql -U postgres -h localhost

# Listar databases
\l

# Criar database para MVP
CREATE DATABASE creeser_mvp;
CREATE USER creeser_user WITH PASSWORD 'sua_senha_forte_aqui';
GRANT ALL PRIVILEGES ON DATABASE creeser_mvp TO creeser_user;
ALTER DATABASE creeser_mvp OWNER TO creeser_user;
\q
```

### 2.2 Criar Estrutura de Pastas

```bash
# Na VPS, criar estrutura
mkdir -p ~/projects/creeser-backend
cd ~/projects/creeser-backend

# Criar .env
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://creeser_user:sua_senha_forte_aqui@localhost:5432/creeser_mvp"

# API
PORT=3001
NODE_ENV="production"
API_URL="http://seu-ip-vps:3001"

# JWT
JWT_SECRET="sua_chave_jwt_aleatoria_muito_longa_aqui"
JWT_EXPIRATION="24h"
JWT_REFRESH_EXPIRATION="7d"

# CORS
FRONTEND_URL="http://seu-ip-vps:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL="info"
LOG_FILE="/home/usuario/projects/creeser-backend/logs/app.log"
EOF

# Criar pasta de logs
mkdir -p logs
```

---

## 3. Implementação do Backend com ChatGPT

### 3.1 Prompt Exato para ChatGPT

**Copiar integralmente do arquivo**: `GUIA_CHATGPT_CRIAR_API.md`

**Anexos necessários**:
- `ARQUITETURA_MULTITENANT_PRODUCAO.md`
- `PADRAO_SCHEMA_DINAMICO_JSONB.md`

**Instruções**:
1. Abrir ChatGPT
2. Colar o prompt completo
3. Anexar os 2 arquivos de arquitetura
4. Solicitar: "Crie o backend complete pronto para deploy em VPS com PostgreSQL"
5. Receber: Arquivo ZIP com projeto Express.js estruturado

### 3.2 Estrutura de Pastas Esperada

```
creeser-backend/
├── src/
│   ├── middleware/
│   │   ├── auth.js           # JWT verification + empresaId validation
│   │   ├── tenantIsolation.js # Tenant isolation enforcement
│   │   ├── rateLimit.js       # Rate limiting logic
│   │   └── errorHandler.js    # Centralized error handling
│   │
│   ├── controllers/
│   │   ├── authController.js  # Login, register, refresh token
│   │   ├── usuariosController.js
│   │   ├── alunosController.js
│   │   └── ... (outros)
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── usuariosService.js
│   │   └── ... (outros)
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── usuarios.js
│   │   ├── alunos.js
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── logger.js          # Logging para arquivos
│   │   ├── validators.js      # Validação de dados
│   │   └── formatters.js      # Formatação de resposta
│   │
│   └── app.js                 # Express setup
│
├── prisma/
│   └── schema.prisma          # Schema completo (30+ tabelas)
│
├── migrations/
│   └── ... (criadas por Prisma)
│
├── .env                       # (já criado acima)
├── .env.example              # Template para deploy
├── .gitignore
├── package.json
├── index.js                  # Entry point
└── README.md
```

---

## 4. Componentes Críticos do MVP

### 4.1 Autenticação (JWT + Tenant)

**Arquivo**: `src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarTokenJWT(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar dados ao request
    req.user = {
      id: decoded.sub,
      empresaId: decoded.empresaId,
      tipo: decoded.tipo,
      unidadeId: decoded.unidadeId,
      email: decoded.email
    };

    // Validar empresa existe ainda
    const empresa = await prisma.empresa.findUnique({
      where: { id: req.user.empresaId }
    });

    if (!empresa) {
      return res.status(403).json({ erro: 'Empresa inválida' });
    }

    next();
  } catch (erro) {
    if (erro.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado' });
    }
    res.status(401).json({ erro: 'Token inválido' });
  }
}

module.exports = { verificarTokenJWT };
```

**Arquivo**: `src/controllers/authController.js`

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    // Validar entrada
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha obrigatórios' });
    }

    // Buscar usuário
    const usuario = await prisma.usuario.findFirst({
      where: { 
        email: email.toLowerCase(),
        deletedAt: null
      },
      include: {
        empresa: true
      }
    });

    if (!usuario) {
      logger.warn(`Login failed: usuário ${email} não encontrado`, { email });
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    // Validar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      logger.warn(`Login failed: senha incorreta para ${email}`, { email });
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    // Gerar token
    const token = jwt.sign(
      {
        sub: usuario.id,
        empresaId: usuario.empresaId,
        tipo: usuario.tipo,
        unidadeId: usuario.unidadeId,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    const refreshToken = jwt.sign(
      { sub: usuario.id, empresaId: usuario.empresaId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
    );

    // Registrar log de acesso
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        acao: 'LOGIN',
        tabela: 'usuario',
        registroId: usuario.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        dadosAntigos: null,
        dadosNovos: { login: new Date().toISOString() }
      }
    });

    logger.info(`Login success: ${email}`, { email, empresaId: usuario.empresaId });

    res.json({
      sucesso: true,
      token,
      refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo,
        empresaId: usuario.empresaId,
        empresa: usuario.empresa.nome
      }
    });
  } catch (erro) {
    logger.error('Login error', { erro: erro.message });
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
}

module.exports = { login };
```

### 4.2 Middleware de Tenant Isolation

**Arquivo**: `src/middleware/tenantIsolation.js`

```javascript
const logger = require('../utils/logger');

function garantirIsolacaoTenant(req, res, next) {
  // Garantir que usuário está autenticado
  if (!req.user || !req.user.empresaId) {
    logger.warn('Access denied: no user or empresaId', { ip: req.ip });
    return res.status(401).json({ erro: 'Não autenticado' });
  }

  // Validar se empresaId no corpo (se POST/PUT) corresponde ao token
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    if (req.body.empresaId && req.body.empresaId !== req.user.empresaId) {
      logger.warn('SECURITY: Tenant mismatch attempt', {
        tokenEmpresaId: req.user.empresaId,
        bodyEmpresaId: req.body.empresaId,
        usuarioId: req.user.id,
        ip: req.ip
      });
      return res.status(403).json({ erro: 'Acesso negado: empresa não corresponde' });
    }
    
    // Auto-adicionar empresaId se não informado
    req.body.empresaId = req.user.empresaId;
  }

  // Adicionar helper para queries com isolação automática
  req.tenantFilter = { empresaId: req.user.empresaId };

  next();
}

module.exports = { garantirIsolacaoTenant };
```

### 4.3 Rate Limiting

**Arquivo**: `src/middleware/rateLimit.js`

```javascript
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limit geral
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por window
  message: { erro: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: false,
  skip: (req) => req.user?.tipo === 'admin', // Admins sem limite
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      usuarioId: req.user?.id,
      empresaId: req.user?.empresaId,
      rota: req.originalUrl
    });
    res.status(429).json({ erro: 'Muitas requisições, tente novamente mais tarde' });
  }
});

// Rate limit para login (mais restrito)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 tentativas de login
  message: { erro: 'Muitas tentativas de login, tente novamente em 15 minutos' },
  standardHeaders: false,
  skip: false,
  handler: (req, res) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });
    res.status(429).json({ erro: 'Muitas tentativas de login, tente novamente em 15 minutos' });
  }
});

module.exports = { limiter, loginLimiter };
```

### 4.4 Logging Estruturado

**Arquivo**: `src/utils/logger.js`

```javascript
const fs = require('fs');
const path = require('path');

const logDir = process.env.LOG_FILE ? path.dirname(process.env.LOG_FILE) : './logs';
const logFile = process.env.LOG_FILE || './logs/app.log';

// Garantir que pasta de logs existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function formatarLog(nivel, mensagem, contexto = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    nivel,
    mensagem,
    ...contexto,
    nodeEnv: process.env.NODE_ENV
  });
}

function escreverLog(nivel, mensagem, contexto = {}) {
  const log = formatarLog(nivel, mensagem, contexto);
  
  // Console sempre
  console.log(`[${nivel}] ${mensagem}`, contexto);
  
  // Arquivo em produção
  if (process.env.NODE_ENV === 'production') {
    fs.appendFileSync(logFile, log + '\n', 'utf8');
  }
}

module.exports = {
  info: (msg, ctx) => escreverLog('INFO', msg, ctx),
  warn: (msg, ctx) => escreverLog('WARN', msg, ctx),
  error: (msg, ctx) => escreverLog('ERROR', msg, ctx),
  debug: (msg, ctx) => {
    if (process.env.NODE_ENV !== 'production') {
      escreverLog('DEBUG', msg, ctx);
    }
  }
};
```

---

## 5. Setup do App Principal

**Arquivo**: `src/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { limiter, loginLimiter } = require('./middleware/rateLimit');
const { verificarTokenJWT } = require('./middleware/auth');
const { garantirIsolacaoTenant } = require('./middleware/tenantIsolation');

const app = express();

// Middlewares globais
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Empresa-Id']
}));

// Rate limiting
app.use('/api/', limiter);

// Logging de requisições
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      usuarioId: req.user?.id,
      empresaId: req.user?.empresaId
    });
  });
  next();
});

// Rotas públicas
app.post('/api/auth/login', loginLimiter, require('./routes/auth').login);
app.post('/api/auth/register', require('./routes/auth').register);
app.post('/api/auth/refresh-token', require('./routes/auth').refreshToken);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Middlewares de proteção
app.use('/api/', verificarTokenJWT);
app.use('/api/', garantirIsolacaoTenant);

// Rotas protegidas
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/alunos', require('./routes/alunos'));
app.use('/api/professores', require('./routes/professores'));
app.use('/api/auditoria', require('./routes/auditoria'));
// ... adicionar outras rotas

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    erro: err.message,
    stack: err.stack,
    usuarioId: req.user?.id,
    empresaId: req.user?.empresaId
  });
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

module.exports = app;
```

**Arquivo**: `index.js` (Entry point)

```javascript
const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');
const logger = require('./src/utils/logger');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

async function iniciar() {
  try {
    // Testar conexão com banco
    await prisma.$connect();
    logger.info('✓ Conectado ao PostgreSQL');

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`✓ Servidor rodando na porta ${PORT}`, {
        ambiente: process.env.NODE_ENV,
        apiUrl: process.env.API_URL
      });
    });
  } catch (erro) {
    logger.error('Falha ao iniciar servidor', { erro: erro.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

iniciar();
```

---

## 6. Package.json

```json
{
  "name": "creeser-backend-mvp",
  "version": "1.0.0",
  "description": "Backend MVP para CREESER - Multi-tenant educational platform",
  "main": "index.js",
  "scripts": {
    "dev": "NODE_ENV=development nodemon index.js",
    "start": "NODE_ENV=production node index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "test": "jest --coverage"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.0.0",
    "jsonwebtoken": "^9.1.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@prisma/cli": "^5.0.0",
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  }
}
```

---

## 7. Passos de Implementação

### Passo 1: Obter Backend do ChatGPT
- [ ] Abrir `GUIA_CHATGPT_CRIAR_API.md`
- [ ] Copiar prompt completo
- [ ] Anexar arquivos de arquitetura
- [ ] Solicitar backend completo
- [ ] Baixar ZIP gerado
- [ ] Extrair em `~/projects/creeser-backend`

### Passo 2: Configurar Ambiente
- [ ] SSH na VPS
- [ ] Criar database PostgreSQL
- [ ] Copiar `.env` (vide seção 2.2)
- [ ] Executar `npm install`
- [ ] Executar `npx prisma migrate deploy`

### Passo 3: Testar Localmente (opcional)
- [ ] `npm run dev`
- [ ] Testar: `curl http://localhost:3001/health`
- [ ] Testar login: `curl -X POST http://localhost:3001/api/auth/login -d '{"email":"...","senha":"..."}'`

### Passo 4: Deploy na VPS
- [ ] Garantir node/npm instalados na VPS
- [ ] Copiar projeto para VPS
- [ ] Setup backup (vide `SETUP_BACKUP_VPS.md`)
- [ ] Próximo: PM2 (você guia - vide `GUIA_PM2_DEPLOYMENT.md`)

### Passo 5: Testes de Segurança
- [ ] Usar `GUIA_TESTES_MULTITENANT.md`
- [ ] Validar isolação entre tenants
- [ ] Testar rate limiting
- [ ] Verificar logs

---

## 8. Troubleshooting

### Erro: "Não consegue conectar ao PostgreSQL"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar credenciais no .env
psql -U creeser_user -h localhost -d creeser_mvp

# Testar com psql
psql -U postgres -c "SELECT version();"
```

### Erro: "PORT 3001 already in use"
```bash
# Encontrar processo usando a porta
lsof -i :3001

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3002 npm start
```

### Erro: "Prisma migration failed"
```bash
# Ver status das migrations
prisma migrate status

# Reset database (ATENÇÃO: apaga dados!)
prisma migrate reset

# Ou deploy com --skip-generate
prisma migrate deploy --skip-generate
```

### Logs não aparecem
```bash
# Verificar permissões da pasta
ls -la ~/projects/creeser-backend/logs/

# Criar pasta se não existir
mkdir -p ~/projects/creeser-backend/logs
chmod 755 ~/projects/creeser-backend/logs

# Verificar NODE_ENV
echo $NODE_ENV

# Logs vão para arquivo apenas em production
NODE_ENV=production npm start
```

---

## 9. Próximos Passos

**Quando você avisar**:
1. Leio `GUIA_PM2_DEPLOYMENT.md`
2. Setup PM2 para iniciar ao boot
3. Configurar logs do PM2
4. Criar script de monitoramento

**Depois do MVP validado**:
1. Usar `CHECKLIST_MIGRACAO_SUPABASE.md`
2. Migrar dados de VPS → Supabase
3. Testar ambiente novo
4. Fazer cutover com zero downtime

---

## 10. Checklist Final MVP

- [ ] Backend rodando na VPS (npm start)
- [ ] Database PostgreSQL com schema Prisma
- [ ] Autenticação JWT funcionando
- [ ] Rate limiting protegendo endpoints
- [ ] Logs sendo gravados
- [ ] CORS configurado corretamente
- [ ] Isolação de tenant validada
- [ ] Backup cron configurado (vide SETUP_BACKUP_VPS.md)
- [ ] Next.js frontend consegue chamar API
- [ ] Testes de segurança passando

Quando tudo isso estiver ✓, é MVP validado e aí sim migramos para Supabase!

---

**Próximo**: `SETUP_BACKUP_VPS.md` (backup automático)
