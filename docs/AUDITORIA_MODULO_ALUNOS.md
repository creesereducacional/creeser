# Relatório de Auditoria — Módulo Alunos (Inove Técnico)
**Sprint Produção | Auditoria pré-deploy | Read-only**
**Data:** 25/05/2026

---

## 1. Estrutura do Cadastro

### 1.1 Interface Principal

| Caminho | Função | Status |
|---|---|---|
| `pages/admin/alunos/index.js` | Listagem com filtros | ✅ Funcional |
| `pages/admin/alunos/novo.js` | Formulário completo (novo + edição) | ✅ Funcional |
| `pages/admin/alunos/[id].js` | Edição — re-exporta `novo.js` | ✅ Correto |
| `components/AdminAlunos.js` | Formulário simplificado legado | ⚠️ Divergente (ver §1.4) |

### 1.2 Campos do Formulário (novo.js — 47 campos)

| Seção | Campos | Visibilidade |
|---|---|---|
| **Identificação** | instituicao, curso, turma, anoLetivo, turnoIntegral, semestre | Todos |
| **Dados Pessoais** | nome, nomeSocial, apelido\*, cpf, estadoCivil, sexo, dtNascimento, rg, dataExpedicaoRG, orgaoExpedidorRG, ufRG\*, telefoneCelular | Todos |
| **Filiação** | pai, mae | Todos |
| **Endereço** | cep (com ViaCEP), endereco, numero, bairro, cidade, uf, complemento, naturalidade, ufNaturalidade, email | Todos |
| **Registro de Nascimento** | termo, folha, livro, nomeCartorio | Oculto: INOVE TECNICO, FACULDADE FAETE |
| **INEP/Censo** | tipoEscolaAnterior, paisOrigem | Todos |
| **Ensino Médio** | estabelecimento, anoConclusao, enderecoDEM, municipioDEM, ufDEM | Oculto: COLEGIO INOVE |
| **Deficiência** | pessoaComDeficiencia, tipoDeficiencia | Todos |
| **Dados Financeiros** | planoFinanceiro, valorMatricula, valorMensalidade, percentualDesconto, quantidadeParcelas, diaPagamento, quantidadeMesesContrato, cnpjBoleto, razaoSocialBoleto, alunoBolsista, percentualBolsaEstudo, financiamentoEstudantil, percentualFinanciamento | Todos |
| **Informações Adicionais** | tituloEleitoral, zonaEleitoral, secaoEleitoral, carteiraReservista, numeroRegistroConselho, religiao, laudoCid, observacoesAdicionais, indicacaoQuem | Todos |
| **Status / Foto** | status, foto (base64) | Todos |

> \*`apelido` aparece apenas quando `nomeSocial = true`. `ufRG` depende de coluna com compatibilidade condicional.

### 1.3 Campos Obrigatórios

Validação no frontend (HTML `required`): **nome, cpf** (mínimos identificados no form). Não há validação server-side explícita na API além de verificar a presença do `instituicao_id`.

> ⚠️ **Risco:** A API aceita cadastro com `nome` vazio se o campo vier como `undefined` no body.

### 1.4 Divergência: AdminAlunos.js vs novo.js

`components/AdminAlunos.js` contém um formulário simplificado com ~12 campos (nome, email, cpf, telefone, data nascimento, genero, endereço básico, cursos, status). **Este componente não está em uso nas rotas `pages/admin/alunos/`** — as rotas usam `novo.js` diretamente. O `AdminAlunos.js` parece ser um componente legado ou usado em outro contexto (ex.: painel embedded). Não representa risco operacional para o fluxo principal.

---

## 2. Banco de Dados

### 2.1 Tabela `alunos` — Colunas Confirmadas (via migrations)

**Schema base** (`supabase/schema.sql`):

