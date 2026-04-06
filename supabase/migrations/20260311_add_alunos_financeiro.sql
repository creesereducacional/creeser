-- Campos de dados financeiros para cadastro de alunos.
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS plano_financeiro VARCHAR(100),
ADD COLUMN IF NOT EXISTS valor_matricula NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_mensalidade NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS percentual_desconto NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS qtd_parcelas INTEGER,
ADD COLUMN IF NOT EXISTS dia_pagamento INTEGER,
ADD COLUMN IF NOT EXISTS qtd_meses_contrato INTEGER,
ADD COLUMN IF NOT EXISTS cnpj_boleto VARCHAR(18),
ADD COLUMN IF NOT EXISTS razao_social_boleto VARCHAR(255),
ADD COLUMN IF NOT EXISTS aluno_bolsista BOOLEAN,
ADD COLUMN IF NOT EXISTS percentual_bolsa NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS financiamento_estudantil VARCHAR(50),
ADD COLUMN IF NOT EXISTS percentual_financiamento NUMERIC(5,2);
