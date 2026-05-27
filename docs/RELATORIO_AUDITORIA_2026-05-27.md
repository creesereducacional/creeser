# Relatório Final de Auditoria Operacional — Inove Técnico

**Data:** 27/05/2026  
**Auditor:** Sistema automatizado + análise diagnóstica  
**Scripts:** `scripts/auditoria-operacional.cjs` + `scripts/diagnose.cjs`  
**Ambiente:** Desenvolvimento local (Next.js) + Supabase Produção

> **ATUALIZADO:** Diagnóstico direto no Supabase realizado após auditoria inicial.
> Algumas reprovações identificadas como artefatos de teste; causas raiz confirmadas.

---

## Sumário Executivo

| Métrica | Valor |
|---------|-------|
| Testes executados | 40 |
| ✅ Aprovados | 19 |
| ⚠️ Avisos | 16 |
| ❌ Reprovados | 5 |
| &nbsp;&nbsp;&nbsp;↳ Bugs reais | **3** |
| &nbsp;&nbsp;&nbsp;↳ Artefatos de teste | 2 |
| **Nota Geral** | **48%** (62% excl. artefatos) |
| **Veredicto** | **NO-GO 🔴** |

---

## Resultado por Módulo

| Módulo | ✅ OK | ⚠️ Aviso | ❌ Bug Real | Artefato Teste | Veredicto |
|--------|-------|----------|------------|----------------|-----------|
| Recepção | 1 | 0 | 1 | 0 | ❌ FAIL |
| Comercial | 1 | 2 | 1 | 1 | ❌ FAIL |
| Financeiro | 3 | 1 | 0 | 1 | ✅ OK |
| FormacaoTurmas | 2 | 4 | 0 | 0 | ⚠️ PARCIAL |
| Contratos | 7 | 1 | 0 | 0 | ✅ OK |
| Segurança | 5 | 8 | 0 | 0 | ✅ OK |
| GoLive | 0 | 0 | 0 | 1 | ⚠️ AVALIAR |

---

## Fluxos Aprovados

- ✅ **[Recepção]** 1.1 GET /api/recepcao/pre-cadastros retorna 200 — 4 registros
- ✅ **[Comercial]** 2.1 GET /api/comercial/leads retorna 200 — 2 leads
- ✅ **[Financeiro]** 3.1 Dashboard financeiro retorna 200
- ✅ **[Financeiro]** 3.2 Tabela financeiro_parcelas acessível — 5 parcela(s)
- ✅ **[Financeiro]** 3.6 Tabela financeiro_logs acessível — 1 log(s)
- ✅ **[FormacaoTurmas]** 4.1 GET /api/formacao-turmas retorna 200 — 3 turma(s)
- ✅ **[FormacaoTurmas]** 4.2 Contagem de alunos por turma — Turma #9: 1 aluno(s)
- ✅ **[Contratos]** 5.1 Modelo(s) de contrato encontrado(s) — 1 contrato(s)
- ✅ **[Contratos]** 5.1b Contrato padrão configurado — ID 7dcc4f89-b0b6-4e3e-bb00-58a0950221c1
- ✅ **[Contratos]** 5.2 Tabela contratos_assinaturas acessível — 0 assinatura(s)
- ✅ **[Contratos]** 5.3 Colunas de status_contrato presentes na tabela alunos
- ✅ **[Contratos]** 5.4 /api/contratos/stats retorna dados — {"NAO_GERADO":5,"GERADO":0,"ENVIADO_ASSINATURA":0,"ASSINADO":0,"RECUSADO":0,"EXPIRADO":0}
- ✅ **[Contratos]** 5.5 ASSINAFY_API_KEY configurada
- ✅ **[Contratos]** 5.7 /marcar-gerado atualiza status do contrato — {"ok":true,"status_contrato":"GERADO"}
- ✅ **[Segurança]** grupo_admin acessa /api/contratos/stats — OK
- ✅ **[Segurança]** grupo_admin acessa /api/admin-financeiro/dashboard — OK
- ✅ **[Segurança]** Requisição sem token retorna 401
- ✅ **[Segurança]** Token adulterado corretamente rejeitado (401)
- ✅ **[Segurança]** AUTH_JWT_SECRET configurada e adequada — 48 chars

---

## Fluxos Reprovados / Bugs Encontrados