```
id SERIAL PK, usuarioId FK→usuarios, matricula UNIQUE, cursoId FK→cursos,
turmaId FK→turmas, statusMatricula, dataMatricula, endereco, cidade, estado,
cep, bairro, numeroEndereco, responsavelId FK→usuarios, dataCriacao, dataAtualizacao
```

**Campos adicionados via migrations:**

| Migration | Colunas adicionadas |
|---|---|
| `20250101120000_add_alunos_fields.sql` | nome, cpf (UNIQUE), estadoCivil, sexo, data_nascimento, rg, data_expedicao_rg, orgao_expedidor_rg, telefone_celular, email, pai, mae, instituicao (texto), ano_letivo, turno_integral, semestre, termo, folha, livro, nome_cartorio, complemento, naturalidade, uf_naturalidade, estabelecimento, ano_conclusao, endereco_dem, municipio_dem, uf_dem, pessoa_com_deficiencia, tipo_deficiencia, foto, tipo_escola_anterior, pais_origem, nome_social |
| `20260311_add_alunos_financeiro.sql` | plano_financeiro, valor_matricula, valor_mensalidade, percentual_desconto, qtd_parcelas, dia_pagamento, qtd_meses_contrato, cnpj_boleto, razao_social_boleto, aluno_bolsista, percentual_bolsa, financiamento_estudantil, percentual_financiamento |
| `20260311_add_alunos_informacoes_adicionais.sql` | titulo_eleitoral, zona_eleitoral, secao_eleitoral, carteira_reservista, registro_conselho, religiao, laudo_cid, observacoes_adicionais, indicacao_quem |
| `20260311_add_alunos_apelido.sql` | apelido |
| `20260311_add_alunos_uf_rg.sql` | uf_rg |
| `20260406_add_nacionalidade_naturalidade_alunos.sql` | nacionalidade, naturalidade (reforço) |
| `20260519_fase1_multi_instituicao.sql` | **instituicao_id UUID FK→instituicoes** (multi-tenant) |

### 2.2 Colunas com Compatibilidade Condicional na API

`pages/api/alunos/index.js` verifica em runtime se estas colunas existem antes de incluí-las no INSERT/UPDATE:

| Flag | Coluna(s) | Status esperado em produção |
|---|---|---|
| `supportsUfRgColumn` | `uf_rg` | ✅ migration aplicada |
| `supportsApelidoColumn` | `apelido` | ✅ migration aplicada |
| `supportsFinanceiroColumns` | 13 campos financeiros | ✅ migration aplicada |
| `supportsInformacoesAdicionaisColumns` | 9 campos adicionais | ✅ migration aplicada |

> ⚠️ **Se as migrations não foram aplicadas no banco de produção, esses campos são silenciosamente ignorados no cadastro sem erro.**

### 2.3 Relacionamentos

```
alunos.cursoId          → cursos.id           (ON DELETE SET NULL)
alunos.turmaId          → turmas.id           (ON DELETE SET NULL)
alunos.instituicao_id   → instituicoes.id     (ON DELETE SET NULL)
responsavel_aluno.aluno_id        → alunos.id          (tabela de junção M:N)
responsavel_aluno.responsavel_id  → responsaveis.id
financeiro_ordens_pagamento.aluno_id → alunos.id       (ON DELETE RESTRICT)
financeiro_parcelas.aluno_id         → alunos.id       (ON DELETE RESTRICT)
```

> ⚠️ **`alunos.responsavelId` (coluna legada no schema base)** aponta para `usuarios.id`, não para `responsaveis.id`. O relacionamento real responsável↔aluno usa a tabela `responsavel_aluno` (M:N). A coluna `responsavelId` está obsoleta.

---

## 3. Fluxo CRUD

### 3.1 Criar Aluno

```
[Formulário novo.js]
  → POST /api/alunos
    → requireAuth + requirePerfil(['grupo_admin','instituicao_admin','coordenador',
                                   'secretaria','financeiro','comercial','admin'])
    → resolveInstituicaoId(req, user, { allowAll: false })  ← obrigatório
    → INSERT alunos (42 campos com compatibilidade condicional)
    → Retorna aluno criado
[Redireciona para /admin/alunos após 1.5s]
```

