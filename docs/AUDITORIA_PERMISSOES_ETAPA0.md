# Relatório de Auditoria — Sprint Produção Inove Técnico | Etapa 0

**Data:** 25/05/2026
**Sistema:** ERP Creeser Educacional
**Escopo:** Usuários, Perfis e Permissões

---

## 1. Matriz de Permissões Atual

### 1.1 Menu (AdminSidebar.js — `MENU_ITEMS`)

| Item de Menu | grupo_admin | instituicao_admin | secretaria | comercial | financeiro | coordenador | professor | aluno |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Usuários | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Professores | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Alunos | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cursos | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Banner/Slider | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Notícias | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Fórum | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| E-mails | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Avaliações | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Documentos | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Coordenação (grupo) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| → Configurações | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| → Solicitações | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| → Unidades | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| → Anos Letivos | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| → Calendário de Aulas | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| → Contas Bancárias | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

> **Observações críticas:**
> - Os perfis `comercial` e `financeiro` **não aparecem em nenhum item de menu** → usuário com esses perfis vê apenas o Dashboard e fica bloqueado sem rota útil.
> - Itens **Calendário de Aulas** e **Contas Bancárias** existem no menu mas não têm API nem implementação real.

---

### 1.2 APIs — Estado de proteção atual

| API | requireAuth | requirePerfil (perfis autorizados) |
|---|:---:|---|
| `auth/login` | ⬜ intencional | — |
| `auth/logout` | ⬜ intencional | — |
| `auth/me` | ⬜ retorna 401 | — |
| `usuarios.js` | ✅ | grupo_admin, instituicao_admin, admin |
| `usuarios/alterar-senha` | ✅ | ⚠️ sem perfil — qualquer autenticado |
| `usuarios/atualizar-perfil` | ✅ | ⚠️ sem perfil — qualquer autenticado |
| `upload-foto` | ✅ | ⚠️ sem perfil — qualquer autenticado |
| `upload-material` | ✅ | ⚠️ sem perfil — qualquer autenticado |
| `upload-thumbnail` | ✅ | ⚠️ sem perfil — qualquer autenticado |
| `upload-slider` | ✅ | grupo_admin, instituicao_admin, admin |
| `alunos/index` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, financeiro, admin |
| `alunos/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, financeiro, admin |
| `alunos/supabase` | ❌ **ABERTA** | — |
| `professores/index` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `professores/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `responsaveis/index` | ❌ **ABERTA** | — |
| `responsaveis/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria |
| `cursos/index` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `cursos/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `turmas/index` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `turmas/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `turmas/opcoes` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `disciplinas/index` | ✅ | grupo_admin, instituicao_admin, coordenador, admin |
| `disciplinas/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, admin |
| `grades/index` | ✅ | grupo_admin, instituicao_admin, coordenador, admin |
| `grades/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, admin |
| `notas-faltas/index` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, secretaria |
| `notas-faltas/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, secretaria |
| `planejamento-diario/index` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, admin |
| `planejamento-diario/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, admin |
| `atividades-complementares/index` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, aluno, admin |
| `atividades-complementares/[id]` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, aluno, admin |
| `livro-registro/index` | ✅ | grupo_admin, instituicao_admin, secretaria, coordenador, admin |
| `livro-registro/[id]` | ✅ | grupo_admin, instituicao_admin, secretaria, coordenador, admin |
| `documentos.js` | ✅ | grupo_admin, instituicao_admin, coordenador, secretaria, admin |
| `noticias.js` | ✅ | grupo_admin, instituicao_admin, coordenador, admin |
| `forum.js` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, aluno, admin |
| `enviar-email.js` | ✅ | grupo_admin, instituicao_admin, coordenador, admin |
| `avaliacoes.js` | ✅ | grupo_admin, instituicao_admin, coordenador, professor, aluno |
| `slider.js` | ✅ | grupo_admin, instituicao_admin |
| `funcionarios/index` | ✅ | grupo_admin, instituicao_admin, admin |
| `funcionarios/[id]` | ✅ | grupo_admin, instituicao_admin, admin |
| `instituicoes.js` | ✅ | grupo_admin |
| `instituicoes/[id]` | ✅ | grupo_admin |
| `instituicoes/[id]/contratos` | ✅ | (sem requirePerfil explícito) |
| `contratos/[id]` | ✅ | grupo_admin, instituicao_admin, admin |
| `contratos/aluno/[id]` | ✅ | sem requirePerfil — qualquer autenticado |
| `contratos/aluno/[id]/assinar-digital` | ❌ **ABERTA** | — |
| `contratos/aluno/[id]/assinatura-status` | ❌ **ABERTA** | — |
| `contratos/[id]/padrao` | ❌ **ABERTA** | — |
| `unidades/index` | ❌ **ABERTA** | — |
| `unidades/[id]` | ❌ **ABERTA** | — |
| `configuracoes/anos-letivos` | ❌ **ABERTA** | — |
| `configuracoes/diploma-digital` | ❌ **ABERTA** | usa JSON local (não migrado) |
| `configuracoes/rematricula` | ❌ **ABERTA** | usa JSON local (não migrado) |
| `configuracoes/campanhas` | ✅ | grupo_admin, instituicao_admin, admin |
| `configuracoes/empresa` | ✅ | grupo_admin, instituicao_admin, admin |
| `configuracoes/matriculadores` | ✅ | grupo_admin, instituicao_admin, admin |
| `configuracoes/solicitacoes` | ✅ | grupo_admin, instituicao_admin, admin |
| `configuracoes/solicitacoes/[id]` | ✅ | grupo_admin, instituicao_admin, admin |
| `configuracoes/usuarios` | ✅ | grupo_admin, instituicao_admin, admin |
| `admin-financeiro/dashboard` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/alunos` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/alunos/[id]` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/aluno-ordens/[id]` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/ordens/index` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/ordens/create` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/carnes/index` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/convenios/index` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/convenios/[id]` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/recibo/[ordemId]` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/efi/carne` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/efi/cobranca` | ✅ | grupo_admin, instituicao_admin, financeiro, admin |
| `admin-financeiro/efi/webhook` | ❌ **ABERTA** | intencional (webhook externo EFI) |
| `admin-financeiro/clientes` | ✅ | grupo_admin **apenas** |

