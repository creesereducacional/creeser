# ✅ VERIFICAÇÃO: Alinhamento Formulário ↔ Supabase

## 📊 Status Atual

| Componente | Status | Descrição |
|-----------|--------|-----------|
| **Migration SQL** | ✅ Preparada | 30+ campos prontos para adicionar |
| **Formulário (novo.js)** | ✅ COMPLETO | 40+ campos implementados |
| **API (index.js)** | ✅ ATUALIZADA | Integrada com Supabase |
| **API ([id].js)** | ✅ ATUALIZADA | GET, PUT, DELETE com Supabase |
| **Servidor** | ✅ RODANDO | http://localhost:3000 ativo |

---

## 🔗 Mapeamento Formulário → Supabase

### Campos Já Existentes ✅

```
Formulário          →    Supabase (alunos)
────────────────────────────────────────
instituicao         →    instituicao
turma               →    turmaId (referência)
status              →    statusMatricula
endereco            →    endereco
numero              →    numeroEndereco
bairro              →    bairro
cidade              →    cidade
uf                  →    estado
cep                 →    cep
```

### Campos Novos (Migration Pendente) ⏳

```
Formulário              →    Supabase (novo)
────────────────────────────────────────────
cpf                     →    cpf (UNIQUE)
estadoCivil             →    estadoCivil
sexo                    →    sexo
dtNascimento            →    data_nascimento
rg                      →    rg
dataExpedicaoRG         →    data_expedicao_rg
orgaoExpedidorRG        →    orgao_expedidor_rg
telefoneCelular         →    telefone_celular
email                   →    email
pai                     →    pai
mae                     →    mae
anoLetivo               →    ano_letivo
turnoIntegral           →    turno_integral
semestre                →    semestre
termo                   →    termo
folha                   →    folha
livro                   →    livro
nomeCartorio            →    nome_cartorio
complemento             →    complemento
naturalidade            →    naturalidade
ufNaturalidade          →    uf_naturalidade
estabelecimento         →    estabelecimento
anoConclusao            →    ano_conclusao
enderecoDEM             →    endereco_dem
municipioDEM            →    municipio_dem
ufDEM                   →    uf_dem
pessoaComDeficiencia    →    pessoa_com_deficiencia
tipoDeficiencia         →    tipo_deficiencia
foto                    →    foto
tipoEscolaAnterior      →    tipo_escola_anterior
paisOrigem              →    pais_origem
nomeSocial              →    nome_social
```

---

## 🧪 Como Testar

### Opção 1: Via Formulário Web

```
1. Acesse: http://localhost:3000/admin/alunos/novo
2. Preencha os dados básicos:
   - Nome: Teste Silva
   - CPF: 12345678900
   - Email: teste@example.com
   - Sexo: Masculino
   - Data Nascimento: 01/01/2000
   - CEP: 01310100 (vai buscar endereço via ViaCEP)
   - Cidade: São Paulo
   - Estado: SP
3. Clique em "Salvar"
4. Verifique mensagem de sucesso
```

### Opção 2: Via cURL (Terminal)

```bash
curl -X POST http://localhost:3000/api/alunos \
  -H "Content-Type: application/json" \
  -d '{
    "instituicao": "CREESER",
    "nome": "Teste Silva",
    "cpf": "12345678900",
    "email": "teste@example.com",
    "sexo": "Masculino",
    "dtNascimento": "2000-01-01",
    "telefoneCelular": "11999999999",
    "endereco": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "uf": "SP",
    "cep": "01310100",
    "status": "ATIVO"
  }'
```

### Opção 3: Via Postman

```
POST: http://localhost:3000/api/alunos
Headers: Content-Type: application/json
Body (JSON):
{
  "instituicao": "CREESER",
  "nome": "Teste Silva",
  "cpf": "12345678900",
  "email": "teste@example.com",
  "sexo": "Masculino",
  "dtNascimento": "2000-01-01",
  "telefoneCelular": "11999999999",
  "endereco": "Avenida Paulista",
  "numero": "1000",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "uf": "SP",
  "cep": "01310100",
  "status": "ATIVO"
}
```

---

## ❓ Possíveis Problemas e Soluções

### Problema 1: "Campo não existe no Supabase"
```
Erro: "column 'cpf' of relation 'alunos' does not exist"
Solução: Executar migration SQL no Supabase (30+ comandos ALTER TABLE)
```

### Problema 2: "Erro de autenticação"
```
Erro: "Anonymous user cannot access"
Solução: Verificar variáveis de ambiente:
  - NEXT_PUBLIC_SUPABASE_URL ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅
```

### Problema 3: "CPF duplicado"
```
Erro: "duplicate key value violates unique constraint 'alunos_cpf_key'"
Solução: CPF já registrado. Usar outro CPF para teste.
```

---

## 📋 Próximas Etapas

### ⏳ CRÍTICA (Hoje):
- [ ] Executar Migration SQL no Supabase (adiciona 30+ campos)
- [ ] Testar cadastro de novo aluno
- [ ] Verificar dados no Supabase Dashboard

### ✅ COMPLETO (Já Feito):
- [x] Formulário implementado com 40+ campos
- [x] API integrada com Supabase
- [x] Mapeamento de campos configurado
- [x] Servidor rodando

### 🚀 FUTURO:
- [ ] Configurar validações (CPF, email, datas)
- [ ] Implementar upload de foto para Storage
- [ ] Adicionar paginação na listagem
- [ ] Implementar filtros na listagem
- [ ] Configurar RLS (Row Level Security)

---

## 🎯 Resumo

```
PRONTO PARA RECEBER REGISTROS? 

⚠️  PARCIALMENTE:
  ✅ Formulário: Completo
  ✅ API: Integrada com Supabase
  ✅ Servidor: Rodando
  ❌ Banco: Aguardando migration SQL (30+ campos)

PRÓXIMA AÇÃO:
  ▶️  Executar migration SQL no Supabase
  ▶️  Testar formulário
  ▶️  Confirmar dados salvos
```

---

## 📞 Teste Rápido

Para confirmar que está tudo funcionando:

**URL do Formulário**: http://localhost:3000/admin/alunos/novo
**API Teste**: http://localhost:3000/api/alunos (GET)

Me avise quando:
1. ✅ Migration SQL executada
2. ✅ Aluno registrado via formulário
3. ✅ Dados aparecem no Supabase
