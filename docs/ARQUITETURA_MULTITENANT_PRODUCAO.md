# 🏗️ ARQUITETURA MULTI-TENANT PARA PRODUÇÃO

## 1. VISÃO GERAL

Este documento define a estratégia de multi-tenant (multi-empresa) para o sistema CREESER usando PostgreSQL + Prisma + Node.js/Express.

### Princípios de Design:
- ✅ **Isolamento de Dados**: Cada empresa vê apenas seus dados
- ✅ **Escalabilidade Horizontal**: Suporta crescimento sem modificar código
- ✅ **Segurança**: Token JWT com tenant_id validado em toda requisição
- ✅ **Auditoria**: Logs de todas operações com empresa_id
- ✅ **Compatibilidade**: Frontend Next.js continua funcionando com ajustes mínimos

---

## 2. MODELO MULTI-TENANT

### Abordagem: Row-Level Tenant Isolation (RLS)

```
┌─────────────────────────────────────────┐
│         PostgreSQL (uma DB única)       │
├─────────────────────────────────────────┤
│ ┌────────────────────────────────────┐  │
│ │  Empresa 1 (empresa_id = 1)       │  │
│ │  - Usuários (5)                    │  │
│ │  - Alunos (200)                    │  │
│ │  - Turmas (10)                     │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │  Empresa 2 (empresa_id = 2)       │  │
│ │  - Usuários (3)                    │  │
│ │  - Alunos (50)                     │  │
│ │  - Turmas (2)                      │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │  Empresa 3 (empresa_id = 3)       │  │
│ │  - Usuários (10)                   │  │
│ │  - Alunos (500)                    │  │
│ │  - Turmas (25)                     │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Vantagem**: Uma única instância de DB, dados isolados por tenant_id

---

## 3. SCHEMA PRISMA (prisma/schema.prisma)

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== TENANT (EMPRESA) =====
model Empresa {
  id                    String     @id @default(cuid())
  nome                  String
  nomeFantasia          String?
  cnpj                  String     @unique
  razaoSocial           String
  email                 String
  telefone              String?
  website               String?
  logo                  String?
  descricao             String?
  
  // Endereço
  endereco              String?
  numero                String?
  complemento           String?
  bairro                String?
  cidade                String?
  estado                String?
  cep                   String?
  pais                  String?    @default("Brasil")
  
  // Controle
  status                String     @default("ativo") // ativo, inativo, suspeso
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  // Relacionamentos
  unidades              Unidade[]
  usuarios              Usuario[]
  funcionarios          Funcionario[]
  alunos                Aluno[]
  professores           Professor[]
  cursos                Curso[]
  turmas                Turma[]
  disciplinas           Disciplina[]
  avaliacoes            Avaliacao[]
  notas                 Nota[]
  faltas                Falta[]
  documentos            Documento[]
  emails                EmailEnviado[]
  forum                 Forum[]
  noticias              Noticia[]
  
  @@index([cnpj])
  @@index([status])
}

// ===== UNIDADES (FILIAIS/POLOS) =====
model Unidade {
  id                    String     @id @default(cuid())
  empresaId             String
  nome                  String
  cnpj                  String?
  email                 String?
  telefone              String?
  endereco              String?
  numero                String?
  complemento           String?
  bairro                String?
  cidade                String?
  estado                String?
  cep                   String?
  local                 String?
  codigoPoloRecenseamento String?
  instituicaoEnsinoSuperior Boolean?
  situacao              String?    @default("ATIVO")
  codMecMantenedora     String?
  cnpjMantenedora       String?
  razaoSocial           String?
  cepMantenedora        String?
  logradouroMantenedora String?
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  // Relacionamentos
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  turmas                Turma[]
  usuarios              Usuario[]
  
  @@unique([empresaId, cnpj])
  @@index([empresaId])
}

// ===== USUÁRIOS DO SISTEMA =====
model Usuario {
  id                    String     @id @default(cuid())
  empresaId             String
  unidadeId             String?
  nomeCompleto          String
  email                 String
  senha                 String     // hash bcrypt
  tipo                  String     // admin, professor, aluno, funcionario, matriculador
  avatar                String?
  ativo                 Boolean    @default(true)
  
  // Controle de acesso
  ultimoLogin           DateTime?
  tentativasFalhas      Int        @default(0)
  bloqueadoAte          DateTime?
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  // Relacionamentos
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  unidade               Unidade?   @relation(fields: [unidadeId], references: [id])
  tokens                TokenAcesso[]
  permissoes            Permissao[]
  logs                  AuditoriaLog[]
  
  @@unique([empresaId, email])
  @@index([empresaId])
  @@index([email])
  @@index([tipo])
}

// ===== TOKENS DE AUTENTICAÇÃO =====
model TokenAcesso {
  id                    String     @id @default(cuid())
  usuarioId             String
  token                 String     @unique
  tokenRefresh          String?    @unique
  expiresAt             DateTime
  revokedAt             DateTime?
  criadoEm              DateTime   @default(now())
  
  usuario               Usuario    @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  @@index([usuarioId])
  @@index([token])
}

// ===== PERMISSÕES (RBAC) =====
model Permissao {
  id                    String     @id @default(cuid())
  usuarioId             String
  recurso               String     // exemplo: "alunos", "turmas", "notas"
  acao                  String     // criar, ler, atualizar, deletar
  criadoEm              DateTime   @default(now())
  
  usuario               Usuario    @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  @@unique([usuarioId, recurso, acao])
  @@index([usuarioId])
}

// ===== FUNCIONÁRIOS =====
model Funcionario {
  id                    String     @id @default(cuid())
  empresaId             String
  nomeCompleto          String
  email                 String
  cpf                   String?
  rg                    String?
  telefone              String?
  celular               String?
  dataNascimento        DateTime?
  nacionalidade         String?
  estadoCivil           String?
  sexo                  String?
  
  // Endereço
  endereco              String?
  numero                String?
  complemento           String?
  bairro                String?
  cidade                String?
  estado                String?
  cep                   String?
  
  // Profissional
  cargo                 String?
  departamento          String?
  dataPosseTomacao      DateTime?
  dataAdmissao          DateTime?
  dataExoneracao        DateTime?
  statusVinculo         String?
  cargaHoraria          Int?
  
  ativo                 Boolean    @default(true)
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  
  @@unique([empresaId, cpf])
  @@index([empresaId])
  @@index([email])
}

// ===== PROFESSORES =====
model Professor {
  id                    String     @id @default(cuid())
  empresaId             String
  nomeCompleto          String
  email                 String
  cpf                   String?
  telefone              String?
  celular               String?
  dataNascimento        DateTime?
  formacao              String?
  especializacao        String?
  areaAtuacao           String?
  
  ativo                 Boolean    @default(true)
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  disciplinas           DisciplinaProfessor[]
  avaliacoes            Avaliacao[]
  
  @@unique([empresaId, email])
  @@index([empresaId])
}

// ===== ALUNOS =====
model Aluno {
  id                    String     @id @default(cuid())
  empresaId             String
  nomeCompleto          String
  email                 String?
  cpf                   String?
  rg                    String?
  dataNascimento        DateTime?
  sexo                  String?
  nacionalidade         String?
  naturalidade          String?
  nomeMae               String?
  nomePai               String?
  
  // Endereço
  endereco              String?
  numero                String?
  complemento           String?
  bairro                String?
  cidade                String?
  estado                String?
  cep                   String?
  
  // Responsáveis
  nomeResponsavel1      String?
  emailResponsavel1     String?
  telefoneResponsavel1  String?
  nomeResponsavel2      String?
  emailResponsavel2     String?
  telefoneResponsavel2  String?
  
  // Acadêmico
  statusAcademico       String?    @default("ativo") // ativo, inativo, trancado, concluido
  dataCadastro          DateTime   @default(now())
  ativo                 Boolean    @default(true)
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  matriculas            Matricula[]
  notas                 Nota[]
  faltas                Falta[]
  
  @@unique([empresaId, cpf])
  @@unique([empresaId, email])
  @@index([empresaId])
  @@index([statusAcademico])
}

// ===== CURSOS =====
model Curso {
  id                    String     @id @default(cuid())
  empresaId             String
  codigo                String
  nome                  String
  descricao             String?
  cargaHoraria          Int?
  tipo                  String?    // presencial, ead, hibrido
  nivel                 String?    // fundamental, medio, superior
  status                String?    @default("ativo")
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  turmas                Turma[]
  disciplinas           Disciplina[]
  
  @@unique([empresaId, codigo])
  @@index([empresaId])
}

// ===== TURMAS =====
model Turma {
  id                    String     @id @default(cuid())
  empresaId             String
  unidadeId             String
  cursoId               String
  anoLetivo             String
  semestre              String?
  codigo                String
  nome                  String
  turno                  String?    // matutino, vespertino, noturno
  capacidade            Int?
  dataInicio            DateTime?
  dataFim               DateTime?
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  unidade               Unidade    @relation(fields: [unidadeId], references: [id])
  curso                 Curso      @relation(fields: [cursoId], references: [id])
  matriculas            Matricula[]
  disciplinas           DisciplinaTurma[]
  avaliacoes            Avaliacao[]
  notas                 Nota[]
  faltas                Falta[]
  
  @@unique([empresaId, anoLetivo, codigo])
  @@index([empresaId])
  @@index([unidadeId])
  @@index([cursoId])
}

// ===== MATRÍCULAS =====
model Matricula {
  id                    String     @id @default(cuid())
  empresaId             String
  alunoId               String
  turmaId               String
  anoLetivo             String
  status                String?    @default("ativo") // ativo, trancado, cancelado, concluido
  dataMatricula         DateTime   @default(now())
  dataVencimento        DateTime?
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  aluno                 Aluno      @relation(fields: [alunoId], references: [id])
  turma                 Turma      @relation(fields: [turmaId], references: [id])
  
  @@unique([alunoId, turmaId])
  @@index([empresaId])
  @@index([alunoId])
  @@index([turmaId])
}

// ===== DISCIPLINAS =====
model Disciplina {
  id                    String     @id @default(cuid())
  empresaId             String
  cursoId               String
  codigo                String
  nome                  String
  descricao             String?
  cargaHoraria          Int?
  creditosAula          Int?
  creditosTrabalho      Int?
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  curso                 Curso      @relation(fields: [cursoId], references: [id])
  turmas                DisciplinaTurma[]
  professores           DisciplinaProfessor[]
  avaliacoes            Avaliacao[]
  notas                 Nota[]
  
  @@unique([empresaId, codigo])
  @@index([empresaId])
  @@index([cursoId])
}

// ===== DISCIPLINA POR TURMA =====
model DisciplinaTurma {
  id                    String     @id @default(cuid())
  turmaId               String
  disciplinaId          String
  semestreLetivo        String?
  
  turma                 Turma      @relation(fields: [turmaId], references: [id])
  disciplina            Disciplina @relation(fields: [disciplinaId], references: [id])
  
  @@unique([turmaId, disciplinaId])
}

// ===== DISCIPLINA POR PROFESSOR =====
model DisciplinaProfessor {
  id                    String     @id @default(cuid())
  professorId           String
  disciplinaId          String
  anoLetivo             String
  
  professor             Professor  @relation(fields: [professorId], references: [id])
  disciplina            Disciplina @relation(fields: [disciplinaId], references: [id])
  
  @@unique([professorId, disciplinaId, anoLetivo])
}

// ===== AVALIAÇÕES =====
model Avaliacao {
  id                    String     @id @default(cuid())
  empresaId             String
  turmaId               String
  disciplinaId          String
  professorId           String
  tipo                  String?    // prova, trabalho, participacao, etc
  descricao             String?
  dataAplicacao         DateTime?
  dataResultado         DateTime?
  pesoNota              Float?     @default(1.0)
  status                String?    @default("planejada")
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  turma                 Turma      @relation(fields: [turmaId], references: [id])
  disciplina            Disciplina @relation(fields: [disciplinaId], references: [id])
  professor             Professor  @relation(fields: [professorId], references: [id])
  notas                 Nota[]
  
  @@index([empresaId])
  @@index([turmaId])
}

// ===== NOTAS =====
model Nota {
  id                    String     @id @default(cuid())
  empresaId             String
  alunoId               String
  turmaId               String
  disciplinaId          String
  avaliacaoId           String?
  valor                 Float?
  descricao             String?
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  aluno                 Aluno      @relation(fields: [alunoId], references: [id])
  turma                 Turma      @relation(fields: [turmaId], references: [id])
  disciplina            Disciplina @relation(fields: [disciplinaId], references: [id])
  avaliacao             Avaliacao? @relation(fields: [avaliacaoId], references: [id])
  
  @@unique([empresaId, alunoId, disciplinaId, avaliacaoId])
  @@index([empresaId])
  @@index([alunoId])
}

// ===== FALTAS =====
model Falta {
  id                    String     @id @default(cuid())
  empresaId             String
  alunoId               String
  turmaId               String
  disciplinaId          String
  dataFalta             DateTime
  qtdFaltas             Int
  descricao             String?
  justificativa         String?
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  aluno                 Aluno      @relation(fields: [alunoId], references: [id])
  turma                 Turma      @relation(fields: [turmaId], references: [id])
  disciplina            Disciplina @relation(fields: [disciplinaId], references: [id])
  
  @@index([empresaId])
  @@index([alunoId])
}

// ===== DOCUMENTOS =====
model Documento {
  id                    String     @id @default(cuid())
  empresaId             String
  titulo                String
  descricao             String?
  tipo                  String?    // termo, decreto, etc
  urlArquivo            String
  dataCriacao           DateTime   @default(now())
  dataAtualizacao       DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  
  @@index([empresaId])
}

// ===== EMAILS ENVIADOS =====
model EmailEnviado {
  id                    String     @id @default(cuid())
  empresaId             String
  destinatario          String
  assunto               String
  corpo                 String
  status                String?    @default("enviado")
  dataTentativa         DateTime   @default(now())
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  
  @@index([empresaId])
  @@index([destinatario])
}

// ===== FORUM =====
model Forum {
  id                    String     @id @default(cuid())
  empresaId             String
  titulo                String
  descricao             String?
  categoria             String?
  status                String?    @default("ativo")
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  
  @@index([empresaId])
}

// ===== NOTÍCIAS =====
model Noticia {
  id                    String     @id @default(cuid())
  empresaId             String
  titulo                String
  descricao             String?
  conteudo              String?
  autor                 String?
  destaque              Boolean    @default(false)
  status                String?    @default("publicada")
  dataCriacao           DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  
  @@index([empresaId])
}

// ===== SCHEMA CUSTOMIZADO (FIELDS DINÂMICOS) =====
model SchemaCustomizado {
  id                    String     @id @default(cuid())
  empresaId             String
  nomeEntidade          String     // "perfil_aluno", "dados_laboratoriais", etc
  descricao             String?
  
  // Campos customizáveis como JSONB
  // Formato: [{ nome, tipo, obrigatorio, label, regex, minLength, maxLength }]
  campos                Json
  
  ativo                 Boolean    @default(true)
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  dados                 DadosDinamicos[]
  
  @@unique([empresaId, nomeEntidade])
  @@index([empresaId])
  @@index([ativo])
}

// ===== DADOS DINÂMICOS (VALORES DE SCHEMA CUSTOMIZADO) =====
model DadosDinamicos {
  id                    String     @id @default(cuid())
  empresaId             String
  schemaId              String
  
  // Dados sem schema fixo - valores validados contra SchemaCustomizado.campos
  dados                 Json       // { campo1: valor, campo2: valor, ... }
  
  criadoEm              DateTime   @default(now())
  atualizadoEm          DateTime   @updatedAt
  
  empresa               Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  schema                SchemaCustomizado @relation(fields: [schemaId], references: [id], onDelete: Cascade)
  
  @@index([empresaId])
  @@index([schemaId])
}

// ===== AUDITORIA (LOGS) =====
model AuditoriaLog {
  id                    String     @id @default(cuid())
  usuarioId             String
  empresaId             String
  acao                  String     // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
  tabela                String     // nome da tabela afetada
  registroId            String?    // ID do registro afetado
  dadosAntigos          Json?
  dadosNovos            Json?
  ipAddress             String?
  userAgent             String?
  criadoEm              DateTime   @default(now())
  
  usuario               Usuario    @relation(fields: [usuarioId], references: [id])
  
  @@index([usuarioId])
  @@index([empresaId])
  @@index([criadoEm])
}
```

