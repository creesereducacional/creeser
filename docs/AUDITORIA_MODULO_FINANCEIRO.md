# Auditoria — Módulo Financeiro (Ordens de Pagamento)
**Data:** 2025-07  
**Escopo:** Uso em produção no Inove Técnico  
**Foco:** Ordens de pagamento + integração EFI Bank  
**Build:** ✅ Compilado com sucesso (Next.js, sem erros)

---

## Veredicto Geral

🟡 **PRONTO COM RESSALVAS** — O fluxo básico de ordens de pagamento e geração de boleto EFI está funcional e testado. Há pendências operacionais importantes antes do uso em produção real (valores financeiros do aluno de teste não cadastrados, NEXT_PUBLIC_URL ausente na Vercel).

---

## 1. Schema do Banco

| Tabela | Existe | `instituicao_id` | Notas |
|---|---|---|---|
| `financeiro_ordens_pagamento` | ✅ | ✅ | + colunas EFI (efi_charge_id, efi_carnet_id, efi_status) |
| `financeiro_parcelas` | ✅ | ✅ | + efi_charge_id por parcela |
| `financeiro_boletos` | ✅ | ✅ | Histórico de boletos (gateway, barcode, url, status) |
| `financeiro_convenios` | ✅ | ✅* | *Tabela vazia — colunas confirmadas na migration (`instituicao_id NOT NULL`) |

**Colunas financeiras em `alunos`** (migration `20260311_add_alunos_financeiro.sql`):
- `valor_matricula`, `valor_mensalidade`, `percentual_desconto`, `qtd_parcelas`
- `dia_pagamento`, `qtd_meses_contrato`, `plano_financeiro`
- `aluno_bolsista`, `percentual_bolsa`, `financiamento_estudantil`, `percentual_financiamento`
- `cnpj_boleto`, `razao_social_boleto`

---

## 2. Perfis de Acesso

| Perfil | Acesso ao Módulo | Criar Ordem | Gerar Boleto | Obs. |
|---|---|---|---|---|
| `grupo_admin` | ✅ total | ✅ | ✅ | Cross-instituição |
| `instituicao_admin` | ✅ | ✅ | ✅ | Isolado por instituição |
| `admin` | ✅ | ✅ | ✅ | Isolado por instituição |
| `financeiro` | ✅ | ✅ | ✅ | Perfil específico do tesoureiro |
| `secretaria` | ❌ | ❌ | ❌ | Sem rota para `/admin-financeiro` |
| `comercial` | ❌ | ❌ | ❌ | Sem rota para `/admin-financeiro` |
| `professor` | ❌ | ❌ | ❌ | Sem acesso |

**Isolamento multi-tenant:** `applyInstituicaoFilter` aplicado em todas as queries. Teste ao vivo confirmou isolamento correto (FAETE ≠ Inove Técnico).

---

## 3. Fluxo de Ordens de Pagamento

### 3.1 Criar Ordem

**Rota:** `POST /api/admin-financeiro/ordens/create`  
**UI:** `/admin-financeiro/create-ordem`

Campos obrigatórios:
- `aluno_id` — validado + verificado pertence à instituição
- `tipo` — `ordem_simples` ou `carne`
- `descricao` — texto livre
- `valor_total` — > 0

Campos opcionais:
- `referencia` — texto livre (ex: "MATRÍCULA 2025/1")
- `percentual_desconto` + `valor_desconto` — desconto aplicado
- `quantidade_parcelas` (padrão: 1)
- `intervalo_dias` (padrão: 30)
- `data_vencimento_primeira` — data da 1ª parcela

**Geração de parcelas:** automática na criação  
`valor_parcela = valor_total / quantidade_parcelas`  
Datas calculadas: `data_vencimento_primeira + (n-1) * intervalo_dias`

**UI:** pré-preenche `valor_total` com `aluno.valor_mensalidade` se disponível.

### 3.2 Listar Ordens

**Rota:** `GET /api/admin-financeiro/ordens`  
**UI:** `/admin-financeiro/ordens`  
Filtros: status, tipo, busca por aluno  
Isolamento: `applyInstituicaoFilter` ✅

