# 📋 Padrão de Botões - CREESER Educacional

## ✅ Resumo de Implementação

Este documento descreve o padrão de botões aplicado consistentemente em todos os módulos de cadastro e listagem.

---

## 🎨 Paleta de Cores

### Botões de Ação Principal (Novo/Criar/Atualizar)
```jsx
className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-semibold px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200"
```
**Uso:** Botão "+ Novo Funcionário", "Criar", "Atualizar"

### Botão Editar (em tabelas)
```jsx
className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-semibold px-3 py-1 rounded text-sm hover:shadow-lg transition-all"
```
**Uso:** Ações de edição em linhas de tabela

### Botão Inativar (em tabelas)
```jsx
className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded text-sm font-semibold transition-all"
```
**Uso:** Alternar status de registros (ATIVO/INATIVO)

### Botão Excluir (em tabelas)
```jsx
className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-all"
```
**Uso:** Remover registros permanentemente

### Botão Cancelar
```jsx
className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-6 py-2 rounded-lg transition-all"
```
**Uso:** Fechar formulários ou voltar sem salvar

---

## 📌 Implementado

### ✅ Módulo Funcionários (COMPLETO)

**Listagem:** `components/AdminFuncionarios.js`
- ✅ Botão "+ Novo Funcionário" (amarelo-laranja gradiente)
- ✅ Botão "Editar" em cada linha (amarelo-laranja gradiente)
- ✅ Botão "Inativar" em cada linha (laranja claro)
- ✅ Botão "Excluir" em cada linha (vermelho sólido)

**Formulário:** `pages/admin/funcionarios/novo.js`
- ✅ Botão "Criar"/"Atualizar" (amarelo-laranja gradiente)
- ✅ Botão "Cancelar" (cinza)
- ✅ Auto-preenchimento de endereço via CEP
- ✅ Campo "Número" adicionado

---

## 📋 Estrutura de Botões em Tabelas

```jsx
<div className="flex justify-center gap-2">
  <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-semibold px-3 py-1 rounded text-sm hover:shadow-lg transition-all">
    Editar
  </button>
  <button className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded text-sm font-semibold transition-all">
    Inativar
  </button>
  <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-all">
    Excluir
  </button>
</div>
```

---

## 📝 Próximos Passos (Recomendado)

Aplicar o mesmo padrão em:
1. ✅ **Funcionários** - PRONTO
2. ⏳ **Usuários** - Já tem padrão similar (manter como está)
3. ⏳ **Alunos** - Precisa atualizar AdminAlunos.js
4. ⏳ **Cursos** - Precisa atualizar AdminCursos.js
5. ⏳ **Professores** - Precisa atualizar AdminProfessores.js
6. ⏳ **Avaliações** - Precisa atualizar AdminAvaliacoes.js
7. ⏳ **Documentos** - Precisa atualizar AdminDocumentos.js
8. ⏳ **E-mails** - Precisa atualizar AdminEmails.js
9. ⏳ **Blog** - Precisa atualizar AdminBlog.js
10. ⏳ **Slider** - Precisa atualizar AdminSlider.js

---

## 🔧 Mudanças Realizadas

### AdminFuncionarios.js
```diff
- <button className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium">
+ <button className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-semibold rounded-lg hover:shadow-lg transition-all duration-200">
  + Novo Funcionário
</button>
```

```diff
- <button className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition">✏️</button>
- <button className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition">✕</button>
+ <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-semibold px-3 py-1 rounded text-sm hover:shadow-lg transition-all">Editar</button>
+ <button className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded text-sm font-semibold transition-all">Inativar</button>
+ <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-all">Excluir</button>
```

### novo.js (Formulário)
```diff
- <button type="submit" className="px-12 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg">CADASTRAR</button>
+ <button type="submit" className="px-12 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-semibold rounded-lg hover:shadow-lg transition-all duration-200">
+   {isEditando ? 'Atualizar' : 'Criar'}
+ </button>
+ <button type="button" className="px-12 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all">
+   Cancelar
+ </button>
```

---

## 🎯 Benefícios

✅ **Consistência Visual** - Mesmos botões em todos os módulos
✅ **Melhor UX** - Cores significam ações (amarelo=editar, vermelho=deletar)
✅ **Profissionalismo** - Gradiente e sombras modernas
✅ **Acessibilidade** - Textos descritivos em vez de ícones
✅ **Responsividade** - Botões adapta em mobile e desktop

---

## 📌 Notas

- **Gradiente Amarelo-Laranja:** Usado em ações principais (criar, editar)
- **Laranja Claro:** Usado em ações secundárias (inativar)
- **Vermelho:** Reservado para ações destrutivas (excluir)
- **Cinza:** Usado em cancelamentos
- **Feedback visual:** Sombras e cores mais escuras no hover

---

**Data:** 11 de Dezembro de 2025  
**Status:** ✅ Funcionários (Completo) | ⏳ Outros módulos (Pendente)
