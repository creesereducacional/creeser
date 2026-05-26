# Relatório de Auditoria — Módulo Contratos (Inove Técnico)

**Sprint Produção | Auditoria pré-deploy | Read-only**
**Data:** 25/05/2026

---

## 1. Modelos de Contrato

### 1.1 Onde são cadastrados

Interface: `pages/admin/configuracoes/empresa.js` → aba **"contratos"**.

Fluxo de cadastro:
```
Configurações > Empresa > Aba Contratos
  → Selecionar instituição (dropdown)
  → Preencher nome + descrição + conteúdo HTML (RichTextEditor)
  → Inserir placeholders via botões
  → Salvar → POST /api/instituicoes/[id]/contratos
```

Banco: tabela `public.contratos_instituicao` (migration `20260312_create_contratos_instituicao.sql`)

```sql
id uuid PK, instituicao_id uuid FK→instituicoes (NOT NULL, CASCADE),
nome text NOT NULL, conteudo_html text DEFAULT '',
placeholders jsonb DEFAULT '[]', ativo boolean DEFAULT true,
padrao boolean DEFAULT false, ordem integer DEFAULT 0
```

Índice único garante no máximo 1 padrão por instituição:
```sql
UNIQUE INDEX uq_contratos_instituicao_padrao
  ON contratos_instituicao(instituicao_id) WHERE padrao = true
```

### 1.2 Vinculação por `instituicao_id`

✅ Vinculação é obrigatória — `instituicao_id NOT NULL`. Não é possível criar modelo sem instituição.

### 1.3 Contrato padrão do Inove Técnico

⚠️ **NÃO VERIFICÁVEL via read-only** — depende de dado vivo no banco. **Pendência obrigatória antes do go-live (ver §6).**

Regra de seleção automática do padrão na API:
```js
// Primeiro: busca com ativo=true, ordenado por padrao DESC
// Fallback: busca sem filtro de ativo (qualquer contrato)
// Se nenhum encontrado → HTTP 404
```

Comportamento na criação: o **primeiro** contrato de uma instituição é automaticamente `padrao = true`. Criações subsequentes não são padrão, salvo se explicitado.

### 1.4 Placeholders documentados

30 placeholders disponíveis, definidos em dois lugares sincronizados:

| Arquivo | Constante |
|---|---|
| `pages/api/contratos/_shared.js` | `PLACEHOLDERS_CONTRATO` |
| `pages/admin/configuracoes/empresa.js` | `CONTRATO_PLACEHOLDERS` |

Lista completa exibida na interface de cadastro com botão de inserção direta no editor.

---

## 2. Geração de Contrato por Aluno

### 2.1 Fluxo técnico

```
GET /api/contratos/aluno/[alunoId]
  1. Auth + perfil
  2. Resolve instituicao_id do usuário (multi-tenant) ← ✅ CORRIGIDO 25/05/2026
  3. Busca aluno por id + applyInstituicaoFilter     ← ✅ CORRIGIDO 25/05/2026
  4. Resolve instituição:
     a. findInstituicaoPorId(aluno.instituicao_id) → UUID direto ← ✅ NOVO
     b. findInstituicaoPorNome(aluno) → ilike fallback para legados
  5. findContratoPadraoInstituicao(instituicao.id)
  6. findTurmaDoAluno + findCursoDaTurma
  7. findResponsavelDoAluno (via responsavel_aluno M:N)
  8. replacePlaceholders(contrato.conteudo_html, placeholders)
  9. Retorna JSON com html processado
```

### 2.2 Dados puxados corretamente

| Origem | Campos | Status |
|---|---|---|
| `alunos` | nome, cpf, rg, email, telefone_celular, data_nascimento, naturalidade, estadocivil, pais_origem, endereço completo | ✅ |
| `turmas` | nome, datainicio, datafim, mensalidade, matricula, mesescontrato, cargahoraria | ✅ (null-safe) |
| `cursos` | nome, carga_horaria | ✅ (null-safe) |
| `instituicoes` | nome, cnpj, endereço composto | ✅ |
| `responsaveis` | nome, cpf (via tabela `responsavel_aluno`) | ✅ (null-safe) |

### 2.3 Comportamento quando dados ausentes

