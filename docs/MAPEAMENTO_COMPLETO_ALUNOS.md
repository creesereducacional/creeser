# 📋 MAPEAMENTO COMPLETO - FORMULÁRIO ALUNOS

## ✅ CAMPOS DO FORMULÁRIO → COLUNAS DO BANCO

| # | Campo Formulário (camelCase) | Coluna Banco (lowercase) | Tipo | Padrão | Obrigatório |
|---|---|---|---|---|---|
| 1 | nome | nome | VARCHAR(255) | '' | ✅ SIM |
| 2 | instituicao | instituicao | VARCHAR(255) | 'CREESER' | ❌ |
| 3 | turma | turmaid | INTEGER | NULL | ❌ |
| 4 | anoLetivo | ano_letivo | INTEGER | ano atual | ❌ |
| 5 | turnoIntegral | turno_integral | BOOLEAN | false | ❌ |
| 6 | semestre | semestre | VARCHAR(10) | NULL | ❌ |
| 7 | cpf | cpf | VARCHAR(14) | NULL | ❌ |
| 8 | estadoCivil | estadocivil | VARCHAR(50) | NULL | ❌ |
| 9 | sexo | sexo | VARCHAR(10) | NULL | ❌ |
| 10 | dtNascimento | data_nascimento | DATE | NULL | ❌ |
| 11 | rg | rg | VARCHAR(20) | NULL | ❌ |
| 12 | dataExpedicaoRG | data_expedicao_rg | DATE | NULL | ❌ |
| 13 | orgaoExpedidorRG | orgao_expedidor_rg | VARCHAR(100) | NULL | ❌ |
| 14 | telefoneCelular | telefone_celular | VARCHAR(20) | NULL | ❌ |
| 15 | pai | pai | VARCHAR(255) | NULL | ❌ |
| 16 | mae | mae | VARCHAR(255) | NULL | ❌ |
| 17 | cep | cep | VARCHAR(10) | NULL | ❌ |
| 18 | endereco | endereco | VARCHAR(255) | NULL | ❌ |
| 19 | numero | numeroendereco | VARCHAR(10) | NULL | ❌ |
| 20 | bairro | bairro | VARCHAR(100) | NULL | ❌ |
| 21 | cidade | cidade | VARCHAR(100) | NULL | ❌ |
| 22 | uf | estado | CHAR(2) | NULL | ❌ |
| 23 | complemento | complemento | VARCHAR(255) | NULL | ❌ |
| 24 | naturalidade | naturalidade | VARCHAR(100) | NULL | ❌ |
| 25 | ufNaturalidade | uf_naturalidade | CHAR(2) | NULL | ❌ |
| 26 | email | email | VARCHAR(100) | NULL | ❌ |
| 27 | termo | termo | VARCHAR(50) | NULL | ❌ |
| 28 | folha | folha | VARCHAR(50) | NULL | ❌ |
| 29 | livro | livro | VARCHAR(50) | NULL | ❌ |
| 30 | nomeCartorio | nome_cartorio | VARCHAR(255) | NULL | ❌ |
| 31 | tipoEscolaAnterior | tipo_escola_anterior | VARCHAR(100) | NULL | ❌ |
| 32 | paisOrigem | pais_origem | VARCHAR(100) | 'BRA - Brasil' | ❌ |
| 33 | estabelecimento | estabelecimento | VARCHAR(255) | NULL | ❌ |
| 34 | anoConclusao | ano_conclusao | INTEGER | NULL | ❌ |
| 35 | enderecoDEM | endereco_dem | VARCHAR(255) | NULL | ❌ |
| 36 | municipioDEM | municipio_dem | VARCHAR(100) | NULL | ❌ |
| 37 | ufDEM | uf_dem | CHAR(2) | NULL | ❌ |
| 38 | pessoaComDeficiencia | pessoa_com_deficiencia | BOOLEAN | false | ❌ |
| 39 | tipoDeficiencia | tipo_deficiencia | VARCHAR(255) | NULL | ❌ |
| 40 | nomeSocial | nome_social | BOOLEAN | false | ❌ |
| 41 | status | statusmatricula | VARCHAR(50) | 'ATIVO' | ❌ |
| 42 | foto | foto | TEXT | NULL | ❌ |

## 📊 RESUMO

- **Total de campos**: 42
- **Mapeamento criado em**: 29/12/2025
- **Status**: ✅ COMPLETO

## 🔑 PONTOS IMPORTANTES

1. **PostgreSQL converte colunas para lowercase** - usar `estadocivil` não `estadoCivil`
2. **Campos booleanos**: usar `true/false` diretamente
3. **Campos de data**: enviar em formato `YYYY-MM-DD`
4. **Integers**: usar `parseInt()` para garantir tipo correto
5. **Campos vazios**: enviar como `null` ou string vazia `''` conforme tipo
6. **Foreign keys**: 
   - `turmaid` → referencia `turmas(id)` (pode ser NULL)
   - Deixar `NULL` se turma não for selecionada
