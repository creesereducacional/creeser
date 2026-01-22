# ✅ ANÁLISE: Alinhamento Formulário Alunos vs Supabase

## 📊 Resumo Executivo

| Item | Status | Descrição |
|------|--------|-----------|
| **Formulário** | ✅ COMPLETO | 40+ campos implementados |
| **Tabela Base** | ✅ EXISTENTE | 14 campos criados |
| **Campos Faltantes** | ❌ 30+ | Precisam ser adicionados ao Supabase |
| **API JSON** | ✅ FUNCIONA | Salvando em arquivo |
| **API Supabase** | ⏳ PRONTA | Criada, aguardando migration |
| **Status Geral** | ⚠️ PARCIAL | Pronto para receber dados após migration |

---

## 🔍 Detalhamento Técnico

### Formulário de Cadastro

**URL**: http://localhost:3000/admin/alunos/novo
**Método**: POST → `/api/alunos`

#### Campos Implementados no Formulário (40+ campos):

| Seção | Campo | Tipo | Status |
|-------|-------|------|--------|
| **Identificação** | instituicao | text | ✅ Supabase |
| | turma | select | ⏳ Supabase (turmaId) |
| | anoLetivo | number | ❌ Falta |
| | turnoIntegral | checkbox | ❌ Falta |
| | semestre | text | ❌ Falta |
| **Dados Pessoais** | nome | text | ⏳ Supabase (usuarioId) |
| | nomeSocial | checkbox | ❌ Falta |
| | cpf | text | ❌ Falta |
| | estadoCivil | select | ❌ Falta |
| | sexo | select | ❌ Falta |
| | dtNascimento | date | ❌ Falta |
| | rg | text | ❌ Falta |
| | dataExpedicaoRG | date | ❌ Falta |
| | orgaoExpedidorRG | text | ❌ Falta |
| | telefoneCelular | tel | ❌ Falta |
| **Filiação** | pai | text | ❌ Falta |
| | mae | text | ❌ Falta |
| **Endereço** | cep | text | ✅ Supabase (cep) |
| | endereco | text | ✅ Supabase |
| | numero | text | ✅ Supabase (numeroEndereco) |
| | bairro | text | ✅ Supabase |
| | cidade | text | ✅ Supabase |
| | uf | select | ✅ Supabase (estado) |
| | complemento | text | ❌ Falta |
| | naturalidade | text | ❌ Falta |
| | ufNaturalidade | select | ❌ Falta |
| | email | email | ❌ Falta |
| **Reg. Nascimento** | termo | text | ❌ Falta |
| | folha | text | ❌ Falta |
| | livro | text | ❌ Falta |
| | nomeCartorio | text | ❌ Falta |
| **Ensino Médio** | estabelecimento | text | ❌ Falta |
| | anoConclusao | number | ❌ Falta |
| | enderecoDEM | text | ❌ Falta |
| | municipioDEM | text | ❌ Falta |
| | ufDEM | select | ❌ Falta |
| **Deficiência** | pessoaComDeficiencia | checkbox | ❌ Falta |
| | tipoDeficiencia | select | ❌ Falta |
| **INEP** | tipoEscolaAnterior | select | ❌ Falta |
| | paisOrigem | text | ❌ Falta |
| **Admin** | status | select | ✅ Supabase (statusMatricula) |

---

### Tabela `alunos` no Supabase

**Status Atual**: 14 campos (insuficiente)

```
Campos Existentes:
✅ id (SERIAL PRIMARY KEY)
✅ usuarioId (INTEGER)
✅ matricula (VARCHAR)
✅ cursoId (INTEGER)
✅ turmaId (INTEGER)
✅ statusMatricula (VARCHAR)
✅ dataMatricula (DATE)
✅ endereco (VARCHAR)
✅ cidade (VARCHAR)
✅ estado (CHAR 2)
✅ cep (VARCHAR)
✅ bairro (VARCHAR)
✅ numeroEndereco (VARCHAR)
✅ responsavelId (INTEGER)

Campos Faltando (30+):
❌ cpf
❌ estadoCivil
❌ sexo
❌ data_nascimento
❌ rg
❌ data_expedicao_rg
❌ orgao_expedidor_rg
❌ telefone_celular
❌ email
❌ pai
❌ mae
❌ instituicao
❌ ano_letivo
❌ turno_integral
❌ semestre
❌ termo
❌ folha
❌ livro
❌ nome_cartorio
❌ complemento
❌ naturalidade
❌ uf_naturalidade
❌ estabelecimento
❌ ano_conclusao
❌ endereco_dem
❌ municipio_dem
❌ uf_dem
❌ pessoa_com_deficiencia
❌ tipo_deficiencia
❌ foto
❌ tipo_escola_anterior
❌ pais_origem
❌ nome_social
```

---

## 🚀 Plano de Ação

### Fase 1: Preparar Supabase (5 min)

**Migration SQL criada**: `supabase/migrations/add_alunos_fields.sql`

Executar no Supabase Dashboard:
1. Abrir https://app.supabase.com
2. Selecionar projeto CREESER
3. Ir para **SQL Editor**
4. Copiar conteúdo de `supabase/migrations/add_alunos_fields.sql`
5. Clicar **Run**

**OU** via script:
```bash
node scripts/run-migration-alunos.js
```

### Fase 2: Testar Integridade (2 min)

Acessar página de teste:
- URL: http://localhost:3000/teste-supabase
- Confirmar que tabela `alunos` mostra estrutura atualizada

### Fase 3: Integrar API (3 min)

Atualizar `/api/alunos/index.js` para usar Supabase em vez de JSON

**Opções**:
1. ✅ Já criada: `/api/alunos/supabase.js` (completa)
2. Ou: Modificar index.js para usar a versão Supabase

### Fase 4: Testar Cadastro (5 min)

1. Acessar http://localhost:3000/admin/alunos/novo
2. Preencher formulário com dados de teste
3. Clicar em "Salvar"
4. Verificar se foi salvo no Supabase

---

## 📋 Checklist de Implementação

- [ ] Executar migration SQL no Supabase
- [ ] Confirmar que novos campos foram criados
- [ ] Atualizar API `/api/alunos` para usar Supabase
- [ ] Testar cadastro de novo aluno via formulário
- [ ] Verificar dados no Supabase
- [ ] Testar validações (CPF único, etc)
- [ ] Testar listagem de alunos

---

## 💡 Próximos Passos Recomendados

### Curto Prazo (Hoje):
1. ✅ Executar migration SQL
2. ✅ Integrar API com Supabase
3. ✅ Testar cadastro de novo aluno

### Médio Prazo (Esta Semana):
1. Adicionar validações:
   - CPF (máscara e validação)
   - Email (validação)
   - Datas (validação de período)
   
2. Melhorar UX:
   - Indicadores de campos obrigatórios
   - Mensagens de erro claras
   - Feedback em tempo real

### Longo Prazo (Este Mês):
1. Configurar RLS (Row Level Security)
2. Implementar listagem de alunos do Supabase
3. Implementar edição de alunos
4. Implementar deleção de alunos
5. Integrar fotos com Supabase Storage

---

## 📞 Status: Pronto para Proceder?

✅ **SIM! O módulo está pronto para receber registros após a migration SQL.**

Próximo passo: **Executar a migration no Supabase**
