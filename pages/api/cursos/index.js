import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  readInstituicaoId,
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

let cursoUnidadeSchemaCache = null;

const parseInteger = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const digitsOnly = String(value).trim().replace(/\D/g, '');
  if (!digitsOnly) return null;
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseDecimal = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const cleaned = String(value)
    .trim()
    .replace(/[R$\s]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'sim' || normalized === 'on';
  }
  if (typeof value === 'number') return value === 1;
  return false;
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const isMissingColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('does not exist') || message.includes('could not find');
};

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || message.includes('relation') || message.includes('does not exist');
};

const getCursoUnidadeSchema = async () => {
  if (cursoUnidadeSchemaCache) {
    return cursoUnidadeSchemaCache;
  }

  const candidates = [
    { cursoCol: 'cursoid', unidadeCol: 'unidadeid' },
    { cursoCol: 'curso_id', unidadeCol: 'unidade_id' },
    { cursoCol: 'cursoId', unidadeCol: 'unidadeId' },
  ];

  for (const schema of candidates) {
    const { error } = await supabase
      .from('curso_unidade')
      .select(`${schema.cursoCol},${schema.unidadeCol}`)
      .limit(1);

    if (!error) {
      cursoUnidadeSchemaCache = schema;
      return schema;
    }

    if (isMissingTableError(error)) {
      return null;
    }

    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  return null;
};

const getUnidadeBindings = async (cursoIds = null) => {
  const schema = await getCursoUnidadeSchema();
  if (!schema) {
    return {
      bindings: [],
      schema: null,
    };
  }

  let query = supabase
    .from('curso_unidade')
    .select(`${schema.cursoCol},${schema.unidadeCol}`);

  if (Array.isArray(cursoIds) && cursoIds.length > 0) {
    query = query.in(schema.cursoCol, cursoIds);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error) || isMissingColumnError(error)) {
      return {
        bindings: [],
        schema,
      };
    }
    throw error;
  }

  return {
    bindings: data || [],
    schema,
  };
};