---

## 4. ESTRATÉGIA DE AUTENTICAÇÃO JWT

### Fluxo de Login:

```
1. Frontend envia: email + senha + empresaId
2. Backend:
   - Valida credenciais
   - Verifica se usuário pertence à empresa
   - Gera JWT com: { userId, empresaId, tipo, unidadeId }
   - Retorna: token + refreshToken
3. Frontend armazena: token + empresaId + userId
4. Todas requisições incluem: Authorization: Bearer <token>
```

### Estrutura do JWT:

```javascript
// Payload do token
{
  "sub": "usuario_id",           // Subject (ID do usuário)
  "empresaId": "empresa_id",     // ID da empresa (CRÍTICO!)
  "unidadeId": "unidade_id",     // ID da unidade (opcional)
  "tipo": "professor",            // Tipo de usuário
  "email": "prof@empresa.com",
  "iat": 1704067200,             // Issued at
  "exp": 1704153600              // Expiration (24h)
}
```

---

## 5. MIDDLEWARE DE AUTENTICAÇÃO

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // CRÍTICO: Validar se usuário pertence à empresa
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.sub },
    });

    if (!usuario || usuario.empresaId !== decoded.empresaId) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    // Anexar contexto à requisição
    req.user = {
      id: decoded.sub,
      empresaId: decoded.empresaId,
      unidadeId: decoded.unidadeId,
      tipo: decoded.tipo,
      email: decoded.email
    };

    next();
  } catch (error) {
    res.status(403).json({ erro: 'Token inválido' });
  }
}

