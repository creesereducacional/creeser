# 💼 ÁREA ADMINISTRATIVA FINANCEIRA

## 🎯 Visão Geral

Área administrativa **completamente separada** do dashboard educacional para gestão de:
- ✅ Clientes (Empresas contratantes)
- ✅ Assinaturas e Planos
- ✅ Faturas e Pagamentos
- ✅ Relatórios Financeiros
- ✅ Promoções e Cupons

**Acesso restrito** apenas ao time de Suporte e Vendas.

---

## 📁 Estrutura de Pastas

```
pages/
  ├── admin-financeiro/           ← ÁREA FINANCEIRA (SEPARADA)
  │   ├── index.js               ← 📊 Dashboard
  │   ├── clientes.js            ← 👥 Gestão de Clientes
  │   ├── clientes/[id].js       ← 📝 Editar Cliente
  │   ├── assinaturas.js         ← 📋 Gerenciar Assinaturas
  │   ├── faturas.js             ← 💳 Gestão de Faturas
  │   ├── pagamentos.js          ← 💰 Registrar Pagamentos
  │   ├── relatorios.js          ← 📈 Relatórios
  │   ├── planos.js              ← 🎯 Planos de Preço
  │   └── promocoes.js           ← 🎁 Cupons e Promoções
  │
  ├── api/admin-financeiro/
  │   ├── dashboard.js           ← Métricas do dashboard
  │   ├── clientes.js            ← CRUD de clientes
  │   ├── clientes/[id].js       ← Detalhes do cliente
  │   ├── assinaturas.js         ← CRUD de assinaturas
  │   ├── faturas.js             ← CRUD de faturas
  │   ├── pagamentos.js          ← Registrar pagamentos
  │   ├── relatorios.js          ← Gerar relatórios
  │   └── auth.js                ← Validar acesso
  │
  └── admin/                      ← DASHBOARD EDUCACIONAL (SEPARADO)
      ├── index.js               ← Admin educacional
      ├── alunos/
      ├── professores/
      ├── turmas/
      └── ... (módulos educacionais)

components/
  ├── AdminFinanceiro/
  │   ├── Layout.js              ← Layout específico
  │   ├── Sidebar.js             ← Menu lateral
  │   ├── ClienteForm.js         ← Formulário de cliente
  │   ├── FaturaCard.js          ← Card de fatura
  │   └── MetricasCard.js        ← Card de métricas
  │
  └── DashboardLayout.js         ← Layout educacional (DIFERENTE)
```

---

## 🔐 Autenticação e Autorização

### Restrições de Acesso

```javascript
// ✅ USUÁRIOS COM ACESSO:
- Tipo: "admin"
- Tipo: "vendedor"
- Tipo: "suporte"

// ❌ SEM ACESSO:
- Tipo: "professor"
- Tipo: "aluno"
- Tipo: "funcionario"
```

### Middleware de Autenticação

Será criado em `lib/middleware/checkFinanceiroAccess.js`:

```javascript
export async function checkFinanceiroAccess(req) {
  const usuario = req.user; // Do JWT
  
  const permitidos = ['admin', 'vendedor', 'suporte'];
  
  if (!usuario || !permitidos.includes(usuario.tipo)) {
    throw new Error('Acesso não autorizado');
  }
}
```

---

## 📊 Páginas e Funcionalidades

### 1. **Dashboard Financeiro** (`/admin-financeiro`)
**Métricas principais:**
- 👥 Total de Clientes
- 💚 MRR (Monthly Recurring Revenue)
- 📈 Faturamento últimos 30 dias
- ⏰ Faturas Pendentes
- 📊 Faturamento 12 meses
- 📍 Taxa de Retenção
- 📉 Churn Rate
- 💰 ARPU (Average Revenue Per User)

**Ações rápidas:**
- ➕ Novo Cliente
- 💰 Registrar Pagamento
- 📄 Gerar Fatura
- 📊 Exportar Relatório

