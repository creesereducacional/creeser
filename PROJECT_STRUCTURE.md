#!/usr/bin/env node
/**
 * @file PROJECT_STRUCTURE.md
 * @description Estrutura completa do projeto CREESER pós-refatoração Phase 1
 * @author CREESER Development
 * @date 2026-01-22
 */

# 📁 ESTRUTURA DO PROJETO CREESER

## 🎯 Visão Geral

```
CREESER/
│
├── 📂 components/                  # Componentes React (25 existentes + 5 novos)
│   ├── 📂 ui/                      # 🆕 Componentes reutilizáveis (Foundation)
│   │   ├── Tabela.js              # ✅ Tabelas dinâmicas com colunas customizáveis
│   │   ├── Formulario.js          # ✅ Formulário + CampoFormulario
│   │   ├── Botao.js               # ✅ Botões com 4 variantes × 3 tamanhos
│   │   ├── Cartao.js              # ✅ Cards + CartaoGrade para layout
│   │   └── Carregando.js          # ✅ Spinners + Skeletons
│   │
│   ├── AdminAlunos.js             # ⏳ Refatoração: exemplo fornecido
│   ├── AdminProfessores.js        # ⏳ Refatoração: próxima
│   ├── AdminCursos.js             # ⏳ Refatoração: na fila
│   ├── AdminTurmas.js             # ⏳ Refatoração: na fila
│   ├── AdminAvaliacoes.js         # ⏳ Refatoração: na fila
│   ├── AdminBlog.js               # ⏳ Refatoração: na fila
│   ├── AdminDocumentos.js         # ⏳ Refatoração: na fila
│   ├── AdminFinanceiro.js         # ⏳ Refatoração: na fila
│   ├── AdminUsuarios.js           # ⏳ Refatoração: na fila
│   ├── AdminFuncionarios.js       # ⏳ Refatoração: na fila
│   ├── AdminSlider.js             # ⏳ Refatoração: na fila
│   ├── AdminEmails.js             # ⏳ Refatoração: na fila
│   ├── AdminSidebar.js            # ✅ Já otimizado
│   ├── AdminHeader.js             # 📝 Adicionar JSDoc (Phase 3)
│   │
│   ├── ConfirmModal.js            # 📝 Adicionar JSDoc (Phase 3)
│   ├── CustomModal.js             # 📝 Adicionar JSDoc (Phase 3)
│   ├── CookieBanner.js            # 📝 Adicionar JSDoc (Phase 3)
│   ├── DashboardLayout.js         # 📝 Adicionar JSDoc (Phase 3)
│   ├── ExemplosSupabase.js        # 📝 Adicionar JSDoc (Phase 3)
│   ├── Footer.js                  # 📝 Adicionar JSDoc (Phase 3)
│   ├── Forum.js                   # 📝 Adicionar JSDoc (Phase 3)
│   ├── Header.js                  # 📝 Adicionar JSDoc (Phase 3)
│   ├── ProfessorHeader.js         # 📝 Adicionar JSDoc (Phase 3)
│   ├── ProfessorLayout.js         # 📝 Adicionar JSDoc (Phase 3)
│   ├── ProfessorSidebar.js        # 📝 Adicionar JSDoc (Phase 3)
│   ├── RichTextEditor.js          # 📝 Adicionar JSDoc (Phase 3)
│   └── [+ 10 mais componentes]
│
├── 🪝 hooks/                       # 🆕 Hooks customizados (reutilizáveis)
│   ├── useApiData.js              # ✅ Fetch com loading/erro/refetch
│   └── useFormData.js             # ✅ Gerenciar estado e validação de formulário
│
├── 🔧 utils/                       # 🆕 Funções utilitárias (reutilizáveis)
│   ├── api.js                     # ✅ Cliente HTTP com auth, timeout, retry
│   ├── validacoes.js              # ✅ 10 funções de validação (email, CPF, etc)
│   ├── formatadores.js            # ✅ 13 funções de formatação (data, moeda, etc)
│   ├── constantes.js              # ✅ Constantes do sistema (roles, status, rotas)
│   └── [Phase 4] autenticacao.js  # ⏳ Login, logout, token management
│   └── [Phase 4] storage.js       # ⏳ localStorage helpers
│   └── [Phase 4] erros.js         # ⏳ Error handling e logging
│   └── [Phase 4] permissoes.js    # ⏳ Role-based access control
│
├── 📚 docs/                        # 📖 Documentação (completa)
│   ├── PADROES_ENGENHARIA.md      # ✅ Guia de padrões e standards
│   ├── FASE_1_COMPLETA.md         # ✅ Resumo da Phase 1
│   ├── REFACTOR_ADMIN_ALUNOS_GUIA.md # ✅ Step-by-step de refatoração
│   ├── [+ 10 mais documentos]     # ✅ Documentação existente
│   └── [+ 20 arquivos de referência]
│
├── 📂 pages/                       # Páginas Next.js
│   ├── api/                        # API routes
│   ├── admin/                      # Admin pages
│   ├── professor/                  # Professor pages
│   ├── aluno/                      # Student pages
│   └── [mais páginas]
│
├── 📂 public/                      # Arquivos estáticos
├── 📂 scripts/                     # Scripts de setup
├── 📂 styles/                      # CSS/Tailwind
├── 📂 lib/                         # Bibliotecas customizadas
├── 📂 context/                     # React Context
├── 📂 data/                        # Dados de exemplo (JSON)
├── 📂 prisma/                      # ORM Prisma
├── 📂 supabase/                    # Supabase config
│
├── 📄 package.json                 # Dependências do projeto
├── 📄 next.config.js               # Configuração Next.js
├── 📄 tailwind.config.js           # Configuração Tailwind
├── 📄 postcss.config.js            # Configuração PostCSS
├── 📄 jsconfig.json                # Configuração JS
│
├── 📄 STATUS_REFATORACAO.md        # ✅ Dashboard de status (ESTE)
├── 📄 FASE_1_COMPLETA.md           # ✅ Fase 1 summary
├── 📄 REFACTOR_ADMIN_ALUNOS_GUIA.md # ✅ Refactoring guide
└── 📄 AdminAlunos.js.refatorado    # ✅ Exemplo de refatoração
```

