# Relatório Visual Final — INOVE TÉCNICO

**Data:** 27 de maio de 2026  
**Metodologia:** Captura via browser integrado (~504px efetivo = viewport "notebook reduzido"). Análise de snapshot DOM + screenshot por tela.  
**Escopo:** Apenas validação visual. Nenhuma correção aplicada.

---

## Legenda

| Ícone | Significado |
|---|---|
| ✅ | OK visual |
| ⚠️ | Quebra moderada / problema menor |
| 🔴 | Quebra crítica / impacta usabilidade |

---

## 1. Módulo Comercial

### 1.1 Dashboard Comercial (`/comercial/dashboard`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | PageHeader com ícone/título/subtítulo bem posicionado |
| Quebra visual | ⚠️ | Grid de KPI cards em 2 colunas em viewport estreito (esperado 3+) |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | "Novo Lead" isolado acima do grid |
| Menu | ✅ OK | Sidebar collapsed, 6 ícones corretos |
| Responsividade | ⚠️ | Pipeline de Leads com scroll horizontal — itens do funil estouram a largura em telas < 768px |

---

### 1.2 Meus Leads (`/comercial/leads`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | PageHeader + filtros bem organizados |
| Quebra visual | 🔴 | Tabela corta colunas — "Status" e ações ficam fora da tela, exigindo scroll horizontal obrigatório |
| Texto cortado | 🔴 | Cabeçalho "Status" cortado como "ST." — coluna de ações invisível sem scroll |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | — |
| Responsividade | 🔴 | **Crítico** — tabela de 6 colunas sem colapso mobile. Botões de ação (Detalhes/WhatsApp) invisíveis sem scroll horizontal |

---

### 1.3 Novo Lead (`/comercial/leads/novo`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ⚠️ | Header inconsistente — usa `← Voltar  Novo Lead` em `<h2>` simples, sem `PageHeader` (único formulário assim) |
| Quebra visual | ✅ OK | Formulário vertical responsivo |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | — |
| Responsividade | ✅ OK | — |

---

### 1.4 Pré-Matrículas (`/comercial/matriculas`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | PageHeader presente, EmptyState correto |
| Quebra visual | ⚠️ | Campo de busca e select "Todos os status" lado a lado truncam o placeholder |
| Texto cortado | ⚠️ | Placeholder "Buscar por nome, e-mail ou curs..." cortado |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | — |
| Responsividade | ✅ OK | EmptyState bem exibido |

---

### 1.5 Comissões Comerciais (`/comercial/comissoes`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | PageHeader + totais Pendente/Repassado visíveis |
| Quebra visual | ⚠️ | 3 cards de categoria (Pendentes/Repassadas/Canceladas) aparecem em coluna única em vez de row horizontal |
| Texto cortado | ✅ OK | Valores zerados mas formatação correta |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | — |
| Responsividade | ✅ OK | Aceitável para viewport estreito |

---

### 1.6 Equipe Comercial (`/comercial/equipe`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | PageHeader + EmptyState corretos |
| Quebra visual | ✅ OK | — |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | "+ Novo Operador" alinhado à direita no PageHeader |
| Menu | ✅ OK | — |
| Responsividade | ✅ OK | — |
| **Bug funcional** | 🔴 | **Erro de banco exposto:** `column usuarios.comercial_master_id does not exist` — caixa de erro vermelha visível ao usuário final |

---

## 2. Módulo Recepção

### 2.1 Dashboard Recepção (`/recepcao/dashboard`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ⚠️ | Dupla redundância de CTA — PageHeader tem "+ Novo Pré-Cadastro" E abaixo há um segundo botão "➕ Novo Pré-Cadastro" grande azul do código original (não removido) |
| Quebra visual | 🔴 | Dois botões CTA idênticos empilhados — o antigo não foi removido ao inserir o PageHeader |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | 🔴 | CTA duplicado causa confusão visual — dois botões com mesmo destino |
| Menu | ✅ OK | Sidebar recepção com 3 ícones |
| Responsividade | ✅ OK | Grid de KPI cards em 2 colunas funcional |

---

### 2.2 Pré-Cadastros — lista (`/recepcao/pre-cadastros`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ⚠️ | Dupla redundância de ação — PageHeader tem "+ Novo Pré-Cadastro" E a barra de busca tem outro link "➕ Novo Pré-Cadastro" ao lado |
| Quebra visual | ⚠️ | 2 botões de nova ação na mesma tela |
| Texto cortado | 🔴 | Nomes cortados: "ALAN CARDO...", "francisco de a...", "FRANCISCO D..." — truncate sem tooltip |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | — |
| Responsividade | ⚠️ | Cards de alunos sem StatusBadge visível — status do aluno não aparece nos cards da lista |

---

### 2.3 Novo Pré-Cadastro (`/recepcao/pre-cadastros/novo`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | Stepper visual com 3 etapas bem posicionado |
| Quebra visual | ✅ OK | — |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | "← Cancelar" e "Próximo →" alinhados corretamente |
| Menu | ✅ OK | — |
| Responsividade | ✅ Excelente | Melhor formulário do sistema |

---

## 3. Módulo Financeiro

### 3.1 Dashboard Financeiro (`/admin-financeiro`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | `AdminFinanceiroLayout` com header "Financeiro" + navegação por abas |
| Quebra visual | ✅ OK | — |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | Abas horizontais: Dashboard / Alunos / Ordens / Carnês / Convênios / Comissões |
| Responsividade | ⚠️ | Abas horizontais transbordaram em viewport estreito — "Convênios" e "Comissões" somem ou quebram para segunda linha sem estilo de wrap adequado |

