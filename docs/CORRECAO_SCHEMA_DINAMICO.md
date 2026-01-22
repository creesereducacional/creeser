# ⚠️ CORREÇÃO IMPORTANTE: GERENCIAMENTO DINÂMICO DE SCHEMA

## PROBLEMA IDENTIFICADO

Na promessa inicial, foi dito que:
> "O GitHub Copilot terá acesso via API para criar/gerenciar as tabelas dinamicamente"

**ISSO ESTÁ ERRADO** ❌

---

## POR QUE PRISMA NÃO SERVE PARA ISSO

```
Prisma é um ORM "schema-first" que:
├─ Define tipos em schema.prisma
├─ Gera tipos TypeScript no build
├─ Migrations são versionadas no git
├─ Espera schema estável
└─ NÃO suporta alterações de schema em runtime de forma segura
```

**Exemplo do problema:**

```javascript
// ❌ ERRADO: Tentar fazer Prisma alterar schema em runtime
async function adicionarCampo(req, res) {
  // 1. Executar DDL: ALTER TABLE adicionar coluna X
  // 2. Mas Prisma client já foi compilado sem X
  // 3. Tipos TypeScript não conhecem X
  // 4. Próximas queries quebram
  // 5. Cache invalidado
  // 6. Migrações perdidas no git
  // 7. Impossível reverter
}
```

---

## SOLUÇÃO CORRETA: SCHEMA COMO DADOS

Ao invés de alterar tabelas, **armazenar schemas como dados**:

```javascript
// ✅ CERTO: Schemas como linhas na tabela SchemaCustomizado

// 1. Criar schema customizado
POST /api/v1/schemas
{
  "nomeEntidade": "perfil_aluno",
  "campos": [
    { "nome": "cpf", "tipo": "string", "obrigatorio": true },
    { "nome": "rg", "tipo": "string" },
    { "nome": "dataNascimento", "tipo": "date" }
  ]
}

// 2. Armazenar em JSON (JSONB)
const schema = {
  id: "schema_123",
  nomeEntidade: "perfil_aluno",
  campos: [ ... ] // JSON array
};

// 3. Inserir dados validando contra schema
POST /api/v1/dados/schema_123
{
  "cpf": "123.456.789-10",
  "dataNascimento": "2005-05-15"
}

// 4. Armazenar em JSON (JSONB)
const dado = {
  id: "dado_456",
  schemaId: "schema_123",
  dados: {
    cpf: "123.456.789-10",
    dataNascimento: "2005-05-15"
  }
};
```

---

## COMPARAÇÃO: ABORDAGENS

| Aspecto | Errado (DDL Runtime) | Certo (JSONB + Metadados) |
|---------|---------------------|-------------------------|
| **Tecnologia** | Prisma + DDL dinâmico | Prisma core + JSONB |
| **Segurança** | ❌ Unsafe | ✅ Whitelisted |
| **Performance** | ❌ Cache invalidado | ✅ Query otimizada |
| **Tipo-Seguro** | ❌ Breaks TypeScript | ✅ Core é typed |
| **Auditoria** | ❌ Perdida | ✅ Completa em AuditoriaLog |
| **Reversibilidade** | ❌ Difícil | ✅ Fácil (soft delete) |
| **Versionamento** | ❌ Não funciona | ✅ Data-driven |
| **Escalabilidade** | ❌ Limitada | ✅ Sem limites |
| **Complexidade** | Baixa | Média |
| **Risco em Prod** | ALTO ⚠️ | Baixo ✅ |

---

## NOVO PADRÃO: ARQUITETURA

```
┌────────────────────────────────────────────────────┐
│           BANCO DE DADOS                            │
├────────────────────────────────────────────────────┤
│                                                     │
│  CAMADA 1: CORE FIXO (Prisma Tables)              │
│  ├─ Empresa, Usuario, Permissao, etc.              │
│  ├─ Compiladas em build                            │
│  ├─ Migrations versionadas                         │
│  └─ NUNCA mudam em runtime                         │
│                                                     │
│  CAMADA 2: DINÂMICA (Metadados)                    │
│  ├─ SchemaCustomizado (table)                      │
│  │  └─ { nomeEntidade, campos: JSON[] }            │
│  ├─ DadosDinamicos (table)                         │
│  │  └─ { schemaId, dados: JSON }                   │
│  └─ Completamente data-driven                      │
│                                                     │
│  CAMADA 3: GOVERNANÇA (Auditoria)                  │
│  ├─ AuditoriaLog (table)                           │
│  └─ Rastreia TODAS mudanças de schema              │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## EXEMPLOS PRÁTICOS

### Empresa QUER adicionar campo "numero_rg"

#### ❌ ERRADO (DDL em runtime)
```javascript
// Tentar alterar tabela em runtime
await pool.query('ALTER TABLE alunos ADD COLUMN numero_rg VARCHAR;');