const resolveUnidadeIdsFromBody = async (body) => {
  const idsFromBody = Array.isArray(body.unidadeIds)
    ? body.unidadeIds
      .map((value) => parseInteger(value))
      .filter((value) => value !== null)
    : [];

  if (idsFromBody.length > 0) {
    return [...new Set(idsFromBody)];
  }

  const unidades = Array.isArray(body.unidades) ? body.unidades : [];
  if (unidades.length === 0) {
    return [];
  }

  const unidadesNumericas = unidades
    .map((value) => parseInteger(value))
    .filter((value) => value !== null);

  if (unidadesNumericas.length > 0) {
    return [...new Set(unidadesNumericas)];
  }

  const nomes = unidades
    .map((value) => String(value || '').trim())
    .filter((value) => value.length > 0);

  if (nomes.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('unidades')
    .select('id,nome')
    .in('nome', nomes);

  if (error) {
    throw error;
  }

  return [...new Set((data || []).map((item) => item.id))];
};

const syncCursoUnidade = async (cursoId, unidadeIds) => {
  const schema = await getCursoUnidadeSchema();
  if (!schema) {
    return;
  }

  const { error: deleteError } = await supabase
    .from('curso_unidade')
    .delete()
    .eq(schema.cursoCol, cursoId);

  if (deleteError) {
    throw deleteError;
  }

  if (!Array.isArray(unidadeIds) || unidadeIds.length === 0) {
    return;
  }

  const payload = unidadeIds.map((unidadeId) => ({
    [schema.cursoCol]: cursoId,
    [schema.unidadeCol]: unidadeId,
  }));

  const { error: insertError } = await supabase
    .from('curso_unidade')
    .insert(payload);

  if (insertError) {
    throw insertError;
  }
};

const mapRowToResponse = (row, unidadesDoCurso = []) => {
  const unidadeNomes = unidadesDoCurso
    .map((unidade) => unidade.nome)
    .filter(Boolean);

  const unidadeIds = unidadesDoCurso
    .map((unidade) => unidade.id)
    .filter((id) => id !== undefined && id !== null)
    .map((id) => String(id));

  return {
    id: row.id,
    instituicaoId: row.instituicao_id || row.instituicaoid || '',
    instituicaoNome: row.instituicoes?.nome || row.instituicao_nome || '',
    nome: row.nome || '',
    descricaoGeral: row.descricaogeral || '',
    duracao: row.duracao !== null && row.duracao !== undefined ? String(row.duracao) : '',
    cargaHoraria: row.cargahoraria !== null && row.cargahoraria !== undefined ? String(row.cargahoraria) : '',
    cargaHorariaEstagio: row.cargahorariaestagio !== null && row.cargahorariaestagio !== undefined ? String(row.cargahorariaestagio) : '',
    cargaHorariaAtividadesComplementares:
      row.cargahorariaatividadescomplementares !== null && row.cargahorariaatividadescomplementares !== undefined
        ? String(row.cargahorariaatividadescomplementares)
        : '',
    mediaRequerida: row.mediarequerida !== null && row.mediarequerida !== undefined ? String(row.mediarequerida) : '',
    frequenciaRequerida: row.frequenciarequerida !== null && row.frequenciarequerida !== undefined ? String(row.frequenciarequerida) : '',
    nivelEnsino: row.nivelensino || '',
    grauConferido: row.grauconferido || '',
    tituloConferido: row.tituloconferido || '',
    valorInscricao: row.valorinscricao !== null && row.valorinscricao !== undefined ? String(row.valorinscricao) : '',
    valorMensalidade: row.valormensalidade !== null && row.valormensalidade !== undefined ? String(row.valormensalidade) : '',
    layoutNotas: row.layoutnotas || '',
    idCenso: row.idcenso || '',
    bibliotecaVirtual: row.bibliotecavirtual || '',
    portariaRecredenciamento: row.portariarecredenciamento || '',
    exibirCRM: Boolean(row.exibircrm),
    exibirBibliotecaVirtual: Boolean(row.exibirbibliotecavirtual),
    situacao: row.situacao || 'ATIVO',
    unidades: unidadeNomes,
    unidadeIds,
    dataCriacao: row.datacriacao || null,
    dataAtualizacao: row.dataatualizacao || null,

    // Compatibilidade legada para telas antigas.
    titulo: row.nome || '',
    descricao: row.descricaogeral || '',
    categoria: row.nivelensino || '',
    ativo: (row.situacao || 'ATIVO') === 'ATIVO',
  };
};

const validarDadosCurso = (payload) => {
  if (!payload.nome || payload.nome.trim() === '') {
    return 'O nome do curso é obrigatório';
  }
  if (payload.nome.length > 100) {
    return 'O nome do curso não pode ter mais de 100 caracteres';
  }
  const regexNome = /^[a-zA-Z0-9À-ÿ\s]+$/;
  if (!regexNome.test(payload.nome)) {
    return 'O nome do curso deve conter apenas caracteres alfanuméricos e espaços';
  }

  if (payload.descricaogeral) {
    if (payload.descricaogeral.length > 500) {
      return 'A descrição geral não pode ter mais de 500 caracteres';
    }
    const regexDescricao = /^[a-zA-Z0-9À-ÿ\s.,;:!?()[\]'"/\-–—\n\r%ºª$]*$/;
    if (!regexDescricao.test(payload.descricaogeral)) {
      return 'A descrição geral contém caracteres inválidos';
    }
  }

  if (payload.duracao !== null && (payload.duracao < 1 || payload.duracao > 20)) {
    return 'A duração deve ser entre 1 e 20 períodos';
  }

  if (payload.cargahoraria !== null && (payload.cargahoraria < 0 || payload.cargahoraria > 99999)) {
    return 'A carga horária deve ser entre 0 e 99.999 horas';
  }

  if (payload.mediarequerida !== null && (payload.mediarequerida < 0 || payload.mediarequerida > 10)) {
    return 'A média requerida deve ser entre 0 e 10';
  }

  if (payload.frequenciarequerida !== null && (payload.frequenciarequerida < 0 || payload.frequenciarequerida > 100)) {
    return 'A frequência requerida deve ser entre 0% e 100%';
  }

  if (payload.cargahorariaestagio !== null && (payload.cargahorariaestagio < 0 || payload.cargahorariaestagio > 99999)) {
    return 'A carga horária de estágio deve ser entre 0 e 99.999 horas';
  }

  if (
    payload.cargahorariaatividadescomplementares !== null &&
    (payload.cargahorariaatividadescomplementares < 0 || payload.cargahorariaatividadescomplementares > 99999)
  ) {
    return 'A carga horária de atividades complementares deve ser entre 0 e 99.999 horas';
  }

  if (payload.valorinscricao !== null && (payload.valorinscricao < 0 || Number.isNaN(payload.valorinscricao))) {
    return 'O valor de inscrição não pode ser negativo';
  }

  if (payload.valormensalidade !== null && (payload.valormensalidade < 0 || Number.isNaN(payload.valormensalidade))) {
    return 'O valor da mensalidade não pode ser negativo';
  }

  return null;
};

const mapBodyToPayload = (body = {}) => {
  const nomeRaw = String(body.nome || body.titulo || '').trim();
  const nome = nomeRaw.toUpperCase();
  const situacao = body.situacao || (parseBoolean(body.ativo) ? 'ATIVO' : 'INATIVO') || 'ATIVO';

  return {
    nome,
    instituicao_id: normalizeText(body.instituicaoId ?? body.instituicao_id ?? body.instituicaoid),
    descricaogeral: normalizeText(body.descricaoGeral ?? body.descricaogeral ?? body.descricao),
    duracao: parseInteger(body.duracao),
    cargahoraria: parseInteger(body.cargaHoraria ?? body.cargahoraria),
    cargahorariaestagio: parseInteger(body.cargaHorariaEstagio ?? body.cargahorariaestagio),
    cargahorariaatividadescomplementares: parseInteger(
      body.cargaHorariaAtividadesComplementares ?? body.cargahorariaatividadescomplementares
    ),
    mediarequerida: parseDecimal(body.mediaRequerida ?? body.mediarequerida),
    frequenciarequerida: parseInteger(body.frequenciaRequerida ?? body.frequenciarequerida),
    nivelensino: body.nivelEnsino ?? body.nivelensino ?? body.categoria ?? null,
    grauconferido: body.grauConferido ?? body.grauconferido ?? null,
    tituloconferido: body.tituloConferido ?? body.tituloconferido ?? null,
    valorinscricao: parseDecimal(body.valorInscricao ?? body.valorinscricao),
    valormensalidade: parseDecimal(body.valorMensalidade ?? body.valormensalidade),
    layoutnotas: body.layoutNotas ?? body.layoutnotas ?? null,
    idcenso: body.idCenso ?? body.idcenso ?? null,
    bibliotecavirtual: body.bibliotecaVirtual ?? body.bibliotecavirtual ?? null,
    portariarecredenciamento: body.portariaRecredenciamento ?? body.portariarecredenciamento ?? null,
    exibircrm: parseBoolean(body.exibirCRM ?? body.exibircrm),
    exibirbibliotecavirtual: parseBoolean(body.exibirBibliotecaVirtual ?? body.exibirbibliotecavirtual),
    situacao,
  };
};

const getNextCursoId = async () => {
  const { data, error } = await supabase
    .from('cursos')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.id || 0) + 1;
};

const mapCursosWithUnidades = async (cursos) => {
  if (!Array.isArray(cursos) || cursos.length === 0) {
    return [];
  }

  const cursoIds = cursos
    .map((item) => item.id)
    .filter((id) => id !== undefined && id !== null);

  const { bindings, schema } = await getUnidadeBindings(cursoIds);

  if (!schema || bindings.length === 0) {
    return cursos.map((curso) => mapRowToResponse(curso, []));
  }

  const unidadeIds = [...new Set(bindings
    .map((item) => parseInteger(item[schema.unidadeCol]))
    .filter((id) => id !== null))];

  let unidades = [];
  if (unidadeIds.length > 0) {
    const { data: unidadesData, error: unidadesError } = await supabase
      .from('unidades')
      .select('id,nome')
      .in('id', unidadeIds);

    if (unidadesError) {
      throw unidadesError;
    }

    unidades = unidadesData || [];
  }

  const unidadeById = new Map(unidades.map((unidade) => [unidade.id, unidade]));
  const unidadesByCursoId = new Map();

  bindings.forEach((item) => {
    const cursoId = parseInteger(item[schema.cursoCol]);
    const unidadeId = parseInteger(item[schema.unidadeCol]);

    if (cursoId === null || unidadeId === null) return;

    const unidade = unidadeById.get(unidadeId);
    if (!unidade) return;

    if (!unidadesByCursoId.has(cursoId)) {
      unidadesByCursoId.set(cursoId, []);
    }

    unidadesByCursoId.get(cursoId).push(unidade);
  });

  return cursos.map((curso) => mapRowToResponse(curso, unidadesByCursoId.get(curso.id) || []));
};

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

  try {
    if (req.method === 'GET') {
      const requestedInstituicaoId = readInstituicaoId(req);
      const userInstituicaoId = normalizeText(authUser.instituicao_id ?? authUser.instituicaoId);

      if (!isGroupAdmin) {
        if (requestedInstituicaoId && requestedInstituicaoId !== userInstituicaoId) {
          return res.status(403).json({ error: 'Acesso não autorizado para esta instituição', message: 'Acesso não autorizado para esta instituição' });
        }
        if (!userInstituicaoId) {
          return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual', message: 'Instituicao nao definida para o usuario atual' });
        }
      }

      const instituicaoId = isGroupAdmin ? (requestedInstituicaoId || null) : userInstituicaoId;

      // Se for perfil professor, restringir cursos às turmas vinculadas
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

        // Buscar as turmas para extrair o cursoId
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('cursoId, curso_id, cursoid')
          .in('id', turmaIds);

        if (turmasError || !turmasData || turmasData.length === 0) return res.status(200).json([]);

        const cursoIds = [...new Set(
          turmasData.map(t => t.cursoId || t.curso_id || t.cursoid).filter(Boolean)
        )];

        if (cursoIds.length === 0) return res.status(200).json([]);

        let query = supabase
          .from('cursos')
          .select('*')
          .in('id', cursoIds)
          .order('id', { ascending: false });

        query = applyInstituicaoFilter(query, instituicaoId);
        const { data, error } = await query;
        if (error) {
          console.error('Supabase GET cursos error:', error);
          return res.status(500).json({ error: 'Erro ao listar cursos', message: error.message, detail: error.message });
        }
        const response = await mapCursosWithUnidades(data || []);
        return res.status(200).json(response);
      }

      let query = supabase
        .from('cursos')
        .select('*')
        .order('id', { ascending: false });

      query = applyInstituicaoFilter(query, instituicaoId);

      const { data, error } = await query;

      if (error) {
        console.error('Supabase GET cursos error:', error);
        return res.status(500).json({ error: 'Erro ao listar cursos', message: error.message, detail: error.message });
      }

      const response = await mapCursosWithUnidades(data || []);
      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const payload = mapBodyToPayload(body);
      const requestedInstituicaoId = normalizeText(body.instituicaoId ?? body.instituicao_id ?? req.headers?.['x-instituicao-id']);
      const userInstituicaoId = normalizeText(authUser.instituicao_id ?? authUser.instituicaoId);

      if (!isGroupAdmin) {
        if (requestedInstituicaoId && requestedInstituicaoId !== userInstituicaoId) {
          return res.status(403).json({ error: 'Acesso não autorizado para cadastrar nesta instituição', message: 'Acesso não autorizado para cadastrar nesta instituição' });
        }
        if (!userInstituicaoId) {
          return res.status(400).json({ error: 'Instituição não definida para o usuário', message: 'Instituição não definida para o usuário' });
        }
      }

      const instituicaoId = isGroupAdmin ? (requestedInstituicaoId || userInstituicaoId) : userInstituicaoId;

      if (!instituicaoId) {
        return res.status(400).json({ error: 'Instituição é obrigatória', message: 'Instituição é obrigatória' });
      }

      payload.instituicao_id = instituicaoId;

      const erroValidacao = validarDadosCurso(payload);
      if (erroValidacao) {
        return res.status(400).json({ error: erroValidacao, message: erroValidacao });
      }

      const unidadeIds = await resolveUnidadeIdsFromBody(body);
      const id = await getNextCursoId();

      const { data, error } = await supabase
        .from('cursos')
        .insert([{ ...payload, id }])
        .select('*')
        .single();

      if (error) {
        console.error('Supabase POST cursos error:', error);
        return res.status(500).json({ error: 'Erro ao criar curso', message: error.message, detail: error.message });
      }

      try {
        await syncCursoUnidade(data.id, unidadeIds);
      } catch (syncError) {
        console.error('Supabase curso_unidade sync error:', syncError);
        return res.status(500).json({ error: 'Curso criado, mas falhou ao vincular unidades', message: syncError.message, detail: syncError.message });
      }

      const response = await mapCursosWithUnidades([data]);
      return res.status(201).json(response[0]);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método não permitido', message: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de cursos:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição', message: error.message, detail: error.message });
  }
}
