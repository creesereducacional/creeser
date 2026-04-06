-- Ordens de Pagamento para Alunos
-- Suporta: pagamento único (ordem) ou carnê de múltiplas parcelas

create extension if not exists pgcrypto;

-- Tabela principal: Ordens de Pagamento e Carnês
create table if not exists public.financeiro_ordens_pagamento (
  id uuid primary key default gen_random_uuid(),
  aluno_id bigint not null references public.alunos(id) on delete restrict,
  tipo varchar(50) not null check (tipo in ('ordem_simples', 'carne')),
  descricao varchar(255) not null,
  referencia varchar(100),
  valor_total numeric(10,2) not null,
  percentual_desconto numeric(5,2) default 0,
  valor_desconto numeric(10,2) default 0,
  quantidade_parcelas integer default 1,
  observacoes text,
  status varchar(50) not null default 'ativo' check (status in ('ativo', 'cancelado', 'encerrado')),
  criado_por varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela: Parcelas/Boletos individuais
create table if not exists public.financeiro_parcelas (
  id uuid primary key default gen_random_uuid(),
  ordem_pagamento_id uuid not null references public.financeiro_ordens_pagamento(id) on delete cascade,
  aluno_id bigint not null references public.alunos(id) on delete restrict,
  numero_parcela integer not null,
  valor numeric(10,2) not null,
  data_vencimento date not null,
  status varchar(50) not null default 'pendente' check (status in ('pendente', 'pago', 'vencido', 'cancelado')),
  boleto_numero varchar(50),
  boleto_barcode varchar(100),
  boleto_url text,
  data_pagamento date,
  valor_pago numeric(10,2),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela: Histórico de Boletos (Asaas e EFI)
create table if not exists public.financeiro_boletos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references public.financeiro_parcelas(id) on delete cascade,
  gateway varchar(50) not null check (gateway in ('asaas', 'efi')),
  boleto_id_gateway varchar(255),
  boleto_numero varchar(50),
  boleto_barcode varchar(100),
  boleto_url text,
  status_gateway varchar(50),
  resposta_json jsonb,
  data_geracao timestamptz default now(),
  tentativas_falhas integer default 0,
  ultima_tentativa_em timestamptz,
  mensagem_erro text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para buscas rápidas
create index if not exists idx_financeiro_ordens_aluno_id
  on public.financeiro_ordens_pagamento(aluno_id);

create index if not exists idx_financeiro_ordens_tipo
  on public.financeiro_ordens_pagamento(tipo);

create index if not exists idx_financeiro_ordens_status
  on public.financeiro_ordens_pagamento(status);

create index if not exists idx_financeiro_ordens_created_at
  on public.financeiro_ordens_pagamento(created_at);

create index if not exists idx_financeiro_parcelas_ordem_id
  on public.financeiro_parcelas(ordem_pagamento_id);

create index if not exists idx_financeiro_parcelas_aluno_id
  on public.financeiro_parcelas(aluno_id);

create index if not exists idx_financeiro_parcelas_status
  on public.financeiro_parcelas(status);

create index if not exists idx_financeiro_parcelas_vencimento
  on public.financeiro_parcelas(data_vencimento);

create index if not exists idx_financeiro_boletos_parcela_id
  on public.financeiro_boletos(parcela_id);

create index if not exists idx_financeiro_boletos_gateway
  on public.financeiro_boletos(gateway);

create index if not exists idx_financeiro_boletos_status
  on public.financeiro_boletos(status_gateway);

-- Triggers para atualizar updated_at
create or replace function public.atualizar_updated_at_financeiro_ordens()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.atualizar_updated_at_financeiro_parcelas()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.atualizar_updated_at_financeiro_boletos()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_atualizar_updated_at_financeiro_ordens on public.financeiro_ordens_pagamento;
create trigger trigger_atualizar_updated_at_financeiro_ordens
before update on public.financeiro_ordens_pagamento
for each row
execute function public.atualizar_updated_at_financeiro_ordens();

drop trigger if exists trigger_atualizar_updated_at_financeiro_parcelas on public.financeiro_parcelas;
create trigger trigger_atualizar_updated_at_financeiro_parcelas
before update on public.financeiro_parcelas
for each row
execute function public.atualizar_updated_at_financeiro_parcelas();

drop trigger if exists trigger_atualizar_updated_at_financeiro_boletos on public.financeiro_boletos;
create trigger trigger_atualizar_updated_at_financeiro_boletos
before update on public.financeiro_boletos
for each row
execute function public.atualizar_updated_at_financeiro_boletos();
