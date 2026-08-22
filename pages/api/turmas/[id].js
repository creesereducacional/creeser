import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const isMissingColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('does not exist') || message.includes('could not find');
};

const parseInteger = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const parseTurmaMeta = (descricao) => {
  if (!descricao) return {};
  if (typeof descricao !== 'string') return {};

  try {
    const parsed = JSON.parse(descricao);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { descricaoTexto: descricao };
  }
};

const mapRowToResponse = (row) => {
  const meta = parseTurmaMeta(row.descricao);
  const descricaoDireta = typeof row.descricao === 'string' && row.descricao.trim().startsWith('{')
    ? meta.descricao || meta.descricaoTexto || ''
    : row.descricao || meta.descricao || meta.descricaoTexto || '';

  return {
    id: row.id,
    nome: row.nome || '',
    instituicaoId: row.instituicao_id || row.instituicaoid || '',
    instituicao: meta.instituicao || '',
    unidadeId: row.unidadeid !== undefined && row.unidadeid !== null ? Number(row.unidadeid) : null,
    unidade_id: row.unidadeid !== undefined && row.unidadeid !== null ? Number(row.unidadeid) : null,
    unidade: row.unidades?.nome || meta.unidade || '',
    cursoId: row.cursoid !== undefined && row.cursoid !== null ? Number(row.cursoid) : null,
    curso_id: row.cursoid !== undefined && row.cursoid !== null ? Number(row.cursoid) : null,
    curso: row.cursos?.nome || meta.curso || '',
    gradeId: row.gradeid !== undefined && row.gradeid !== null ? Number(row.gradeid) : null,
    grade_id: row.gradeid !== undefined && row.gradeid !== null ? Number(row.gradeid) : null,
    grade: row.grades?.nome || meta.grade || '',
    cargaHoraria: row.cargahoraria || meta.cargaHoraria || '',
    processoSeletivo: row.datainicio || meta.processoSeletivo || '',
    edittalProcessoSeletivo: row.editalprocessoseletivo || meta.edittalProcessoSeletivo || '',
    turno: row.turno || meta.turno || '',
    tipo: row.tipocobranca || meta.tipo || 'Boleto',
    mensalidade: row.mensalidade || meta.mensalidade || '',
    desconto: row.desconto || meta.desconto || '',
    inscricao: row.inscricao || meta.inscricao || '',
    matricula: row.matricula || meta.matricula || '',
    contaRecebimento: row.contarecebimento || meta.contaRecebimento || '',
    mesesContrato:
      row.mesescontrato !== null && row.mesescontrato !== undefined
        ? String(row.mesescontrato)
        : meta.mesesContrato || '',
    limiteCadastroAlunos:
      row.capacidademaxima !== null && row.capacidademaxima !== undefined
        ? String(row.capacidademaxima)
        : meta.limiteCadastroAlunos || '',
    iesRegistradoraDiploma: row.iesregistradoradiploma || meta.iesRegistradoraDiploma || '',
    situacao: row.situacao || 'ATIVO',
    contratoId: row.contrato_id || row.contratoid || null,
    contrato_id: row.contrato_id || row.contratoid || null,
    descricao: descricaoDireta,
    dataInicio: row.datainicio || '',
    dataFim: row.datafim || '',
    dataCriacao: row.datacriacao || null,
    dataAtualizacao: row.dataatualizacao || null,
  };
};

