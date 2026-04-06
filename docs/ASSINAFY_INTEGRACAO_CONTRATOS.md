# Integracao Assinafy - Contratos de Alunos

## Variaveis de ambiente

Defina no backend (arquivo `.env.local` ou ambiente de deploy):

- `ASSINAFY_API_KEY`: chave de API da Assinafy.
- `ASSINAFY_ACCOUNT_ID`: ID da conta workspace na Assinafy.
- `ASSINAFY_BASE_URL` (opcional): por padrao usa `https://api.assinafy.com.br/v1`.

Exemplo:

```env
ASSINAFY_API_KEY=seu_token_api_key
ASSINAFY_ACCOUNT_ID=seu_account_id
ASSINAFY_BASE_URL=https://api.assinafy.com.br/v1
```

## Fluxo implementado

1. No modulo de alunos, o botao `🔒` chama `POST /api/contratos/aluno/:id/assinar-digital`.
2. A API gera o contrato do aluno (ja preenchido com placeholders da instituicao).
3. O contrato e convertido para PDF e enviado para a Assinafy.
4. A API garante os signatarios (aluno e, quando existir, responsavel).
5. A API cria assignment no metodo `virtual`.
6. Os `signing_urls` retornados sao abertos em nova aba no navegador.
7. O processo fica salvo na tabela `contratos_assinaturas` para acompanhamento.

## Acompanhamento de status

- O botao `👁️` na listagem de alunos chama `GET /api/contratos/aluno/:id/assinatura-status`.
- Essa rota retorna o ultimo registro salvo no banco para o aluno.
- Se as credenciais estiverem configuradas, a rota sincroniza o status atual do documento direto na Assinafy.

## Migration necessaria

Aplicar a migration:

- `supabase/migrations/20260312_create_contratos_assinaturas.sql`

## Requisitos de cadastro para funcionar

- O aluno precisa ter instituicao valida e contrato padrao cadastrado nessa instituicao.
- Todos os signatarios precisam ter e-mail cadastrado (aluno e responsavel quando vinculado).

## Rotas criadas

- `POST /api/contratos/aluno/:id/assinar-digital`
- `GET /api/contratos/aluno/:id` (ja existente, usado como base dos placeholders)
- `GET /api/contratos/aluno/:id/assinatura-status`

## Observacao tecnica

A versao atual converte o HTML do contrato para PDF de forma server-side para envio na Assinafy. Em uma fase posterior, pode ser substituida por renderizacao PDF mais fiel ao layout visual.
