# 🏗️ PADRÕES DE ENGENHARIA - CREESER EDUCACIONAL

**Data:** 22 de janeiro de 2026  
**Status:** Implementação em progresso

---

## 📋 Índice

1. [Estrutura de Componentes](#estrutura-de-componentes)
2. [Hooks Customizados](#hooks-customizados)
3. [Componentes Reutilizáveis](#componentes-reutilizáveis)
4. [Padrões de Código](#padrões-de-código)
5. [Comentários em Português](#comentários-em-português)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Checklist de Refatoração](#checklist-de-refatoração)

---

## 🏗️ Estrutura de Componentes

### Novo Padrão

```
components/
├── ui/                          # Componentes base reutilizáveis
│   ├── Tabela.js               # Componente de tabela genérica
│   ├── Formulario.js           # Componente de formulário genérico
│   ├── Modal.js                # Modal genérica
│   ├── Botao.js                # Botão padronizado
│   ├── Cartao.js               # Card/Cartão
│   └── Carregando.js           # Spinner de carregamento
│
├── admin/                       # Componentes Admin específicos
│   ├── AdminAlunos.js          # Gerenciamento de alunos
│   ├── AdminProfessores.js     # Gerenciamento de professores
│   ├── AdminCursos.js          # Gerenciamento de cursos
│   └── ...
│
├── layout/                      # Componentes de layout
│   ├── DashboardLayout.js
│   ├── AdminSidebar.js
│   ├── AdminHeader.js
│   └── ...
│
└── formularios/                 # Formulários específicos
    ├── FormularioAluno.js
    ├── FormularioProfessor.js
    └── ...
```

---

## 🎣 Hooks Customizados

### useApiData.js

```javascript
// Hook para carregar dados de APIs
const { data, loading, erro, refetch } = useApiData('/api/alunos');
```

**Vantagens:**
- Encapsula lógica comum de fetch
- Gerencia loading e erro automaticamente
- Permite refetch manual
- Suporta cache opcional

### useFormData.js

```javascript
// Hook para gerenciar estado de formulário
const { valores, erros, carregando, handleChange, handleSubmit, resetar } = 
  useFormData(valoresIniciais, onSubmit);
```

**Vantagens:**
- Gerencia estado de campos automaticamente
- Validação integrada
- Reset de formulário
- Tratamento de erros do servidor

---

## 🧩 Componentes Reutilizáveis

### Componente Tabela

```javascript
<Tabela
  colunas={[
    { chave: 'id', titulo: 'ID', largura: '10%' },
    { chave: 'nome', titulo: 'Nome', largura: '40%' },
    { chave: 'email', titulo: 'Email', largura: '40%' },
    { 
      chave: 'acoes', 
      titulo: 'Ações', 
      largura: '10%',
      renderizador: (valor, linha) => <BotoesAcao item={linha} />
    }
  ]}
  dados={alunos}
  carregando={loading}
/>
```

### Componente Formulário

```javascript
<Formulario
  campos={[
    { 
      nome: 'nome', 
      label: 'Nome', 
      tipo: 'text',
      requerido: true,
      placeholder: 'Ex: João Silva'
    },
    { 
      nome: 'email', 
      label: 'Email', 
      tipo: 'email',
      requerido: true,
      placeholder: 'Ex: joao@email.com'
    }
  ]}
  valores={valores}
  erros={erros}
  carregando={carregando}
  aoSubmeter={handleSubmit}
  aoReset={resetar}
  labelBotaoSubmit="Salvar Aluno"
/>
```

---

## 📝 Padrões de Código

### 1. Comentários de Arquivo

```javascript
/**
 * @file components/AdminAlunos.js
 * @description Componente para gerenciamento de alunos
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Este componente permite:
 * - Listar alunos
 * - Criar novos alunos
 * - Editar dados de alunos
 * - Deletar alunos
 * - Aprovar solicitações de matrícula
 */
```

### 2. Comentários de Função

```javascript
/**
 * Carrega lista de alunos da API
 * 
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Se falhar ao buscar dados
 * 
 * @example
 * await carregarAlunos();
 */
async function carregarAlunos() {
  // implementação
}
```

### 3. Comentários Inline

```javascript
// Apenas para comentários de UMA LINHA
const novoAluno = { ...alunoFormData }; // cria cópia para não mutar original

// Para lógica complexa:
// Valida se email já existe no banco de dados
// antes de salvar novo registro
const emailExiste = alunos.some(a => a.email === novoAluno.email);
```

### 4. Nomes Significativos

```javascript
// ❌ BOM (mas em português é melhor)
const x = fetch('/api/data');
const f = (d) => d.map(i => ({ ...i, v: true }));

// ✅ ÓTIMO
const alunos = fetch('/api/alunos');
const marcarComoAtivo = (dados) => 
  dados.map(aluno => ({ ...aluno, ativo: true }));
```

---

## 💬 Comentários em Português

### Padrão Recomendado

```javascript
/**
 * Função para validar dados do formulário de alunos
 * 
 * Valida:
 * - Nome não vazio
 * - Email em formato válido
 * - CPF com formato correto (se fornecido)
 * - Telefone com formato correto (se fornecido)
 * 
 * @param {Object} dados - Objeto com dados do formulário
 * @returns {Object} { valido: boolean, erros: Object }
 */
function validarAlunoFormulario(dados) {
  // objeto para armazenar erros encontrados
  const erros = {};

  // validação do nome
  if (!dados.nome?.trim()) {
    erros.nome = 'Nome é obrigatório';
  }

  // validação do email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(dados.email)) {
    erros.email = 'Email inválido';
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  };
}
```

---

## 🚨 Tratamento de Erros

### Padrão de Try/Catch

```javascript
/**
 * Salva novo aluno no banco de dados
 */
const salvarAluno = async (dadosAluno) => {
  try {
    // valida dados antes de enviar
    const { valido, erros } = validarAlunoFormulario(dadosAluno);
    if (!valido) {
      setErros(erros);
      return;
    }

    setCarregando(true);

    // faz requisição para API
    const resposta = await fetch('/api/alunos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAluno),
    });

    // trata resposta de erro do servidor
    if (!resposta.ok) {
      const dados = await resposta.json();
      throw new Error(dados.mensagem || 'Erro ao salvar aluno');
    }

    // sucesso
    const novoAluno = await resposta.json();
    setAlunos([...alunos, novoAluno]);
    
    // feedback ao usuário
    alert('Aluno salvo com sucesso!');
    setMostrarForm(false);

  } catch (erro) {
    // registra erro no console para debug
    console.error('Erro ao salvar aluno:', erro);
    
    // mostra erro ao usuário
    setErros({ geral: erro.message });
  } finally {
    // sempre remove estado de carregamento
    setCarregando(false);
  }
};
```

---

## ✅ Checklist de Refatoração

### Fase 1: Componentes Básicos (Começado)
- [x] useApiData.js - Hook para fetch de dados
- [x] useFormData.js - Hook para gerenciar formulários
- [x] Tabela.js - Componente de tabela genérico
- [x] Formulario.js - Componente de formulário genérico
- [ ] Botao.js - Botão padronizado
- [ ] Cartao.js - Card reutilizável
- [ ] Carregando.js - Spinner de carregamento

### Fase 2: Refatoração de Componentes Existentes
- [ ] AdminAlunos.js - Usar novos componentes
- [ ] AdminProfessores.js - Usar novos componentes
- [ ] AdminCursos.js - Usar novos componentes
- [ ] AdminTurmas.js - Usar novos componentes
- [ ] AdminUsuarios.js - Usar novos componentes
- [ ] AdminAvaliacoes.js - Usar novos componentes
- [ ] AdminBlog.js - Usar novos componentes
- [ ] AdminDocumentos.js - Usar novos componentes

### Fase 3: Comentários e Documentação
- [ ] Adicionar comentários JSDoc em todos os componentes
- [ ] Adicionar comentários inline em lógica complexa
- [ ] Documentar todas as funções
- [ ] Criar arquivo de padrões (este arquivo)

### Fase 4: Utilitários Comuns
- [ ] utils/validacoes.js - Funções comuns de validação
- [ ] utils/formatadores.js - Funções para formatar dados
- [ ] utils/api.js - Cliente HTTP customizado
- [ ] utils/constantes.js - Constantes do sistema

---

## 🎯 Próximos Passos

1. **Esta semana:** Refatorar AdminAlunos.js como exemplo
2. **Próxima semana:** Refatorar demais componentes Admin
3. **Semana seguinte:** Adicionar comentários em tudo
4. **Depois:** Criar utilitários compartilhados

---

## 📚 Referências

- [React Best Practices](https://react.dev)
- [Padrões JavaScript](https://javascript.info)
- [Tailwind CSS](https://tailwindcss.com)

---

**Padrões estabelecidos em:** 22 de janeiro de 2026  
**Próxima revisão:** 29 de janeiro de 2026

