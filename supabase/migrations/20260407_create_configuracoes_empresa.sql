-- Tabela única de configurações da empresa (1 registro, upsert por id fixo)
-- Abas: Informações, Pedagógico, Financeiro, Biblioteca
-- Contratos e Instituições ficam em tabelas próprias

CREATE TABLE IF NOT EXISTS public.configuracoes_empresa (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Aba: Informações
  nome_empresa    VARCHAR(255),
  cnpj            VARCHAR(18),
  razao_social    VARCHAR(255),
  email           VARCHAR(150),
  telefone        VARCHAR(30),
  endereco        VARCHAR(255),
  cidade          VARCHAR(100),
  estado          CHAR(2),
  cep             VARCHAR(9),
  logo            TEXT,
  website         VARCHAR(255),
  descricao       TEXT,
  faculdade       VARCHAR(255),
  biografia       TEXT,
  ddd             VARCHAR(5),
  exibir_whatsapp_aluno   BOOLEAN DEFAULT false,
  contato_whatsapp        VARCHAR(30),

  -- Aba: Pedagógico (campos agrupados em JSONB para flexibilidade)
  pedagogico      JSONB NOT NULL DEFAULT '{
    "coordenador": "",
    "email": "",
    "telefone": "",
    "bloquearHistorico": false,
    "bloquearDeclaracao": false,
    "bloquearPortalContrato": false,
    "casasDecimais": 0,
    "idIESCenso": "",
    "atividadeComplementarDisciplina": false,
    "notasEscola": false,
    "notaseFaltas": false,
    "frequenciaV1": false,
    "frequenciaV2": false
  }'::jsonb,

  -- Aba: Financeiro
  financeiro      JSONB NOT NULL DEFAULT '{
    "banco": "",
    "agencia": "",
    "conta": "",
    "chave_pix": "",
    "desativarFinanceiro": false,
    "desativarJurosMulha": false,
    "bloquearAlunoInadimplente": false,
    "saldarVencimentoFinal": false,
    "ativarRPSManual": false,
    "ativarGerencianet": false,
    "clientId": "",
    "clientSecret": "",
    "identificadorConta": "",
    "aceitarCartaoGerencianet": false,
    "jurosGerencianet": 0.033,
    "multaGerencianet": 2,
    "ativarAsaas": false,
    "apiKeyAsaas": "",
    "percentualJurosAsaas": 0.033,
    "percentualMultaAsaas": 2,
    "aceitarPagamentosCartaoAsaas": false,
    "aceitarPagamentosPixAsaas": false,
    "chavePix": ""
  }'::jsonb,

  -- Aba: Biblioteca
  biblioteca      JSONB NOT NULL DEFAULT '{
    "gerente": "",
    "email": "",
    "acervo": 0,
    "bloquearEmprestimoPendencia": false,
    "qtdRenovacaoPorPessoa": "ilimitada",
    "qtdItensPorPessoa": "ilimitada",
    "qtdReservasPorPessoa": "3",
    "diasVencimentoReserva": "2"
  }'::jsonb,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_configuracoes_empresa_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_configuracoes_empresa_updated_at ON public.configuracoes_empresa;
CREATE TRIGGER trg_configuracoes_empresa_updated_at
  BEFORE UPDATE ON public.configuracoes_empresa
  FOR EACH ROW EXECUTE FUNCTION update_configuracoes_empresa_updated_at();

-- Seed: dados atuais do arquivo JSON
INSERT INTO public.configuracoes_empresa (
  id, nome_empresa, cnpj, razao_social, email, telefone,
  endereco, cidade, estado, cep, logo, website, descricao,
  faculdade, biografia, ddd, exibir_whatsapp_aluno, contato_whatsapp,
  pedagogico, financeiro, biblioteca
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Creeser Educacional',
  '00.000.000/0000-00',
  'Creeser Educacional LTDA',
  'contato@creeser.com',
  '(85) 3000-0000',
  'Rua Exemplo, 123',
  'Fortaleza',
  'CE',
  '60000-000',
  '',
  'https://creeser.com',
  'Plataforma de educação digital',
  '', '', '', false, '',
  '{"coordenador":"","email":"","telefone":"","bloquearHistorico":false,"bloquearDeclaracao":false,"bloquearPortalContrato":false,"casasDecimais":0,"idIESCenso":"","atividadeComplementarDisciplina":false,"notasEscola":false,"notaseFaltas":false,"frequenciaV1":false,"frequenciaV2":false}'::jsonb,
  '{"banco":"","agencia":"","conta":"","chave_pix":"","desativarFinanceiro":false,"desativarJurosMulha":false,"bloquearAlunoInadimplente":false,"saldarVencimentoFinal":false,"ativarRPSManual":false,"ativarGerencianet":false,"clientId":"","clientSecret":"","identificadorConta":"","aceitarCartaoGerencianet":false,"jurosGerencianet":0.033,"multaGerencianet":2,"ativarAsaas":false,"apiKeyAsaas":"","percentualJurosAsaas":0.033,"percentualMultaAsaas":2,"aceitarPagamentosCartaoAsaas":false,"aceitarPagamentosPixAsaas":false,"chavePix":""}'::jsonb,
  '{"gerente":"","email":"","acervo":0,"bloquearEmprestimoPendencia":false,"qtdRenovacaoPorPessoa":"ilimitada","qtdItensPorPessoa":"ilimitada","qtdReservasPorPessoa":"3","diasVencimentoReserva":"2"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
