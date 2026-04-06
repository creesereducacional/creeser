-- Campos de informacoes adicionais para ficha de cadastro do aluno.
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS titulo_eleitoral VARCHAR(50),
ADD COLUMN IF NOT EXISTS zona_eleitoral INTEGER,
ADD COLUMN IF NOT EXISTS secao_eleitoral INTEGER,
ADD COLUMN IF NOT EXISTS carteira_reservista VARCHAR(50),
ADD COLUMN IF NOT EXISTS registro_conselho VARCHAR(100),
ADD COLUMN IF NOT EXISTS religiao VARCHAR(100),
ADD COLUMN IF NOT EXISTS laudo_cid VARCHAR(50),
ADD COLUMN IF NOT EXISTS observacoes_adicionais TEXT,
ADD COLUMN IF NOT EXISTS indicacao_quem VARCHAR(255);