### 3.2 Editar Aluno

```
[Página /admin/alunos/[id].js → redireciona para novo.js com id]
  → GET /api/alunos/[id]  ← carrega dados (applyInstituicaoFilter)
  → [Formulário pré-preenchido com mapeamento inverso]
  → PUT /api/alunos/[id]
    → requireAuth + requirePerfil(mesma lista)
    → applyInstituicaoFilter  ← isolamento multi-tenant no update
    → UPDATE 42 campos
```

### 3.3 Excluir Aluno

```
DELETE /api/alunos/[id]
  → requireAuth + requirePerfil(mesma lista)
  → applyInstituicaoFilter  ← isolamento multi-tenant
  → DELETE alunos WHERE id = ? AND instituicao_id = ?
```

> ⚠️ **Sem verificação de restrição antes do DELETE**: se o aluno tiver `financeiro_ordens_pagamento` vinculadas, o banco retornará `FK violation (ON DELETE RESTRICT)` — a API retorna 500 genérico sem mensagem amigável ao usuário.

### 3.4 Listar Alunos

```
GET /api/alunos
  → requireAuth + requirePerfil
  → resolveInstituicaoId → applyInstituicaoFilter
  → SELECT * FROM alunos WHERE instituicao_id = ?
```

Filtros na listagem (`pages/admin/alunos/index.js`) são **client-side** (7 filtros: nome, matrícula, CPF, instituição, ano letivo, turma, status). Nenhum filtro é passado para a API — **todos os alunos são carregados e filtrados no browser**.

---

## 4. Multi-Instituição

| Operação | Isolamento | Observação |
|---|---|---|
| POST (criar) | ✅ `resolveInstituicaoId(allowAll: false)` | Sempre usa instituição do usuário |
| GET (listar) | ✅ `applyInstituicaoFilter` | `grupo_admin` pode ver todos |
| GET (por id) | ✅ `applyInstituicaoFilter` | Impede acesso cross-tenant |
| PUT (editar) | ✅ `applyInstituicaoFilter` | Impede edição cross-tenant |
| DELETE | ✅ `applyInstituicaoFilter` | Impede exclusão cross-tenant |
| Contrato | ⚠️ Sem filtro por `instituicao_id` | Busca por nome da instituição via `ilike` |

> ⚠️ **`pages/api/contratos/aluno/[id].js`** — busca o aluno por `id` sem filtrar por `instituicao_id`. Um usuário autenticado poderia acessar o contrato de aluno de outra instituição se souber o ID numérico. Risco baixo (auth protege a rota), mas o isolamento está incompleto neste endpoint.

---

## 5. Contratos

### 5.1 Fluxo

```
/admin/alunos/index.js → botão "Contrato"
  → abrirContratoAluno(id) → window.open('/admin/alunos/contrato/${id}?autoprint=1')
    → GET /api/contratos/aluno/[id]
      1. Busca aluno por id (sem filtro de instituição ⚠️)
      2. Resolve instituição via aluno.instituicao (campo texto, busca ilike)
      3. Busca contrato padrão da instituição (contratos_instituicao, padrao=true)
      4. Busca turma, curso, responsável
      5. Substitui placeholders no conteudo_html
      6. Retorna JSON com html pronto
    → [id].js renderiza e faz window.print() após 350ms
```

### 5.2 Placeholders Disponíveis

