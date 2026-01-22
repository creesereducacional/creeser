# 🚀 Executar Migration no Supabase - Passo a Passo

## Status da Tentativa Automática
❌ **RPC Script não funcionou** - Supabase Cloud não permite exec_sql() direto

✅ **Solução**: Executar manualmente via SQL Editor (2 minutos)

---

## 📝 Como Executar Manualmente

### Passo 1: Abrir Supabase Dashboard
1. Acesse: https://app.supabase.com
2. Faça login com suas credenciais
3. Selecione o projeto **CREESER Educacional**

### Passo 2: Acessar SQL Editor
1. No painel lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **+ New Query** (botão verde no topo)

### Passo 3: Copiar SQL da Migration

**Opção A - Copiar deste documento:**

```sql
-- Atualizar tabela alunos com novos campos do formulário de cadastro

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

**Opção B - Abrir arquivo local:**
- Arquivo: `supabase/migrations/add_alunos_fields.sql`
- Copie todo o conteúdo

### Passo 4: Colar no SQL Editor
1. No SQL Editor, clique na área branca de edição
2. Cole o SQL (Ctrl+V)

### Passo 5: Executar
1. Clique no botão **Run** (botão azul no canto inferior direito)
2. Aguarde a execução (deve levar menos de 30 segundos)

### Passo 6: Verificar Sucesso
✅ Se aparecer "Query executed successfully" - **PRONTO!**

---

## 🔍 Como Verificar se Funcionou

### No Supabase Dashboard:
1. Vá para **Database** → **Tables** → **alunos**
2. Clique na aba **Columns**
3. Procure por campos como:
   - ✅ cpf
   - ✅ email
   - ✅ data_nascimento
   - ✅ pai
   - ✅ mae

Se todos estão lá, **migration foi bem-sucedida!**

---

## 🚨 Se Houver Erro

### Erro: "Column already exists"
**Causa**: Coluna já foi adicionada em uma tentativa anterior
**Solução**: Ignore - o `IF NOT EXISTS` deve prevenir isso

### Erro: "UNIQUE constraint failed"
**Causa**: CPF já existe ou dados incompatíveis
**Solução**: 
1. Verifique dados existentes
2. Ou remova a constraint UNIQUE do CPF na migration

### Erro: "Permission denied"
**Causa**: Credenciais insuficientes
**Solução**: Use o token de super-admin do Supabase

---

## ✅ Próximos Passos Após Migration

1. **Teste a estrutura** via página de teste
   ```bash
   curl http://localhost:3000/teste-supabase
   ```

2. **Atualize a API** para usar novos campos
   - Arquivo: `pages/api/alunos/supabase.js`
   - Já foi criado, só precisa ativar

3. **Teste o formulário**
   ```
   http://localhost:3000/admin/alunos/novo
   ```

4. **Valide os dados** no Supabase

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas, me avise e eu:
- Faço print das telas do Supabase
- Crio um vídeo passo a passo
- Configuro manualmente para você

**Status**: Aguardando você executar a migration no Supabase! ⏳