---

## 2. Diferenças entre Matriz Atual e Proposta

### 2.1 `secretaria`

| Recurso Proposto | Menu atual | API atual | Status |
|---|:---:|:---:|---|
| Alunos | ✅ | ✅ | OK |
| Responsáveis | ❌ ausente | ❌ API aberta | **FALTANDO** |
| Documentos | ✅ | ✅ | OK |
| Turmas | ❌ ausente no menu | ✅ | Menu incompleto |
| Cursos | ✅ | ✅ | OK |
| Solicitações | ❌ (só em Coordenação) | ❌ perfil não listado | **FALTANDO** |

### 2.2 `comercial`

| Recurso Proposto | Menu atual | API atual | Status |
|---|:---:|:---:|---|
| Alunos | ❌ | ❌ (não no requirePerfil) | **PERFIL NÃO EXISTE** |
| Matrículas | ❌ | ❌ | **MÓDULO NÃO IMPLEMENTADO** |
| Campanhas | ❌ | ❌ (só admin/grupo_admin) | **SEM ACESSO** |
| Contratos | ❌ | ❌ (só admin/grupo_admin) | **SEM ACESSO** |

> `comercial` **não existe** no sistema. Não há nenhuma API com `comercial` na lista de perfis permitidos. Perfil precisa ser criado do zero.

### 2.3 `financeiro`

| Recurso Proposto | Menu atual | API atual | Status |
|---|:---:|:---:|---|
| Alunos (consulta) | ❌ sem menu | ✅ | Sem menu |
| Contratos | ❌ | ❌ (só grupo_admin, instituicao_admin) | **SEM ACESSO** |
| Ordens de pagamento | ❌ | ✅ | Sem menu |
| Carnês | ❌ | ✅ | Sem menu |
| Convênios | ❌ | ✅ | Sem menu |
| EFI | ❌ | ✅ | Sem menu |

> `financeiro` existe nas APIs mas **não tem nenhum item no AdminSidebar**. O usuário autenticado como `financeiro` vê somente o Dashboard e não consegue navegar para nada.