| Situação | Comportamento |
|---|---|
| Aluno sem turma | `{{TURMA_NOME}}`, `{{DATA_INICIO_CURSO}}`, `{{DATA_FIM_CURSO}}` ficam vazios. Sem erro. |
| Aluno sem curso | `{{CURSO_NOME}}`, `{{CURSO_CARGA_HORARIA}}` ficam vazios. Sem erro. |
| Aluno sem responsável | `{{RESPONSAVEL_NOME}}`, `{{RESPONSAVEL_CPF}}` ficam vazios. Sem erro. |
| Tabela `responsavel_aluno` inexistente | Retorna null graciosamente (`isMissingTableError`). |
| Aluno não tem `instituicao_id` (legado) | Tenta `ilike` por `aluno.instituicao` (texto). Se não encontrar → HTTP 404. |
| Sem contrato padrão cadastrado | HTTP 404 com mensagem clara. |
| Aluno de outra instituição | HTTP 404 (filtro multi-tenant). |

### 2.4 Isolamento multi-tenant

✅ Corrigido em 25/05/2026. Comportamento atual:

| Perfil | Acesso ao contrato |
|---|---|
| `grupo_admin` sem header | Qualquer aluno |
| `grupo_admin` + `x-instituicao-id` | Apenas alunos daquela instituição |
| `instituicao_admin`, `secretaria`, `financeiro`, `comercial` | Apenas alunos da própria `instituicao_id` |
| ID de aluno de outra instituição | HTTP 404 |

---

## 3. Impressão / PDF

### 3.1 Fluxo

```
Listagem /admin/alunos → botão 📄 (por linha)
  → abrirContratoAluno(aluno.id)
  → window.open('/admin/alunos/contrato/[id]?autoprint=1', '_blank', 'noopener,noreferrer')
    → página carrega + fetch GET /api/contratos/aluno/[id]
    → quando payload chegou: setTimeout(window.print, 350)
    → diálogo nativo de impressão/PDF do browser
```

### 3.2 Lógica de autoprint

O `setTimeout` só é acionado quando `payload !== null` — a impressão **espera o carregamento completo do contrato**. Não há race condition com a API.

### 3.3 Layout de impressão

Classes CSS `print:*` aplicadas corretamente:

| Classe | Finalidade |
|---|---|
| `print:bg-white` | Sem cinza de fundo |
| `print:shadow-none print:rounded-none` | Sem borda/sombra |
| `print:px-8 print:py-8` | Margens adequadas |
| `print:hidden` (botões Voltar/Imprimir) | Controles ocultos no PDF |

### 3.4 Autenticação na página de impressão

⚠️ `pages/admin/alunos/contrato/[id].js` não usa `DashboardLayout` e não redireciona para `/login`. A API protege os dados (retorna 401 sem cookie), mas o shell HTML da página é servido sem autenticação. Impacto real: mínimo — usuário sem sessão vê apenas mensagem de erro do fetch.

---

## 4. Perfis de Acesso

### 4.1 Mapeamento por endpoint

| Endpoint | Perfis autorizados |
|---|---|
| `GET /api/contratos/aluno/[id]` (gerar) | `grupo_admin`, `instituicao_admin`, `financeiro`, `secretaria`, `comercial` |
| `POST /api/contratos/aluno/[id]/assinar-digital` | `grupo_admin`, `instituicao_admin`, `financeiro`, `secretaria` |
| `GET /api/contratos/aluno/[id]/assinatura-status` | `grupo_admin`, `instituicao_admin`, `financeiro`, `secretaria` |
| `GET/POST /api/instituicoes/[id]/contratos` | `grupo_admin`, `instituicao_admin`, `financeiro` |
| `GET/PUT/DELETE /api/contratos/[id]` | `grupo_admin`, `instituicao_admin`, `financeiro` |
| `POST /api/contratos/[id]/padrao` | `grupo_admin`, `instituicao_admin`, `financeiro` |

### 4.2 Resumo por perfil

| Perfil | Gerar contrato | Iniciar assinatura digital | Gerenciar modelos |
|---|---|---|---|
| `grupo_admin` | ✅ | ✅ | ✅ |
| `instituicao_admin` | ✅ | ✅ | ✅ |
| `financeiro` | ✅ | ✅ | ✅ |
| `secretaria` | ✅ | ✅ | ❌ |
| `comercial` | ✅ | ❌ | ❌ |

