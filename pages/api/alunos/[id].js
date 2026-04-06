import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

let hasUfRgColumnCache = null;
let hasApelidoColumnCache = null;
let hasFinanceiroColumnsCache = null;
let hasInformacoesAdicionaisColumnsCache = null;

const isMissingColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('does not exist') || message.includes('column');
};

const supportsUfRgColumn = async () => {
  if (hasUfRgColumnCache !== null) {
    return hasUfRgColumnCache;
  }

  const { error } = await supabase
    .from('alunos')
    .select('uf_rg')
    .limit(1);

  if (!error) {
    hasUfRgColumnCache = true;
    return true;
  }

  if (isMissingColumnError(error)) {
    hasUfRgColumnCache = false;
    return false;
  }

  throw error;
};

const supportsApelidoColumn = async () => {
  if (hasApelidoColumnCache !== null) {
    return hasApelidoColumnCache;
  }

  const { error } = await supabase
    .from('alunos')
    .select('apelido')
    .limit(1);

  if (!error) {
    hasApelidoColumnCache = true;
    return true;
  }

  if (isMissingColumnError(error)) {
    hasApelidoColumnCache = false;
    return false;
  }

  throw error;
};

const supportsFinanceiroColumns = async () => {
  if (hasFinanceiroColumnsCache !== null) {
    return hasFinanceiroColumnsCache;
  }

  const { error } = await supabase
    .from('alunos')
    .select('plano_financeiro')
    .limit(1);

  if (!error) {
    hasFinanceiroColumnsCache = true;
    return true;
  }

  if (isMissingColumnError(error)) {
    hasFinanceiroColumnsCache = false;
    return false;
  }

  throw error;
};