### 2.4 `coordenador`

| Situação | Status |
|---|---|
| Acesso a Professores, Notas, Frequência, Planejamento | ✅ correto |
| Acesso a E-mails (API + menu) | ⚠️ proposta não prevê |
| Acesso a Avaliações (API + menu) | ⚠️ proposta não prevê |
| Acesso a Notícias (API + menu) | ⚠️ proposta não prevê |
| Submenu Configurações inteiro visível | ⚠️ excessivo — proposta limita a pedagógico |

### 2.5 `professor`

| Situação | Status |
|---|---|
| Portal do professor (`/professor/*`) | ✅ separado |
| Acesso a APIs pedagógicas (notas, planejamento, atividades) | ✅ |
| Acesso ao painel admin (`/admin/*`) | ⚠️ DashboardLayout redireciona pelo `tipo`, mas sem verificação explícita de perfil nas páginas |

### 2.6 `aluno`

| Situação | Status |
|---|---|
| Portal do aluno (`/aluno/*`) | ✅ separado |
| Acesso a `forum.js` API | ✅ esperado |
| Acesso a `avaliacoes.js` API | ✅ esperado |
| Acesso a `atividades-complementares` API | ✅ esperado |
| `upload-foto`, `upload-material`, `upload-thumbnail` | ⚠️ **acessíveis** (só requireAuth, sem perfil) |

---

## 3. Ajustes Necessários

### 🔴 P1 — Crítico (bloqueador de produção)

| # | Problema | Onde | Ação |
|---|---|---|---|
| 1 | `responsaveis/index.js` completamente aberta | API | Adicionar `requireAuth` + `requirePerfil(['grupo_admin','instituicao_admin','secretaria','coordenador'])` |
| 2 | `unidades/index.js` e `unidades/[id].js` abertas | API | Adicionar `requireAuth` + `requirePerfil(['grupo_admin','instituicao_admin'])` |
| 3 | `configuracoes/anos-letivos.js` aberta | API | Adicionar `requireAuth` + `requirePerfil(['grupo_admin','instituicao_admin','coordenador'])` |
| 4 | `contratos/aluno/[id]/assinar-digital.js` aberta | API | Adicionar `requireAuth` (aluno assina o próprio contrato) |
| 5 | `contratos/aluno/[id]/assinatura-status.js` aberta | API | Adicionar `requireAuth` |
| 6 | `contratos/[id]/padrao.js` aberta | API | Adicionar `requireAuth` + `requirePerfil(['grupo_admin','instituicao_admin'])` |
| 7 | `alunos/supabase.js` aberta | API | Verificar função; se expõe dados, adicionar auth |
| 8 | `financeiro` não tem menu | AdminSidebar | Adicionar seção Financeiro com itens corretos |
| 9 | `DashboardLayout` ainda usa `localStorage` | Componente | Migrar para `/api/auth/me` (igual ao AdminSidebar já corrigido) |

### 🟠 P2 — Alto (impede uso correto por perfil)

| # | Problema | Onde | Ação |
|---|---|---|---|
| 10 | `comercial` não existe em nenhuma API | Sistema | Criar perfil `comercial`; adicionar nas APIs: alunos, contratos, campanhas |
| 11 | `secretaria` não vê Turmas no menu | AdminSidebar | Adicionar item Turmas com `perfis: ['grupo_admin','instituicao_admin','secretaria','coordenador']` |
| 12 | `secretaria` não acessa Responsáveis no menu | AdminSidebar | Adicionar item Responsáveis com perfis equivalentes |
| 13 | `secretaria` não acessa Solicitações | Menu + API | Adicionar `secretaria` em `configuracoes/solicitacoes.js` e no menu |
| 14 | `contratos/[id]` não permite `financeiro` | API | Adicionar `financeiro` nos perfis permitidos |
| 15 | `upload-foto/material/thumbnail` sem `requirePerfil` | APIs | Adicionar perfis mínimos (bloquear `aluno` de uploads do sistema) |

### 🟡 P3 — Médio (boas práticas e consistência)

