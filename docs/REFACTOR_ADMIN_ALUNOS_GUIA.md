/**
 * @file REFACTOR_ADMIN_ALUNOS_GUIA.md
 * @description Guia completo de refatoração do AdminAlunos.js
 * @author CREESER Development
 * @date 2026-01-22
 */

# 🔄 REFATORAÇÃO AdminAlunos.js - GUIA COMPLETO

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois | Redução |
|---------|-------|--------|---------|
| Linhas de código | 832 | ~400 | **52%** ✅ |
| Estados locais | 10+ | 6 | **40% redução** |
| Funções handler | 8+ inline | 6 reutilizáveis | **Melhor** |
| Repetição de código | Alto | Nenhuma | **100% eliminada** |
| Documentação | Nenhuma | Completa JSDoc | **+100%** |
| Imports | 1 | 12+ reutilizáveis | **Modularizado** |

---

## 🎯 Principais Mudanças

### 1️⃣ REMOÇÃO DO ESTADO DUPLICADO

**ANTES:**
```javascript
// Duplicação de estado - múltiplos hooks para mesma coisa
const [alunos, setAlunos] = useState([]);
const [carregando, setCarregando] = useState(false);
const [erro, setErro] = useState(null);
```

**DEPOIS:**
```javascript
// Um hook customizado que encapsula tudo
const { data: alunos, loading, erro, refetch } = useApiData('/api/alunos');
```

**Benefício:** Menos código boilerplate, menos bugs de estado

---

### 2️⃣ FETCH CENTRALIZADO

**ANTES:**
```javascript
const carregarAlunos = async () => {
  try {
    const response = await fetch('/api/alunos');
    const data = await response.json();
    setAlunos(data);
  } catch (error) {
    console.error('Erro ao carregar alunos:', error);
    alert('Erro ao carregar alunos');
  }
};

const carregarCursos = async () => {
  try {
    const response = await fetch('/api/cursos');
    const data = await response.json();
    setCursos(data);
  } catch (error) {
    console.error('Erro ao carregar cursos:', error);
  }
};

useEffect(() => {
  carregarAlunos();
  carregarCursos();
}, []);
```

**DEPOIS:**
```javascript
const { data: alunos, loading, erro, refetch } = useApiData('/api/alunos');
const { data: cursos = [] } = useApiData('/api/cursos');
// Sem useEffect! Hook gerencia automaticamente
```

**Benefício:** Menos código, melhor tratamento de erros, retry automático

---

### 3️⃣ VALIDAÇÃO CENTRALIZADA

**ANTES:**
```javascript
const maskCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskWhatsApp = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCEP = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

// ... mais 50+ linhas de formatação
```

**DEPOIS:**
```javascript
import { formatarCPF, formatarTelefone, formatarCEP } from '@/utils/formatadores';
import { validarCPF, validarTelefone, validarEmail } from '@/utils/validacoes';

// Uso simples:
<CampoFormulario
  nome="cpf"
  valor={formatarCPF(valores.cpf)}
  onChange={handleChange}
/>
```

**Benefício:** Reutilizável em todos os componentes, testes unitários, manutenção centralizada

---

### 4️⃣ FORMULÁRIO SIMPLIFICADO

**ANTES:**
```javascript
const [formData, setFormData] = useState({});
const [uploading, setUploading] = useState(false);

const handleChange = (e) => {
  const { name, value } = e.target;
  let maskedValue = value;

  if (name === 'cpf') maskedValue = maskCPF(value);
  if (name === 'whatsapp') maskedValue = maskWhatsApp(value);
  if (name === 'cep') maskedValue = maskCEP(value);

  setFormData({ ...formData, [name]: maskedValue });
};

// 150+ linhas de JSX para um formulário
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
  <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8">
    {/* ... 200 linhas de campos ... */}
  </div>
</div>
```