---

## 🎨 COMPONENTES UI (5 novos)

### Tabela.js
```javascript
// Uso
<Tabela 
  colunas={[
    { chave: 'nome', titulo: 'Nome', largura: '25%' },
    { chave: 'email', titulo: 'Email', renderizador: (v) => <a href={`mailto:${v}`}>{v}</a> }
  ]}
  dados={alunos}
  carregando={loading}
/>

// Features
✅ Colunas dinâmicas
✅ Renderizadores customizados
✅ Loading skeleton
✅ Empty state
✅ Row click handler
✅ Responsive
```

### Formulario.js + CampoFormulario
```javascript
// Uso
<Formulario valores={valores} erros={erros} onSubmit={handleSubmit}>
  <CampoFormulario 
    nome="email" 
    label="Email *" 
    tipo="email"
    erro={erros.email}
    onChange={handleChange}
    requerido
  />
  <CampoFormulario 
    nome="status" 
    label="Status"
    tipo="select"
    opcoes={[...]}
  />
  <CampoFormulario 
    nome="bio" 
    label="Biografia"
    tipo="textarea"
    maxLength={500}
  />
</Formulario>

// Features
✅ Tipos: text, email, password, date, select, textarea
✅ Validação integrada
✅ Error display
✅ Loading state
✅ Reset funcional
```

### Botao.js
```javascript
// Uso
<Botao variant="primario" tamanho="medio" onClick={handler}>
  Salvar
</Botao>

// Variantes
primario    // Teal - ação principal
secundario  // Blue - ações alternativas
perigo      // Red - deletar, cancelar
sucesso     // Green - operações bem-sucedidas

// Tamanhos
pequeno     // 8px padding
medio       // 12px padding (padrão)
grande      // 16px padding

// Features
✅ 4 variantes × 3 tamanhos
✅ Estado carregando
✅ Disabled automático
✅ Icon support
```

### Cartao.js + CartaoGrade
```javascript
// Uso
<Cartao titulo="Alunos" sombra>
  <p>Conteúdo do card</p>
  <Cartao.Footer>
    <Botao>Ação</Botao>
  </Cartao.Footer>
</Cartao>

<CartaoGrade colunas={2}>
  <Cartao titulo="Card 1" />
  <Cartao titulo="Card 2" />
</CartaoGrade>

// Features
✅ Header, content, footer
✅ Shadow option
✅ Grid layout
✅ Customizable columns
```

### Carregando.js
```javascript
// Uso
{loading ? <SkeletonTabela linhas={5} colunas={3} /> : <Tabela {...} />}

{submitting && <Carregando tamanho="grande" />}

<SkeletonFormulario campos={5} />
<SkeletonCartao />

// Features
✅ Spinner com variantes
✅ Skeleton loaders
✅ Pulse animation
✅ Configurável
```

---

## 🪝 CUSTOM HOOKS (2 novos)

### useApiData
```javascript
// Uso
const { data, loading, erro, refetch } = useApiData('/api/alunos', {
  dependencias: [filtro],
  parametros: { status: filtro },
  cache: 60000 // 1 minuto
});

// Features
✅ Auto fetch com useEffect
✅ Loading + error + data states
✅ Manual refetch
✅ Auto retry
✅ Caching opcional
✅ Query parameters
```

