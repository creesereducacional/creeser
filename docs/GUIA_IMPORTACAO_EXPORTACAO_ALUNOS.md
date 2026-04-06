# Guia de Importação/Exportação de Alunos (CSV)

## 📊 Visão Geral

Este guia explica como exportar dados de alunos do Supabase para CSV e como importar dados de um arquivo CSV.

---

## 📥 EXPORTAR ALUNOS (Supabase → CSV)

### Comando
```bash
node scripts/exportar-alunos-csv.js [nome-arquivo.csv]
```

### Exemplos
```bash
# Exporta com nome automático (alunos-export-YYYY-MM-DD.csv)
node scripts/exportar-alunos-csv.js

# Exporta com nome específico
node scripts/exportar-alunos-csv.js alunos-2025.csv

# Exporta para local específico
node scripts/exportar-alunos-csv.js c:/backups/alunos-backup.csv
```

### O que é exportado?

O script exporta **todos os campos** de cada aluno:
- **Identificação**: id, nome, email, cpf, telefone_celular, apelido
- **Dados Pessoais**: data_nascimento, rg, sexo, estadocivil, pai, mae
- **Acadêmicos**: turmaid, cursoid, statusmatricula, datamatricula, ano_letivo
- **Financeiros**: valor_mensalidade, valor_matricula, qtd_parcelas, dia_pagamento, plano_financeiro
- **Bolsas/Financiamento**: aluno_bolsista, percentual_bolsa, financiamento_estudantil, percentual_financiamento
- **Timestamps**: created_at, updated_at

### Saída
O script irá:
1. ✅ Mostrar progresso de carregamento (com paginação automática)
2. ✅ Exibir amostra dos primeiros 3 alunos
3. ✅ Salvar arquivo CSV com todos os dados
4. ✅ Mostrar caminho completo do arquivo gerado

### Exemplo de Saída
```
📥 Iniciando exportação de alunos...

✅ Página 1: 500 alunos carregados (Total: 500)
✅ Página 2: 250 alunos carregados (Total: 750)

✅ Exportação concluída com sucesso!

📊 RESUMO:
   • Total de alunos: 750
   • Campos por aluno: 29
   • Arquivo salvo: C:\Users\...\alunos-export-2025-01-15.csv

📋 AMOSTRA DOS PRIMEIROS 3 ALUNOS:
---
Aluno 1:
   • ID: 1
   • Nome: João Silva
   • Email: joao@email.com
   • CPF: 123.456.789-10
   • Turma ID: 1
   • Curso ID: 1
   • Status: ATIVO
   • Valor Mensalidade: 850.00
...
```

---

## 📤 IMPORTAR ALUNOS (CSV → Supabase)

### Comando
```bash
node scripts/importar-alunos-csv.js <arquivo.csv> [opções]
```

### Opções
- `--dry-run` - Simula importação sem alterar banco (recomendado antes de importar de verdade)
- `--skip-duplicates` - Pula alunos com CPF duplicado (já existente no banco)

### Exemplos
```bash
# Modo simulação (recomendado!)
node scripts/importar-alunos-csv.js alunos-novo.csv --dry-run

# Importar real
node scripts/importar-alunos-csv.js alunos-novo.csv

# Importar ignorando CPFs duplicados
node scripts/importar-alunos-csv.js alunos-novo.csv --skip-duplicates

# Tudo junto: simular + skip + arquivo específico
node scripts/importar-alunos-csv.js alunos-novo.csv --skip-duplicates --dry-run
```

### Fluxo Recomendado
1. **Preparar arquivo CSV** com dados do cliente
2. **Validar com --dry-run** antes de importar
3. **Revisar preview** dos dados que serão importados
4. **Executar importação real** sem o --dry-run

### Validações Automáticas
O script verifica:
- ✅ Arquivo existe
- ✅ Headers corretos
- ✅ Número de campos por linha
- ✅ Nome do aluno (obrigatório)
- ✅ CPF duplicado no arquivo
- ✅ Dados de data válidos
- ✅ Tipos de dados corretos (conversão automática)

### Tratamento de Campos Vazios
- Campos vazios são convertidos para `NULL` no banco
- O Supabase usará valores padrão quando disponível
- Nenhum erro por campo vazio

### Conversão de Tipos
O script converte automaticamente:
- `"true"` → booleano `true` (campos: aluno_bolsista)
- `"123"` → número integer (campos: id, turmaid, cursoid, ano_letivo, etc.)
- `"850.50"` → número decimal (campos: valor_mensalidade, percentual_bolsa, etc.)
- `"2025-02-01"` → data (campos: data_nascimento, datamatricula, etc.)

---

## 📋 TEMPLATE CSV

### Arquivo Disponível
`import-templates/template-alunos.csv` - Contém 3 exemplos de alunos