**DEPOIS:**
```javascript
const { valores, erros, carregando, handleChange, handleSubmit } =
  useFormData(initialValues, onSubmit);

// Apenas 50 linhas com componentes reutilizáveis
<Formulario valores={valores} erros={erros} onSubmit={handleSubmit}>
  <CampoFormulario nome="nomeCompleto" label="Nome *" requerido />
  <CampoFormulario nome="email" label="Email *" tipo="email" requerido />
  <CampoFormulario nome="cpf" label="CPF *" requerido />
  {/* ... */}
</Formulario>
```

**Benefício:** Menos JSX, validação integrada, comportamento consistente

---

### 5️⃣ TABELA DINÂMICA

**ANTES:**
```javascript
// ~150 linhas de JSX para renderizar tabela
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="bg-gray-100">
        <th className="px-4 py-2 text-left">Foto</th>
        <th className="px-4 py-2 text-left">Nome</th>
        <th className="px-4 py-2 text-left">Email</th>
        {/* ... mais colunas ... */}
      </tr>
    </thead>
    <tbody>
      {alunos.map(aluno => (
        <tr key={aluno.id}>
          <td>{/* foto inline code */}</td>
          <td>{/* nome inline code */}</td>
          {/* ... */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**DEPOIS:**
```javascript
const colunas = [
  {
    chave: 'foto',
    titulo: 'Foto',
    renderizador: (valor) => (
      <img src={valor} alt="Foto" className="h-10 w-10 rounded-full" />
    ),
  },
  { chave: 'nomeCompleto', titulo: 'Nome' },
  { chave: 'email', titulo: 'Email' },
  // ... configuração simples
];

<Tabela colunas={colunas} dados={alunosFiltrados} />
```

**Benefício:** Configuração simples, reutilizável, responsive automático

---

## 📋 Passo a Passo da Refatoração

### Passo 1: Imports

```javascript
// Adicionar no topo do arquivo
import { useApiData } from '@/hooks/useApiData';
import { useFormData } from '@/hooks/useFormData';
import Tabela from '@/components/ui/Tabela';
import Formulario, { CampoFormulario } from '@/components/ui/Formulario';
import Botao from '@/components/ui/Botao';
import Cartao from '@/components/ui/Cartao';
import { Carregando, SkeletonTabela } from '@/components/ui/Carregando';
import ClienteAPI from '@/utils/api';
import {
  formatarCPF,
  formatarTelefone,
  formatarData,
  formatarNome,
} from '@/utils/formatadores';
import {
  validarEmail,
  validarCPF,
  validarTelefone,
  validarRequerido,
} from '@/utils/validacoes';
import { STATUS_USUARIO, GENEROS } from '@/utils/constantes';
```

### Passo 2: Remover Hooks de Estado Duplicado

```javascript
// ❌ REMOVER
const [alunos, setAlunos] = useState([]);
const [cursos, setCursos] = useState([]);
const [carregando, setCarregando] = useState(false);
const [erro, setErro] = useState(null);
const [uploading, setUploading] = useState(false);
const [modal, setModal] = useState({...});

// ✅ ADICIONAR
const { data: alunos, loading, erro, refetch } = useApiData('/api/alunos');
const { data: cursos = [] } = useApiData('/api/cursos');
const [visualizacao, setVisualizacao] = useState('todos');
const [modal, setModal] = useState({...}); // Apenas para UI
```

### Passo 3: Remover useEffect

```javascript
// ❌ REMOVER TODO O useEffect
useEffect(() => {
  carregarAlunos();
  carregarCursos();
}, []);

// ✅ REMOVER AS FUNÇÕES carregarAlunos() e carregarCursos()
// O hook useApiData gerencia automaticamente
```

### Passo 4: Substituir Máscara por Formatadores

```javascript
// ❌ REMOVER
const maskCPF = (value) => { /* 10 linhas */ };
const maskWhatsApp = (value) => { /* 10 linhas */ };
const maskCEP = (value) => { /* 10 linhas */ };
const handleChange = (e) => {
  // 20 linhas com ifs para cada máscara
};