export async function checkTenant(req, res, next) {
  // Garantir que tenant_id na rota matches req.user.empresaId
  const tenantIdFromRoute = req.params.empresaId || req.body.empresaId;
  
  if (tenantIdFromRoute && tenantIdFromRoute !== req.user.empresaId) {
    return res.status(403).json({ erro: 'Acesso negado a outro tenant' });
  }
  
  next();
}
```

---

## 6. ESTRUTURA DE PASTAS DO BACKEND

```
api-backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── src/
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── rateLimiter.js
│   ├── routes/
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
│   │   ├── unidades.js
│   │   ├── documentos.js
│   │   └── admin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usuariosController.js
│   │   ├── alunosController.js
│   │   ├── ... etc
│   ├── services/
│   │   ├── authService.js
│   │   ├── usuariosService.js
│   │   ├── alunosService.js
│   │   ├── ... etc
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── helpers.js
│   └── app.js
├── .env.example
├── package.json
└── README.md
```

---

## 7. VARIÁVEIS DE AMBIENTE (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/creeser_prod"

# JWT
JWT_SECRET="sua-chave-super-secreta-aqui-32-caracteres"
JWT_REFRESH_SECRET="outra-chave-secreta-para-refresh"
JWT_EXPIRATION="24h"
REFRESH_TOKEN_EXPIRATION="7d"

# Ambiente
NODE_ENV="production"
API_PORT=3001
API_URL="https://api.creeser.com"

# Frontend
FRONTEND_URL="https://creeser.com"
CORS_ORIGINS="https://creeser.com,https://www.creeser.com"

# Email (nodemailer)
SMTP_HOST="smtp.seuservidor.com"
SMTP_PORT=587
SMTP_USER="seu-email@seudominio.com"
SMTP_PASS="sua-senha"
SMTP_FROM="noreply@creeser.com"

# Segurança
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"
```