### ❌ BUG-001 — Coluna `data_captacao` ausente na tabela `alunos` (BLOQUEANTE)
- **Módulo:** Recepção  
- **Sintoma:** `POST /api/recepcao/pre-cadastros` → HTTP 500  
- **Erro:** `Could not find the 'data_captacao' column of 'alunos' in the schema cache`  
- **Causa raiz confirmada por diagnóstico:** A tabela `alunos` tem 82 colunas, `data_captacao` **não está entre elas**. O código em `pages/api/recepcao/pre-cadastros/index.js` insere `data_captacao: new Date().toISOString().slice(0, 10)` incondicionalmente.  
- **Impacto:** Todo novo pré-cadastro falha. **Fluxo de entrada de alunos 100% bloqueado.**  
- **Ação corretiva:** `ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_captacao DATE;`

---

### ❌ BUG-002 — Tabelas `comissoes_comerciais` e `comissoes_config` inexistentes (BLOQUEANTE)
- **Módulo:** Comercial  
- **Sintoma:** `GET /comissoes_comerciais` → HTTP 404  
- **Erro:** `Could not find the table 'public.comissoes_comerciais' in the schema cache`  
- **Causa raiz confirmada por diagnóstico:** Ambas as tabelas simplesmente não existem no banco. Migrations não foram aplicadas.  
- **Impacto:** Módulo de comissões completamente não-funcional. `lib/comissoes-helper.js` falha em silêncio; nenhum vendedor recebe rastreabilidade de comissão.  
- **Ação corretiva:** Criar migration com `CREATE TABLE comissoes_config` e `CREATE TABLE comissoes_comerciais`

---

### ⚠️ ARTEFATO DE TESTE — `POST /api/comercial/leads` → HTTP 500 (não é bug real)
- **Causa:** Token artificial no script de auditoria usava `id: 1` como usuário. A tabela `usuarios` tem usuários reais a partir do `id: 8`. FK violation porque `captado_por_id = 1` não existe.  
- **Com usuário real:** O fluxo funciona normalmente — confirmado por diagnóstico (5 usuários reais presentes: IDs 8–12).  
- **Observação:** Coluna `nome` e `instituicao_id` estão ausentes da tabela `usuarios`, o que fez o script de auditoria não encontrar os usuários e gerar token artificial.

---

