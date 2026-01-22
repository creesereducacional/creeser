# 🏗️ PADRÃO: SCHEMA FIXO + METADADOS DINÂMICOS

## O PROBLEMA COM ALTERAÇÕES DINÂMICAS DE SCHEMA

Prisma (e qualquer ORM) **NÃO é adequado** para alterações de schema em runtime porque:

```
❌ PROBLEMA
├─ Prisma gera tipos TypeScript durante build
├─ Schema é estático (schema.prisma)
├─ Migrations são versionadas no git
├─ Executar DDL em runtime quebra o contrato de tipos
├─ Difícil de reverter/auditar
├─ Unsafe em ambientes multi-tenant
└─ Performance degradada

✅ SOLUÇÃO
├─ Core fixo via Prisma (tabelas que não mudam)
├─ Campos customizáveis via JSONB
├─ Metadados em tabela dedicada
├─ API /schema/* com whitelisting
└─ Totalmente versionado e auditável
```

---

## ARQUITETURA CORRETA

```
┌──────────────────────────────────────────────┐
│         BANCO DE DADOS (PostgreSQL)          │
├──────────────────────────────────────────────┤
│                                               │
│  CAMADA 1: CORE FIXO (Prisma)                │
│  ├─ Empresa                                   │
│  ├─ Usuario                                   │
│  ├─ Permissao                                 │
│  ├─ AuditoriaLog                              │
│  ├─ Unidade                                   │
│  └─ ... (tabelas que NUNCA MUDAM)             │
│                                               │
│  CAMADA 2: DINÂMICA (Metadados + JSONB)     │
│  ├─ SchemaCustomizado                        │
│  │  ├─ id                                     │
│  │  ├─ empresaId                              │
│  │  ├─ nomeEntidade (ex: "perfil_aluno")    │
│  │  ├─ campos: JSONB[]                        │
│  │  │  └─ [{ nome, tipo, obrigatorio, ... }] │
│  │  └─ criadoEm                               │
│  │                                            │
│  └─ DadosDinamicos                           │
│     ├─ id                                     │
│     ├─ empresaId                              │
│     ├─ schemaId (FK)                          │
│     ├─ dados: JSONB                           │
│     │  └─ { campo1, campo2, ... }             │
│     └─ criadoEm                               │
│                                               │
└──────────────────────────────────────────────┘
```

---

## ESQUEMA PRISMA ATUALIZADO

```prisma
// Tabelas FIXAS (Prisma)

model Empresa {
  id                String     @id @default(cuid())
  nome              String
  cnpj              String     @unique
  // ... campos normais
  
  schemasCustomizados SchemaCustomizado[]
  dadosDinamicos    DadosDinamicos[]
  
  @@index([cnpj])
}

// NOVO: Definição de schema customizado
model SchemaCustomizado {
  id                String     @id @default(cuid())
  empresaId         String
  nomeEntidade      String     // "perfil_aluno", "dados_laboratoriais", etc
  descricao         String?
  
  // Campos customizáveis como JSONB
  campos            Json       // Array de { nome, tipo, obrigatorio, label, regex, ... }
  
  ativo             Boolean    @default(true)
  criadoEm          DateTime   @default(now())
  atualizadoEm      DateTime   @updatedAt
  
  empresa           Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  dados             DadosDinamicos[]
  
  @@unique([empresaId, nomeEntidade])
  @@index([empresaId])
}

// NOVO: Armazenamento de dados dinâmicos
model DadosDinamicos {
  id                String     @id @default(cuid())
  empresaId         String
  schemaId          String
  
  // Dados sem schema fixo
  dados             Json       // { campo1: valor, campo2: valor, ... }
  
  criadoEm          DateTime   @default(now())
  atualizadoEm      DateTime   @updatedAt
  
  empresa           Empresa    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  schema            SchemaCustomizado @relation(fields: [schemaId], references: [id], onDelete: Cascade)
  
  @@index([empresaId])
  @@index([schemaId])
}

// Tabelas FIXAS continuam (Usuario, Aluno, Turma, etc.)
// ...
```

---

## API DE GERENCIAMENTO DE SCHEMA

### 1. Criar Schema Customizado