---

### 2. **Gestão de Clientes** (`/admin-financeiro/clientes`)
**Funcionalidades:**
- 📋 Listar todas as empresas contratantes
- 🔍 Filtrar por nome, CNPJ, email
- ➕ Cadastrar novo cliente
- ✏️ Editar dados do cliente
- 🗑️ Deletar cliente
- 📊 Ver histórico de pagamentos
- 💾 Exportar lista

**Informações por cliente:**
- Nome, CNPJ, Email, Telefone
- Endereço completo
- Plano atual
- Status da assinatura
- Data de próximo vencimento
- MRR
- Número de usuários/alunos
- Histórico de transações

---

### 3. **Gestão de Assinaturas** (`/admin-financeiro/assinaturas`)
**Funcionalidades:**
- 📋 Listar assinaturas ativas/canceladas
- ➕ Nova assinatura (novo cliente)
- ✏️ Editar plano do cliente
- ⏸️ Suspender/Reativar
- ❌ Cancelar assinatura
- 📈 Ver crescimento de assinaturas
- 📊 Análise de churn

**Statuses:**
- ✅ Ativa
- ❌ Cancelada
- ⏸️ Suspensa
- ⏰ Vencida

---

### 4. **Gestão de Faturas** (`/admin-financeiro/faturas`)
**Funcionalidades:**
- 📋 Listar todas as faturas
- 🔎 Filtrar por status, período, cliente
- 📄 Gerar fatura
- 👁️ Visualizar detalhes
- 💾 Enviar por email
- 📥 Exportar PDF
- 🔗 Gerar link de pagamento
- ❌ Cancelar fatura

**Statuses:**
- ⏳ Pendente
- ✅ Paga
- ⚠️ Vencida
- ❌ Cancelada

---

### 5. **Registrar Pagamentos** (`/admin-financeiro/pagamentos`)
**Funcionalidades:**
- ➕ Registrar novo pagamento
- 🔍 Buscar fatura
- 💳 Selecionar método (cartão, boleto, PIX, transferência)
- 💰 Inserir valor
- ✅ Confirmar
- 📨 Enviar comprovante
- 📋 Histórico de pagamentos

---

### 6. **Relatórios** (`/admin-financeiro/relatorios`)
**Tipos de relatórios:**
- 📊 Faturamento por período
- 👥 Crescimento de clientes
- 💹 Receita por plano
- 📉 Taxa de churn
- 📋 Clientes por vencer
- 💸 Pagamentos em atraso
- 🎯 Projeções
- 📈 Análise de tendências

**Exportar em:**
- 📄 PDF
- 📊 Excel
- 📈 CSV

---

### 7. **Planos de Preço** (`/admin-financeiro/planos`)
**Funcionalidades:**
- 📋 Listar planos disponíveis
- ➕ Criar novo plano
- ✏️ Editar preços
- 🗑️ Deletar plano
- 📊 Ver clientes por plano
- 💰 Ajustar preço MRR/Anual
- 🎯 Configurar limites

**Planos padrão:**
- **Básico**: R$ 299/mês
  - Até 50 alunos
  - 1 professor
  - Relatórios básicos
  
- **Profissional**: R$ 799/mês
  - Até 500 alunos
  - 10 professores
  - Relatórios avançados
  - Suporte prioritário
  
- **Enterprise**: Customizável
  - Alunos ilimitados
  - Usuários ilimitados
  - Integrações
  - Suporte dedicado

---

### 8. **Promoções e Cupons** (`/admin-financeiro/promocoes`)
**Funcionalidades:**
- 🎁 Criar cupom de desconto
- 📊 Definir % de desconto
- ⏰ Data de expiração
- 🎯 Limite de uso
- 🔍 Rastrear uso
- 🗑️ Desativar cupom
- 💰 Ver economia

---

## 🗄️ Modelos de Dados

