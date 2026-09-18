import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial'];

const isComercialPuro = (user) =>
  hasPerfil(user, ['comercial']) && !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

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

  const comercial = isComercialPuro(authUser);

  // ── 2. Consulta de Alunos com filtro de instituição e comercial ──────────────
  let query = supabase
    .from('alunos')
    .select('id, nome, email, telefone_celular, statusmatricula, cursoid, turmaid, captado_por_id, datacriacao, instituicao_id, turmas(id, unidadeid)')
    .order('datacriacao', { ascending: false });

  if (!isGroupAdmin) {
    query = applyInstituicaoFilter(query, userInstituicaoId);
  }

  if (comercial) {
    query = query.eq('captado_por_id', authUser.id);
  } else {
    query = query.not('captado_por_id', 'is', null);
  }

  const { data: alunos, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  if (!alunos || alunos.length === 0) return res.status(200).json([]);

  const alunoIds = alunos.map(a => a.id).filter(Boolean);

  // ── 3. Resolução de Unidades em Lote (evita N+1 para usuários Filial) ────────
  const alunoUnidadeMap = new Map();

  if (ctx.unidadesPermitidas !== null && alunoIds.length > 0) {
    const { data: matriculasData, error: matriculasError } = await supabase
      .from('matriculas')
      .select(`
        id,
        aluno_id,
        turma_id,
        is_principal,
        turmas(id, unidadeid)
      `)
      .in('aluno_id', alunoIds);

    if (matriculasError) {
      console.error('Aviso ao consultar matrículas em lote para comercial:', matriculasError);
    } else if (matriculasData) {
      // Ordena garantindo que is_principal venha primeiro
      const matriculasOrdenadas = [...matriculasData].sort((a, b) => {
        if (a.is_principal && !b.is_principal) return -1;
        if (!a.is_principal && b.is_principal) return 1;
        return 0;
      });

      for (const m of matriculasOrdenadas) {
        if (!alunoUnidadeMap.has(m.aluno_id)) {
          const uid = m.turmas?.unidadeid != null ? Number(m.turmas.unidadeid) : null;
          if (uid !== null) {
            alunoUnidadeMap.set(m.aluno_id, uid);
          }
        }
      }
    }
  }

  // ── 4. Filtrar por Escopo de Unidade (Filial) ────────────────────────────────
  const alunosFiltrados = alunos.filter(a => {
    // Matriz / Grupo Admin mantém todas as unidades da instituição
    if (ctx.unidadesPermitidas === null) {
      return true;
    }

    // 1. Unidade obtida pela relação direta/prioritária: matriculas -> turmas.unidadeid
    let unidadeId = alunoUnidadeMap.get(a.id) ?? null;

    // 2. Fallback legado: aluno.turmas.unidadeid
    if (unidadeId === null && a.turmas?.unidadeid != null) {
      unidadeId = Number(a.turmas.unidadeid);
    }

    // Registros legados sem unidade determinável permanecem acessíveis no escopo institucional
    if (unidadeId === null) {
      return true;
    }

    return ctx.unidadesPermitidas.includes(unidadeId);
  });

  if (alunosFiltrados.length === 0) return res.status(200).json([]);

  // ── 5. Buscar leads associados para obter curso_interesse e status ────────────
  const alunoFiltradoIds = alunosFiltrados.map(a => a.id);
  const { data: leads } = await supabase
    .from('leads')
    .select('aluno_convertido_id, curso_interesse, status')
    .in('aluno_convertido_id', alunoFiltradoIds);

  const leadsMap = {};
  (leads || []).forEach(l => { leadsMap[l.aluno_convertido_id] = l; });

  const resultado = alunosFiltrados.map(a => {
    const { turmas: _turmas, instituicao_id: _instId, ...rest } = a;
    return {
      ...rest,
      curso_interesse: leadsMap[a.id]?.curso_interesse || null,
      lead_status: leadsMap[a.id]?.status || null,
    };
  });

  return res.status(200).json(resultado);
}