```javascript
// POST /api/v1/schemas
async function criarSchema(req, res) {
  const { empresaId } = req.user;
  const { nomeEntidade, descricao, campos } = req.body;

  // Validação
  if (!validarNomeEntidade(nomeEntidade)) {
    return res.status(400).json({ erro: 'Nome inválido' });
  }

  if (!validarCampos(campos)) {
    return res.status(400).json({ erro: 'Campos inválidos' });
  }

  // Criar schema
  const schema = await prisma.schemaCustomizado.create({
    data: {
      empresaId,
      nomeEntidade,
      descricao,
      campos: campos.map(validarCampo), // Sanitizar
    },
  });

  // Auditar
  await auditarOperacao(req, 'CREATE', 'SchemaCustomizado', schema.id);

  res.status(201).json({
    success: true,
    data: schema,
  });
}

// Validadores
function validarNomeEntidade(nome) {
  // Apenas a-z, 0-9, underscore
  return /^[a-z0-9_]+$/.test(nome) && nome.length <= 50;
}

function validarCampos(campos) {
  if (!Array.isArray(campos) || campos.length === 0) return false;
  
  const tiposValidos = ['string', 'number', 'boolean', 'date', 'email', 'url'];
  
  return campos.every(campo => {
    return (
      campo.nome && 
      tiposValidos.includes(campo.tipo) &&
      typeof campo.obrigatorio === 'boolean'
    );
  });
}

function validarCampo(campo) {
  return {
    nome: campo.nome,
    tipo: campo.tipo,
    obrigatorio: campo.obrigatorio ?? false,
    label: campo.label || campo.nome,
    regex: campo.regex || null, // Para validação de string
    minLength: campo.minLength || null,
    maxLength: campo.maxLength || null,
  };
}
```

### 2. Listar Schemas da Empresa

```javascript
// GET /api/v1/schemas
async function listarSchemas(req, res) {
  const { empresaId } = req.user;

  const schemas = await prisma.schemaCustomizado.findMany({
    where: {
      empresaId,
      ativo: true,
    },
    select: {
      id: true,
      nomeEntidade: true,
      descricao: true,
      campos: true,
      criadoEm: true,
    },
  });

  res.json({
    success: true,
    data: schemas,
  });
}
```

### 3. Atualizar Schema

```javascript
// PUT /api/v1/schemas/:schemaId
async function atualizarSchema(req, res) {
  const { empresaId } = req.user;
  const { schemaId } = req.params;
  const { descricao, campos } = req.body;

  // Validar ownership
  const schema = await prisma.schemaCustomizado.findUnique({
    where: { id: schemaId },
  });

  if (!schema || schema.empresaId !== empresaId) {
    return res.status(404).json({ erro: 'Schema não encontrado' });
  }

  // Validar novos campos
  if (campos && !validarCampos(campos)) {
    return res.status(400).json({ erro: 'Campos inválidos' });
  }

  const atualizado = await prisma.schemaCustomizado.update({
    where: { id: schemaId },
    data: {
      descricao: descricao || schema.descricao,
      campos: campos ? campos.map(validarCampo) : schema.campos,
    },
  });

  // Auditar
  await auditarOperacao(req, 'UPDATE', 'SchemaCustomizado', schemaId, {
    antes: schema,
    depois: atualizado,
  });

  res.json({
    success: true,
    data: atualizado,
  });
}
```

### 4. Deletar Schema

```javascript
// DELETE /api/v1/schemas/:schemaId
async function deletarSchema(req, res) {
  const { empresaId } = req.user;
  const { schemaId } = req.params;

  const schema = await prisma.schemaCustomizado.findUnique({
    where: { id: schemaId },
  });

  if (!schema || schema.empresaId !== empresaId) {
    return res.status(404).json({ erro: 'Schema não encontrado' });
  }

  // Soft delete
  await prisma.schemaCustomizado.update({
    where: { id: schemaId },
    data: { ativo: false },
  });

  // Auditar
  await auditarOperacao(req, 'DELETE', 'SchemaCustomizado', schemaId);

  res.json({
    success: true,
    mensagem: 'Schema deletado',
  });
}
```

---

## API DE DADOS DINÂMICOS

### 1. Criar Registro Dinâmico