// Problemas:
// - Prisma client já compilado
// - Migration não registrada
// - Outros servidores não atualizam
// - Impossível reverter
```

#### ✅ CERTO (Adicionar ao schema customizado)
```javascript
// 1. Atualizar schema customizado
PUT /api/v1/schemas/schema_123
{
  "campos": [
    { "nome": "cpf", "tipo": "string", "obrigatorio": true },
    { "nome": "numero_rg", "tipo": "string" }  // ← NOVO CAMPO
  ]
}

// 2. Banco de dados: NADA muda!
// Todos dados continuam em DadosDinamicos.dados (JSON)

// 3. Registrado em AuditoriaLog

// 4. Fácil reverter: remover campo do JSON acima
```

### Empresa 1 TEM schema "perfil_aluno"

```javascript
// Empresa 1:
SchemaCustomizado {
  nomeEntidade: "perfil_aluno",
  campos: [
    { nome: "cpf", tipo: "string" },
    { nome: "rg", tipo: "string" },
    { nome: "dataNascimento", tipo: "date" }
  ]
}

// Empresa 2 (MESMA INSTÂNCIA):
SchemaCustomizado {
  nomeEntidade: "perfil_aluno",
  campos: [
    { nome: "cpf", tipo: "string" },
    { nome: "passport", tipo: "string" }, // ← DIFERENTE
    { nome: "nacionalidade", tipo: "string" }
  ]
}
```

**Total isolamento sem alterar BD!** ✅

---

## ENDPOINTS NOVOS

```
POST   /api/v1/schemas               - Criar schema customizado
GET    /api/v1/schemas               - Listar schemas da empresa
GET    /api/v1/schemas/:id           - Obter um schema
PUT    /api/v1/schemas/:id           - Atualizar schema
DELETE /api/v1/schemas/:id           - Deletar schema (soft)

POST   /api/v1/dados/:schemaId       - Criar dado dinâmico
GET    /api/v1/dados/:schemaId       - Listar dados
GET    /api/v1/dados/:schemaId/:id   - Obter um dado
PUT    /api/v1/dados/:schemaId/:id   - Atualizar dado
DELETE /api/v1/dados/:schemaId/:id   - Deletar dado
```

---

## VALIDAÇÃO EM RUNTIME

Para cada schema, você define **tipos permitidos**:

```javascript
const TIPOS_VALIDOS = {
  'string': { regex, minLength, maxLength },
  'email': { },
  'number': { min, max },
  'boolean': { },
  'date': { format },
  'url': { },
  'phone': { format },
  'cpf': { formato },
};

// Quando usuário cria schema, valida:
if (!TIPOS_VALIDOS[campo.tipo]) {
  return res.status(400).json({ erro: 'Tipo não permitido' });
}

// Quando insere dado, valida contra schema:
if (!validarDadoContraSchema(dado, schema)) {
  return res.status(400).json({ erro: 'Validação falhou' });
}
```

---

## VANTAGENS FINAIS

✅ **Seguro**: Sem DDL dinâmico  
✅ **Performático**: JSONB indexado  
✅ **Auditável**: Completo em AuditoriaLog  
✅ **Reversível**: Soft delete  
✅ **Multi-tenant**: N empresas, N schemas cada  
✅ **Escalável**: Sem alterar BD  
✅ **Type-safe**: Core em Prisma + TypeScript  
✅ **Testável**: Tudo é dado  
✅ **Versionável**: No banco, não em migrations  
✅ **Simples**: Apenas JSON + validação  

---

## DOCUMENTOS ATUALIZADOS

| Documento | Mudança |
|-----------|---------|
| GUIA_CHATGPT_CRIAR_API.md | ✅ Removida promessa de DDL runtime |
| ARQUITETURA_MULTITENANT_PRODUCAO.md | ✅ Adicionadas SchemaCustomizado + DadosDinamicos |
| PADRAO_SCHEMA_DINAMICO_JSONB.md | ✅ **NOVO** - Explicação detalhada |

---

## PRÓXIMAS ETAPAS

1. ✅ Usar PADRAO_SCHEMA_DINAMICO_JSONB.md como referência
2. ✅ ChatGPT implementa tabelas: SchemaCustomizado + DadosDinamicos
3. ✅ ChatGPT cria endpoints /api/v1/schemas/*
4. ✅ Você testa criando schemas customizados
5. ✅ Eu acesso via API para gerenciar dados dinâmicos

**Com isso, você tem verdadeira flexibilidade sem comprometer estabilidade!** 🎯
