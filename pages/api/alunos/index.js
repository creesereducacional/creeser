import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
}

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
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  // Garantir paridade com todos os perfis administrativos/pedagógicos/financeiros autorizados
  if (!requirePerfil(authUser, res, [
    'grupo_admin',
    'instituicao_admin',
    'admin',
    'coordenador',
    'secretaria',
    'professor',
    'financeiro',
    'comercial',
    'comercial_master',
    'recepcao'
  ])) {
    return;
  }

  // Professor só tem permissão de leitura (GET)
  if (hasPerfil(authUser, ['professor']) && req.method !== 'GET') {
    return res.status(403).json({ error: 'Acesso negado: Professor possui acesso apenas para leitura.' });
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  try {
    if (req.method === 'GET') {
      const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });
      if (!isGroupAdmin && !instituicaoId) {
        return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
      }

      // Se for perfil professor, restringir aos alunos das turmas vinculadas
      if (hasPerfil(authUser, ['professor'])) {
        const emailLogado = authUser.email;
        if (!emailLogado) return res.status(200).json([]);

        // Obter professor_id
        const { data: prof, error: profError } = await supabase
          .from('professores')
          .select('id')
          .eq('email', emailLogado)
          .eq('instituicao_id', instituicaoId)
          .maybeSingle();

        if (profError || !prof) return res.status(200).json([]);

        // Obter turmas vinculadas do professor
        const { data: vts, error: vtsError } = await supabase
          .from('professor_turma_disciplinas')
          .select('turma_id')
          .eq('professor_id', prof.id)
          .eq('ativo', true);

        if (vtsError || !vts || vts.length === 0) return res.status(200).json([]);

        const turmaIds = vts.map(item => item.turma_id);

        let query = supabase
          .from('alunos')
          .select('*')
          .in('turmaId', turmaIds)
          .order('id', { ascending: false });

        query = applyInstituicaoFilter(query, instituicaoId);
        const { data, error } = await query;
        if (error) {
          console.error('Supabase GET error:', error);
          return res.status(500).json({ message: 'Erro ao recuperar alunos', error: error.message });
        }
        return res.status(200).json(data || []);
      }

      const { cpf } = req.query;
      if (cpf) {
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        const cpfFormatado = cpfLimpo.length === 11 
          ? `${cpfLimpo.slice(0,3)}.${cpfLimpo.slice(3,6)}.${cpfLimpo.slice(6,9)}-${cpfLimpo.slice(9)}`
          : cpfLimpo;

        const { data: alunoExistente, error: cpfError } = await supabase
          .from('alunos')
          .select('id, nome, cpf, statusmatricula, turmaid')
          .or(`cpf.eq.${cpfLimpo},cpf.eq.${cpfFormatado}`)
          .limit(1);

        if (cpfError) {
          console.error('Erro ao verificar CPF:', cpfError);
          return res.status(500).json({ error: 'Erro ao verificar CPF' });
        }

        const existe = Array.isArray(alunoExistente) && alunoExistente.length > 0;
        return res.status(200).json({
          existe,
          aluno: existe ? alunoExistente[0] : null
        });
      }

      // 1. Buscar alunos com dados de turmas, cursos e unidades (alinhado com o financeiro)
      let alunosQuery = supabase
        .from('alunos')
        .select(`
          *,
          cursos (
            id,
            nome
          ),
          turmas (
            id,
            nome,
            unidades (
              id,
              nome
            )
          )
        `)
        .order('id', { ascending: false });

      alunosQuery = applyInstituicaoFilter(alunosQuery, instituicaoId);

      const { data: alunosData, error: alunosError } = await alunosQuery;

      if (alunosError) {
        console.error('Supabase GET alunos error:', alunosError);
        return res.status(500).json({ 
          message: 'Erro ao recuperar alunos', 
          error: alunosError?.message || alunosError,
          code: alunosError?.code || null
        });
      }

      const alunos = alunosData || [];
      const alunoIds = alunos.map((a) => a.id).filter(Boolean);

      // 2. Buscar todas as matrículas correspondentes aos alunos retornados
      let matriculasPorAluno = {};
      if (alunoIds.length > 0) {
        try {
          const { data: matriculasData, error: matError } = await supabase
            .from('matriculas')
            .select(`
              id,
              codigo_matricula,
              aluno_id,
              instituicao_id,
              curso_id,
              turma_id,
              grade_id,
              ano_letivo,
              semestre,
              status_administrativo,
              situacao_academica,
              is_principal,
              data_matricula,
              cursos (
                id,
                nome
              ),
              turmas (
                id,
                nome,
                unidades (
                  id,
                  nome
                )
              )
            `)
            .in('aluno_id', alunoIds)
            .order('is_principal', { ascending: false })
            .order('created_at', { ascending: false });

          if (!matError && Array.isArray(matriculasData)) {
            matriculasData.forEach((mat) => {
              if (!matriculasPorAluno[mat.aluno_id]) {
                matriculasPorAluno[mat.aluno_id] = [];
              }
              matriculasPorAluno[mat.aluno_id].push(mat);
            });
          }
        } catch (mErr) {
          console.error('Aviso ao consultar matriculas:', mErr);
        }
      }

      // 3. Desdobrar em 1 registro por Matrícula (ALUNO + MATRÍCULA + CURSO + TURMA) com fallback total para legado
      const listaAlunosFinal = [];

      alunos.forEach((aluno) => {
        const matriculasDoAluno = matriculasPorAluno[aluno.id] || [];

        if (matriculasDoAluno.length > 0) {
          matriculasDoAluno.forEach((mat) => {
            const turmaObj = mat.turmas || aluno.turmas || {};
            const cursoObj = mat.cursos || aluno.cursos || (turmaObj.cursos ? turmaObj.cursos : null);
            const unidadeObj = turmaObj.unidades || (aluno.turmas?.unidades ? aluno.turmas.unidades : null);

            listaAlunosFinal.push({
              ...aluno,
              // Chaves da Matrícula específica
              matricula_id: mat.id,
              matricula_codigo: mat.codigo_matricula || aluno.matricula || aluno.numero_id || null,
              is_principal: Boolean(mat.is_principal),
              status_administrativo: mat.status_administrativo || aluno.statusmatricula || 'ATIVO',
              situacao_academica: mat.situacao_academica || 'EM_ANDAMENTO',
              data_matricula: mat.data_matricula || aluno.datamatricula,

              // Identificadores de Curso / Turma / Período da Matrícula
              curso_id: mat.curso_id || aluno.cursoid,
              cursoid: mat.curso_id || aluno.cursoid,
              curso_nome: cursoObj?.nome || aluno.curso || null,
              curso: cursoObj?.nome || aluno.curso || null,

              turma_id: mat.turma_id || aluno.turmaid,
              turmaid: mat.turma_id || aluno.turmaid,
              turma_nome: turmaObj?.nome || aluno.turma || null,
              turma: turmaObj?.nome || aluno.turma || null,

              unidade_id: turmaObj?.unidadeid || aluno.turmas?.unidadeid || null,
              unidade_nome: unidadeObj?.nome || null,

              ano_letivo: mat.ano_letivo || aluno.ano_letivo,
              anoLetivo: mat.ano_letivo || aluno.ano_letivo,
              semestre: mat.semestre || aluno.semestre || '1',

              gradeid: mat.grade_id || turmaObj?.gradeid || aluno.turmas?.gradeid || null,
              status: mat.status_administrativo || aluno.statusmatricula || 'ATIVO',
              statusmatricula: mat.status_administrativo || aluno.statusmatricula || 'ATIVO',
            });
          });
        } else {
          // Fallback seguro para alunos sem registro na tabela matriculas (dados legados)
          const turmaObj = aluno.turmas || {};
          const cursoObj = aluno.cursos || (turmaObj.cursos ? turmaObj.cursos : null);
          const unidadeObj = turmaObj.unidades || null;

          listaAlunosFinal.push({
            ...aluno,
            matricula_id: null,
            matricula_codigo: aluno.matricula || aluno.numero_id || null,
            is_principal: true,
            status_administrativo: aluno.statusmatricula || 'ATIVO',
            curso_id: aluno.cursoid,
            cursoid: aluno.cursoid,
            curso_nome: cursoObj?.nome || aluno.curso || null,
            curso: cursoObj?.nome || aluno.curso || null,
            turma_id: aluno.turmaid,
            turmaid: aluno.turmaid,
            turma_nome: turmaObj?.nome || aluno.turma || null,
            turma: turmaObj?.nome || aluno.turma || null,
            unidade_id: turmaObj?.unidadeid || null,
            unidade_nome: unidadeObj?.nome || null,
            ano_letivo: aluno.ano_letivo,
            anoLetivo: aluno.ano_letivo,
            semestre: aluno.semestre || '1',
            gradeid: turmaObj?.gradeid || null,
            status: aluno.statusmatricula || 'ATIVO',
            statusmatricula: aluno.statusmatricula || 'ATIVO',
          });
        }
      });

      res.status(200).json(listaAlunosFinal);
    } 
    else if (req.method === 'POST') {
      // ========================================
      // INSERIR NOVO ALUNO - MAPEAMENTO COMPLETO
      // ========================================
      const formData = req.body;
      
      console.log('\n📋 POST /api/alunos - Iniciando inserção');
      console.log('Campos recebidos:', Object.keys(formData).length);

      // ✅ MAPEAMENTO COMPLETO E DEFINITIVO (42 CAMPOS)
      // Referência: MAPEAMENTO_COMPLETO_ALUNOS.md
      
      // ✅ Função helper para converter para UPPERCASE (exceto campos específicos)
      const toUppercase = (value, exceptionFields = []) => {
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
      
      let instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: false });
      
      // Se for administrador do grupo e tiver selecionado/enviado uma instituição no formulário, resolver essa instituição
      if (isGroupAdmin && (formData.instituicaoId || formData.instituicao_id || formData.instituicaoid)) {
        instituicaoId = String(formData.instituicaoId || formData.instituicao_id || formData.instituicaoid);
      } else if (isGroupAdmin && formData.instituicao) {
        // Tentar resolver a instituição pelo nome selecionado no select
        const { data: instPorNome } = await supabase
          .from('instituicoes')
          .select('id')
          .ilike('nome', `%${formData.instituicao.trim()}%`)
          .maybeSingle();

        if (instPorNome?.id) {
          instituicaoId = String(instPorNome.id);
        }
      }

      if (!instituicaoId) {
        return res.status(400).json({ message: 'Instituição obrigatória para criar aluno' });
      }

      if (!formData.nome || !String(formData.nome).trim()) {
        return res.status(400).json({ message: 'Nome do aluno é obrigatório' });
      }

      const turmaIdVal = parseInteger(formData.turma || formData.turmaId || formData.turmaid);
      if (!turmaIdVal) {
        return res.status(400).json({ message: 'A seleção de uma Turma é obrigatória para o cadastro do aluno.' });
      }

      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('*')
        .eq('id', turmaIdVal)
        .single();

      if (turmaError || !turmaData) {
        return res.status(400).json({ message: 'A turma selecionada não existe ou é inválida.' });
      }

      const turmaInstId = turmaData.instituicao_id || turmaData.instituicaoid;
      // Se a turma tiver instituicao_id, validar contra a instituicao resolvida ou a instituicao informada/turma
      if (turmaInstId && String(turmaInstId) !== String(instituicaoId) && isGroupAdmin) {
        // Para grupo_admin, a instituicao da turma passa a ser a instituicao de referencia do aluno
      } else if (turmaInstId && String(turmaInstId) !== String(instituicaoId)) {
        return res.status(400).json({ message: 'A turma selecionada não pertence à instituição do aluno.' });
      }

      // Validação de duplicidade de CPF por instituição
      if (formData.cpf) {
        const cleanCpf = String(formData.cpf).trim();
        if (cleanCpf) {
          const { data: existingCpf } = await supabase
            .from('alunos')
            .select('id, nome')
            .eq('cpf', cleanCpf)
            .eq('instituicao_id', instituicaoId)
            .maybeSingle();

          if (existingCpf) {
            return res.status(400).json({ message: `Já existe um aluno matriculado com este CPF (${cleanCpf}): ${existingCpf.nome}` });
          }
        }
      }

      const alunoData = {
        // ===== IDENTIFICAÇÃO =====
        nome: toUppercase(formData.nome) || '',
        instituicao: toUppercase(formData.instituicao) || 'CREESER',
        instituicao_id: instituicaoId,
        statusmatricula: toUppercase(formData.status) || 'ATIVO',
        datamatricula: formData.dataMatricula || new Date().toISOString().split('T')[0],
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
        nacionalidade: toUppercase(formData.nacionalidade) || null,

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

      // Log dos dados que serão inseridos
      console.log('\n✅ Mapeamento concluído - Campos para inserir:');
      Object.entries(alunoData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          console.log(`  ${key}: ${value}`);
        }
      });

      // Remover campos undefined
      Object.keys(alunoData).forEach(key => {
        if (alunoData[key] === undefined) {
          delete alunoData[key];
        }
      });

      // Compatibilidade: se a coluna ainda não foi migrada, ignora ufRG sem quebrar o cadastro.
      if (!(await supportsUfRgColumn())) {
        delete alunoData.uf_rg;
      }

      // Compatibilidade: se a coluna ainda não foi migrada, ignora apelido sem quebrar o cadastro.
      if (!(await supportsApelidoColumn())) {
        delete alunoData.apelido;
      }

      // Compatibilidade: se as colunas financeiras ainda não foram migradas, ignora os campos sem quebrar o cadastro.
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

      // Compatibilidade: se as colunas de informações adicionais ainda não foram migradas, ignora os campos sem quebrar o cadastro.
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

      try {
        const { data, error } = await supabase
          .from('alunos')
          .insert([alunoData])
          .select();

        if (error) {
          console.error('❌ ERRO SUPABASE:', error.message);
          console.error('   Detalhes:', error);

          if (error.code === '23505' || String(error.message || '').includes('alunos_cpf_key') || String(error.message || '').includes('duplicate key')) {
            return res.status(409).json({
              message: 'Já existe um aluno cadastrado com este CPF.',
              error: 'CPF duplicado'
            });
          }

          return res.status(500).json({ 
            message: 'Erro ao inserir aluno: ' + error.message, 
            error: error.message,
            hint: error.hint
          });
        }
        
        console.log('✅ SUCESSO! Aluno inserido com ID:', data[0].id);
        res.status(201).json(data[0]);
      } catch (error) {
        console.error('❌ ERRO NA INSERÇÃO:', error);
        return res.status(500).json({ 
          message: 'Erro ao inserir aluno', 
          error: error.message
        });
      }
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
