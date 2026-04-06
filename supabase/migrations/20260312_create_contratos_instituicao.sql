-- Modelos de contrato por instituicao
-- Objetivo: permitir multiplos templates por instituicao com 1 modelo padrao

create extension if not exists pgcrypto;

create table if not exists public.contratos_instituicao (
  id uuid primary key default gen_random_uuid(),
  instituicao_id uuid not null references public.instituicoes(id) on delete cascade,
  nome text not null,
  descricao text,
  conteudo_html text not null default '',
  placeholders jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  padrao boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contratos_instituicao_instituicao_id
  on public.contratos_instituicao(instituicao_id);

create index if not exists idx_contratos_instituicao_ativo
  on public.contratos_instituicao(ativo);

create unique index if not exists uq_contratos_instituicao_padrao
  on public.contratos_instituicao(instituicao_id)
  where padrao = true;

alter table public.contratos_instituicao
  add column if not exists descricao text,
  add column if not exists conteudo_html text,
  add column if not exists placeholders jsonb,
  add column if not exists ativo boolean,
  add column if not exists padrao boolean,
  add column if not exists ordem integer,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.contratos_instituicao
set
  conteudo_html = coalesce(conteudo_html, ''),
  placeholders = coalesce(placeholders, '[]'::jsonb),
  ativo = coalesce(ativo, true),
  padrao = coalesce(padrao, false),
  ordem = coalesce(ordem, 0),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.contratos_instituicao
  alter column conteudo_html set not null,
  alter column conteudo_html set default '',
  alter column placeholders set not null,
  alter column placeholders set default '[]'::jsonb,
  alter column ativo set not null,
  alter column ativo set default true,
  alter column padrao set not null,
  alter column padrao set default false,
  alter column ordem set not null,
  alter column ordem set default 0,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();