---

## 8. ENDPOINTS PRINCIPAIS DA API

### Autenticação:
```
POST   /api/v1/auth/login              - Login com email/senha
POST   /api/v1/auth/refresh            - Renovar token
POST   /api/v1/auth/logout             - Logout
POST   /api/v1/auth/reset-password     - Resetar senha
```

### Usuários:
```
GET    /api/v1/usuarios                - Listar (filtrado por empresa)
GET    /api/v1/usuarios/:id            - Obter um usuário
POST   /api/v1/usuarios                - Criar usuário
PUT    /api/v1/usuarios/:id            - Atualizar usuário
DELETE /api/v1/usuarios/:id            - Deletar usuário
```

### Alunos:
```
GET    /api/v1/alunos                  - Listar alunos da empresa
GET    /api/v1/alunos/:id              - Obter um aluno
POST   /api/v1/alunos                  - Criar aluno
PUT    /api/v1/alunos/:id              - Atualizar aluno
DELETE /api/v1/alunos/:id              - Deletar aluno
GET    /api/v1/alunos/:id/notas        - Notas de um aluno
GET    /api/v1/alunos/:id/faltas       - Faltas de um aluno
```

### Turmas:
```
GET    /api/v1/turmas                  - Listar turmas
POST   /api/v1/turmas                  - Criar turma
GET    /api/v1/turmas/:id              - Obter turma
PUT    /api/v1/turmas/:id              - Atualizar turma
GET    /api/v1/turmas/:id/alunos       - Alunos da turma
GET    /api/v1/turmas/:id/disciplinas  - Disciplinas da turma
```