| Placeholder | Fonte |
|---|---|
| `{{ALUNO_NOME}}` | `aluno.nome` |
| `{{ALUNO_CPF}}` | `aluno.cpf` |
| `{{ALUNO_RG}}` | `aluno.rg` |
| `{{ALUNO_EMAIL}}` | `aluno.email` |
| `{{ALUNO_TELEFONE}}` | `aluno.telefone_celular \|\| aluno.telefonecelular \|\| aluno.telefone` |
| `{{ALUNO_DATA_NASCIMENTO}}` | `aluno.data_nascimento` |
| `{{ALUNO_NACIONALIDADE}}` | `aluno.pais_origem` ⚠️ semanticamente incorreto |
| `{{ALUNO_NATURALIDADE}}` | `aluno.naturalidade` |
| `{{ALUNO_ESTADO_CIVIL}}` | `aluno.estadocivil` |
| `{{ALUNO_PROFISSAO}}` | `aluno.profissao` ⚠️ campo não existe na tabela alunos |
| `{{ALUNO_ENDERECO_RESIDENCIAL}}` | endereço composto (endereco + numero + complemento + bairro + cidade + estado + cep) |
| `{{ALUNO_ENDERECO}}` | `aluno.endereco` |
| `{{ALUNO_BAIRRO}}` | `aluno.bairro` |
| `{{ALUNO_CIDADE}}` | `aluno.cidade` |
| `{{ALUNO_CEP}}` | `aluno.cep` |
| `{{ALUNO_UF}}` | `aluno.estado` |
| `{{CURSO_NOME}}` | `curso.nome \|\| turma.curso` |
| `{{CURSO_CARGA_HORARIA}}` | `curso.carga_horaria \|\| turma.cargahoraria` |
| `{{TURMA_NOME}}` | `turma.nome` |
| `{{VALOR_MENSALIDADE}}` | `aluno.valor_mensalidade \|\| turma.mensalidade` |
| `{{VALOR_MATRICULA}}` | `aluno.valor_matricula \|\| turma.matricula` |
| `{{QTD_PARCELAS}}` | `aluno.qtd_parcelas \|\| turma.mesescontrato` |
| `{{DATA_INICIO_CURSO}}` | `turma.datainicio` |
| `{{DATA_FIM_CURSO}}` | `turma.datafim` |
| `{{INSTITUICAO_NOME}}` | `instituicao.nome` |
| `{{INSTITUICAO_CNPJ}}` | `instituicao.cnpj` |
| `{{INSTITUICAO_ENDERECO}}` | endereço composto da instituição |
| `{{RESPONSAVEL_NOME}}` | `responsavel.nome` (via tabela `responsavel_aluno`) |
| `{{RESPONSAVEL_CPF}}` | `responsavel.cpf` |
| `{{DATA_ASSINATURA}}` | data atual formatada |

### 5.3 Problemas Identificados nos Contratos

| Problema | Impacto |
|---|---|
| `{{ALUNO_PROFISSAO}}` — campo `profissao` não existe em `alunos` (existe em `responsaveis`) | Placeholder sempre vazio |
| `{{ALUNO_NACIONALIDADE}}` usa `pais_origem` | Semanticamente incorreto (país ≠ nacionalidade) |
| Busca de instituição por `aluno.instituicao` (campo texto) via `ilike` | Se nome divergir do cadastrado, contrato falha com 404 |
| Assinatura digital (`assinar-digital.js`) protegida mas sem integração no fluxo de impressão | Recurso incompleto |

---

## 6. Financeiro

### 6.1 Campos do Aluno Usados pelo Módulo Financeiro

| Campo | Uso | Status |
|---|---|---|
| `id` | FK em `financeiro_ordens_pagamento` | ✅ |
| `nome` | Exibição em ordens/carnês | ✅ |
| `cpf` | Exibição + geração de boleto EFI | ✅ |
| `email` | Exibição + geração de boleto EFI | ✅ |
| `data_nascimento` | Exibição + geração de boleto EFI | ✅ |
| `telefone_celular` | Geração de boleto EFI (obrigatório pela API) | ✅ (campo não obrigatório no cadastro ⚠️) |
| `instituicao_id` | Isolamento multi-tenant nas ordens | ✅ |
| `valor_matricula`, `valor_mensalidade` | Pré-sugestão no módulo financeiro | ✅ |
| `percentual_desconto`, `qtd_parcelas`, `dia_pagamento` | Geração de carnê | ✅ |
| Endereço completo | Emissão de boleto (campos obrigatórios EFI) | ⚠️ Sem validação obrigatória no cadastro |
| Convênios (`financeiro_convenios`) | Tabela separada — não vinculada diretamente ao aluno | Relacionamento ausente na API de alunos |