const mapBodyToPayload = (body) => {
  const instituicaoId = normalizeText(body.instituicaoId || body.instituicao_id || body.instituicaoid);
  const unidadeId = parseInteger(body.unidadeId || body.unidadeid || body.unidade);
  const cursoId = parseInteger(body.cursoId || body.cursoid || body.curso);
  const gradeId = parseInteger(body.gradeId || body.gradeid || body.grade);
  const contratoId = normalizeText(body.contratoId || body.contrato_id || body.contratoid);
  const capacidadeMaxima = parseInteger(body.limiteCadastroAlunos || body.capacidadeMaxima || body.capacidademaxima);
  const mesesContrato = parseInteger(body.mesesContrato || body.mesescontrato);

  const descricaoMeta = {
    instituicao: body.instituicao || '',
    unidade: body.unidade || '',
    curso: body.curso || '',
    grade: body.grade || '',
    contratoId: contratoId || '',
    cargaHoraria: body.cargaHoraria || '',
    processoSeletivo: body.processoSeletivo || '',
    edittalProcessoSeletivo: body.edittalProcessoSeletivo || '',
    turno: body.turno || '',
    tipo: body.tipo || 'Boleto',
    mensalidade: body.mensalidade || '',
    desconto: body.desconto || '',
    inscricao: body.inscricao || '',
    matricula: body.matricula || '',
    contaRecebimento: body.contaRecebimento || '',
    mesesContrato: body.mesesContrato || '',
    limiteCadastroAlunos: body.limiteCadastroAlunos || '',
    iesRegistradoraDiploma: body.iesRegistradoraDiploma || '',
    descricao: body.descricao || '',
  };

  const payloadBase = {
    nome: (body.nome || '').trim(),
    instituicao_id: instituicaoId,
    unidadeid: unidadeId,
    cursoid: cursoId,
    gradeid: gradeId,
    contrato_id: contratoId || null,
    situacao: body.situacao || 'ATIVO',
    datainicio: body.processoSeletivo || body.dataInicio || null,
    datafim: body.dataFim || null,
    capacidademaxima: capacidadeMaxima,
  };

  const payloadNormalizado = {
    ...payloadBase,
    cargahoraria: body.cargaHoraria || null,
    editalprocessoseletivo: body.edittalProcessoSeletivo || null,
    turno: body.turno || null,
    tipocobranca: body.tipo || null,
    mensalidade: body.mensalidade || null,
    desconto: body.desconto || null,
    inscricao: body.inscricao || null,
    matricula: body.matricula || null,
    contarecebimento: body.contaRecebimento || null,
    mesescontrato: mesesContrato,
    iesregistradoradiploma: body.iesRegistradoraDiploma || null,
    descricao: body.descricao || null,
  };

  const payloadLegado = {
    ...payloadBase,
    descricao: JSON.stringify(descricaoMeta),
  };

  return {
    payloadNormalizado,
    payloadLegado,
  };
};

