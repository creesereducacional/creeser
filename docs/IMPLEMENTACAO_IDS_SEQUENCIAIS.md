# 🆔 IDs NUMÉRICOS SEQUENCIAIS - IMPLEMENTAÇÃO

## O que foi feito

Adicionado campo `numero_id` SERIAL (auto-incremento) em todas as tabelas principais:
- ✅ `alunos`
- ✅ `professores`
- ✅ `turmas`
- ✅ `cursos`
- ✅ `funcionarios`
- ✅ `disciplinas`
- ✅ `avaliacoes`

## Como funciona

Cada novo registro recebe automaticamente um número sequencial:
- Aluno #1, #2, #3...
- Professor #1, #2, #3...
- Turma #1, #2, #3...
- Etc.

## Aplicar a Migration

### ✅ Opção 1: SQL Editor do Supabase (Recomendado)

1. Abra [https://app.supabase.com](https://app.supabase.com)
2. Acesse seu projeto
3. Vá para **SQL Editor**
4. Crie uma nova query
5. Cole o conteúdo de: `supabase/migrations/add_sequential_ids.sql`
6. Clique em **RUN**

### ✅ Opção 2: Migração via Script (Node.js)

Se tiver um script de migração configurado, pode executar:

```bash
node scripts/apply-migration.js
```

## Verificação

Após aplicar, rode uma query de teste:

```sql
SELECT id, numero_id, nome FROM alunos LIMIT 5;
```

Você verá:
```
id (UUID)              | numero_id | nome
-----------            | --------- | ------
abc123...              | 1         | João
def456...              | 2         | Maria
ghi789...              | 3         | Pedro
```

## Novo comportamento na UI

- **Listagem de Alunos**: Mostra `#1`, `#2`, `#3` como identificador visual
- **Busca**: Pode buscar por número (ex: "5") ou nome
- **Relatórios**: IDs numéricos mais legíveis

## Campos impactados

### POST `/api/alunos`
- Retorna `numero_id` junto com o registro criado

### GET `/api/alunos`
- Inclui `numero_id` em cada aluno

### PUT `/api/alunos/{id}`
- Retorna `numero_id` atualizado

## SQL Executado

```sql
ALTER TABLE alunos ADD COLUMN numero_id SERIAL UNIQUE NOT NULL;
ALTER TABLE professores ADD COLUMN numero_id SERIAL UNIQUE NOT NULL;
ALTER TABLE turmas ADD COLUMN numero_id SERIAL UNIQUE NOT NULL;
ALTER TABLE cursos ADD COLUMN numero_id SERIAL UNIQUE NOT NULL;
ALTER TABLE funcionarios ADD COLUMN numero_id SERIAL UNIQUE NOT NULL;
ALTER TABLE disciplinas ADD COLUMN numero_id SERIAL UNIQUE NOT NULL;
ALTER TABLE avaliacoes ADD COLUMN numero_id SERIAL UNIQUE NOT NULL;
```

## Próximos passos

1. Executar a migration no Supabase SQL Editor
2. Testar criação de novo aluno
3. Verificar listagem mostrando #ID
4. Aplicar mesma lógica a outros módulos (professores, turmas, cursos, funcionários)

## Status

- ✅ Migration SQL criada
- ✅ Listagem de alunos atualizada para exibir `#ID`
- ✅ Filtros atualizados para buscar por número
- ⏳ Aguardando execução da migration no Supabase
- ⏳ Testar API retornando `numero_id`