| # | Problema | Onde | Ação |
|---|---|---|---|
| 16 | `coordenador` acessa E-mails e Avaliações (fora da proposta) | Menu + API | Avaliar se é intencional; remover se não for |
| 17 | `configuracoes/diploma-digital.js` e `rematricula.js` usam JSON local | APIs | Migrar para Supabase (pendente da Sprint 1) |
| 18 | `admin-financeiro/clientes.js` só permite `grupo_admin` | API | Verificar se `financeiro` deve ter acesso |
| 19 | Calendário de Aulas e Contas Bancárias sem implementação | Menu | Adicionar badge "Em breve" / desabilitar link |
| 20 | `usuarios/alterar-senha` e `atualizar-perfil` sem `requirePerfil` | APIs | Aceitável para auto-edição; documentar como decisão consciente |

---

## 4. APIs que precisam de `requirePerfil`

APIs com `requireAuth` mas sem `requirePerfil` — qualquer usuário autenticado acessa:

| API | Situação | Perfil sugerido |
|---|---|---|
| `upload-foto.js` | Qualquer autenticado | `['grupo_admin','instituicao_admin','coordenador','secretaria','professor']` |
| `upload-material.js` | Qualquer autenticado | `['grupo_admin','instituicao_admin','coordenador','professor']` |
| `upload-thumbnail.js` | Qualquer autenticado | `['grupo_admin','instituicao_admin','coordenador']` |
| `usuarios/alterar-senha.js` | Qualquer autenticado | Manter (auto-edição de senha — intencional) |
| `usuarios/atualizar-perfil.js` | Qualquer autenticado | Manter (auto-edição de perfil — intencional) |
| `contratos/aluno/[id]` | Qualquer autenticado | `['grupo_admin','instituicao_admin','financeiro','secretaria','aluno']` |
| `contratos/aluno/[id]/assinar-digital` | **ABERTA** | `['aluno','grupo_admin','instituicao_admin']` |
| `contratos/aluno/[id]/assinatura-status` | **ABERTA** | `['aluno','grupo_admin','instituicao_admin','financeiro']` |
| `contratos/[id]/padrao` | **ABERTA** | `['grupo_admin','instituicao_admin']` |
| `responsaveis/index` | **ABERTA** | `['grupo_admin','instituicao_admin','secretaria','coordenador']` |
| `unidades/index` | **ABERTA** | `['grupo_admin','instituicao_admin']` |
| `unidades/[id]` | **ABERTA** | `['grupo_admin','instituicao_admin']` |
| `configuracoes/anos-letivos` | **ABERTA** | `['grupo_admin','instituicao_admin','coordenador']` |

---

## 5. Menus que devem ser ocultados ou criados por perfil

Alterações necessárias no `MENU_ITEMS` do `components/AdminSidebar.js`:

| Item | Situação atual | Ajuste necessário |
|---|---|---|
| Dashboard | Sem filtro (todos veem) | Manter |
| Usuários | `grupo_admin, instituicao_admin` | Correto |
| Professores | `grupo_admin, instituicao_admin, coordenador, secretaria` | Correto |
| Alunos | `grupo_admin, instituicao_admin, coordenador, secretaria` | Adicionar `financeiro, comercial` |
| **Responsáveis** | **Ausente** | **Criar item** com `secretaria, coordenador, grupo_admin, instituicao_admin` |
| **Turmas** | **Ausente** | **Criar item** com `secretaria, coordenador, grupo_admin, instituicao_admin` |
| Cursos | `grupo_admin, instituicao_admin, coordenador, secretaria` | Correto |
| Banner/Slider | `grupo_admin, instituicao_admin` | Correto |
| Notícias | `grupo_admin, instituicao_admin, coordenador` | Verificar proposta |
| Fórum | `grupo_admin, instituicao_admin, coordenador` | Correto |
| E-mails | `grupo_admin, instituicao_admin, coordenador` | Verificar proposta |
| Avaliações | `grupo_admin, instituicao_admin, coordenador` | Verificar proposta |
| Documentos | `grupo_admin, instituicao_admin, coordenador, secretaria` | Adicionar `comercial` |
| Coordenação | `grupo_admin, instituicao_admin, coordenador` | Manter |
| → Solicitações | Coordenação only | Adicionar `secretaria` |
| → Calendário de Aulas | Sem implementação | Desabilitar / badge "Em breve" |
| → Contas Bancárias | Sem implementação | Desabilitar / badge "Em breve" |
| **Seção Financeiro (nova)** | **Ausente** | **Criar seção** com Ordens, Carnês, Convênios, EFI para `financeiro, grupo_admin, instituicao_admin` |
| **Seção Comercial (nova)** | **Ausente** | **Criar seção** com Matrículas, Campanhas, Contratos para `comercial, grupo_admin, instituicao_admin` |