---

### 3.2 Ordens de Pagamento (`/admin-financeiro/ordens`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ⚠️ | Título `<h2>Ordens de Pagamento</h2>` sem ícone — visualmente mais "frio" que outros módulos (PageHeader não foi adicionado por design — correto) |
| Quebra visual | ✅ OK | — |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | Aba "Ordens" destacada corretamente |
| Responsividade | ✅ OK | KPI cards empilham corretamente |

---

### 3.3 Carnês de Pagamento (`/admin-financeiro/carnes`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | Layout limpo, KPI cards visíveis |
| Quebra visual | ✅ OK | — |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | "Novo Carnê" alinhado à direita do título |
| Menu | ✅ OK | — |
| Responsividade | ✅ OK | — |

---

### 3.4 Comissões Financeiro (`/admin-financeiro/comissoes`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | h2 + KPI cards em 2×2 bem posicionados |
| Quebra visual | ✅ OK | — |
| Texto cortado | ⚠️ | Subtítulo "Apuração e repasse de comissões por matrícula" quebra linha na viewport estreita |
| Botão desalinhado | ⚠️ | "⚙️ Configurar Regra" empurra o título para baixo em mobile, ficando desalinhado do h2 |
| Menu | ✅ OK | — |
| Responsividade | ✅ OK | Aceitável |

---

## 4. Módulo Turmas

### 4.1 Gerenciar Turmas (`/admin/turmas`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | PageHeader com breadcrumbs (Admin / Turmas) + botão "+ Nova Turma" + abas Listar/Inserir |
| Quebra visual | ✅ OK | — |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | — |
| Menu | ✅ OK | Sidebar admin correta |
| Responsividade | ✅ OK | — |

---

## 5. Módulo Contratos

### 5.1 Dashboard Contratos (`/admin/contratos/dashboard`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | Breadcrumbs Admin/Contratos + PageHeader + Alerta Crítico bem destacado |
| Quebra visual | ✅ OK | — |
| Texto cortado | ✅ OK | — |
| Botão desalinhado | ✅ OK | "Lista de Contratos" posicionado abaixo do PageHeader |
| Menu | ✅ OK | — |
| Responsividade | ✅ OK | KPI cards em 2 colunas funcionam bem |

---

### 5.2 Relatório de Contratos (`/admin/contratos/relatorio`)

| Critério | Status | Detalhe |
|---|---|---|
| Visual geral | ✅ OK | PageHeader + breadcrumbs + 3 action buttons |
| Quebra visual | 🔴 | Tabela corta colunas — em viewport estreita mostra apenas CURSO e TURMA; colunas de aluno/status/ações cortadas |
| Texto cortado | 🔴 | Conteúdo das células aparece como "—" ou cortado sem acesso ao scroll |
| Botão desalinhado | ✅ OK | Botões no PageHeader alinhados |
| Menu | ✅ OK | — |
| Responsividade | 🔴 | Tabela de 9 colunas sem colapso mobile — mesmo padrão crítico de Meus Leads |

---

## Sumário Executivo

| Severidade | Qtd | Páginas Afetadas |
|---|---|---|
| 🔴 Crítico | 5 | Meus Leads (tabela), Relatório Contratos (tabela), Equipe (erro SQL), Dashboard Recepção (CTA duplicado), Pré-Cadastros lista (link duplicado) |
| ⚠️ Moderado | 8 | Pipeline scroll, placeholder truncado, cards comissão em coluna, abas financeiro wrap, subtítulo comissão quebra, nomes truncados sem tooltip, Novo Lead sem PageHeader, KPI grid 2-col |
| ✅ OK | 12+ | Formulários, modais, EmptyStates, menus, navegação entre módulos |

---

## Padrões Problemáticos Identificados

### P1 — Tabelas com muitas colunas sem versão mobile
**Afeta:** `Meus Leads` (6 col), `Relatório Contratos` (9 col)  
**Sintoma:** Scroll horizontal obrigatório, ações e status invisíveis sem scroll  
**Correção sugerida:** Colapsar para cards em mobile (`sm:hidden` nas colunas secundárias + row expandida)

### P2 — CTAs duplicados na Recepção
**Afeta:** `Dashboard Recepção`, `Pré-Cadastros lista`  
**Sintoma:** Ao adicionar `PageHeader` com action button, o botão/link original do layout não foi removido  
**Correção sugerida:** Remover o botão CTA antigo dos dois arquivos

### P3 — Erro SQL exposto na Equipe Comercial
**Afeta:** `/comercial/equipe`  
**Sintoma:** `column usuarios.comercial_master_id does not exist` visível ao usuário final  
**Correção sugerida:** Bug de banco/API — requer análise da query ou criação da coluna

### P4 — Formulário Novo Lead sem PageHeader
**Afeta:** `/comercial/leads/novo`  
**Sintoma:** Header legacy `← Voltar / Novo Lead` em h2, inconsistente com demais formulários  
**Correção sugerida:** Adicionar `PageHeader` com breadcrumb e mover o link "← Voltar" para os breadcrumbs

### P5 — Abas do Financeiro sem wrap mobile
**Afeta:** `AdminFinanceiroLayout` (nav de abas)  
**Sintoma:** "Convênios" e "Comissões" desaparecem ou quebram linha sem estilo de overflow controlado  
**Correção sugerida:** Adicionar `overflow-x-auto` + `flex-nowrap` na nav de abas