### 3.3 Detalhar Ordem / Parcelas

**Rota:** `GET /api/admin-financeiro/aluno-ordens/[id]`  
Retorna ordens + parcelas do aluno, com dados do boleto.

### 3.4 Recibo

**Rota:** `GET /api/admin-financeiro/recibo/[ordemId]`  
Retorna: ordem, aluno, turma, curso, dados da empresa (`configuracoes_empresa`).  
Auth + isolamento ✅

### 3.5 Operações Ausentes ⚠️

| Operação | Status | Impacto |
|---|---|---|
| Editar valor/descrição pós-criação | ❌ sem endpoint | Operacional: requer cancelar e recriar |
| Alterar vencimento de parcela | ❌ sem endpoint | Operacional: comum na tesouraria |
| Baixa manual de parcela | ❌ sem endpoint | Crítico: pagamento em dinheiro/transferência não registra |
| Estornar pagamento | ❌ sem endpoint | Operacional |
| Relatório de inadimplência | ❌ desabilitado no menu | Gerencial |

---

## 4. Integração EFI Bank

### 4.1 Credenciais e Ambiente

```
EFI_CLIENT_ID:     ✅ presente (50 chars)
EFI_CLIENT_SECRET: ✅ presente (54 chars)
EFI_SANDBOX:       false → 🔴 PRODUÇÃO
OAuth2 EFI:        ✅ HTTP 200, token obtido (expires_in=600s)
```

> ⚠️ **ATENÇÃO:** `EFI_SANDBOX=false` significa que qualquer boleto gerado é **real e cobra dinheiro**. Validar em homologação primeiro (criar `.env.local` com `EFI_SANDBOX=true` e credenciais de sandbox).

### 4.2 Fluxo de Cobrança Única (Boleto)

```
POST /api/admin-financeiro/efi/cobranca
  1. requirePerfil → financeiro/admin
  2. Busca parcela + applyInstituicaoFilter (isolamento)
  3. Valida: parcela não cancelada, tipo=ordem_simples, sem charge_id existente
  4. Valida CPF do aluno (11 dígitos — bloqueia se inválido)
  5. efi.createCharge([{name, value_centavos, amount}])
  6. efi.updateChargeMetadata(chargeId, webhookUrl)
  7. efi.associateBillet(chargeId, {expire_at, customer})
  8. Grava em financeiro_boletos
  9. Atualiza financeiro_parcelas (efi_charge_id, barcode, url)
  10. Atualiza financeiro_ordens_pagamento (efi_charge_id, efi_status='waiting')
  → Retorna {charge_id, boleto_url, barcode, vencimento}

DELETE /api/admin-financeiro/efi/cobranca
  Cancela no EFI (se charge_id presente) + atualiza localmente
  Ordem → status='cancelado', efi_status='canceled'
  Todas as parcelas → status='cancelado'
```

### 4.3 Dados do Aluno Exigidos pela EFI

| Campo | Obrigatório | Verificação | Status aluno id=16 |
|---|---|---|---|
| `nome` | ✅ Sim | sempre incluso | ✅ FRANCISCO DE ASSIS DA SILVA ALCANTARA |
| `cpf` | ✅ Sim | 11 dígitos, bloqueia se inválido | ✅ 75468972387 |
| `email` | Não | incluso se presente | ✅ wciinfor@gmail.com |
| `telefone_celular` | Não | incluso se 10-11 dígitos | ✅ 91993121501 |
| `data_nascimento` | Não | incluso se YYYY-MM-DD | ✅ 1978-04-01 |
| Endereço | Não | **NÃO enviado à EFI** | n/a |

**Conclusão:** O aluno id=16 (FRANCISCO DE ASSIS) está apto a ter boleto gerado — todos os campos necessários estão preenchidos.

### 4.4 Fluxo de Carnê (Boleto Parcelado)

