# 🚀 ADICIONAR COLUNA NOME À TABELA ALUNOS

## ⚠️ PROBLEMA IDENTIFICADO
O formulário de cadastro de alunos estava falhando ao tentar salvar porque:
- A coluna `nome` (campo básico do formulário) **não existia** na tabela `alunos`
- A foreign key de `turmaid` estava causando constraint violation

## ✅ SOLUÇÃO

### Passo 1: Executar SQL no Supabase

1. Acesse: https://app.supabase.com
2. Selecione o projeto `creeser-educacional`
3. Vá para **SQL Editor** → **New Query**
4. **Cole este comando:**

```sql
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT '';
```

5. Clique em **Run** (ícone ▶️)
6. Deve retornar "Success. No rows returned"

### Passo 2: Verificar Coluna (Opcional)

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name='alunos' AND column_name='nome';
```

Deve retornar:
```
column_name | data_type | is_nullable
------------|-----------|------------
nome        | character varying | NO
```

### Passo 3: Testar o Formulário

1. Abra: http://localhost:3000/admin/alunos/novo
2. Preencha os campos (principalmente **Nome**)
3. Clique em **Salvar**
4. Deve criar o registro com sucesso! ✅

## 📝 MUDANÇAS NO CÓDIGO

**Arquivos atualizados:**
- `pages/api/alunos/index.js` - Adicionado mapeamento de `nome` no POST
- `pages/api/alunos/[id].js` - Adicionado mapeamento de `nome` no PUT
- `supabase/migrations/add_alunos_fields.sql` - Adicionado `nome` à migration

**Fixos:**
- ✅ `turmaid` agora fica como `null` para não violar foreign key
- ✅ GET endpoint agora retorna todas as colunas corretamente

---

## 🧪 TESTE RÁPIDO

Após executar o SQL, teste com este curl (ou use o formulário):

```bash
curl -X POST http://localhost:3000/api/alunos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João da Silva",
    "cpf": "123.456.789-00",
    "email": "joao@example.com",
    "endereco": "Rua Teste, 123"
  }'
```

Deve retornar um objeto com `id`, `nome`, `cpf`, etc. ✅

---

**Data:** 29 de dezembro de 2025
**Status:** Pronto para implementação
