-- Cadastro de convênios financeiros
-- Campos: nome, percentual, instituicao, cnpj e observacoes

create extension if not exists pgcrypto;

create table if not exists public.financeiro_convenios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  percentual numeric(5,2) not null,
  instituicao_id uuid not null references public.instituicoes(id) on delete restrict,
  cnpj varchar(18),
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_financeiro_convenios_percentual
    check (percentual >= 0 and percentual <= 100)
);

create index if not exists idx_financeiro_convenios_instituicao_id
  on public.financeiro_convenios(instituicao_id);

create index if not exists idx_financeiro_convenios_nome
  on public.financeiro_convenios(nome);

create index if not exists idx_financeiro_convenios_cnpj
  on public.financeiro_convenios(cnpj);

create or replace function public.atualizar_updated_at_financeiro_convenios()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_atualizar_updated_at_financeiro_convenios on public.financeiro_convenios;
create trigger trigger_atualizar_updated_at_financeiro_convenios
before update on public.financeiro_convenios
for each row
execute function public.atualizar_updated_at_financeiro_convenios();