### useFormData
```javascript
// Uso
const { valores, erros, carregando, handleChange, handleSubmit, resetar, setarErros } = 
  useFormData(
    { nome: '', email: '' },
    async (valores) => {
      await api.post('/salvar', valores);
    }
  );

// Features
✅ Gerenciamento de estado
✅ Validação
✅ Error clearing on change
✅ Submit handling
✅ Reset funcional
✅ Manual error setting
```

---

## 🔧 UTILITIES (4 novos)

### validacoes.js (10 funções)
```javascript
validarEmail(email)                    // RFC compliant
validarCPF(cpf)                        // Com validação de dígito
validarTelefone(telefone)              // 10 ou 11 dígitos
validarSenha(senha)                    // Força + requisitos
validarRequerido(valor)                // Non-empty check
validarComprimentoMinimo(v, min)       // String length
validarComprimentoMaximo(v, max)       // String length
validarNumero(valor)                   // Number check
validarData(data)                      // YYYY-MM-DD format
validarURL(url)                        // Valid URL
```

### formatadores.js (13 funções)
```javascript
formatarData(data, 'longo')            // DD/MM/YYYY
formatarDataHora(dataHora)             // DD/MM/YYYY HH:MM
formatarCPF(cpf)                       // XXX.XXX.XXX-XX
formatarTelefone(tel)                  // (XX) XXXXX-XXXX
formatarMoeda(valor)                   // R$ 1.234,56
formatarNumero(num, casas)             // 1.234,56
formatarPercentual(valor)              // XX,XX%
truncarTexto(texto, max)               // Texto...
capitalizarTexto(texto)                // Hello world
formatarNome(texto)                    // Proper Case Name
formatarBooleano(bool)                 // Sim/Não
formatarStatus(status)                 // Em Progresso
removerCaracteresEspeciais(texto)      // Clean text
```

### constantes.js (25+ constantes)
```javascript
// Papéis e status
PAPEIS.ADMIN                           // 'admin'
PAPEIS.PROFESSOR                       // 'professor'
PAPEIS.ALUNO                           // 'aluno'
STATUS_USUARIO.ATIVO                   // 'ativo'
STATUS_USUARIO.BLOQUEADO               // 'bloqueado'

// Status de negócio
STATUS_MATRICULA.ATIVA                 // 'ativa'
STATUS_AVALIACAO.PUBLICADA             // 'publicada'

// Tipos e enums
GENEROS.MASCULINO                      // 'masculino'
TIPOS_DOCUMENTO.CPF                    // 'cpf'
ESTADOS_CIVIS.CASADO                   // 'casado'

// Configurações
PAGINACAO.ITENS_POR_PAGINA_PADRAO      // 10
LIMITES.NOME_MINIMO                    // 3
LIMITES.EMAIL_MAXIMO                   // 255

// Rotas
ROTAS.ADMIN_ALUNOS                     // '/admin/alunos'
ROTAS.PROFESSOR_TURMAS                 // '/professor/turmas'

// Mensagens
MENSAGENS.SUCESSO                      // 'Operação realizada...'
MENSAGENS.CONFIRMACAO_DELETAR          // 'Tem certeza que...'
```

### api.js (Cliente HTTP)
```javascript
// Uso
const dados = await ClienteAPI.get('/api/alunos', {
  parametros: { status: 'ativo', pagina: 1 }
});

const novo = await ClienteAPI.post('/api/alunos', {
  nome: 'João',
  email: 'joao@email.com'
});

await ClienteAPI.put(`/api/alunos/${id}`, dados);
await ClienteAPI.patch(`/api/alunos/${id}`, { status: 'ativo' });
await ClienteAPI.delete(`/api/alunos/${id}`);

const resultado = await ClienteAPI.upload('/api/upload', arquivo, {
  aluno_id: 123
});

// Features
✅ 6 métodos HTTP (GET, POST, PUT, PATCH, DELETE, UPLOAD)
✅ Autenticação automática com token
✅ Error handling centralizado
✅ Timeout configurável
✅ Retry automático em GET
✅ FormData para upload
✅ Logout em 401 (não autorizado)
```

---

## 📊 ESTATÍSTICAS

### Phase 1 - Criado
| Tipo | Quantidade | Linhas | Status |
|------|-----------|--------|--------|
| Componentes UI | 5 | ~545 | ✅ Completo |
| Hooks | 2 | ~165 | ✅ Completo |
| Utilities | 4 | ~1240 | ✅ Completo |
| Documentação | 1 | ~320 | ✅ Completo |
| **TOTAL** | **12** | **~2270** | **✅ Completo** |