const selectTurma = `
  *,
  unidades(id,nome),
  cursos(id,nome),
  grades(id,nome)
`;

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'admin', 'professor'])) {
    return;
  }

  // Professor só tem permissão de leitura (GET)
  if (hasPerfil(authUser, ['professor']) && req.method !== 'GET') {
    return res.status(403).json({ error: 'Acesso negado: Professor possui acesso apenas para leitura.' });
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  const { id } = req.query;
  const turmaId = parseInteger(id);

  if (!turmaId) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    if (req.method === 'GET') {
      let query = supabase
        .from('turmas')
        .select(selectTurma)
        .eq('id', turmaId);

      const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });
      if (!isGroupAdmin && !instituicaoId) {
        return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
      }
      query = applyInstituicaoFilter(query, instituicaoId);

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Turma não encontrada' });
        }
        console.error('Supabase GET turma error:', error);
        return res.status(500).json({ error: 'Erro ao recuperar turma', detail: error.message });
      }

      return res.status(200).json(mapRowToResponse(data));
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const { payloadNormalizado, payloadLegado } = mapBodyToPayload(body);
      const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
      let instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: false });

      if (isGroupAdmin && (body.instituicaoId || body.instituicao_id || body.instituicaoid)) {
        instituicaoId = normalizeText(body.instituicaoId || body.instituicao_id || body.instituicaoid);
      }

      if (!instituicaoId) {
        return res.status(400).json({ error: 'Instituicao obrigatoria' });
      }

      payloadNormalizado.instituicao_id = instituicaoId;
      payloadLegado.instituicao_id = instituicaoId;

      if (!payloadNormalizado.nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      if (!payloadNormalizado.instituicao_id || !payloadNormalizado.unidadeid || !payloadNormalizado.cursoid || !payloadNormalizado.gradeid) {
        return res.status(400).json({ error: 'Instituição, unidade, curso e grade são obrigatórios' });
      }

      // Recuperar a turma atual antes de atualizar
      const { data: existingTurma, error: findError } = await supabase
        .from('turmas')
        .select('gradeid, cursoid')
        .eq('id', turmaId)
        .single();
      
      if (findError || !existingTurma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }

      // Se a turma já possui um gradeid cadastrado, não permitir que ele seja alterado
      if (existingTurma.gradeid && String(existingTurma.gradeid) !== String(payloadNormalizado.gradeid)) {
        return res.status(400).json({ error: 'Após criada, a Turma deve permanecer vinculada à mesma Matriz Curricular (gradeid) para não corromper históricos.' });
      }

      // Validar se a nova grade existe, está ativa e pertence ao mesmo curso
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('id', payloadNormalizado.gradeid)
        .single();
      
      if (gradeError || !gradeData) {
        return res.status(400).json({ error: 'Matriz Curricular vinculada não existe ou é inválida.' });
      }

      if (gradeData.situacao && gradeData.situacao !== 'ATIVO') {
        return res.status(400).json({ error: 'A Matriz Curricular selecionada precisa estar ativa.' });
      }

      const gradeCursoId = gradeData.curso_id || gradeData.cursoid;
      if (gradeCursoId && String(gradeCursoId) !== String(payloadNormalizado.cursoid)) {
        return res.status(400).json({ error: 'A Matriz Curricular selecionada não pertence ao mesmo Curso da Turma.' });
      }

      if (payloadNormalizado.contrato_id) {
        const { data: contratoData, error: contratoError } = await supabase
          .from('contratos_instituicao')
          .select('*')
          .eq('id', payloadNormalizado.contrato_id)
          .single();

        if (contratoError || !contratoData) {
          return res.status(400).json({ error: 'Modelo de contrato selecionado não existe ou é inválido.' });
        }

        const contratoInstituicaoId = contratoData.instituicao_id || contratoData.instituicaoid;
        if (contratoInstituicaoId && String(contratoInstituicaoId) !== String(payloadNormalizado.instituicao_id)) {
          return res.status(400).json({ error: 'O Modelo de Contrato selecionado não pertence à mesma Instituição da Turma.' });
        }
      }

      let data = null;
      let error = null;

      let updateQuery = supabase
        .from('turmas')
        .update({
          ...payloadNormalizado,
          dataatualizacao: new Date().toISOString(),
        })
        .eq('id', turmaId);

      updateQuery = applyInstituicaoFilter(updateQuery, instituicaoId);

      ({ data, error } = await updateQuery
        .select(selectTurma)
        .single());

      if (error && isMissingColumnError(error)) {
        // Tentar payload sem contrato_id caso a coluna contrato_id/contratoid ainda não exista na tabela turmas
        const { contrato_id: _c1, ...payloadNormalizadoSemContrato } = payloadNormalizado;
        ({ data, error } = await supabase
          .from('turmas')
          .update({
            ...payloadNormalizadoSemContrato,
            dataatualizacao: new Date().toISOString(),
          })
          .eq('id', turmaId)
          .select(selectTurma)
          .single());

        if (error && isMissingColumnError(error)) {
          const { contrato_id: _c2, ...payloadLegadoSemContrato } = payloadLegado;
          ({ data, error } = await supabase
            .from('turmas')
            .update({
              ...payloadLegadoSemContrato,
              dataatualizacao: new Date().toISOString(),
            })
            .eq('id', turmaId)
            .select(selectTurma)
            .single());
        }
      }

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Turma não encontrada' });
        }
        console.error('Supabase PUT turma error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar turma', detail: error.message });
      }

      return res.status(200).json(mapRowToResponse(data));
    }

    if (req.method === 'DELETE') {
      const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
      const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });
      if (!isGroupAdmin && !instituicaoId) {
        return res.status(400).json({ error: 'Instituicao obrigatoria' });
      }

      let deleteQuery = supabase
        .from('turmas')
        .delete()
        .eq('id', turmaId);

      if (!isGroupAdmin) {
        deleteQuery = applyInstituicaoFilter(deleteQuery, instituicaoId);
      }

      const { error } = await deleteQuery;

      if (error) {
        console.error('Supabase DELETE turma error:', error);
        return res.status(500).json({ error: 'Erro ao deletar turma', detail: error.message });
      }

      return res.status(200).json({ mensagem: 'Turma deletada com sucesso' });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de turma:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição', detail: error.message });
  }
}