---

## 5. Problemas Identificados

### 5.1 Bloqueadores de go-live

| # | Problema | Impacto |
|---|---|---|
| **B-01** | **Modelo padrão do Inove Técnico não confirmado** | Se ausente, 100% das gerações falham com HTTP 404 |
| **B-02** | **Alunos sem `instituicao_id`** (cadastrados antes da migration 20260519) | Esses alunos ficam invisíveis para secretaria/financeiro/comercial ao gerar contrato. Fallback `ilike` funciona só se `aluno.instituicao` (texto) bater exatamente com o nome cadastrado em `instituicoes` |

### 5.2 Problemas não bloqueadores

| # | Problema | Impacto |
|---|---|---|
| P-01 | `{{ALUNO_PROFISSAO}}` sempre vazio — campo `profissao` não existe em `alunos` | Placeholder inútil no modelo |
| P-02 | `{{ALUNO_NACIONALIDADE}}` mapeia `aluno.pais_origem` | Semanticamente incorreto |
| P-03 | Página de impressão sem redirect de auth | Shell HTML servido sem sessão (dados protegidos pela API) |
| P-04 | Assinatura digital depende de `ASSINAFY_API_KEY` + `ASSINAFY_ACCOUNT_ID` | Se não configurados, retorna erro claro e descritivo |
| P-05 | Coluna "Turma" na listagem exibe `aluno.turmaid` (ID numérico) | Dado sem nome legível |
| P-06 | Filtro de turma na listagem usa valores fixos (`1A`, `1B`, `2A`...) hardcoded | Não reflete turmas reais cadastradas |

---

## 6. Pendências Obrigatórias Antes do Go-Live

### B-01 — Verificar/criar modelo padrão para o Inove Técnico

Executar no Supabase Studio (SQL Editor):

```sql
-- 1. Verificar se existe modelo cadastrado
SELECT ci.id, ci.nome, ci.padrao, ci.ativo, i.nome AS instituicao
FROM public.contratos_instituicao ci
JOIN public.instituicoes i ON i.id = ci.instituicao_id
WHERE i.nome ILIKE '%INOVE%TECNICO%' OR i.nome ILIKE '%INOVE TÉCNICO%'
ORDER BY ci.padrao DESC;
```

- **0 linhas** → Acessar `Configurações > Empresa > Contratos`, selecionar Inove Técnico e criar um modelo.
- **Linhas sem `padrao = true`** → Clicar em "Definir como padrão" no modelo desejado.

### B-02 — Backfill de `instituicao_id` nos alunos legados

```sql
-- 1. Obter UUID da instituição Inove Técnico
SELECT id, nome FROM public.instituicoes WHERE nome ILIKE '%INOVE%';

-- 2. Verificar alunos sem instituicao_id
SELECT id, nome, instituicao
FROM public.alunos
WHERE instituicao_id IS NULL
  AND (instituicao ILIKE '%INOVE TECNICO%' OR instituicao ILIKE '%INOVE TÉCNICO%');

-- 3. Aplicar backfill (substituir <UUID> pelo id obtido no passo 1)
UPDATE public.alunos
SET instituicao_id = '<UUID-INOVE-TECNICO>'
WHERE instituicao_id IS NULL
  AND (instituicao ILIKE '%INOVE TECNICO%' OR instituicao ILIKE '%INOVE TÉCNICO%');
```

---

## 7. Veredicto

| Fluxo | Status |
|---|---|
| **Geração de contrato (impressão/PDF)** | 🟡 Produção com ressalvas — depende de B-01 e B-02 |
| **Isolamento multi-tenant** | ✅ Corrigido — aprovado |
| **Perfis de acesso** | ✅ Aprovado |
| **Gerenciamento de modelos** | ✅ Funcional |
| **Assinatura digital (Assinafy)** | 🔴 Não ativada — depende de credenciais externas |

**Veredicto geral: 🟡 PRODUÇÃO COM RESSALVAS**

O módulo está operacional para o fluxo de impressão/PDF, condicionado à resolução das pendências **B-01** e **B-02**. A assinatura digital (Assinafy) é um recurso separado e sua ausência não bloqueia a operação principal de contratos do Inove Técnico.