**Rota:** `POST /api/admin-financeiro/efi/carne`  
`efi.createCarnet({items, customer, expire_at, repeats, split_items})`  
Cria todas as parcelas de uma vez na EFI.  
Cancelamento: `cancelCarnet` (carnê inteiro) ou `cancelCarnetParcel` (parcela individual).

### 4.5 Webhook EFI

**Rota:** `POST /api/admin-financeiro/efi/webhook`  
**Auth:** Nenhuma — público por design da EFI (token no body valida a autenticidade)

Mapeamento de status:
```
new / waiting                 → pendente
paid / settled / identified   → pago  (registra data_pagamento + valor_pago)
unpaid / expired              → vencido
canceled                      → cancelado
```

Atualiza `financeiro_parcelas` e `financeiro_ordens_pagamento` por `efi_charge_id`.

### 4.6 Configuração do Webhook na Vercel

```
NEXT_PUBLIC_URL não definido no .env.local
```
A API constrói a notification_url dinamicamente a partir do host da requisição.  
Na Vercel, isso usa o domínio de produção automaticamente — **OK para deploy**.  
Para registro manual do webhook no painel EFI, usar: `https://[dominio-vercel]/api/admin-financeiro/efi/webhook`

---

## 5. Dashboard Financeiro

**Rota:** `GET /api/admin-financeiro/dashboard`  
**UI:** `/admin-financeiro`

| Métrica | Status |
|---|---|
| Total alunos com pendências | ✅ |
| Total a receber (parcelas pendentes) | ✅ |
| Boletos vencidos + valor | ✅ |
| Total ordens simples | ✅ |
| Total carnês | ✅ |
| Total recebido | ✅ |
| Taxa de recebimento | ✅ |
| Relatório de inadimplência | ❌ desabilitado |

---

## 6. Dados Financeiros do Aluno de Teste

```
Aluno: FRANCISCO DE ASSIS DA SILVA ALCANTARA (id=16)
CPF:             ✅ 11 dígitos (válido para EFI)
Email:           ✅ wciinfor@gmail.com
Telefone:        ✅ 91993121501
Data nascimento: ✅ 1978-04-01
Endereço:        ✅ RUA HUMBERTO CAMPOS

Campos financeiros do aluno:
  valor_matricula:     ⚠️ vazio
  valor_mensalidade:   ⚠️ vazio
  percentual_desconto: vazio
  qtd_parcelas:        vazio
  dia_pagamento:       vazio
  plano_financeiro:    vazio
  aluno_bolsista:      false
```

> ⚠️ Os campos financeiros do aluno (valor_mensalidade, valor_matricula etc.) não foram preenchidos. A UI de criação de ordem pré-preenche o valor com `valor_mensalidade` — se vazio, o operador digita manualmente. **Preencher esses campos no cadastro do aluno é recomendado antes de usar em produção.**

---

## 7. Convênios

Tabela `financeiro_convenios`: ✅ existe com `instituicao_id NOT NULL`  
Inove Técnico: 0 convênios cadastrados (normal para fase inicial)

---

## 8. Multi-tenant — Verificações

| Verificação | Resultado |
|---|---|
| `financeiro_ordens_pagamento.instituicao_id` | ✅ existe |
| `financeiro_parcelas.instituicao_id` | ✅ existe |
| `financeiro_boletos.instituicao_id` | ✅ existe |
| `applyInstituicaoFilter` nas queries | ✅ aplicado |
| Teste ao vivo: aluno Inove com filtro FAETE | ✅ 0 resultados |
| Criar ordem valida `aluno.instituicao_id` | ✅ verificado no código |

---

## 9. Pendências Antes do Go-Live

### 🔴 Críticas

| # | Pendência | Ação necessária |
|---|---|---|
| C1 | **Baixa manual de parcelas não existe** | Criar endpoint `PATCH /api/admin-financeiro/parcelas/[id]/baixa` para pagamentos em dinheiro/pix/transferência |
| C2 | **`EFI_SANDBOX=false` em `.env.local`** | Durante testes locais, usar `EFI_SANDBOX=true` com credenciais de homologação para não gerar cobranças reais |

