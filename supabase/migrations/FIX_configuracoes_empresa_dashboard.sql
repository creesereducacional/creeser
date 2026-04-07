-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Adiciona colunas faltantes e garante linha id=1

ALTER TABLE public.configuracoes_empresa
  ADD COLUMN IF NOT EXISTS logo               TEXT,
  ADD COLUMN IF NOT EXISTS website            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS descricao          TEXT,
  ADD COLUMN IF NOT EXISTS faculdade          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS biografia          TEXT,
  ADD COLUMN IF NOT EXISTS ddd                VARCHAR(5),
  ADD COLUMN IF NOT EXISTS exibir_whatsapp_aluno  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contato_whatsapp   VARCHAR(30),
  ADD COLUMN IF NOT EXISTS pedagogico         JSONB NOT NULL DEFAULT '{"coordenador":"","email":"","telefone":"","bloquearHistorico":false,"bloquearDeclaracao":false,"bloquearPortalContrato":false,"casasDecimais":0,"idIESCenso":"","atividadeComplementarDisciplina":false,"notasEscola":false,"notaseFaltas":false,"frequenciaV1":false,"frequenciaV2":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS financeiro         JSONB NOT NULL DEFAULT '{"banco":"","agencia":"","conta":"","chave_pix":"","desativarFinanceiro":false,"desativarJurosMulha":false,"bloquearAlunoInadimplente":false,"saldarVencimentoFinal":false,"ativarRPSManual":false,"ativarGerencianet":false,"clientId":"","clientSecret":"","identificadorConta":"","aceitarCartaoGerencianet":false,"jurosGerencianet":0.033,"multaGerencianet":2,"ativarAsaas":false,"apiKeyAsaas":"","percentualJurosAsaas":0.033,"percentualMultaAsaas":2,"aceitarPagamentosCartaoAsaas":false,"aceitarPagamentosPixAsaas":false,"chavePix":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS biblioteca         JSONB NOT NULL DEFAULT '{"gerente":"","email":"","acervo":0,"bloquearEmprestimoPendencia":false,"qtdRenovacaoPorPessoa":"ilimitada","qtdItensPorPessoa":"ilimitada","qtdReservasPorPessoa":"3","diasVencimentoReserva":"2"}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT NOW();

-- Garante que exista pelo menos uma linha com id=1
INSERT INTO public.configuracoes_empresa (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