```javascript
// POST /api/v1/dados/:schemaId
async function criarDado(req, res) {
  const { empresaId } = req.user;
  const { schemaId } = req.params;
  const dados = req.body;

  // Obter schema
  const schema = await prisma.schemaCustomizado.findUnique({
    where: { id: schemaId },
  });

  if (!schema || schema.empresaId !== empresaId) {
    return res.status(404).json({ erro: 'Schema não encontrado' });
  }

  // Validar dados contra schema
  const erros = validarDadosContraSchema(dados, schema.campos);
  if (erros.length > 0) {
    return res.status(400).json({
      success: false,
      erro: 'Validação falhou',
      detalhes: erros,
    });
  }

  // Sanitizar dados
  const dadosSanitizados = sanitizarDados(dados, schema.campos);

  // Criar registro
  const registro = await prisma.dadosDinamicos.create({
    data: {
      empresaId,
      schemaId,
      dados: dadosSanitizados,
    },
  });

  // Auditar
  await auditarOperacao(req, 'CREATE', `Dados-${schema.nomeEntidade}`, registro.id);

  res.status(201).json({
    success: true,
    data: registro,
  });
}

// Validadores
function validarDadosContraSchema(dados, campos) {
  const erros = [];

  campos.forEach(campo => {
    const valor = dados[campo.nome];

    // Validar obrigatoriedade
    if (campo.obrigatorio && (valor === undefined || valor === null)) {
      erros.push(`${campo.nome} é obrigatório`);
      return;
    }

    if (valor === undefined || valor === null) return;

    // Validar tipo
    switch (campo.tipo) {
      case 'string':
        if (typeof valor !== 'string') {
          erros.push(`${campo.nome} deve ser string`);
        }
        if (campo.minLength && valor.length < campo.minLength) {
          erros.push(`${campo.nome} mínimo ${campo.minLength} caracteres`);
        }
        if (campo.maxLength && valor.length > campo.maxLength) {
          erros.push(`${campo.nome} máximo ${campo.maxLength} caracteres`);
        }
        if (campo.regex && !new RegExp(campo.regex).test(valor)) {
          erros.push(`${campo.nome} formato inválido`);
        }
        break;

      case 'email':
        if (!validarEmail(valor)) {
          erros.push(`${campo.nome} email inválido`);
        }
        break;

      case 'number':
        if (typeof valor !== 'number') {
          erros.push(`${campo.nome} deve ser número`);
        }
        break;

      case 'date':
        if (!validarData(valor)) {
          erros.push(`${campo.nome} data inválida`);
        }
        break;

      case 'boolean':
        if (typeof valor !== 'boolean') {
          erros.push(`${campo.nome} deve ser booleano`);
        }
        break;
    }
  });

  return erros;
}

function sanitizarDados(dados, campos) {
  const sanitizado = {};

  campos.forEach(campo => {
    let valor = dados[campo.nome];

    if (valor === undefined || valor === null) return;

    // Sanitizar por tipo
    switch (campo.tipo) {
      case 'string':
        valor = String(valor).trim();
        if (campo.maxLength) {
          valor = valor.substring(0, campo.maxLength);
        }
        break;

      case 'email':
        valor = String(valor).toLowerCase().trim();
        break;

      case 'number':
        valor = Number(valor);
        break;

      case 'date':
        valor = new Date(valor).toISOString();
        break;
    }

    sanitizado[campo.nome] = valor;
  });

  return sanitizado;
}
```

### 2. Listar Registros Dinâmicos

```javascript
// GET /api/v1/dados/:schemaId
async function listarDados(req, res) {
  const { empresaId } = req.user;
  const { schemaId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Validar schema
  const schema = await prisma.schemaCustomizado.findUnique({
    where: { id: schemaId },
  });

  if (!schema || schema.empresaId !== empresaId) {
    return res.status(404).json({ erro: 'Schema não encontrado' });
  }

  // Paginar
  const skip = (page - 1) * limit;

  const [registros, total] = await Promise.all([
    prisma.dadosDinamicos.findMany({
      where: {
        empresaId,
        schemaId,
      },
      skip,
      take: Number(limit),
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.dadosDinamicos.count({
      where: { empresaId, schemaId },
    }),
  ]);

  res.json({
    success: true,
    data: registros,
    paginacao: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  });
}
```

### 3. Atualizar Registro Dinâmico

