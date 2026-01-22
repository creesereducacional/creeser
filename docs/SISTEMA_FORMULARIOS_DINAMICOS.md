# Sistema de Formulários Dinâmicos - Funcionários

**Objetivo**: Criar funcionários sem criar novas tabelas (usando SchemaCustomizado + DadosDinamicos)

**Data**: 27 de dezembro de 2025

---

## 1. Estrutura dos Campos (Do seu formulário)

Baseado em `pages/admin/funcionarios/novo.js`, os campos são:

```javascript
{
  // Dados Pessoais
  nome: "string",           // obrigatório
  email: "email",           // obrigatório
  cpf: "cpf",              // obrigatório
  funcao: "string",        // obrigatório
  rg: "string",            // opcional
  telefoneCelular: "phone", // opcional
  whatsapp: "phone",       // opcional
  
  // Endereço
  cep: "string",           // opcional
  endereco: "string",      // opcional
  numero: "string",        // opcional
  bairro: "string",        // opcional
  cidade: "string",        // opcional
  uf: "string",            // opcional
  
  // Datas
  dtNascimento: "date",    // opcional
  dtAdmissao: "date",      // opcional
  
  // Status
  status: "enum",          // ATIVO, INATIVO
  
  // Dados Financeiros
  banco: "string",         // opcional
  agencia: "string",       // opcional
  contaCorrente: "string", // opcional
  pix: "string",          // opcional
  obs: "text"             // opcional
}
```

---

## 2. Criar SchemaCustomizado (Tabela de Definição)

**Endpoint**: `POST /api/schemas-customizados`

```javascript
// 1. Criar o schema uma única vez (na primeira vez)
const response = await fetch('/api/schemas-customizados', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    nomeEntidade: 'funcionario',
    descricao: 'Formulário de Cadastro de Funcionários',
    campos: [
      { nome: 'nome', tipo: 'string', obrigatorio: true, label: 'Nome Completo', minLength: 3, maxLength: 255 },
      { nome: 'email', tipo: 'email', obrigatorio: true, label: 'Email', maxLength: 255 },
      { nome: 'cpf', tipo: 'cpf', obrigatorio: true, label: 'CPF', regex: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$' },
      { nome: 'funcao', tipo: 'string', obrigatorio: true, label: 'Função', maxLength: 100 },
      { nome: 'rg', tipo: 'string', obrigatorio: false, label: 'RG', maxLength: 20 },
      { nome: 'telefoneCelular', tipo: 'phone', obrigatorio: false, label: 'Telefone Celular' },
      { nome: 'whatsapp', tipo: 'phone', obrigatorio: false, label: 'WhatsApp' },
      { nome: 'cep', tipo: 'string', obrigatorio: false, label: 'CEP', regex: '^\\d{5}-?\\d{3}$' },
      { nome: 'endereco', tipo: 'string', obrigatorio: false, label: 'Endereço', maxLength: 255 },
      { nome: 'numero', tipo: 'string', obrigatorio: false, label: 'Número', maxLength: 10 },
      { nome: 'bairro', tipo: 'string', obrigatorio: false, label: 'Bairro', maxLength: 100 },
      { nome: 'cidade', tipo: 'string', obrigatorio: false, label: 'Cidade', maxLength: 100 },
      { nome: 'uf', tipo: 'string', obrigatorio: false, label: 'UF', maxLength: 2 },
      { nome: 'dtNascimento', tipo: 'date', obrigatorio: false, label: 'Data de Nascimento' },
      { nome: 'dtAdmissao', tipo: 'date', obrigatorio: false, label: 'Data de Admissão' },
      { nome: 'status', tipo: 'enum', obrigatorio: true, label: 'Status', valores: ['ATIVO', 'INATIVO'] },
      { nome: 'banco', tipo: 'string', obrigatorio: false, label: 'Banco', maxLength: 100 },
      { nome: 'agencia', tipo: 'string', obrigatorio: false, label: 'Agência', maxLength: 20 },
      { nome: 'contaCorrente', tipo: 'string', obrigatorio: false, label: 'Conta Corrente', maxLength: 20 },
      { nome: 'pix', tipo: 'string', obrigatorio: false, label: 'PIX', maxLength: 255 },
      { nome: 'obs', tipo: 'text', obrigatorio: false, label: 'Observações', maxLength: 1000 }
    ]
  })
});

const schema = await response.json();
console.log('Schema ID:', schema.id); // Guardar este ID!
```