const supportsInformacoesAdicionaisColumns = async () => {
  if (hasInformacoesAdicionaisColumnsCache !== null) {
    return hasInformacoesAdicionaisColumnsCache;
  }

  const { error } = await supabase
    .from('alunos')
    .select('titulo_eleitoral')
    .limit(1);

  if (!error) {
    hasInformacoesAdicionaisColumnsCache = true;
    return true;
  }

  if (isMissingColumnError(error)) {
    hasInformacoesAdicionaisColumnsCache = false;
    return false;
  }

  throw error;
};

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      // Recuperar um aluno específico
      // ⚠️ PostgreSQL converte para lowercase automaticamente
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Aluno não encontrado' });
      }

      res.status(200).json(data);
    } 
    else if (req.method === 'PUT') {
      // ========================================
      // ATUALIZAR ALUNO - MAPEAMENTO COMPLETO
      // ========================================
      const formData = req.body;

      // ✅ Função helper para converter para UPPERCASE (exceto campos específicos)
      const toUppercase = (value) => {
        if (!value) return value;
        return typeof value === 'string' ? value.toUpperCase() : value;
      };

      const parseDecimal = (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;

        let normalized = String(value).trim().replace(/[^\d,.-]/g, '');
        if (!normalized) return null;

        if (normalized.includes(',') && normalized.includes('.')) {
          normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else if (normalized.includes(',')) {
          normalized = normalized.replace(',', '.');
        }

        const parsed = Number.parseFloat(normalized);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const parseInteger = (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isInteger(value) ? value : Math.trunc(value);

        const onlyDigits = String(value).replace(/\D/g, '');
        if (!onlyDigits) return null;

        const parsed = Number.parseInt(onlyDigits, 10);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const parseBooleanFromOption = (value) => {
        if (value === true || value === false) return value;
        const normalized = String(value || '').trim().toUpperCase();
        if (normalized === 'SIM') return true;
        if (normalized === 'NAO' || normalized === 'NÃO') return false;
        return null;
      };

      // ✅ MAPEAMENTO COMPLETO E DEFINITIVO (42 CAMPOS)
      // Referência: MAPEAMENTO_COMPLETO_ALUNOS.md
      const alunoData = {
        // ===== IDENTIFICAÇÃO =====
        nome: toUppercase(formData.nome) || '',
        instituicao: toUppercase(formData.instituicao) || 'CREESER',
        statusmatricula: toUppercase(formData.status) || 'ATIVO',
        cursoid: formData.curso ? parseInt(formData.curso) : null,
        turmaid: formData.turma ? parseInt(formData.turma) : null,
        ano_letivo: formData.anoLetivo ? parseInt(formData.anoLetivo) : null,
        turno_integral: Boolean(formData.turnoIntegral),
        semestre: formData.semestre || null,

        // ===== DADOS PESSOAIS =====
        cpf: formData.cpf || null,
        estadocivil: toUppercase(formData.estadoCivil) || null,
        sexo: toUppercase(formData.sexo) || null,
        data_nascimento: formData.dtNascimento || null,
        rg: toUppercase(formData.rg) || null,
        data_expedicao_rg: formData.dataExpedicaoRG || null,
        orgao_expedidor_rg: toUppercase(formData.orgaoExpedidorRG) || null,
        uf_rg: toUppercase(formData.ufRG) || null,
        telefone_celular: formData.telefoneCelular || null,
        email: formData.email ? formData.email.toLowerCase() : null,  // Email sempre lowercase

        // ===== FILIAÇÃO =====
        pai: toUppercase(formData.pai) || null,
        mae: toUppercase(formData.mae) || null,

        // ===== ENDEREÇO =====
        endereco: toUppercase(formData.endereco) || null,
        numeroendereco: toUppercase(formData.numero) || null,
        bairro: toUppercase(formData.bairro) || null,
        cidade: toUppercase(formData.cidade) || null,
        estado: toUppercase(formData.uf) || null,
        cep: formData.cep || null,
        complemento: toUppercase(formData.complemento) || null,
        naturalidade: toUppercase(formData.naturalidade) || null,
        uf_naturalidade: toUppercase(formData.ufNaturalidade) || null,

        // ===== REGISTRO DE NASCIMENTO =====
        termo: toUppercase(formData.termo) || null,
        folha: toUppercase(formData.folha) || null,
        livro: toUppercase(formData.livro) || null,
        nome_cartorio: toUppercase(formData.nomeCartorio) || null,

        // ===== INEP / CENSO =====
        tipo_escola_anterior: toUppercase(formData.tipoEscolaAnterior) || null,
        pais_origem: toUppercase(formData.paisOrigem) || 'BRA - BRASIL',

        // ===== ENSINO MÉDIO =====
        estabelecimento: toUppercase(formData.estabelecimento) || null,
        ano_conclusao: formData.anoConclusao ? parseInt(formData.anoConclusao) : null,
        endereco_dem: toUppercase(formData.enderecoDEM) || null,
        municipio_dem: toUppercase(formData.municipioDEM) || null,
        uf_dem: toUppercase(formData.ufDEM) || null,

        // ===== DEFICIÊNCIA =====
        pessoa_com_deficiencia: Boolean(formData.pessoaComDeficiencia),
        tipo_deficiencia: toUppercase(formData.tipoDeficiencia) || null,

        // ===== DADOS FINANCEIROS =====
        plano_financeiro: toUppercase(formData.planoFinanceiro) || null,
        valor_matricula: parseDecimal(formData.valorMatricula),
        valor_mensalidade: parseDecimal(formData.valorMensalidade),
        percentual_desconto: parseDecimal(formData.percentualDesconto),
        qtd_parcelas: parseInteger(formData.quantidadeParcelas),
        dia_pagamento: parseInteger(formData.diaPagamento),
        qtd_meses_contrato: parseInteger(formData.quantidadeMesesContrato),
        cnpj_boleto: formData.cnpjBoleto || null,
        razao_social_boleto: toUppercase(formData.razaoSocialBoleto) || null,
        aluno_bolsista: parseBooleanFromOption(formData.alunoBolsista),
        percentual_bolsa: parseDecimal(formData.percentualBolsaEstudo),
        financiamento_estudantil: toUppercase(formData.financiamentoEstudantil) || null,
        percentual_financiamento: parseDecimal(formData.percentualFinanciamento),

        // ===== INFORMAÇÕES ADICIONAIS =====
        titulo_eleitoral: formData.tituloEleitoral || null,
        zona_eleitoral: parseInteger(formData.zonaEleitoral),
        secao_eleitoral: parseInteger(formData.secaoEleitoral),
        carteira_reservista: toUppercase(formData.carteiraReservista) || null,
        registro_conselho: toUppercase(formData.numeroRegistroConselho) || null,
        religiao: toUppercase(formData.religiao) || null,
        laudo_cid: toUppercase(formData.laudoCid) || null,
        observacoes_adicionais: formData.observacoesAdicionais || null,
        indicacao_quem: toUppercase(formData.indicacaoQuem) || null,

        // ===== OUTROS =====
        nome_social: Boolean(formData.nomeSocial),
        apelido: formData.nomeSocial ? toUppercase(formData.apelido) || null : null,
        foto: formData.foto || null
      };

      try {
        // Compatibilidade: se a coluna ainda não foi migrada, ignora ufRG sem quebrar atualização.
        if (!(await supportsUfRgColumn())) {
          delete alunoData.uf_rg;
        }

        // Compatibilidade: se a coluna ainda não foi migrada, ignora apelido sem quebrar atualização.
        if (!(await supportsApelidoColumn())) {
          delete alunoData.apelido;
        }

        // Compatibilidade: se as colunas financeiras ainda não foram migradas, ignora os campos sem quebrar atualização.
        if (!(await supportsFinanceiroColumns())) {
          delete alunoData.plano_financeiro;
          delete alunoData.valor_matricula;
          delete alunoData.valor_mensalidade;
          delete alunoData.percentual_desconto;
          delete alunoData.qtd_parcelas;
          delete alunoData.dia_pagamento;
          delete alunoData.qtd_meses_contrato;
          delete alunoData.cnpj_boleto;
          delete alunoData.razao_social_boleto;
          delete alunoData.aluno_bolsista;
          delete alunoData.percentual_bolsa;
          delete alunoData.financiamento_estudantil;
          delete alunoData.percentual_financiamento;
        }

        // Compatibilidade: se as colunas de informações adicionais ainda não foram migradas, ignora os campos sem quebrar atualização.
        if (!(await supportsInformacoesAdicionaisColumns())) {
          delete alunoData.titulo_eleitoral;
          delete alunoData.zona_eleitoral;
          delete alunoData.secao_eleitoral;
          delete alunoData.carteira_reservista;
          delete alunoData.registro_conselho;
          delete alunoData.religiao;
          delete alunoData.laudo_cid;
          delete alunoData.observacoes_adicionais;
          delete alunoData.indicacao_quem;
        }

        const { data, error } = await supabase
          .from('alunos')
          .update(alunoData)
          .eq('id', parseInt(id))
          .select();

        if (error) {
          console.error('❌ ERRO AO ATUALIZAR:', error.message);
          throw error;
        }

        console.log('✅ ALUNO ATUALIZADO COM ID:', id);
        res.status(200).json(data[0]);
      } catch (error) {
        console.error('❌ ERRO NA ATUALIZAÇÃO:', error);
        return res.status(500).json({ 
          message: 'Erro ao atualizar aluno', 
          error: error.message 
        });
      }
    } 
    else if (req.method === 'DELETE') {
      // Deletar aluno
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      res.status(200).json({ message: 'Aluno deletado com sucesso' });
    } 
    else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API alunos:', error);
    res.status(500).json({ 
      message: 'Erro ao processar requisição', 
      error: error.message 
    });
  }
}