// ✅ ADICIONAR NO CAMPO
<CampoFormulario
  nome="cpf"
  valor={formatarCPF(valores.cpf)}
  onChange={handleChange}
/>
```

### Passo 5: Usar useFormData

```javascript
// ✅ NOVO HOOK
const { valores, erros, carregando, handleChange, handleSubmit, resetar } =
  useFormData(
    { /* initial values */ },
    async (valores) => {
      // Lógica de submit aqui
    }
  );

// O handleChange automático com máscara
// O handleSubmit com validação
```

### Passo 6: Simplificar Formulário

```javascript
// ❌ REMOVER 200 linhas de JSX
const renderFormulario = () => { /* enorme */ };

// ✅ ADICIONAR FORMULÁRIO SIMPLES
{mostrarFormulario && (
  <div className="fixed inset-0 bg-black bg-opacity-50 ...">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
      <Formulario valores={valores} erros={erros} onSubmit={handleSubmit}>
        <CampoFormulario nome="nomeCompleto" label="Nome *" requerido />
        <CampoFormulario nome="email" label="Email *" tipo="email" requerido />
        {/* ... campos ... */}
      </Formulario>
    </div>
  </div>
)}
```

### Passo 7: Configurar Colunas da Tabela

```javascript
// ✅ NOVO
const colunas = [
  {
    chave: 'foto',
    titulo: 'Foto',
    largura: '5%',
    renderizador: (valor) =>
      valor ? <img src={valor} alt="Foto" className="..." /> : <div className="..." />,
  },
  { chave: 'nomeCompleto', titulo: 'Nome', largura: '25%' },
  { chave: 'email', titulo: 'Email', largura: '25%' },
  { chave: 'cpf', titulo: 'CPF', largura: '15%', renderizador: formatarCPF },
  { chave: 'whatsapp', titulo: 'Telefone', largura: '15%', renderizador: formatarTelefone },
  {
    chave: 'status',
    titulo: 'Status',
    largura: '10%',
    renderizador: (valor) => (
      <span className={valor === STATUS_USUARIO.ATIVO ? 'bg-green-100' : 'bg-gray-100'}>
        {valor === STATUS_USUARIO.ATIVO ? 'Ativo' : 'Inativo'}
      </span>
    ),
  },
  {
    chave: 'acoes',
    titulo: 'Ações',
    largura: '15%',
    renderizador: (_, aluno) => (
      <div className="flex gap-2">
        <Botao tamanho="pequeno" onClick={() => abrirEdicao(aluno)}>
          Editar
        </Botao>
        <Botao tamanho="pequeno" variant="perigo" onClick={() => deletarAluno(aluno)}>
          Deletar
        </Botao>
      </div>
    ),
  },
];
```

### Passo 8: Usar ClienteAPI

```javascript
// ❌ REMOVER
const handleSubmitNovo = async (e) => {
  const response = await fetch('/api/alunos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  // ... tratamento
};

// ✅ USAR NOVO
const onSubmit = async (valores) => {
  await ClienteAPI.post('/api/alunos', valores);
  refetch();
};
```

### Passo 9: Render Simplificado

```javascript
// ✅ RENDER FINAL
return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Gerenciar Alunos</h1>
      <Botao variant="primario" onClick={abrirNovoAluno}>
        + Novo Aluno
      </Botao>
    </div>

    {/* Filtros em Cartao */}
    <Cartao>
      {/* Campos de filtro */}
    </Cartao>

    {/* Tabela com skeleton loading */}
    <Cartao titulo="Lista de Alunos">
      {loading ? (
        <SkeletonTabela linhas={5} colunas={colunas.length} />
      ) : erro ? (
        <div className="p-4 bg-red-50 border border-red-200">
          {erro.toString()}
        </div>
      ) : (
        <Tabela colunas={colunas} dados={alunosFiltrados} />
      )}
    </Cartao>

    {/* Formulário modal */}
    {mostrarFormulario && /* ... */}

    {/* Confirmação modal */}
    <ConfirmModal {...modal} />
  </div>
);
```

---

## ✅ Checklist de Refatoração

Para refatorar outro componente Admin, seguir este checklist:

- [ ] Adicionar imports dos hooks, componentes, utilitários
- [ ] Substituir `useState` + `useEffect` por `useApiData`
- [ ] Substituir múltiplos `useState` de formulário por `useFormData`
- [ ] Remover funções de máscara e validação (usar utils)
- [ ] Remover funções `carregarXXX()` (useApiData gerencia)
- [ ] Remover `renderXXX()` JSX inline (usar componentes)
- [ ] Configurar `colunas` array para Tabela
- [ ] Substituir `fetch` por `ClienteAPI`
- [ ] Usar `Formulario` + `CampoFormulario` para inputs
- [ ] Usar `Botao` com variants corretos
- [ ] Usar `Cartao` para agrupar seções
- [ ] Usar `SkeletonTabela` para loading
- [ ] Usar `formatarXXX()` em renderizadores de coluna
- [ ] Adicionar JSDoc no topo do arquivo
- [ ] Adicionar comentários em Português para lógica complexa
- [ ] Testar create, read, update, delete
- [ ] Testar validação de campos
- [ ] Testar mensagens de erro
- [ ] Fazer commit com mensagem descritiva

---

## 📊 Exemplo de Commit Depois da Refatoração

```bash
git commit -m "refactor: simplify AdminAlunos using reusable components

