import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = [
  'grupo_admin',
  'instituicao_admin',
  'admin',
  'financeiro',
  'comercial',
  'comercial_master',
  'comercial_operador',
  'recepcao',
];

let cursoUnidadeSchemaCache = null;

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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  // ── 1. Resolução do Contexto Instituição × Unidade ───────────────────────────
  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível ao verificar permissões de acesso',
      code: 'AUTH_CONTEXT_UNAVAILABLE',
    });
  }

  const isGroupAdmin = authUser.perfil === 'grupo_admin' || authUser.is_superadmin;
  const userInstituicaoId = ctx.instituicaoId;

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ error: 'Instituição não definida para o usuário atual' });
  }

  // ── 2. Consulta base de cursos da instituição ────────────────────────────────
  let query = supabase
    .from('cursos')
    .select('id, nome, nivelensino, grauconferido, cargahoraria, instituicao_id')
    .or('situacao.eq.ATIVO,situacao.is.null')
    .order('nome');

  if (!isGroupAdmin) {
    query = applyInstituicaoFilter(query, userInstituicaoId);
  }

  const { data: todosOsCursos, error: cursosError } = await query;
  if (cursosError) return res.status(500).json({ error: cursosError.message });

  let resultado = todosOsCursos || [];

  // ── 3. Filtragem de Unidade para Filial (ctx.unidadesPermitidas !== null) ─────
  if (ctx.unidadesPermitidas !== null) {
    let schema = null;
    try {
      schema = await getCursoUnidadeSchema();
    } catch (schemaErr) {
      console.error('Erro ao detectar schema de curso_unidade:', schemaErr);
      return res.status(500).json({
        error: 'Erro ao validar vínculos de unidade para os cursos',
      });
    }

    // Se não há tabela ou schema identificável para curso_unidade:
    // Não ampliar escopo como fallback. Retornar array vazio de forma segura.
    if (!schema) {
      return res.status(200).json([]);
    }

    const { data: links, error: linksError } = await supabase
      .from('curso_unidade')
      .select(`${schema.cursoCol},${schema.unidadeCol}`)
      .in(schema.unidadeCol, ctx.unidadesPermitidas);

    if (linksError) {
      console.error('Erro ao consultar vínculos de curso_unidade:', linksError);
      return res.status(500).json({
        error: 'Erro ao carregar cursos da unidade autorizada',
      });
    }

    const cursosPermitidosIds = new Set(
      (links || []).map((item) => Number(item[schema.cursoCol])).filter(Boolean)
    );

    resultado = resultado.filter((c) => cursosPermitidosIds.has(Number(c.id)));
  }

  return res.status(200).json(resultado);
}