### Phase 2 - A Refatorar
| Componente | Linhas | Status |
|-----------|--------|--------|
| AdminAlunos | 832 | ✅ Exemplo fornecido |
| AdminProfessores | ~800 | ⏳ Próximo |
| AdminCursos | ~600 | ⏳ Na fila |
| AdminTurmas | ~750 | ⏳ Na fila |
| AdminAvaliacoes | ~900 | ⏳ Na fila |
| AdminBlog | ~500 | ⏳ Na fila |
| AdminDocumentos | ~450 | ⏳ Na fila |
| AdminFinanceiro | ~600 | ⏳ Na fila |
| AdminUsuarios | ~550 | ⏳ Na fila |
| AdminFuncionarios | ~650 | ⏳ Na fila |
| AdminSlider | ~400 | ⏳ Na fila |
| AdminEmails | ~350 | ⏳ Na fila |
| **TOTAL** | **~7400** | **⏳ 11 componentes** |

**Redução esperada:** ~3700 linhas (50%)

---

## 🚀 TIMELINE

```
Week 1 (COMPLETO):
├─ Phase 1: Foundation
│  ├─ ✅ Criar 5 componentes UI
│  ├─ ✅ Criar 2 hooks
│  ├─ ✅ Criar 4 utilities
│  ├─ ✅ Documentação
│  └─ ✅ Commits & Push
│
Week 2-3 (PRÓXIMO):
├─ Phase 2: Refactor Admin Components
│  ├─ ✅ Exemplo AdminAlunos
│  ├─ ⏳ Refactor AdminAlunos.js
│  ├─ ⏳ Refactor AdminProfessores.js
│  ├─ ⏳ Refactor AdminCursos.js
│  ├─ ⏳ Refactor AdminTurmas.js
│  ├─ ⏳ Refactor AdminAvaliacoes.js
│  ├─ ⏳ [+ 6 componentes]
│  └─ ⏳ Commits & Push (1 por componente)
│
Week 4 (FUTURO):
├─ Phase 3: JSDoc + Comments
│  ├─ Adicionar JSDoc a 25 componentes
│  ├─ Adicionar comentários português
│  └─ Commits & Push
│
Week 5+ (FUTURO):
└─ Phase 4: Additional Utilities
   ├─ autenticacao.js
   ├─ storage.js
   ├─ erros.js
   └─ permissoes.js
```

---

## 📝 ARQUIVOS PRINCIPAIS

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| `PADROES_ENGENHARIA.md` | Standards completos | ✅ Criado |
| `FASE_1_COMPLETA.md` | Resumo Phase 1 | ✅ Criado |
| `REFACTOR_ADMIN_ALUNOS_GUIA.md` | Guia de refatoração | ✅ Criado |
| `STATUS_REFATORACAO.md` | Dashboard de status | ✅ Criado |
| `AdminAlunos.js.refatorado` | Exemplo refatorado | ✅ Criado |
| `components/ui/*.js` | Componentes reutilizáveis | ✅ Criado |
| `hooks/*.js` | Hooks customizados | ✅ Criado |
| `utils/*.js` | Funções utilitárias | ✅ Criado |

---

## 🎯 COMO USAR

### 1. Entender a Foundation
```bash
# Ler documentação
cat PADROES_ENGENHARIA.md
cat FASE_1_COMPLETA.md
cat REFACTOR_ADMIN_ALUNOS_GUIA.md
```

### 2. Estudar Exemplos
```bash
# Ver componentes UI
ls -la components/ui/

# Ver hooks
ls -la hooks/

# Ver utilities
ls -la utils/

# Ver AdminAlunos refatorado
cat components/AdminAlunos.js.refatorado
```

### 3. Começar Refatoração
```bash
# Opção A: Copiar exemplo
cp components/AdminAlunos.js.refatorado components/AdminAlunos.js

# Opção B: Seguir passo-a-passo
# (Ler REFACTOR_ADMIN_ALUNOS_GUIA.md e implementar manualmente)
```

---

## ✨ PRÓXIMAS MELHORIAS

### Phase 3 (Planned)
- [ ] Adicionar JSDoc a 25 componentes existentes
- [ ] Adicionar comentários português a código existente
- [ ] Criar componentes adicionais (Modal, Alert, Badge, etc)

### Phase 4 (Planned)
- [ ] utils/autenticacao.js - Login, logout, token
- [ ] utils/storage.js - localStorage helpers
- [ ] utils/erros.js - Error handling
- [ ] utils/permissoes.js - RBAC

### Phase 5+ (Future)
- [ ] Melhorias de performance
- [ ] Testes unitários
- [ ] Testes integração
- [ ] Documentação API

---

**Gerado em:** 2026-01-22  
**Versão:** Phase 1 Complete  
**Atualização:** STATUS_REFATORACAO.md para mais detalhes