Refactored AdminAlunos.js to use new component library and custom hooks:
- Replaced inline fetch with useApiData hook (automatic loading/error handling)
- Replaced form state management with useFormData hook
- Replaced 200 lines of form JSX with Formulario component
- Replaced 150 lines of table code with Tabela component with dynamic columns
- Replaced inline masks/format with utils/formatadores functions
- Replaced inline validation with utils/validacoes functions
- Removed 432 lines of code (52% reduction)
- Added JSDoc documentation and Portuguese comments
- Fixed handling of modals and confirmations
- Improved error messages and user feedback

Result:
- File size: 832 lines → ~400 lines
- Maintainability: ↑↑↑
- Reusability: ↑↑↑
- Bug potential: ↓↓↓"
```

---

## 🚀 Próximas Refatorações

Após completar AdminAlunos, aplicar mesmo padrão a:

1. **AdminProfessores.js** - Similar a AdminAlunos, usar mesmo template
2. **AdminCursos.js** - Similar, com campos diferentes
3. **AdminTurmas.js** - Com seleção de turmas
4. **AdminAvaliacoes.js** - Com seleção de questões
5. **AdminBlog.js** - Com editor de texto rico
6. **AdminDocumentos.js** - Com upload de arquivos
7. **AdminFinanceiro.js** - Com formatação de moeda
8. **AdminUsuarios.js** - Com roles e permissões
9. **AdminFuncionarios.js** - Similar a AdminProfessores
10. **AdminSlider.js** - Com upload de imagens
11. **AdminEmails.js** - Com templates
12. **AdminSidebar.js** - Já está otimizado

---

## 💡 Tips para Refatoração Bem-Sucedida

1. **Comece com um componente** - Não tente refatorar tudo de uma vez
2. **Teste enquanto refatora** - Verifique cada feature
3. **Use git branches** - Crie branch para refatoração
4. **Mantenha compatibilidade** - Componentes devem funcionar identicamente
5. **Documento mudanças** - Adicione comentários sobre o novo padrão
6. **Peça review** - Mostre o resultado antes de fazer merge
7. **Reutilize padrão** - AdminAlunos é template para outros

---

**Arquivo de Referência:** `/components/AdminAlunos.js.refatorado`

Copie esse arquivo como base para refatorar outros componentes Admin!