---

## 6. Riscos de Escalação de Privilégio

| # | Risco | Gravidade | Detalhe |
|---|---|---|---|
| 1 | `aluno` pode fazer upload de foto e material | 🔴 Alto | `upload-foto`, `upload-material`, `upload-thumbnail` têm apenas `requireAuth`. Aluno autenticado pode enviar arquivos arbitrários ao servidor. |
| 2 | `responsaveis/index` completamente aberto | 🔴 Alto | Qualquer request não autenticado pode listar e criar responsáveis. Exposição de dados pessoais (risco LGPD). |
| 3 | `unidades/index` e `[id]` completamente abertos | 🟠 Médio | Dados de unidades legíveis e alteráveis sem autenticação. |
| 4 | `configuracoes/anos-letivos` aberto | 🟠 Médio | Qualquer acesso não autenticado pode ler ou alterar anos letivos. |
| 5 | `DashboardLayout` usa `localStorage` | 🟠 Médio | Páginas sem `useAuth` explícito (professores, alunos, turmas, etc.) dependem de `DashboardLayout`, que ainda usa `localStorage` — verificação não ocorre via cookie seguro. |
| 6 | `contratos/aluno/[id]/assinar-digital` aberto | 🟠 Médio | Endpoint de assinatura sem auth — qualquer pessoa conhecendo o ID do contrato pode chamar o endpoint. |
| 7 | `comercial` não mapeado em nenhuma API | 🟡 Baixo | Se um usuário com `tipo=comercial` for criado, não acessa nada útil, mas também não há barreira técnica impedindo acesso ao painel via URL direta (depende de DashboardLayout/localStorage). |
| 8 | `admin-financeiro/clientes` só permite `grupo_admin` | 🟡 Baixo | `financeiro` não pode acessar o módulo de clientes EFI, mesmo sendo o perfil operacional financeiro. |

---

## 7. Resumo Executivo

### O que está funcionando bem

- Módulo financeiro (`admin-financeiro/*`) totalmente protegido com `requireAuth` + `requirePerfil`
- Módulo pedagógico (notas, planejamento, atividades) bem segmentado entre coordenador/professor
- Sistema de cookies JWT com HMAC-SHA256 é sólido
- Isolamento multi-tenant via `instituicao_id` funciona corretamente
- 6 páginas admin já migradas de `localStorage` para `useAuth` (avaliacoes, blog, documentos, emails, forum, usuarios)

### O que bloqueia produção

1. **`financeiro` não tem menu** → usuário não consegue operar
2. **`comercial` não existe** no sistema (nem menu, nem APIs)
3. **`responsaveis/index` e `unidades/*` abertas** → risco LGPD
4. **`DashboardLayout` ainda usa `localStorage`** → a maioria das páginas admin (alunos, professores, turmas, etc.) está com auth fraca

### Ordem de execução sugerida antes do go-live

| Prioridade | Tarefa | Estimativa |
|---|---|---|
| 1 | Fechar APIs abertas críticas (P1: itens 1–7) | 1–2h |
| 2 | Migrar `DashboardLayout` de `localStorage` para `/api/auth/me` | 30min |
| 3 | Criar seção Financeiro no menu AdminSidebar | 30min |
| 4 | Adicionar itens Responsáveis e Turmas no menu para `secretaria` | 30min |
| 5 | Adicionar `secretaria` em `configuracoes/solicitacoes.js` | 15min |
| 6 | Adicionar `requirePerfil` nos uploads (bloquear acesso de `aluno`) | 30min |
| 7 | Criar perfil `comercial` nas APIs e menu | depende de decisão de negócio |
| 8 | Migrar `diploma-digital.js` e `rematricula.js` de JSON para Supabase | 2–3h |
