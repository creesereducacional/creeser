create extension if not exists pgcrypto;

create table if not exists public.contratos_assinaturas (
  id uuid primary key default gen_random_uuid(),
  aluno_id bigint not null references public.alunos(id) on delete cascade,
  instituicao_id uuid null references public.instituicoes(id) on delete set null,
  contrato_id uuid null references public.contratos_instituicao(id) on delete set null,
  provider text not null default 'assinafy',
  provider_document_id text null,
  provider_assignment_id text null,
  status text not null default 'pending_signature',
  signers jsonb not null default '[]'::jsonb,
  signing_urls jsonb not null default '[]'::jsonb,
  provider_payload jsonb not null default '{}'::jsonb,
  error_message text null,
  requested_at timestamptz not null default now(),
  last_synced_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contratos_assinaturas_aluno_id
  on public.contratos_assinaturas(aluno_id);

create index if not exists idx_contratos_assinaturas_status
  on public.contratos_assinaturas(status);

create index if not exists idx_contratos_assinaturas_provider_document_id
  on public.contratos_assinaturas(provider_document_id);