```javascript
// PUT /api/v1/dados/:schemaId/:id
async function atualizarDado(req, res) {
  const { empresaId } = req.user;
  const { schemaId, id } = req.params;
  const novosDados = req.body;

  // Validar schema e registro
  const schema = await prisma.schemaCustomizado.findUnique({
    where: { id: schemaId },
  });

  const registro = await prisma.dadosDinamicos.findUnique({
    where: { id },
  });

  if (!schema || schema.empresaId !== empresaId) {
    return res.status(404).json({ erro: 'Schema não encontrado' });
  }

  if (!registro || registro.empresaId !== empresaId || registro.schemaId !== schemaId) {
    return res.status(404).json({ erro: 'Registro não encontrado' });
  }

  // Validar novos dados
  const erros = validarDadosContraSchema(novosDados, schema.campos);
  if (erros.length > 0) {
    return res.status(400).json({ success: false, erro: 'Validação falhou', detalhes: erros });
  }

  // Mesclar dados antigos com novos
  const dadosMesclados = { ...registro.dados, ...novosDados };
  const dadosSanitizados = sanitizarDados(dadosMesclados, schema.campos);

  const atualizado = await prisma.dadosDinamicos.update({
    where: { id },
    data: { dados: dadosSanitizados },
  });

  // Auditar
  await auditarOperacao(req, 'UPDATE', `Dados-${schema.nomeEntidade}`, id, {
    antes: registro.dados,
    depois: atualizado.dados,
  });

  res.json({
    success: true,
    data: atualizado,
  });
}
```

---

## EXEMPLO DE USO

### Criar Schema para "Perfil de Aluno"

```bash
POST /api/v1/schemas
{
  "nomeEntidade": "perfil_aluno",
  "descricao": "Dados customizados de aluno",
  "campos": [
    {
      "nome": "cpf",
      "tipo": "string",
      "obrigatorio": true,
      "regex": "^[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}$",
      "label": "CPF"
    },
    {
      "nome": "dataNascimento",
      "tipo": "date",
      "obrigatorio": true,
      "label": "Data de Nascimento"
    },
    {
      "nome": "responsavel_email",
      "tipo": "email",
      "obrigatorio": false,
      "label": "Email do Responsável"
    },
    {
      "nome": "matricula_numero",
      "tipo": "string",
      "obrigatorio": true,
      "maxLength": 20,
      "label": "Número da Matrícula"
    }
  ]
}

# Resposta
{
  "success": true,
  "data": {
    "id": "schema_123",
    "nomeEntidade": "perfil_aluno",
    "campos": [...]
  }
}
```

### Criar Registro com Dados Customizados

```bash
POST /api/v1/dados/schema_123
{
  "cpf": "123.456.789-10",
  "dataNascimento": "2005-05-15",
  "responsavel_email": "mae@example.com",
  "matricula_numero": "2025001"
}

# Resposta
{
  "success": true,
  "data": {
    "id": "dado_456",
    "schemaId": "schema_123",
    "dados": {
      "cpf": "123.456.789-10",
      "dataNascimento": "2005-05-15T00:00:00.000Z",
      "responsavel_email": "mae@example.com",
      "matricula_numero": "2025001"
    }
  }
}
```

---

## VANTAGENS DESSA ABORDAGEM

✅ **Seguro**: Schema é whitelisted, sem DDL dinâmico
✅ **Auditável**: Todas mudanças registradas em AuditoriaLog
✅ **Performático**: JSONB indexado no PostgreSQL
✅ **Versionado**: Histórico completo de schemas
✅ **Reversível**: Soft delete de schemas
✅ **Typeado**: TypeScript ainda funciona no core
✅ **Escalável**: Suporta N empresas com N schemas cada uma
✅ **Flexível**: Campos dinâmicos sem alterar banco

---

## COMPARAÇÃO

```
ANTES (Errado):
─────────────
❌ Prisma migrations em runtime
❌ Sem histórico de mudanças
❌ Difícil reverter
❌ Código quebra se schema mudar

DEPOIS (Correto):
────────────────
✅ Schemas como dados (tabela SchemaCustomizado)
✅ Histórico completo em AuditoriaLog
✅ Fácil reverter (soft delete)
✅ Código estável, dados flexíveis
```

---

**Este é o padrão correto para multi-tenant com schemas customizáveis!** 🎯