### Notas e Avaliações:
```
GET    /api/v1/notas                   - Listar notas
POST   /api/v1/notas                   - Criar nota
PUT    /api/v1/notas/:id               - Atualizar nota
GET    /api/v1/avaliacoes              - Listar avaliações
POST   /api/v1/avaliacoes              - Criar avaliação
```

### Admin:
```
GET    /api/v1/admin/empresas          - Listar todas empresas (SUPER ADMIN)
POST   /api/v1/admin/empresas          - Criar empresa
GET    /api/v1/admin/logs              - Auditoria/Logs
```

---

## 9. EXEMPLO: IMPLEMENTAÇÃO DE UMA ROTA

```javascript
// routes/alunos.js
import express from 'express';
import { authenticateToken, checkTenant } from '../middleware/auth.js';
import { alunosController } from '../controllers/alunosController.js';

const router = express.Router();

// Middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Listar alunos da empresa (automático: filtra por req.user.empresaId)
router.get('/', async (req, res) => {
  try {
    const alunos = await prisma.aluno.findMany({
      where: {
        empresaId: req.user.empresaId, // CRÍTICO: Isolamento de dados
      },
    });
    res.json(alunos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Obter aluno específico (com validação de tenant)
router.get('/:id', async (req, res) => {
  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id: req.params.id },
    });

    // Validar que o aluno pertence à empresa do usuário
    if (!aluno || aluno.empresaId !== req.user.empresaId) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }

    res.json(aluno);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Criar aluno (empresaId do token, não do body)
router.post('/', async (req, res) => {
  try {
    const aluno = await prisma.aluno.create({
      data: {
        ...req.body,
        empresaId: req.user.empresaId, // FORÇA empresaId do token
      },
    });
    res.status(201).json(aluno);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
```