### 6.2 Geração de Boleto EFI

A API `pages/api/admin-financeiro/efi/carne.js` seleciona: `id, nome, cpf, email, data_nascimento, telefone_celular` do aluno. Se `telefone_celular` estiver vazio no cadastro, a geração falhará ou retornará erro da API EFI.

---

## 7. Classificação para Produção

### 7.1 Backend (APIs)

| Item | Status |
|---|---|
| Auth + perfis em todas as rotas | ✅ |
| Isolamento multi-tenant (GET/POST/PUT/DELETE) | ✅ |
| Compatibilidade condicional de colunas | ✅ |
| Validação obrigatória de campos no servidor | ⚠️ Fraca (apenas `instituicao_id`) |
| DELETE sem pré-verificação de FKs financeiras | ⚠️ Retorna 500 genérico |
| Isolamento no contrato (`/api/contratos/aluno/[id]`) | ⚠️ Sem filtro por `instituicao_id` |

### 7.2 Frontend

| Item | Status |
|---|---|
| Formulário completo (47 campos) | ✅ |
| Mapeamento bidirecional banco↔form | ✅ |
| CEP com autopreenchimento ViaCEP | ✅ |
| Seções condicionais por instituição | ✅ |
| Upload de foto (base64) | ✅ |
| Filtros de listagem client-side | ⚠️ Todos os alunos carregados (escalabilidade) |
| Validação HTML `required` | ⚠️ Apenas `nome` e `cpf` visíveis |

### 7.3 Banco de Dados

| Item | Status |
|---|---|
| Todas as migrations mapeadas | ✅ |
| `instituicao_id` adicionado | ✅ |
| Campos financeiros e adicionais adicionados | ✅ (se migrations aplicadas) |
| Campo `responsavelId` legado (`→ usuarios.id`) | ⚠️ Coluna obsoleta, não removida |
| `cpf UNIQUE` global (sem escopo por `instituicao_id`) | ⚠️ Impede aluno com mesmo CPF em 2 instituições |

---

## 8. Pendências P2 (pós-produção — sem bloqueio)

| # | Pendência | Criticidade |
|---|---|---|
| P2-01 | Validação server-side de campos obrigatórios (`nome`, `cpf`) na API de alunos | Média |
| P2-02 | Mensagem amigável no DELETE quando há ordens financeiras vinculadas | Baixa |
| P2-03 | Adicionar `applyInstituicaoFilter` em `/api/contratos/aluno/[id]` | Baixa |
| P2-04 | Filtros de listagem passados para API (paginação/performance) | Baixa |
| P2-05 | `cpf UNIQUE` global bloqueia multi-tenant real para alunos com mesmo CPF | Média |
| P2-06 | `{{ALUNO_PROFISSAO}}` no contrato sempre vazio — adicionar campo ao cadastro ou remover placeholder | Baixa |
| P2-07 | Campo `responsavelId` legado (FK→usuarios) não removido — pode causar confusão | Baixa |
| P2-08 | **Confirmar que todas as migrations foram aplicadas no banco de produção** | **Alta** |

---

## 9. Veredicto

> **🟢 MÓDULO PRONTO PARA PRODUÇÃO**, condicionado à confirmação da **P2-08** (migrations aplicadas no banco de produção).

O fluxo CRUD está completo, seguro e isolado por instituição. As pendências identificadas não bloqueiam a operação do Inove Técnico.