---

## 3. Backend API - Criar Endpoints

**Arquivo**: `src/routes/funcionarios.js` (novo arquivo)

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verificarTokenJWT } = require('../middleware/auth');
const { garantirIsolacaoTenant } = require('../middleware/tenantIsolation');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de autenticação
router.use(verificarTokenJWT);
router.use(garantirIsolacaoTenant);

// ============================================================================
// 1. CRIAR SCHEMA CUSTOMIZADO (executar uma única vez)
// ============================================================================

router.post('/schemas', async (req, res) => {
  try {
    const { nomeEntidade, descricao, campos } = req.body;

    // Validar entrada
    if (!nomeEntidade || !campos || campos.length === 0) {
      return res.status(400).json({ erro: 'nomeEntidade e campos obrigatórios' });
    }

    // Verificar se schema já existe
    const schemaExistente = await prisma.schemaCustomizado.findUnique({
      where: {
        empresaId_nomeEntidade: {
          empresaId: req.user.empresaId,
          nomeEntidade
        }
      }
    });

    if (schemaExistente) {
      return res.status(400).json({ erro: 'Schema já existe para esta entidade' });
    }

    // Validar estrutura dos campos
    const camposValidos = campos.every(c => 
      c.nome && c.tipo && ['string', 'email', 'cpf', 'phone', 'date', 'number', 'boolean', 'url', 'text', 'enum'].includes(c.tipo)
    );

    if (!camposValidos) {
      return res.status(400).json({ erro: 'Tipos de campo inválidos' });
    }

    // Criar schema
    const schema = await prisma.schemaCustomizado.create({
      data: {
        empresaId: req.user.empresaId,
        nomeEntidade,
        descricao,
        campos: JSON.stringify(campos), // Armazenar como JSON
        ativo: true
      }
    });

    res.status(201).json(schema);
  } catch (erro) {
    console.error('Erro ao criar schema:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

// ============================================================================
// 2. CRIAR FUNCIONÁRIO (armazenar em DadosDinamicos)
// ============================================================================

router.post('/criar', async (req, res) => {
  try {
    const { schemaId, dados } = req.body;

    if (!schemaId || !dados) {
      return res.status(400).json({ erro: 'schemaId e dados obrigatórios' });
    }

    // Buscar schema para validar
    const schema = await prisma.schemaCustomizado.findUnique({
      where: { id: schemaId }
    });

    if (!schema || schema.empresaId !== req.user.empresaId) {
      return res.status(403).json({ erro: 'Schema não encontrado ou acesso negado' });
    }

    // Validar dados contra schema
    const campos = JSON.parse(schema.campos);
    const errosValidacao = validarDados(dados, campos);

    if (errosValidacao.length > 0) {
      return res.status(400).json({ 
        erro: 'Validação falhou',
        detalhes: errosValidacao
      });
    }

    // Sanitizar dados
    const dadosSanitizados = sanitizarDados(dados, campos);

    // Criar registro
    const funcionario = await prisma.dadosDinamicos.create({
      data: {
        empresaId: req.user.empresaId,
        schemaId,
        dados: JSON.stringify(dadosSanitizados)
      }
    });

    // Registrar auditoria
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: req.user.id,
        empresaId: req.user.empresaId,
        acao: 'CREATE',
        tabela: 'DadosDinamicos',
        registroId: funcionario.id,
        dadosNovos: JSON.stringify(dadosSanitizados),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.status(201).json(funcionario);
  } catch (erro) {
    console.error('Erro ao criar funcionário:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

// ============================================================================
// 3. LISTAR FUNCIONÁRIOS
// ============================================================================

router.get('/listar', async (req, res) => {
  try {
    const { schemaId } = req.query;

    if (!schemaId) {
      return res.status(400).json({ erro: 'schemaId obrigatório' });
    }

    // Buscar schema
    const schema = await prisma.schemaCustomizado.findUnique({
      where: { id: schemaId }
    });

    if (!schema || schema.empresaId !== req.user.empresaId) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    // Buscar dados
    const funcionarios = await prisma.dadosDinamicos.findMany({
      where: {
        empresaId: req.user.empresaId,
        schemaId,
        deletedAt: null
      },
      orderBy: { criadoEm: 'desc' }
    });

    // Parsear JSON dos dados
    const funcionariosFormatados = funcionarios.map(f => ({
      id: f.id,
      ...JSON.parse(f.dados),
      criadoEm: f.criadoEm,
      atualizadoEm: f.atualizadoEm
    }));

    res.json(funcionariosFormatados);
  } catch (erro) {
    console.error('Erro ao listar:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

// ============================================================================
// 4. BUSCAR FUNCIONÁRIO POR ID
// ============================================================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const funcionario = await prisma.dadosDinamicos.findUnique({
      where: { id }
    });

    if (!funcionario || funcionario.empresaId !== req.user.empresaId) {
      return res.status(404).json({ erro: 'Funcionário não encontrado' });
    }

    res.json({
      id: funcionario.id,
      ...JSON.parse(funcionario.dados),
      criadoEm: funcionario.criadoEm,
      atualizadoEm: funcionario.atualizadoEm
    });
  } catch (erro) {
    console.error('Erro ao buscar:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

// ============================================================================
// 5. ATUALIZAR FUNCIONÁRIO
// ============================================================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dados } = req.body;

    // Buscar funcionário
    const funcionario = await prisma.dadosDinamicos.findUnique({
      where: { id }
    });

    if (!funcionario || funcionario.empresaId !== req.user.empresaId) {
      return res.status(404).json({ erro: 'Funcionário não encontrado' });
    }

    // Buscar schema para validar
    const schema = await prisma.schemaCustomizado.findUnique({
      where: { id: funcionario.schemaId }
    });

    const campos = JSON.parse(schema.campos);
    const errosValidacao = validarDados(dados, campos);

    if (errosValidacao.length > 0) {
      return res.status(400).json({ 
        erro: 'Validação falhou',
        detalhes: errosValidacao
      });
    }

    // Sanitizar dados
    const dadosSanitizados = sanitizarDados(dados, campos);
    const dadosAntigos = JSON.parse(funcionario.dados);

    // Atualizar
    const funcionarioAtualizado = await prisma.dadosDinamicos.update({
      where: { id },
      data: {
        dados: JSON.stringify(dadosSanitizados),
        atualizadoEm: new Date()
      }
    });

    // Registrar auditoria
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: req.user.id,
        empresaId: req.user.empresaId,
        acao: 'UPDATE',
        tabela: 'DadosDinamicos',
        registroId: id,
        dadosAntigos: JSON.stringify(dadosAntigos),
        dadosNovos: JSON.stringify(dadosSanitizados),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      id: funcionarioAtualizado.id,
      ...JSON.parse(funcionarioAtualizado.dados)
    });
  } catch (erro) {
    console.error('Erro ao atualizar:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

// ============================================================================
// 6. DELETAR FUNCIONÁRIO (Soft Delete)
// ============================================================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar funcionário
    const funcionario = await prisma.dadosDinamicos.findUnique({
      where: { id }
    });

    if (!funcionario || funcionario.empresaId !== req.user.empresaId) {
      return res.status(404).json({ erro: 'Funcionário não encontrado' });
    }

    // Soft delete
    const funcionarioDeletado = await prisma.dadosDinamicos.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    // Registrar auditoria
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: req.user.id,
        empresaId: req.user.empresaId,
        acao: 'DELETE',
        tabela: 'DadosDinamicos',
        registroId: id,
        dadosAntigos: JSON.stringify(JSON.parse(funcionario.dados)),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({ mensagem: 'Funcionário deletado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function validarDados(dados, campos) {
  const erros = [];

  campos.forEach(campo => {
    const valor = dados[campo.nome];

    // Validar obrigatório
    if (campo.obrigatorio && (!valor || valor.toString().trim() === '')) {
      erros.push(`${campo.label || campo.nome} é obrigatório`);
      return;
    }

    if (!valor) return; // Se opcional e vazio, skip

    // Validar tipo
    switch (campo.tipo) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
          erros.push(`${campo.label} deve ser um email válido`);
        }
        break;

      case 'cpf':
        if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(valor)) {
          erros.push(`${campo.label} deve estar no formato XXX.XXX.XXX-XX`);
        }
        break;

      case 'phone':
        if (!/^\d{10,11}$/.test(valor.replace(/\D/g, ''))) {
          erros.push(`${campo.label} deve ter 10 ou 11 dígitos`);
        }
        break;

      case 'date':
        if (isNaN(Date.parse(valor))) {
          erros.push(`${campo.label} deve ser uma data válida`);
        }
        break;

      case 'number':
        if (isNaN(Number(valor))) {
          erros.push(`${campo.label} deve ser um número`);
        }
        break;

      case 'enum':
        if (campo.valores && !campo.valores.includes(valor)) {
          erros.push(`${campo.label} deve ser um de: ${campo.valores.join(', ')}`);
        }
        break;
    }

    // Validar regex se definido
    if (campo.regex && !new RegExp(campo.regex).test(valor)) {
      erros.push(`${campo.label} tem formato inválido`);
    }

    // Validar tamanho
    if (campo.minLength && valor.length < campo.minLength) {
      erros.push(`${campo.label} deve ter no mínimo ${campo.minLength} caracteres`);
    }

    if (campo.maxLength && valor.length > campo.maxLength) {
      erros.push(`${campo.label} deve ter no máximo ${campo.maxLength} caracteres`);
    }
  });

  return erros;
}

function sanitizarDados(dados, campos) {
  const sanitizados = {};

  Object.keys(dados).forEach(chave => {
    const campo = campos.find(c => c.nome === chave);
    let valor = dados[chave];

    if (!campo) return; // Ignorar campos não definidos

    // Sanitizar por tipo
    switch (campo.tipo) {
      case 'email':
        valor = valor.toLowerCase().trim();
        break;

      case 'phone':
        valor = valor.replace(/\D/g, ''); // Remover não-dígitos
        break;

      case 'cpf':
        valor = valor.trim();
        break;

      case 'number':
        valor = Number(valor);
        break;

      case 'boolean':
        valor = Boolean(valor);
        break;

      default:
        valor = valor.toString().trim();
    }

    sanitizados[chave] = valor;
  });

  return sanitizados;
}

module.exports = router;
```

---

## 4. Registrar Rota no App

**Arquivo**: `src/app.js`

```javascript
// Adicionar após outras rotas
const funcionariosRouter = require('./routes/funcionarios');
app.use('/api/funcionarios', funcionariosRouter);
```

---

## 5. Frontend - Chamar API

**Arquivo**: `pages/admin/funcionarios/novo.js` (modificar)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);

    // Schema ID - guardar isto após criar schema uma vez
    const schemaId = 'xxxxx-xxxxx-xxxxx'; // Cole aqui o ID retornado
    
    const endpoint = isEditando 
      ? `/api/funcionarios/${id}`
      : '/api/funcionarios/criar';

    const method = isEditando ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        schemaId, // Apenas no POST (criar)
        dados: formData
      })
    });

    const result = await response.json();

    if (response.ok) {
      setMessage({ type: 'success', text: isEditando ? 'Atualizado!' : 'Criado!' });
      setTimeout(() => router.push('/admin/funcionarios'), 1500);
    } else {
      setMessage({ type: 'error', text: result.erro || 'Erro ao salvar' });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Erro: ' + error.message });
  } finally {
    setLoading(false);
  }
};
```

---

## 6. Fluxo Completo

```
1. Criar Schema (uma única vez):
   POST /api/funcionarios/schemas
   ↓ Retorna: { id: "schema-123", ... }

2. Criar Funcionário:
   POST /api/funcionarios/criar
   Body: { schemaId: "schema-123", dados: {...} }
   ↓ Armazena em DadosDinamicos

3. Listar Funcionários:
   GET /api/funcionarios/listar?schemaId=schema-123
   ↓ Retorna array de funcionários

4. Atualizar:
   PUT /api/funcionarios/id
   Body: { dados: {...} }

5. Deletar (Soft):
   DELETE /api/funcionarios/id
   ↓ Marca deletedAt
```

---

## ✅ Vantagens

- ✅ Sem criar tabelas novas
- ✅ Sem migrations
- ✅ Totalmente flexível (alterar campos sem redeployer)
- ✅ Auditoria completa
- ✅ Validação em tempo real
- ✅ Sanitização automática

---

**Quer que eu gere o código completo em arquivos?** 🚀