```javascript
// PLANO DE ASSINATURA
{
  id: "uuid",
  nome: "Profissional",
  precoMensal: 799,
  precoAnual: 7990,
  limiteAlunos: 500,
  limiteProfessores: 10,
  relatorios: true,
  integracao: true,
  suportePrioritario: true,
  ativo: true
}

// ASSINATURA (Cliente)
{
  id: "uuid",
  empresaId: "uuid",
  planoId: "uuid",
  dataInicio: "2025-01-01",
  dataProximoVencimento: "2025-02-01",
  status: "ativa",
  cobrancaAnual: false,
  descontoPercentual: 10,
  codigoPromocional: "PROMO2025"
}

// FATURA
{
  id: "uuid",
  numero: "NF-2025-001",
  assinaturaId: "uuid",
  dataEmissao: "2025-01-01",
  dataVencimento: "2025-01-15",
  subtotal: 799,
  desconto: 79.90,
  total: 719.10,
  status: "pendente"
}

// PAGAMENTO
{
  id: "uuid",
  faturaId: "uuid",
  dataRecebimento: "2025-01-10",
  metodo: "cartao_credito",
  valor: 719.10,
  status: "confirmado"
}
```

---

## 🔄 Fluxo de Venda e Faturamento

```
1. NOVO CLIENTE
   ↓
2. CRIAR ASSINATURA
   └─ Selecionar Plano
   └─ Definir cobrança (mensal/anual)
   └─ Aplicar cupom (opcional)
   ↓
3. GERAR FATURA
   └─ Automático no primeiro dia do mês
   └─ ou Manual sob demanda
   ↓
4. ENVIAR FATURA
   └─ Email + Link de pagamento
   └─ Armazenar em PDF
   ↓
5. CLIENTE PAGA
   └─ Automático via gateway
   └─ ou Manual (boleto, transferência)
   ↓
6. REGISTRAR PAGAMENTO
   └─ Marcar fatura como paga
   └─ Enviar recibo
   ↓
7. PRÓXIMO CICLO
   └─ Renovar automaticamente (se ativo)
   └─ Gerar nova fatura
```

---

## 🔗 Integrações Futuras

- **Stripe** - Pagamentos automáticos
- **Mercado Pago** - Boleto, PIX
- **SendGrid** - Email de faturas
- **Google Analytics** - Tracking de vendas
- **RD Station** - CRM
- **Zapier** - Automações

---

## 📊 KPIs Rastreados

- **MRR** - Monthly Recurring Revenue
- **ARR** - Annual Recurring Revenue
- **ARPU** - Average Revenue Per User
- **LTV** - Lifetime Value
- **CAC** - Customer Acquisition Cost
- **Churn Rate** - Taxa de cancelamento
- **Retention Rate** - Taxa de retenção
- **Growth Rate** - Taxa de crescimento

---

## ✅ Status de Implementação

- ✅ Layout separado criado
- ✅ Estrutura de pastas criada
- ✅ Dashboard básico criado
- ✅ Página de clientes criada
- ✅ APIs stub criadas (TODO: implementar)
- ⏳ Autenticação de acesso (TODO)
- ⏳ CRUD de assinaturas (TODO)
- ⏳ CRUD de faturas (TODO)
- ⏳ CRUD de pagamentos (TODO)
- ⏳ Integração com Stripe/MercadoPago (TODO)
- ⏳ Automação de faturas (TODO)
- ⏳ Relatórios avançados (TODO)

---

## 🚀 Próximos Passos

1. Criar middleware de autenticação para `/admin-financeiro`
2. Implementar APIs de CRUD para clientes
3. Integrar com banco de dados (Prisma/Supabase)
4. Criar páginas de assinaturas, faturas, pagamentos
5. Implementar integração com gateway de pagamento
6. Criar automações de cobrança
7. Implementar relatórios avançados
8. Testar fluxo completo de venda

---

## 📞 Suporte

Qualquer dúvida sobre a área financeira, contate o time de desenvolvimento.
