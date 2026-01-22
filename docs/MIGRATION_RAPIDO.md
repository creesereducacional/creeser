# ⚡ AÇÃO IMEDIATA: Migration Alunos

## 📌 Status Atual

```
❌ Automática: RPC não disponível no Supabase Cloud
✅ Manual: Simples, leva 2 minutos
⏳ Aguardando: Sua execução via Supabase Dashboard
```

---

## 🎯 O que Fazer AGORA

### 1️⃣ Acesse Supabase
```
https://app.supabase.com
```

### 2️⃣ Selecione Projeto
```
Projeto: CREESER Educacional
```

### 3️⃣ Vá para SQL Editor
```
Menu esquerdo → SQL Editor → New Query
```

### 4️⃣ Cole este SQL:

```sql
-- Adicionar campos pessoais
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estadoCivil VARCHAR(50);
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

-- Adicionar campos de endereço
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS complemento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_naturalidade CHAR(2);

-- Adicionar informações de ensino médio
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS estabelecimento VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_conclusao INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS endereco_dem VARCHAR(255);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS municipio_dem VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf_dem CHAR(2);

-- Adicionar deficiência
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pessoa_com_deficiencia BOOLEAN DEFAULT false;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_deficiencia VARCHAR(255);

-- Adicionar foto
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS foto TEXT;

-- Adicionar INEP
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_escola_anterior VARCHAR(100);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS pais_origem VARCHAR(100) DEFAULT 'BRA - Brasil';
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_social BOOLEAN DEFAULT false;
```

### 5️⃣ Clique RUN
```
Botão azul no canto inferior direito
```

### 6️⃣ Aguarde Confirmação
```
✅ Query executed successfully
```

---

## 📋 O que Será Adicionado

✅ 30+ novos campos à tabela `alunos`
✅ Alinhamento completo com formulário de cadastro
✅ Suporte para todos os dados do estudante

---

## 🚀 Depois da Migration

Quando confirmar que funcionou, eu:
1. Ativo a API Supabase
2. Testo o formulário completo
3. Prepara para receber dados

---

## 📄 Documentação

Leia para mais detalhes:
- [MIGRATION_ALUNOS_MANUAL.md](./MIGRATION_ALUNOS_MANUAL.md) - Guia completo
- [ANALISE_MODULO_ALUNOS.md](./ANALISE_MODULO_ALUNOS.md) - Análise técnica
- [supabase/migrations/add_alunos_fields.sql](./supabase/migrations/add_alunos_fields.sql) - SQL completo

---

## ✋ Quando Terminar

Me avise: "Migration executada com sucesso" ou "Erro: [mensagem]"

Estou pronto para os próximos passos! 🎉