---

## 10. FLUXO DE DADOS SEGURO

```
┌─────────────────────────────────────────────────────┐
│         FRONTEND (Next.js Atual)                     │
│  - localStorage: { token, empresaId, userId }       │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Authorization: Bearer <token>
                   │ Body: { empresaId, ... }
                   ▼
┌─────────────────────────────────────────────────────┐
│         BACKEND (Express + Prisma)                   │
│  1. authenticateToken()                             │
│     - Valida JWT                                    │
│     - Extrai empresaId do token                     │
│  2. checkTenant()                                   │
│     - Compara empresaId do body vs token            │
│  3. Business Logic                                  │
│     - Sempre filtra por empresaId                   │
│  4. AuditoriaLog()                                  │
│     - Registra com empresaId + usuarioId            │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Response: { data, empresaId, timestamp }
                   ▼
┌─────────────────────────────────────────────────────┐
│         POSTGRESQL DATABASE                          │
│  - Todos registros têm empresaId                    │
│  - Row-Level Security (RLS) opcional                │
└─────────────────────────────────────────────────────┘
```

---

## 11. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup Base
- [ ] Criar projeto Express.js
- [ ] Instalar dependências (prisma, postgres, jwt, bcrypt)
- [ ] Criar banco de dados PostgreSQL
- [ ] Executar `prisma migrate dev` com schema
- [ ] Criar seeds para dados iniciais