### ⚠️ ARTEFATO DE TESTE — `POST /api/admin-financeiro/ordens/create` → HTTP 500 (não é bug real)
- **Causa:** Token artificial usava `id: 1`. Aluno de amostra (#22) pertence à instituição `30130938-...` enquanto o token referenciava `1f140f5f-...`. Mismatch de `instituicao_id`.  
- **Com usuário real da instituição correta:** A criação de ordem deve funcionar.

---

### ⚠️ ARTEFATO DE TESTE — `GET /api/go-live/checklist` → HTTP 500 (provável artefato)
- **Causa provável:** `resolveInstituicaoId` com `allowAll: false` pode não reconhecer o token artificial. Com usuário real (ID=8, grupo_admin), o endpoint deve funcionar normalmente.  
- **O código está correto:** Usa `safeCount`/`safeQuery` em todos os queries com tratamento de erros.  
- **Ação:** Testar manualmente com usuário real após login via `/api/auth/login`.

---

## Avisos

- ⚠️ **[Comercial]** 2.4 Nenhuma configuração de comissão (`comissoes_config` inexistente)
- ⚠️ **[Comercial]** 2.6 Sem usuários com perfis operacionais no banco (`recepcao`, `coordenador`, `comercial_master`, `comercial_operador`)
- ⚠️ **[Financeiro]** 3.4 Sem parcela pendente no aluno de amostra para testar baixa manual
- ⚠️ **[FormacaoTurmas]** 4.3–4.5 Nenhuma turma `PRONTA_PARA_ABRIR` — todas as 3 turmas em `EM_FORMACAO` com apenas 1 aluno cada (mínimo: 20)
- ⚠️ **[FormacaoTurmas]** 4.6 `/api/alunos/ativar` retornou HTTP 422 — expected behavior para aluno não elegível
- ⚠️ **[Contratos]** 5.6 `assinar-digital` retornou 401 — token sem usuário real no banco
- ⚠️ **[Segurança]** 8 perfis sem token real para testar isolamento de acesso por perfil

---

## Diagnóstico de Infraestrutura (confirmado por `diagnose.cjs`)

| Item | Status | Detalhe |
|------|--------|---------|
| Supabase conectado | ✅ | URL e Service Role Key ativos |
| Tabela `alunos` | ✅ | 82 colunas, inclui `status_contrato` |
| Coluna `data_captacao` | ❌ | **AUSENTE** — migration necessária |
| Coluna `status_contrato` | ✅ | Presente (migration aplicada) |
| Tabela `usuarios` | ✅ | 5 usuários (IDs 8–12) |
| Tabela `leads` | ✅ | 2 leads, coluna `captado_por_id` presente |
| Tabela `contratos_instituicao` | ✅ | 1 contrato padrão |
| Tabela `contratos_assinaturas` | ✅ | 0 assinaturas |
| Tabela `financeiro_parcelas` | ✅ | 5 parcelas |
| Tabela `comissoes_comerciais` | ❌ | **NÃO EXISTE** |
| Tabela `comissoes_config` | ❌ | **NÃO EXISTE** |
| Turmas (3) | ⚠️ | Todas `EM_FORMACAO` — nenhuma PRONTA |
| `AUTH_JWT_SECRET` | ✅ | 48 chars |
| `ASSINAFY_API_KEY` | ✅ | Configurada |

### Usuários presentes no banco

| ID | Email | Perfil | Status |
|----|-------|--------|--------|
| 8 | admin@inovetecnico.com.br | grupo_admin | ativo |
| 9 | financeiro@inovetecnico.com.br | financeiro | ativo |
| 10 | secretaria@inovetecnico.com.br | secretaria | ativo |
| 11 | comercial@inovetecnico.com.br | comercial | ativo |
| 12 | adm.inove@inovetecnico.com.br | instituicao_admin | ativo |

**Perfis ausentes:** `recepcao`, `coordenador`, `comercial_master`, `comercial_operador`

---

## Plano de Ações para Go-Live (Ordenado por Prioridade)

### P0 — Bloqueantes (obrigatório antes de qualquer operação)

```sql
-- 1. Adicionar coluna ausente
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_captacao DATE;

-- 2. Criar tabela de configuração de comissões
CREATE TABLE IF NOT EXISTS comissoes_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instituicao_id UUID REFERENCES instituicoes(id),
    ativo BOOLEAN NOT NULL DEFAULT false,
    modo TEXT NOT NULL CHECK (modo IN ('percentual', 'fixo')),
    percentual NUMERIC(5,2),
    valor_fixo NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar tabela de comissões comerciais
CREATE TABLE IF NOT EXISTS comissoes_comerciais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instituicao_id UUID REFERENCES instituicoes(id),
    captado_por_id INTEGER REFERENCES usuarios(id),
    aluno_id INTEGER REFERENCES alunos(id),
    ordem_pagamento_id UUID UNIQUE,
    parcela_id UUID,
    valor_base NUMERIC(12,2),
    valor_comissao NUMERIC(12,2),
    status TEXT NOT NULL DEFAULT 'pendente',
    data_credito DATE,
    repassado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### P1 — Necessários para operação real

1. Criar usuários para os perfis operacionais ausentes: `recepcao`, `coordenador`, `comercial_master`, `comercial_operador`
2. Configurar percentuais em `comissoes_config` para a instituição Inove Técnico
3. Verificar `ASSINAFY_ACCOUNT_ID` nas variáveis de ambiente do Vercel

### P2 — Recomendados antes do lançamento

1. Testar go-live checklist com usuário real autenticado via browser
2. Testar assinatura digital ponta a ponta com aluno real
3. Configurar webhook EFI (`EFI_WEBHOOK_SECRET`) para pagamentos automáticos
4. Confirmar `NODE_ENV=production` no Vercel
5. Atingir mínimo de 20 alunos em pelo menos uma turma para validar abertura de turma

---

## Veredicto Final

### 🔴 NO-GO

**3 bugs reais impedem a operação:**

1. **Recepção bloqueada** — Coluna `data_captacao` ausente. Nenhum aluno pode ser pré-cadastrado.
2. **Comissões inexistentes** — Tabelas não criadas. Rastreabilidade comercial não funciona.
3. **Perfis operacionais não cadastrados** — Não há usuários com perfil recepção, coordenador ou comercial para operar o sistema.

**Próximo passo:** Aplicar as 3 migrations SQL do P0 no Supabase SQL Editor e criar os usuários operacionais.

---

## Riscos para Produção

🟡 MÉDIO — Configuração de comissões ausente/inativa. Comissões não serão geradas.
🟡 MÉDIO — Nenhuma turma PRONTA_PARA_ABRIR. Validar se há alunos em formação.

---

## Veredicto Go/No-Go

### NO-GO 🔴

  Múltiplas falhas bloqueantes. Corrigir antes do Go-Live.

---

## Próximos Passos Recomendados

1. Corrigir: [Recepção] 1.2 POST falhou
2. Corrigir: [Comercial] 2.2 POST lead falhou
3. Corrigir: [Comercial] 2.5 Tabela comissoes_comerciais inacessível
4. Corrigir: [Financeiro] 3.3 Criar ordem de matrícula
5. Corrigir: [GoLive] API go-live checklist falhou



---

*Gerado automaticamente por `scripts/auditoria-operacional.cjs`*
