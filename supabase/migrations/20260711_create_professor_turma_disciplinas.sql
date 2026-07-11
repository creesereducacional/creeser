-- Migration: Criar tabela professor_turma_disciplinas
-- Data: 2026-07-11
-- Descrição: Cria o vínculo entre Professor, Turma e Disciplina mantendo conformidade com tipos reais do banco e regras multi-instituição (multi-tenant).

CREATE TABLE IF NOT EXISTS public.professor_turma_disciplinas (
  id SERIAL PRIMARY KEY,
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  professor_id INTEGER REFERENCES public.professores(id) ON DELETE CASCADE,
  turma_id INTEGER REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id INTEGER REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restrição Única: instituicao_id + professor_id + turma_id + disciplina_id
ALTER TABLE public.professor_turma_disciplinas
  DROP CONSTRAINT IF EXISTS uniq_professor_turma_disciplina_inst;

ALTER TABLE public.professor_turma_disciplinas
  ADD CONSTRAINT uniq_professor_turma_disciplina_inst
  UNIQUE (instituicao_id, professor_id, turma_id, disciplina_id);

-- Índices para melhor performance de pesquisa e filtros
CREATE INDEX IF NOT EXISTS idx_prof_turma_disc_professor_id ON public.professor_turma_disciplinas(professor_id);
CREATE INDEX IF NOT EXISTS idx_prof_turma_disc_turma_id ON public.professor_turma_disciplinas(turma_id);
CREATE INDEX IF NOT EXISTS idx_prof_turma_disc_instituicao_id ON public.professor_turma_disciplinas(instituicao_id);

-- Desabilitar RLS (Row Level Security) se herdado do schema padrão (conforme as políticas da base de dados do projeto)
ALTER TABLE public.professor_turma_disciplinas DISABLE ROW LEVEL SECURITY;

-- Trigger para atualizar timestamp de modificação (updated_at) automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_updated_at_professor_turma_disciplinas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_professor_turma_disciplinas ON public.professor_turma_disciplinas;

CREATE TRIGGER trigger_atualizar_updated_at_professor_turma_disciplinas
BEFORE UPDATE ON public.professor_turma_disciplinas
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_updated_at_professor_turma_disciplinas();
