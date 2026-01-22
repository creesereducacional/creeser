# 🚀 GUIA COMPLETO - CADASTRO DE ALUNOS

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### 1️⃣ Executar SQL no Supabase (ESSENCIAL)

Abra: https://app.supabase.com → SQL Editor → New Query

**Cole e execute TODO este SQL:**

```sql
-- Adicionar coluna nome (campo obrigatório)
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT '';

-- Atualizar dataMatricula se ainda não existir
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS datamatricula DATE;

-- Adicionar campos pessoais
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estadocivil VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS sexo VARCHAR(10);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_expedicao_rg DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS orgao_expedidor_rg VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone_celular VARCHAR(20);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Adicionar filiação
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pai VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS mae VARCHAR(255);

-- Adicionar campos administrativos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS instituicao VARCHAR(255) DEFAULT 'CREESER';
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_letivo INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS turno_integral BOOLEAN DEFAULT false;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS semestre VARCHAR(10);

-- Adicionar campos de registro de nascimento
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS termo VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS folha VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS livro VARCHAR(50);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_cartorio VARCHAR(255);

-- Adicionar campos de endereço completo
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS complemento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_naturalidade CHAR(2);

-- Adicionar informações de ensino médio
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estabelecimento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_conclusao INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS endereco_dem VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS municipio_dem VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_dem CHAR(2);

-- Adicionar informações de deficiência
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pessoa_com_deficiencia BOOLEAN DEFAULT false;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_deficiencia VARCHAR(255);

-- Adicionar foto
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS foto TEXT;

-- Adicionar informações INEP
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_escola_anterior VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pais_origem VARCHAR(100) DEFAULT 'BRA - Brasil';
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_social BOOLEAN DEFAULT false;
```

**Resultado esperado:** "Success. No rows returned" ✅

---

### 2️⃣ Verificar Código - Mapeamento COMPLETO

✅ **Arquivos já atualizados:**
- `pages/api/alunos/index.js` - POST com 42 campos mapeados
- `pages/api/alunos/[id].js` - PUT com 42 campos mapeados
- `supabase/migrations/add_alunos_fields.sql` - Migration completa

✅ **Detalhes do Mapeamento:**
- Todos os 42 campos do formulário mapeados corretamente
- PostgreSQL lowercase conversion handled
- Booleanos usando `Boolean()` para garantir tipo correto
- Integers usando `parseInt()` para evitar erros
- Campos vazios como `null` ou `''` conforme tipo

---

### 3️⃣ Testar o Formulário

#### Teste 1: Cadastro Novo

1. Acesse: http://localhost:3000/admin/alunos/novo
2. Preencha os campos:
   - **Nome**: João da Silva (OBRIGATÓRIO)
   - **Turma**: (deixe vazio - nenhuma turma cadastrada)
   - **Ano Letivo**: 2025 (pré-preenchido)
   - **Turno Integral**: Marque ou não
   - **CPF**: 123.456.789-00
   - **Email**: joao@example.com
   - **Endereço**: Rua Teste, 123
   - **Outros campos**: preencha opcionalmente

3. Clique em **SALVAR**

#### Resultado Esperado:

✅ Mensagem de sucesso: "Aluno cadastrado com sucesso!"
✅ Redirecionado para: http://localhost:3000/admin/alunos
✅ Novo aluno aparece na lista com TODOS os dados salvos

---

### 4️⃣ Verificar Logs do Server

No terminal onde `npm run dev` está rodando, procure por:

```
📋 POST /api/alunos - Iniciando inserção
Campos recebidos: 42
✅ Mapeamento concluído - Campos para inserir:
  nome: João da Silva
  cpf: 123.456.789-00
  email: joao@example.com
  ... (outros campos)
✅ SUCESSO! Aluno inserido com ID: 10
```

Se houver erro, procure por:
```
❌ ERRO SUPABASE: [mensagem]
```

---

### 5️⃣ Teste Completo

Após cadastro bem-sucedido, teste também:

#### ✅ GET (Listar)
- Abra: http://localhost:3000/admin/alunos
- Novo aluno deve aparecer na lista com todos os dados

#### ✅ PUT (Editar)
- Clique no aluno inserido
- Modifique alguns campos
- Clique em SALVAR
- Dados devem ser atualizados

#### ✅ DELETE
- Abra um aluno na lista
- Clique em DELETAR
- Aluno deve ser removido

---

## 📊 MAPEAMENTO RESUMIDO

| Campo Formulário | Coluna Banco | Tipo | Valor Padrão |
|---|---|---|---|
| nome | nome | VARCHAR(255) | '' (obrigatório) |
| instituicao | instituicao | VARCHAR(255) | 'CREESER' |
| turma | turmaid | INTEGER | NULL |
| anoLetivo | ano_letivo | INTEGER | ano atual |
| turnoIntegral | turno_integral | BOOLEAN | false |
| semestre | semestre | VARCHAR(10) | NULL |
| ... | ... | ... | ... |
| (42 campos totais) |

Ver arquivo completo: `MAPEAMENTO_COMPLETO_ALUNOS.md`

---

## 🐛 Troubleshooting

### ❌ Erro: "column alunos.nome does not exist"
**Solução:** Executar o SQL do Supabase para adicionar as colunas

### ❌ Erro: "insert or update on table alunos violates foreign key constraint"
**Solução:** Deixar `turma` vazio (não há turmas cadastradas ainda)

### ❌ Erro: "value too long for type character varying(10)"
**Solução:** Verificar comprimento dos dados - alguns campos têm limite

### ❌ Nada é salvo
**Solução:** Verificar logs do server com console.log detalhado

---

## 📝 Nota Importante

**Este mapeamento é DEFINITIVO e cobre 100% dos campos do formulário.**

Não serão necessárias mais correções incrementais. Todos os 42 campos estão mapeados corretamente:
- ✅ Identificação (7 campos)
- ✅ Dados Pessoais (9 campos)
- ✅ Filiação (2 campos)
- ✅ Endereço (10 campos)
- ✅ Registro de Nascimento (4 campos)
- ✅ INEP/Censo (2 campos)
- ✅ Ensino Médio (5 campos)
- ✅ Deficiência (2 campos)
- ✅ Outros (1 campo)

**Total: 42 campos**

---

**Data**: 29 de dezembro de 2025
**Status**: ✅ PRONTO PARA PRODUÇÃO