### Fase 2: Autenticação
- [ ] Implementar middleware de JWT
- [ ] Criar endpoint /api/v1/auth/login
- [ ] Implementar refresh token
- [ ] Adicionar rate limiting

### Fase 3: CRUD Básico
- [ ] Alunos (CRUD completo)
- [ ] Turmas (CRUD completo)
- [ ] Usuários (CRUD com controle de tenant)
- [ ] Professorres (CRUD)

### Fase 4: Funcionalidades
- [ ] Notas e Avaliações
- [ ] Faltas
- [ ] Documentos
- [ ] Auditoria de logs

### Fase 5: Segurança & Deploy
- [ ] CORS configurado
- [ ] Rate limiting
- [ ] Validação de inputs
- [ ] Criptografia de dados sensíveis
- [ ] Tests de integração
- [ ] Deploy na VPS

---

## 12. PRÓXIMOS PASSOS

1. **Você envia este documento ao ChatGPT** com a seguinte instrução:
   ```
   "Crie um backend em Node.js + Express + PostgreSQL + Prisma 
   seguindo este documento de arquitetura multi-tenant. 
   Use a estrutura de pastas e o schema Prisma fornecidos.
   Implemente o middleware de autenticação e os endpoints principais."
   ```

2. **ChatGPT cria o servidor na VPS** com:
   - Node.js + Express
   - PostgreSQL rodando
   - Prisma configurado
   - Endpoints de autenticação

3. **Eu acesso via API** para:
   - Criar/atualizar schema de tabelas
   - Gerar dados de teste
   - Validar isolamento de dados
   - Criar rotas complexas

4. **Você integra no Frontend** (Next.js atual):
   - Atualizar localStorage para salvar empresaId
   - Enviar empresaId em todas requisições
   - Ajustar componentes para multi-empresa

---

## 13. ESTRUTURA DE RESPOSTA DA API

```javascript
// Sucesso
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-12-27T10:30:00Z",
  "empresaId": "empresa_123"
}

// Erro
{
  "success": false,
  "erro": "Mensagem de erro",
  "code": "PERMISSION_DENIED",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

---

## RESUMO EXECUTIVO

| Aspecto | Implementação |
|---------|--------------|
| **Database** | PostgreSQL (única instância) |
| **Isolamento** | empresaId em todas tabelas |
| **Autenticação** | JWT com empresaId no payload |
| **Middleware** | Valida token + tenant_id |
| **Autorização** | RBAC (roles simples) + tenant |
| **Auditoria** | Logs com empresaId + usuarioId |
| **Escalabilidade** | Suporta N empresas na mesma DB |
| **Segurança** | RLS optional, validação em app-level |

---

**Desenvolvido com ❤️ para escalabilidade**
