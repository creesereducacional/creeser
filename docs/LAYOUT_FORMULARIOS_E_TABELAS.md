# Documentação de Layouts de Formulários e Tabelas
## Sistema CREESER Educacional

---

## 📋 Índice
1. [Layout do Formulário de Novo Aluno](#layout-do-formulário-de-novo-aluno)
2. [Layout das Tabelas de Listagem](#layout-das-tabelas-de-listagem)
3. [Padrões de Design](#padrões-de-design)
4. [Componentes Reutilizáveis](#componentes-reutilizáveis)

---

## Layout do Formulário de Novo Aluno

### 📍 Localização
- **URL**: `http://localhost:3000/admin/alunos/novo`
- **Arquivo**: `pages/admin/alunos/novo.js`
- **Layout Container**: `DashboardLayout`

### 🎨 Estrutura Geral

#### Cabeçalho
- **Ícone**: 👤 (emoji)
- **Título**: "Novo Aluno" ou "Editar Aluno"
- **Classes Tailwind**: `text-2xl md:text-3xl font-bold text-gray-800`

#### Abas de Navegação
- **Listar** (`📋 Listar`) - Link para `/admin/alunos`
- **Inserir** (`➕ Inserir`) - Página atual (ativa)
- **Importação** (`📥 Importação`) - Link para importação
- **Estilo Tab Ativa**: 
  - Cor do texto: `text-teal-600`
  - Border inferior: `border-b-2 border-teal-600`
  - Peso da fonte: `font-semibold`
- **Estilo Tab Inativa**:
  - Cor do texto: `text-gray-500`
  - Hover: `hover:text-teal-600`

#### Divisor das Abas
- Borda inferior: `border-b border-gray-200`
- Espaçamento entre abas: `gap-2`
- Padding das abas: `px-6 py-3`

---

### 📦 Seções do Formulário

#### **1. Seção: Identificação**

**Container**:
- Background: `bg-white`
- Sombra: `shadow-md`
- Padding: `p-4 md:p-6`
- Border radius: `rounded-lg`

**Título da Seção**:
- Font size: `text-lg`
- Font weight: `font-bold`
- Cor: `text-teal-600`
- Margin bottom: `mb-4`

**Campos**:

| Campo | Tipo | Grid | Obrigatório | Placeholder/Opções |
|-------|------|------|-------------|-------------------|
| INSTITUIÇÃO | Select | 4 colunas | Não | CREESER (fixo) |
| TURMA | Select | 4 colunas | Não | 1A, 1B, 2A, 2B, 3A |
| ANO LETIVO | Input number | 4 colunas | Não | Ano atual (padrão) |
| Turno Integral? | Checkbox | 4 colunas | Não | - |
| Semestre | Input text | 2 colunas | Não | "Semestre" |

**Grid**: `grid-cols-1 md:grid-cols-4 gap-4`

**Estilo dos Inputs**:
- Padding: `px-3 py-2`
- Font size: `text-sm`
- Border: `border border-teal-300`
- Border radius: `rounded-lg`
- Background: `bg-teal-50`
- Focus: `focus:outline-none focus:border-teal-500`

**Estilo dos Labels**:
- Font size: `text-xs`
- Font weight: `font-medium`
- Cor: `text-teal-600`
- Margin bottom: `mb-1 block`

---

#### **2. Seção: Dados Pessoais**

**Campos Linha 1** (Grid: `grid-cols-1 md:grid-cols-2 gap-4`):

| Campo | Tipo | Obrigatório | Placeholder |
|-------|------|-------------|------------|
| Nome | Input text | ✅ Sim | "Nome do aluno" |
| Nome social? | Checkbox | Não | - |

**Campos Linha 2** (Grid: `grid-cols-1 md:grid-cols-3 gap-4`):

| Campo | Tipo | Placeholder/Opções |
|-------|------|-------------------|
| CPF | Input text | "Somente Números" |
| Estado Civil | Select | Solteiro, Casado, Divorciado, Viúvo |
| Sexo | Select | Masculino, Feminino, Outro |

**Campos Linha 3** (Grid: `grid-cols-1 md:grid-cols-3 gap-4`):

| Campo | Tipo | Obrigatório | Formato |
|-------|------|-------------|---------|
| Data de Nascimento | Input date | ✅ Sim | dd/mm/yyyy |
| RG | Input text | Não | - |
| Órgão Expedidor (RG) | Select | Não | UF (estados) |

**Campos Linha 4** (Grid: `grid-cols-1 md:grid-cols-3 gap-4`):

| Campo | Tipo | Formato |
|-------|------|---------|
| Data de Expedição (RG) | Input date | dd/mm/yyyy |
| UF (RG) | Select | Estados (AC, AL, AP, AM, BA, etc.) |
| Telefone Celular | Input text | (XX) XXXXX-XXXX |

---

#### **3. Seção: Filiação**

**Título da Seção**:
- Estilo idêntico à "Identificação"

**Campos** (Grid: `grid-cols-1 md:grid-cols-2 gap-4`):

| Campo | Tipo | Placeholder |
|-------|------|------------|
| PAI | Input text | "Nome do pai" |
| MÃE | Input text | "Nome da mãe" |

---

#### **4. Seções Adicionais (Endereço, Registro de Nascimento, etc.)**

Padrão semelhante ao de "Dados Pessoais":

**Seção: Endereço**
- CEP (com busca automática ViaCEP)
- Endereço
- Número
- Bairro
- Cidade
- UF
- Complemento
- Naturalidade
- UF Naturalidade
- Email

**Seção: Registro de Nascimento**
- Termo
- Folha
- Livro
- Nome Cartório

**Seção: Informações para Censo INEP**
- Tipo de Escola Anterior
- País Origem
- Estabelecimento (Ensino Médio)
- Ano de Conclusão
- Endereço DEM
- Município DEM
- UF DEM

**Seção: Deficiências**
- Pessoa com Deficiência (checkbox)
- Tipo de Deficiência (select)

---

### 🔘 Botões do Formulário

**Container de Botões**:
- Flex layout: `flex gap-3 justify-end`
- Margin top: `mt-6`

**Botão: Cancelar**
- Cor do texto: `text-gray-700`
- Cor de fundo: `bg-gray-200`
- Hover: `hover:bg-gray-300`
- Padding: `px-6 py-2`
- Border radius: `rounded-lg`
- Font weight: `font-semibold`
- Transição: `transition`

**Botão: Salvar**
- Cor de fundo: `bg-teal-600`
- Hover: `hover:bg-teal-700`
- Cor do texto: `text-white`
- Padding: `px-6 py-2`
- Border radius: `rounded-lg`
- Font weight: `font-semibold`
- Transição: `transition`

---

### 💬 Feedback do Usuário

**Mensagem de Sucesso/Erro**:
- Margin bottom: `mb-4`
- Padding: `px-4 py-3`
- Border radius: `rounded-lg`
- Font size: `text-sm`
- Border: `border-l-4`

**Sucesso**:
- Background: `bg-green-50`
- Border color: `border-l-green-400`
- Texto: `text-green-700`

**Erro**:
- Background: `bg-red-50`
- Border color: `border-l-red-400`
- Texto: `text-red-700`

---

## Layout das Tabelas de Listagem

### 📍 Localização - Exemplo: Gerenciar Disciplinas
- **URL**: `http://localhost:3000/admin/disciplinas`
- **Arquivo**: `pages/admin/disciplinas/index.js`
- **Layout Container**: `DashboardLayout`

### 🎨 Estrutura Geral

#### Cabeçalho
- **Ícone**: 📖 (emoji)
- **Título**: "Gerenciar Disciplinas" (ou outra entidade)
- **Classes Tailwind**: `text-2xl md:text-3xl font-bold text-gray-800`
- **Container**: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6`

---

### 📌 Seção de Abas

**Estrutura**:
- Flex layout: `flex gap-2 border-b border-gray-200`
- Margin bottom: `mb-6`

**Tab Ativa** (Listar):
- Ícone + Texto: `📋 Listar`
- Cor do texto: `text-teal-600`
- Border bottom: `border-b-2 border-teal-600`
- Padding: `px-6 py-3`
- Font weight: `font-semibold`

**Tab Inativa** (Inserir):
- Ícone + Texto: `➕ Inserir`
- Cor do texto: `text-gray-500`
- Hover: `hover:text-teal-600`
- Transição: `transition`
- Padding: `px-6 py-3`
- Font weight: `font-semibold`

---

### 🔍 Seção: Filtro de Busca

**Container**:
- Background: `bg-teal-50`
- Border: `border border-teal-200`
- Border radius: `rounded-lg`
- Padding: `p-4 md:p-6`
- Margin bottom: `mb-6`

**Título do Filtro**:
- Ícone: 🔍
- Font size: `text-lg`
- Font weight: `font-semibold`
- Cor: `text-gray-700`
- Display: `flex items-center gap-2 mb-4`

**Estrutura do Filtro**:
- 3 linhas de filtros
- Cada linha com 3 colunas: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Space between linhas: `space-y-4`

#### **Linha 1 - Dropdowns Principais** (3 campos):

| Campo | Tipo | Placeholder/Opções |
|-------|------|-------------------|
| CURSO | Select | "- Selecione um Curso -" |
| PERÍODO | Select | "- Selecione um Período -" |
| GRADE | Select + X | "ADM EAD" (com botão de limpar) |

**Select Styles**:
- Width: `w-full`
- Padding: `px-3 py-2`
- Font size: `text-sm`
- Border: `border border-teal-300`
- Border radius: `rounded-lg`
- Focus: `focus:outline-none focus:border-teal-500`
- Background: `bg-white`

**Botão X (Grade)**:
- Cor: `text-gray-500`
- Hover: `hover:text-gray-700`
- Padding: `px-3 py-2`
- Font size: `text-lg`

#### **Linha 2 - Busca e Ações** (3 campos):

| Campo | Tipo | Placeholder |
|-------|------|------------|
| NOME | Input text | "Nome da Disciplina" |
| SITUAÇÃO | Select | "- Selecione -" / ATIVO / INATIVO |
| LIMPAR | Button | - |

**Botão LIMPAR**:
- Width: `w-full`
- Padding: `px-4 py-2`
- Background: `bg-teal-600`
- Hover: `hover:bg-teal-700`
- Cor do texto: `text-white`
- Border radius: `rounded-lg`
- Font weight: `font-semibold`
- Font size: `text-sm`
- Transição: `transition`

---

### 📊 Seção: Listagem de Dados

**Container da Tabela**:
- Background: `bg-white`
- Border radius: `rounded-lg`
- Sombra: `shadow-md`
- Overflow: `overflow-hidden`

**Cabeçalho da Tabela**:
- Flex layout: `flex items-center justify-between`
- Padding: `p-4 md:p-6`
- Border bottom: `border-b border-gray-200`

**Título**: `text-lg font-semibold text-gray-700`
**Ícone**: `📖 Listagem das disciplinas`

**Informações Adicionais**:
- Flex layout: `flex items-center gap-4`
- Quantidade: `text-sm text-gray-600`
- Negrito: `<strong>{filtradas.length}</strong>`

---

#### **Tabela HTML**

**Table Header (thead)**:

| Coluna | Descrição |
|--------|-----------|
| # | Código da disciplina |
| Período | Período letivo |
| Disciplina | Nome da disciplina |
| Curso | Curso vinculado |
| Carga horária | Horas totais |
| Matriz? | Sim/Não (checkbox) |
| Grade | Grade curricular |
| Ações | Botões de ação |

**Header Styles**:
- Background: `bg-teal-100`
- Border bottom: `border-b border-teal-300`
- Texto: `text-xs font-semibold text-teal-800`
- Border right: `border-r border-teal-300` (em cada th)
- Padding: `px-4 py-3`

**Table Body (tbody)**:

**Row Styles**:
- Border bottom: `border-b border-gray-200`
- Hover: `hover:bg-teal-50 transition`

**Cell Styles**:
- Padding: `px-4 py-3`
- Font size: `text-sm`
- Cor: `text-gray-700`
- Border right: `border-r border-gray-200`

**Cell Especial (Disciplina)**:
- Font weight: `font-semibold`
- Cor: `text-gray-800`

---

#### **Coluna: Ações**

**Layout**:
- Flex: `flex items-center justify-center gap-2`
- Padding: `px-4 py-3 text-center`

**Botões de Ação** (6 ícones):

| Ícone | Ação | Título | Cor |
|-------|------|--------|-----|
| 📝 | Imprimir | "Imprimir" | `text-orange-600` |
| 🔗 | Link/Visualizar | "Link" | `text-blue-600` |
| ⚙️ | Configurar | "Configurar" | `text-gray-600` |
| ☁️ | Cloud/Upload | "Cloud" | `text-purple-600` |
| ✏️ | Editar | "Editar" | `text-blue-600` |
| ❌ | Deletar | "Deletar" | `text-red-600` |

**Button Styles**:
- Padding: `p-2`
- Hover: `hover:text-{color}-800 transition`
- Cursor: `cursor-pointer`
- Font size: `text-lg`

---

### 🔘 Botão: IMPRIMIR

**Container**: Lado direito do cabeçalho da tabela

**Estilos**:
- Padding: `px-4 py-2`
- Background: `bg-yellow-500`
- Hover: `hover:bg-yellow-600`
- Cor do texto: `text-white`
- Border radius: `rounded-lg`
- Font weight: `font-semibold`
- Font size: `text-sm`
- Transição: `transition`

---

### 📝 Estados Vazios

**Quando não há dados**:
- Padding: `p-6`
- Text align: `text-center`
- Cor: `text-gray-500`
- Mensagem: "Nenhuma disciplina encontrada"

**Quando está carregando**:
- Padding: `p-6`
- Text align: `text-center`
- Cor: `text-gray-500`
- Mensagem: "Carregando..."

---

## Padrões de Design

### 🎨 Paleta de Cores

| Cor | Uso | Hex/Tailwind |
|-----|-----|--------------|
| Teal | Primária (Inputs, headers) | `#14b8a6` / `teal-600` |
| Teal Claro | Backgrounds | `#ccf5f1` / `teal-50` |
| Teal Border | Borders | `#7dd3c0` / `teal-300` |
| Cinza | Textos neutros | `#374151` / `gray-700` |
| Verde | Sucesso | `#16a34a` / `green-600` |
| Vermelho | Erro/Deletar | `#dc2626` / `red-600` |
| Amarelo | Avisos/Imprimir | `#eab308` / `yellow-500` |
| Azul | Links/Editar | `#2563eb` / `blue-600` |
| Roxo | Secundária | `#a855f7` / `purple-600` |
| Laranja | Ações alternativas | `#ea580c` / `orange-600` |

### 📐 Espaçamento Padrão

| Elemento | Padding/Margin | Tailwind |
|----------|----------------|----------|
| Container principal | 4-6 lateral | `p-4 md:p-6` |
| Seção/Card | 4-6 | `p-4 md:p-6` |
| Grid gap | 4 (normal), 2 (compacto) | `gap-4`, `gap-2` |
| Margin bottom (títulos) | 4 | `mb-4` |
| Margin bottom (seções) | 6 | `mb-6` |

### 📏 Tipografia

| Elemento | Tamanho | Peso | Tailwind |
|----------|---------|------|----------|
| Título principal | 24-32px | 700 | `text-2xl md:text-3xl font-bold` |
| Título seção | 18px | 700 | `text-lg font-bold` |
| Label | 12px | 500 | `text-xs font-medium` |
| Input/Select | 14px | 400 | `text-sm` |
| Tabela header | 12px | 600 | `text-xs font-semibold` |
| Tabela body | 14px | 400 | `text-sm` |

### 🔄 Responsive Design

- **Mobile**: 1 coluna, padding `p-4`
- **Tablet/Desktop**: Múltiplas colunas, padding `p-6`
- **Breakpoint**: `md:` (768px)

Exemplo:
```tailwind
grid-cols-1 md:grid-cols-3  /* 1 coluna em mobile, 3 em desktop */
p-4 md:p-6                   /* Padding 4 em mobile, 6 em desktop */
text-2xl md:text-3xl         /* Tamanho menor em mobile, maior em desktop */
```

---

## Componentes Reutilizáveis

### 1️⃣ **Seção de Formulário**

```jsx
<div className="bg-white rounded-lg shadow-md p-4 md:p-6">
  <h2 className="text-lg font-bold text-teal-600 mb-4">Título da Seção</h2>
  
  <div className="grid grid-cols-1 md:grid-cols-X gap-4">
    {/* Campos aqui */}
  </div>
</div>
```

### 2️⃣ **Input com Label**

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    LABEL
  </label>
  <input
    type="text"
    placeholder="Placeholder"
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### 3️⃣ **Select com Label**

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    LABEL
  </label>
  <select className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white">
    <option>- Selecione -</option>
    <option>Opção 1</option>
  </select>
</div>
```

### 4️⃣ **Checkbox com Label**

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    Label
  </label>
  <input
    type="checkbox"
    className="w-5 h-5 text-teal-600 rounded cursor-pointer"
  />
</div>
```

### 5️⃣ **Botão Primário**

```jsx
<button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition">
  Salvar
</button>
```

### 6️⃣ **Botão Secundário**

```jsx
<button className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition">
  Cancelar
</button>
```

### 7️⃣ **Filtro de Busca**

```jsx
<div className="bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6 mb-6">
  <div className="flex items-center gap-2 mb-4">
    <span className="text-teal-600 text-xl">🔍</span>
    <h2 className="text-lg font-semibold text-gray-700">Filtro de Busca</h2>
  </div>
  <div className="space-y-4">
    {/* Linhas de filtros */}
  </div>
</div>
```

### 8️⃣ **Tabela**

```jsx
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-700">Título</h2>
    <button>IMPRIMIR</button>
  </div>
  
  <table className="w-full border-collapse">
    <thead>
      <tr className="bg-teal-100 border-b border-teal-300">
        <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800">Coluna</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-200 hover:bg-teal-50">
        <td className="px-4 py-3 text-sm text-gray-700">Dado</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🚀 Notas de Implementação

### Funcionalidades Importantes

1. **Máscara de Entrada**:
   - CPF: `XXX.XXX.XXX-XX`
   - Telefone: `(XX) XXXXX-XXXX`
   - CEP: `XXXXX-XXX`

2. **Validações**:
   - Campos obrigatórios marcados com `*` em vermelho
   - Feedback visual em tempo real

3. **Busca de Endereço**:
   - API ViaCEP para preenchimento automático de CEP
   - Preenchimento de Endereço, Bairro, Cidade, UF

4. **Paginação e Filtros**:
   - Filtros múltiplos aplicáveis
   - Botão "LIMPAR" para resetar filtros
   - Quantidade de registros exibida

5. **Responsividade**:
   - Desktop: Múltiplas colunas
   - Mobile: Layout em coluna única
   - Overflow horizontal em tabelas grandes

6. **Ações em Linha**:
   - Ícones com hover effects
   - Tooltips ao passar o mouse
   - Confirmação em ações destrutivas (deletar)

---

## 📱 Considerações Mobile

- Formulários: Máximo 1-2 colunas em mobile
- Tabelas: Scroll horizontal
- Botões: Tamanho mínimo de `44x44px` para toque
- Espaçamento: Aumentado para facilitar navegação

---

## ✅ Checklist de Implementação

- [ ] Copiar estrutura HTML dos layouts
- [ ] Aplicar classes Tailwind CSS
- [ ] Implementar validações de formulário
- [ ] Adicionar funcionalidades de busca/filtro
- [ ] Configurar responsividade
- [ ] Testar em diferentes dispositivos
- [ ] Implementar feedback de usuário (mensagens)
- [ ] Adicionar ícones/emojis
- [ ] Testar acessibilidade
- [ ] Otimizar performance

---

**Última atualização**: 14 de janeiro de 2026
**Versão**: 1.0
