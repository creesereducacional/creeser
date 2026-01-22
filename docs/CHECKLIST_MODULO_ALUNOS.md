# Checklist de Integração - Módulo Alunos

## Status: ⚠️ PARCIALMENTE PRONTO

### Estrutura do Banco de Dados

#### ✅ Campos Base da Tabela `alunos` (já existem):
- `id` (SERIAL PRIMARY KEY)
- `usuarioId` (INTEGER, referencia usuarios)
- `matricula` (VARCHAR)
- `cursoId` (INTEGER)
- `turmaId` (INTEGER)
- `statusMatricula` (VARCHAR)
- `dataMatricula` (DATE)
- `endereco` (VARCHAR)
- `cidade` (VARCHAR)
- `estado` (CHAR 2)
- `cep` (VARCHAR)
- `bairro` (VARCHAR)
- `numeroEndereco` (VARCHAR)
- `responsavelId` (INTEGER)

#### ❌ Campos do Formulário QUE FALTAM NA TABELA:
Precisa executar a migration: `supabase/migrations/add_alunos_fields.sql`

Novos campos a adicionar:
- Dados Pessoais:
  - `cpf` (VARCHAR 14) - UNIQUE
  - `estadoCivil` (VARCHAR)
  - `sexo` (VARCHAR)
  - `data_nascimento` (DATE)
  - `rg` (VARCHAR)
  - `data_expedicao_rg` (DATE)
  - `orgao_expedidor_rg` (VARCHAR)
  - `telefone_celular` (VARCHAR)
  - `email` (VARCHAR)
  - `nome_social` (BOOLEAN)

- Filiação:
  - `pai` (VARCHAR)
  - `mae` (VARCHAR)

- Administrativos:
  - `instituicao` (VARCHAR)
  - `ano_letivo` (INTEGER)
  - `turno_integral` (BOOLEAN)
  - `semestre` (VARCHAR)

- Registro de Nascimento:
  - `termo` (VARCHAR)
  - `folha` (VARCHAR)
  - `livro` (VARCHAR)
  - `nome_cartorio` (VARCHAR)

- Endereço Completo:
  - `complemento` (VARCHAR)
  - `naturalidade` (VARCHAR)
  - `uf_naturalidade` (CHAR 2)

- Ensino Médio:
  - `estabelecimento` (VARCHAR)
  - `ano_conclusao` (INTEGER)
  - `endereco_dem` (VARCHAR)
  - `municipio_dem` (VARCHAR)
  - `uf_dem` (CHAR 2)

- Deficiência:
  - `pessoa_com_deficiencia` (BOOLEAN)
  - `tipo_deficiencia` (VARCHAR)

- Outros:
  - `foto` (TEXT - base64 ou URL)
  - `tipo_escola_anterior` (VARCHAR)
  - `pais_origem` (VARCHAR)

### API

#### ✅ Atualmente Funciona:
- POST `/api/alunos` - Salva em arquivo JSON local

#### ⚠️ Novo Endpoint Criado:
- POST `/api/alunos/supabase` - Salva no Supabase (REQUER MIGRATION)

#### ❌ Próximos Passos:
1. ✅ Analisar formulário
2. ⏳ Executar migration SQL no Supabase
3. ⏳ Atualizar `/api/alunos/index.js` para usar Supabase
4. ⏳ Testar cadastro de novo aluno

### Próximos Passos

```bash
# 1. Executar migration no Supabase
# Copiar conteúdo de: supabase/migrations/add_alunos_fields.sql
# Colar no Supabase SQL Editor e executar

# 2. Depois confirmar aqui para atualizar a API
```

## Formulário de Cadastro

- **URL**: http://localhost:3000/admin/alunos/novo
- **Método**: POST
- **Endpoint**: /api/alunos
- **Status do Formulário**: ✅ COMPLETO

### Campos Preenchíveis:
✅ Todos os 40+ campos do formulário estão implementados

### Campos que Precisam de Validação:
- CPF (máscara e validação)
- CEP (busca ViaCEP)
- Data de nascimento
- Email

---

## Resumo

Para o formulário ficar **100% PRONTO**:

1. ✅ **Formulário**: Já está completo e funcional
2. ⏳ **Banco de Dados**: Precisa adicionar 30+ novos campos
3. ⏳ **API**: Precisa integração com Supabase
4. ⏳ **Testes**: Testar cadastro com novo aluno

**Recomendação**: Executar a migration SQL agora para adicionar os campos ao Supabase!