### Estrutura do CSV

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| id | integer | Não | 1 |
| nome | string | **SIM** | João Silva |
| email | string | Não | joao@email.com |
| cpf | string | Não | 123.456.789-10 |
| telefone_celular | string | Não | 11999999999 |
| data_nascimento | date | Não | 2010-05-15 |
| rg | string | Não | 12.345.678-9 |
| sexo | string | Não | M ou F |
| estadocivil | string | Não | Solteiro, Casado, Divorciado, Viúvo |
| pai | string | Não | José Silva |
| mae | string | Não | Maria Silva |
| turmaid | integer | Não | 1 |
| cursoid | integer | Não | 1 |
| statusmatricula | string | Não | ATIVO, INATIVO, CANCELADO |
| datamatricula | date | Não | 2025-02-01 |
| ano_letivo | integer | Não | 2025 |
| apelido | string | Não | João |
| valor_mensalidade | decimal | Não | 850.00 |
| valor_matricula | decimal | Não | 1500.00 |
| qtd_parcelas | integer | Não | 12 |
| dia_pagamento | integer | Não | 10 |
| plano_financeiro | string | Não | Mensal, Semestral, Anual |
| aluno_bolsista | boolean | Não | true, false |
| percentual_bolsa | decimal | Não | 20.00 |
| financiamento_estudantil | string | Não | Nome do programa |
| percentual_financiamento | decimal | Não | 50.00 |
| created_at | timestamp | Não | 2025-02-01T10:30:00Z |
| updated_at | timestamp | Não | 2025-02-01T10:30:00Z |

### Regras Principais
- **Nome** é o único campo obrigatório
- **Campos vazios** são permitidos (NULL no banco)
- **CPF** deve ser único (não pode duplicar no arquivo = erros)
- **Email** pode ser deixado em branco
- **IDs de turma/curso** devem existir no banco ou deixar em branco
- **Datas** em formato ISO (YYYY-MM-DD)
- **Valores monetários** com ponto como separador decimal

### Exemplo Mínimo (só campos obrigatórios)
```csv
id,nome,email,cpf,telefone_celular,data_nascimento,rg,sexo,estadocivil,pai,mae,turmaid,cursoid,statusmatricula,datamatricula,ano_letivo,apelido,valor_mensalidade,valor_matricula,qtd_parcelas,dia_pagamento,plano_financeiro,aluno_bolsista,percentual_bolsa,financiamento_estudantil,percentual_financiamento,created_at,updated_at
,João Silva,,,,,,,,,,,,,,,,,,,,,,,,,
,Maria Santos,,,,,,,,,,,,,,,,,,,,,,,,,
,Carlos Oliveira,,,,,,,,,,,,,,,,,,,,,,,,,
```

### Preparando seus dados

**No Excel/Google Sheets:**
1. Coloque os headers conforme template
2. Preencha os dados dos alunos
3. Salve como CSV (UTF-8)
4. Use o script para importar

**Dica:** Você pode deixar colunas inteiras vazias se não tiver dados

---

## 🔧 TROUBLESHOOTING

### "❌ Erro: Variáveis SUPABASE não configuradas"
**Solução:** Verifique se `.env.local` existe com:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### "❌ Arquivo não encontrado"
**Solução:** Use caminho completo:
```bash
node scripts/importar-alunos-csv.js "C:\Users\Username\Downloads\alunos.csv"
```

### "Número de campos incorreto"
**Solução:** Verifique se número de colunas é consistente em todas linhas

### "TypeError: fetch failed"
**Solução:** Sem conectividade internet - o script precisará de conexão com Supabase

### Dados não aparecem após importar
**Solução:** 
- Verifique status de retorno do script
- Confirme que email/CPF não duplicado
- Teste com --dry-run primeiro

---

## 📈 EXEMPLOS DE USO COMPLETO

### Cenário 1: Backup dos dados atuais
```bash
# Exportar todos os alunos para backup
node scripts/exportar-alunos-csv.js alunos-backup-janeiro-2025.csv

# Resultado: Arquivo com todos os alunos da instituição
```

### Cenário 2: Importar nova turma
```bash
# 1. Preparar arquivo novo-alunos.csv com dados da turma

# 2. Simular importação antes
node scripts/importar-alunos-csv.js novo-alunos.csv --dry-run

# 3. Verificar preview dos dados

# 4. Importar de verdade
node scripts/importar-alunos-csv.js novo-alunos.csv

# 5. Validar no app: http://localhost:3000/admin/alunos
```

### Cenário 3: Sincronização de dados (atualização)
```bash
# Este script NÃO atualiza, só insere novos
# Para atualizar dados existentes, use o admin/alunos no app

# Se precisar atualizar:
# - Edite diretamente no app (http://localhost:3000/admin/alunos)
# - Ou crie um novo script de UPDATE (entre em contato)
```

---

## 📞 SUPORTE

Para problemas com importação/exportação:
1. Verifique as validações acima
2. Confira o formato do CSV
3. Teste com --dry-run antes
4. Consulte os logs de erro mostrados pelo script