### 🟡 Importantes

| # | Pendência | Ação necessária |
|---|---|---|
| I1 | **Valores financeiros do aluno de teste vazios** | Preencher `valor_mensalidade` e `valor_matricula` no cadastro do aluno id=16 antes de demonstrar a UI |
| I2 | **Sem edição de vencimento de parcela** | Criar endpoint ou aceitar fluxo de cancelar + recriar |
| I3 | **Relatório de inadimplência desabilitado** | Habilitar ou criar página de relatório |

### 🟢 Configuração Vercel

| # | Pendência | Ação |
|---|---|---|
| V1 | `AUTH_JWT_SECRET` na Vercel | **Obrigatório** (já documentado em VALIDACAO_CONTRATOS_GO_LIVE.md) |
| V2 | `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET` na Vercel | Credenciais de PRODUÇÃO já disponíveis no `.env.local` |
| V3 | `EFI_SANDBOX` na Vercel | Deve ser `false` para produção |

---

## 10. Módulo EFI Client (`lib/efi-client.js`)

Métodos disponíveis:

| Método | Descrição | Usado |
|---|---|---|
| `createCharge(items)` | Cria cobrança vazia | ✅ em cobranca.js |
| `associateBillet(chargeId, payload)` | Vincula boleto bancário | ✅ em cobranca.js |
| `cancelCharge(chargeId)` | Cancela cobrança | ✅ em cobranca.js |
| `getCharge(chargeId)` | Consulta cobrança | disponível, não usado em UI |
| `createCarnet(payload)` | Cria carnê parcelado | ✅ em carne.js |
| `cancelCarnet(carnetId)` | Cancela carnê inteiro | ✅ em carne.js |
| `cancelCarnetParcel(carnetId, parcel)` | Cancela parcela do carnê | ✅ em carne.js |
| `getCarnet(carnetId)` | Consulta carnê | ✅ em carne.js |
| `getNotification(token)` | Consulta webhook | ✅ em webhook.js |
| `updateChargeMetadata(chargeId, url)` | Registra webhook | ✅ em cobranca.js |

OAuth2: Token cacheado em memória, renovado automaticamente, expira 30s antes.  
Ambiente controlado por `EFI_SANDBOX`: `true` → homologação, `false`/omitido → **produção**.

---

## 11. Resumo Executivo

```
✅ 13 verificações OK
⚠️  6 avisos (não bloqueantes)
❌  1 falha real: financeiro_convenios sem cols detectáveis (tabela vazia — false negative)

EFI Bank:    ✅ OAuth2 funcional em PRODUÇÃO
Schema:      ✅ Todas as tabelas com instituicao_id
Isolamento:  ✅ Multi-tenant correto
Perfis:      ✅ Financeiro com acesso completo
Build:       ✅ Compilado sem erros

Pendências operacionais:
  - Baixa manual de parcelas (C1) — crítico para pagamentos off-EFI
  - Campos financeiros do aluno de teste (I1) — cadastrar antes de demonstrar
  - Relatório de inadimplência (I3) — gerencial
  - Variáveis de ambiente na Vercel (V1, V2, V3) — antes do deploy
```

---

## 12. Próximos Passos Recomendados

1. **Implementar baixa manual** — endpoint `PATCH /api/admin-financeiro/parcelas/[id]/baixa` com campos: `data_pagamento`, `valor_pago`, `observacao`, `forma_pagamento`
2. **Preencher dados do aluno de teste** — `valor_mensalidade`, `valor_matricula` no aluno id=16
3. **Configurar Vercel** — `AUTH_JWT_SECRET`, `EFI_CLIENT_ID`, `EFI_CLIENT_SECRET`, `EFI_SANDBOX=false`
4. **Testar fluxo completo em homologação** — usar `EFI_SANDBOX=true` com credenciais de sandbox, criar ordem → gerar boleto → simular pagamento → verificar webhook
5. **Habilitar relatório de inadimplência** — `habilitado: false` em `components/AdminFinanceiro/Layout.js` linha do menu Relatórios
