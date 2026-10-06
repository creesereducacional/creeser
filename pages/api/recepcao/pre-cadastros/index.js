import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';
import { rateLimit, getClientIp } from '../../../../lib/rate-limit';
import {
  validarEmailUnico,
  isDuplicateEmailError,
  MSG_EMAIL_DUPLICADO,
  normalizeEmail,
} from '../../../../lib/api-helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['recepcao', 'grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'secretaria', 'coordenador'];

const STATUS_LISTADOS = ['PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO_MATRICULA', 'AGUARDANDO_FORMACAO_TURMA', 'ATIVO', 'DESISTENTE', 'CANCELADO'];

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
  if (normalized === 'SIM' || normalized === 'TRUE' || normalized === '1') return true;
  if (normalized === 'NAO' || normalized === 'NÃO' || normalized === 'FALSE' || normalized === '0') return false;
  return null;
};

export default async function handler(req, res) {
  // Garantir sempre cabeçalho JSON
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
    const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

    // ── GET ─ listar pré-cadastros ──────────────────────────────────
    if (req.method === 'GET') {
      let query = supabase
        .from('alunos')
        .select('id, nome, cpf, email, telefone_celular, cursoid, turmaid, statusmatricula, datacriacao, captado_por_id, instituicao_id')
        .in('statusmatricula', STATUS_LISTADOS)
        .order('datacriacao', { ascending: false });

      query = applyInstituicaoFilter(query, instituicaoId);

      // Buscar também dados auxiliares para resolver nomes e opções de filtros
      let cursosQuery = supabase.from('cursos').select('id, nome, instituicao_id');
      let turmasQuery = supabase.from('turmas').select('id, nome, cursoid, unidadeid, turno, situacao, instituicao_id');
      let unidadesQuery = supabase.from('unidades').select('id, nome, instituicao_id');
      let cursoUnidadeQuery = supabase.from('curso_unidade').select('id, cursoid, unidadeid');

      cursosQuery = applyInstituicaoFilter(cursosQuery, instituicaoId);
      turmasQuery = applyInstituicaoFilter(turmasQuery, instituicaoId);
      unidadesQuery = applyInstituicaoFilter(unidadesQuery, instituicaoId);

      const [
        { data: alunos, error: errAlunos },
        { data: cursos },
        { data: turmas },
        { data: unidades },
        { data: cursoUnidade },
      ] = await Promise.all([
        query,
        cursosQuery,
        turmasQuery,
        unidadesQuery,
        cursoUnidadeQuery,
      ]);

      if (errAlunos) {
        console.error('[pre-cadastros/GET]', errAlunos.message);
        return res.status(500).json({ error: 'Erro interno ao carregar pré-cadastros' });
      }

      const cursosMap = Object.fromEntries((cursos || []).map(c => [c.id, c]));
      const turmasMap = Object.fromEntries((turmas || []).map(t => [t.id, t]));
      const unidadesMap = Object.fromEntries((unidades || []).map(u => [u.id, u]));

      // Mapear curso -> unidades vinculadas
      const cursoUnidadesMap = {};
      (cursoUnidade || []).forEach(cu => {
        if (!cursoUnidadesMap[cu.cursoid]) cursoUnidadesMap[cu.cursoid] = new Set();
        cursoUnidadesMap[cu.cursoid].add(cu.unidadeid);
      });
      (turmas || []).forEach(t => {
        if (t.cursoid && t.unidadeid) {
          if (!cursoUnidadesMap[t.cursoid]) cursoUnidadesMap[t.cursoid] = new Set();
          cursoUnidadesMap[t.cursoid].add(t.unidadeid);
        }
      });

      const enrichedAlunos = (alunos || []).map(a => {
        const turma = turmasMap[a.turmaid];
        const curso = cursosMap[a.cursoid];
        let unidadeId = turma?.unidadeid || null;
        if (!unidadeId && a.cursoid && cursoUnidadesMap[a.cursoid]?.size === 1) {
          unidadeId = Array.from(cursoUnidadesMap[a.cursoid])[0];
        }
        const unidade = unidadesMap[unidadeId];

        return {
          ...a,
          curso_nome: curso?.nome || null,
          turma_nome: turma?.nome ? `${turma.nome}${turma.turno ? ' — ' + turma.turno : ''}` : null,
          unidade_id: unidadeId,
          unidade_nome: unidade?.nome || null,
        };
      });

      if (req.query.include_options === 'true' || req.query.include_options === '1') {
        const opcoesCursos = (cursos || []).map(c => ({
          id: c.id,
          nome: c.nome,
          unidade_ids: Array.from(cursoUnidadesMap[c.id] || []),
        }));

        const opcoesTurmas = (turmas || []).map(t => ({
          id: t.id,
          nome: t.nome,
          cursoid: t.cursoid,
          unidadeid: t.unidadeid,
          turno: t.turno,
          situacao: t.situacao,
        }));

        const opcoesUnidades = (unidades || []).map(u => ({
          id: u.id,
          nome: u.nome,
        }));

        return res.status(200).json({
          alunos: enrichedAlunos,
          unidades: opcoesUnidades,
          cursos: opcoesCursos,
          turmas: opcoesTurmas,
        });
      }

      return res.status(200).json(enrichedAlunos);
    }

    // ── POST ─ criar pré-cadastro com cadastro completo ──────────────
    if (req.method === 'POST') {
      const ip = getClientIp(req);
      const rl = rateLimit({ key: `precadastro_criar:${ip}`, limit: 30, windowMs: 60 * 60 * 1000 });
      if (!rl.allowed) {
        return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de criar mais cadastros.' });
      }

      const body = req.body || {};

      if (!body.nome || !String(body.nome).trim()) {
        return res.status(400).json({ error: 'Nome do aluno é obrigatório.' });
      }

      const efetivInstituicaoId = isGroupAdmin
        ? (body.instituicao_id || body.instituicaoid || instituicaoId)
        : (authUser.instituicao_id || instituicaoId);

      if (!efetivInstituicaoId) {
        return res.status(400).json({ error: 'Instituição não definida para este usuário.' });
      }

      const cursoIdVal = parseInteger(body.cursoid || body.curso);
      const turmaIdVal = parseInteger(body.turmaid || body.turma);

      // Se cursoid for informado, validar se o curso pertence à instituição
      if (cursoIdVal) {
        const { data: cursoValido } = await supabase
          .from('cursos')
          .select('id, instituicao_id')
          .eq('id', cursoIdVal)
          .maybeSingle();

        if (cursoValido && cursoValido.instituicao_id && String(cursoValido.instituicao_id) !== String(efetivInstituicaoId) && !isGroupAdmin) {
          return res.status(400).json({ error: 'O curso selecionado não está disponível para sua unidade.' });
        }
      }

      // Se turma for informada, verificar existência
      let turmaFinalId = null;
      if (turmaIdVal) {
        const { data: turmaValida } = await supabase
          .from('turmas')
          .select('id')
          .eq('id', turmaIdVal)
          .maybeSingle();

        if (turmaValida) {
          turmaFinalId = turmaValida.id;
        }
      }

      // Validação de unicidade de CPF por instituição
      const cleanCpf = body.cpf ? String(body.cpf).trim() : null;
      if (cleanCpf) {
        const { data: existente } = await supabase
          .from('alunos')
          .select('id, nome')
          .eq('cpf', cleanCpf)
          .maybeSingle();

        if (existente) {
          try {
            await supabase.from('recepcao_auditoria').insert({
              usuario_id: authUser.id,
              acao: 'TENTATIVA_CPF_DUPLICADO',
              dados: JSON.stringify({ cpf: cleanCpf, nome_tentativa: body.nome.trim(), aluno_existente_id: existente.id }),
              data_hora: new Date().toISOString(),
            });
          } catch (_) {}

          return res.status(409).json({
            error: `Este CPF já possui cadastro no sistema (${existente.nome}).`,
            aluno_id: existente.id,
            nome: existente.nome
          });
        }
      }

      // Validação de unicidade de e-mail (alunos e usuários)
      const cleanEmail = normalizeEmail(body.email);
      if (cleanEmail) {
        const emailCheck = await validarEmailUnico({
          email: cleanEmail,
          supabaseClient: supabase,
        });

        if (!emailCheck.valid) {
          return res.status(409).json({ error: emailCheck.error || MSG_EMAIL_DUPLICADO });
        }
      }

      // Determinar dados de responsáveis
      const respMesmo = body.responsavel_financeiro_mesmo !== false && body.responsavel_financeiro_mesmo !== 'false';
      const finNome = respMesmo ? body.responsavel_nome : body.financeiro_nome;
      const finCpf  = respMesmo ? body.responsavel_cpf  : body.financeiro_cpf;
      const finRg   = respMesmo ? body.responsavel_rg   : body.financeiro_rg;
      const finTel  = respMesmo ? body.responsavel_telefone : body.financeiro_telefone;
      const finPar  = respMesmo ? body.responsavel_parentesco : body.financeiro_parentesco;

      // Montagem unificada completa com todos os campos do modelo de alunos
      const novoAluno = {
        // Identificação e Cadastro
        nome: toUppercase(body.nome.trim()),
        nome_social: Boolean(body.nomeSocial !== undefined ? body.nomeSocial : body.nome_social),
        apelido: (body.nomeSocial || body.nome_social) ? toUppercase(body.apelido?.trim()) || null : null,
        cpf: cleanCpf,
        email: cleanEmail,
        telefone_celular: body.telefone_celular?.trim() || body.telefoneCelular?.trim() || null,
        data_nascimento: body.data_nascimento || body.dtNascimento || null,
        rg: toUppercase(body.rg?.trim()) || null,
        data_expedicao_rg: body.data_expedicao_rg || body.dataExpedicaoRG || null,
        orgao_expedidor_rg: toUppercase(body.orgao_expedidor_rg?.trim() || body.orgaoExpedidorRG?.trim()) || null,
        uf_rg: toUppercase(body.uf_rg?.trim() || body.ufRG?.trim()) || null,
        sexo: toUppercase(body.sexo?.trim()) || null,
        estadocivil: toUppercase(body.estadocivil?.trim() || body.estadoCivil?.trim()) || null,
        nacionalidade: toUppercase(body.nacionalidade?.trim()) || 'BRASILEIRA',
        naturalidade: toUppercase(body.naturalidade?.trim()) || null,
        uf_naturalidade: toUppercase(body.uf_naturalidade?.trim() || body.ufNaturalidade?.trim()) || null,
        pessoa_com_deficiencia: Boolean(body.pessoa_com_deficiencia !== undefined ? body.pessoa_com_deficiencia : body.pessoaComDeficiencia),
        tipo_deficiencia: toUppercase(body.tipo_deficiencia?.trim() || body.tipoDeficiencia?.trim()) || null,
        foto: body.foto || null,

        // Contatos e Endereço
        cep: body.cep?.trim() || null,
        endereco: toUppercase(body.endereco?.trim()) || null,
        numeroendereco: toUppercase(body.numeroendereco?.trim() || body.numero?.trim()) || null,
        bairro: toUppercase(body.bairro?.trim()) || null,
        cidade: toUppercase(body.cidade?.trim()) || null,
        estado: toUppercase(body.estado?.trim() || body.uf?.trim()) || null,
        complemento: toUppercase(body.complemento?.trim()) || null,

        // Filiação
        pai: toUppercase(body.pai?.trim()) || null,
        mae: toUppercase(body.mae?.trim()) || null,

        // Responsáveis Legal e Financeiro
        responsavel_nome: toUppercase(body.responsavel_nome?.trim()) || null,
        responsavel_cpf: body.responsavel_cpf?.trim() || null,
        responsavel_rg: toUppercase(body.responsavel_rg?.trim()) || null,
        responsavel_telefone: body.responsavel_telefone?.trim() || null,
        responsavel_parentesco: toUppercase(body.responsavel_parentesco?.trim()) || null,
        responsavel_financeiro_mesmo: respMesmo,
        financeiro_nome: toUppercase(finNome?.trim()) || null,
        financeiro_cpf: finCpf?.trim() || null,
        financeiro_rg: toUppercase(finRg?.trim()) || null,
        financeiro_telefone: finTel?.trim() || null,
        financeiro_parentesco: toUppercase(finPar?.trim()) || null,

        // Dados Acadêmicos / Matrícula
        instituicao: toUppercase(body.instituicao?.trim()) || 'CREESER',
        instituicao_id: efetivInstituicaoId,
        cursoid: cursoIdVal || null,
        turmaid: turmaFinalId || null,
        ano_letivo: parseInteger(body.ano_letivo || body.anoLetivo),
        semestre: body.semestre ? String(body.semestre).trim() : null,
        turno_integral: Boolean(body.turno_integral !== undefined ? body.turno_integral : body.turnoIntegral),
        datamatricula: body.dataMatricula || new Date().toISOString().slice(0, 10),

        // Documentação e Histórico
        termo: toUppercase(body.termo?.trim()) || null,
        folha: toUppercase(body.folha?.trim()) || null,
        livro: toUppercase(body.livro?.trim()) || null,
        nome_cartorio: toUppercase(body.nome_cartorio?.trim() || body.nomeCartorio?.trim()) || null,
        tipo_escola_anterior: toUppercase(body.tipo_escola_anterior?.trim() || body.tipoEscolaAnterior?.trim()) || null,
        estabelecimento: toUppercase(body.estabelecimento?.trim()) || null,
        ano_conclusao: parseInteger(body.ano_conclusao || body.anoConclusao),
        municipio_dem: toUppercase(body.municipio_dem?.trim() || body.municipioDEM?.trim()) || null,
        uf_dem: toUppercase(body.uf_dem?.trim() || body.ufDEM?.trim()) || null,

        // Dados Financeiros e Contrato
        plano_financeiro: toUppercase(body.plano_financeiro || body.planoFinanceiro) || null,
        valor_matricula: parseDecimal(body.valor_matricula || body.valorMatricula),
        valor_mensalidade: parseDecimal(body.valor_mensalidade || body.valorMensalidade),
        percentual_desconto: parseDecimal(body.percentual_desconto || body.percentualDesconto),
        qtd_parcelas: parseInteger(body.qtd_parcelas || body.quantidadeParcelas),
        dia_pagamento: parseInteger(body.dia_pagamento || body.diaPagamento),
        qtd_meses_contrato: parseInteger(body.qtd_meses_contrato || body.quantidadeMesesContrato),
        aluno_bolsista: parseBooleanFromOption(body.aluno_bolsista !== undefined ? body.aluno_bolsista : body.alunoBolsista),
        percentual_bolsa: parseDecimal(body.percentual_bolsa || body.percentualBolsaEstudo),
        indicacao_quem: toUppercase(body.indicacao_quem?.trim() || body.indicacaoQuem?.trim()) || null,
        observacoes_adicionais: body.observacoes_adicionais?.trim() || body.observacoesAdicionais?.trim() || null,

        // Metadados da Recepção
        statusmatricula: 'PRE_CADASTRO',
        origem_captacao: 'RECEPCAO',
        captado_por_id: authUser.id,
        data_captacao: new Date().toISOString().slice(0, 10),
      };

      // Limpar campos undefined
      Object.keys(novoAluno).forEach(key => {
        if (novoAluno[key] === undefined) {
          delete novoAluno[key];
        }
      });

      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .insert([novoAluno])
        .select('id, nome, statusmatricula')
        .single();

      if (alunoError) {
        console.error('[pre-cadastros/POST] Erro Supabase:', alunoError);

        if (isDuplicateEmailError(alunoError)) {
          return res.status(409).json({ error: MSG_EMAIL_DUPLICADO });
        }
        if (alunoError.code === '23505' || String(alunoError.message || '').includes('alunos_cpf_key')) {
          return res.status(409).json({ error: 'Já existe um aluno cadastrado com este CPF.' });
        }
        return res.status(500).json({ error: alunoError.message || 'Erro ao persistir aluno no banco de dados.' });
      }

      // Registro de Auditoria
      try {
        await supabase.from('recepcao_auditoria').insert({
          aluno_id: aluno.id,
          usuario_id: authUser.id,
          acao: 'CRIAR_PRE_CADASTRO',
          dados: JSON.stringify({ nome: aluno.nome, statusmatricula: aluno.statusmatricula }),
          data_hora: new Date().toISOString(),
        });
      } catch (_) {}

      return res.status(201).json({
        id: aluno.id,
        nome: aluno.nome,
        statusmatricula: aluno.statusmatricula,
        mensagem: 'Aluno cadastrado com sucesso!',
      });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (err) {
    console.error('[pre-cadastros/FATAL]', err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor ao processar o cadastro.' });
  }
}
