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

const PERFIS_PERMITIDOS = [
  'grupo_admin', 'instituicao_admin', 'admin', 'financeiro',
  'comercial', 'comercial_master', 'comercial_operador',
];

const isOperador = (user) =>
  hasPerfil(user, ['comercial_operador']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master']);

const isMasterRestrito = (user) =>
  hasPerfil(user, ['comercial', 'comercial_master']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro']);

async function getEquipeIds(masterId) {
  const { data: operadores = [] } = await supabase
    .from('usuarios')
    .select('id')
    .eq('comercial_master_id', masterId)
    .eq('perfil', 'comercial_operador');
  return [masterId, ...operadores.map(o => o.id)];
}

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

  try {
    let query = supabase
      .from('comissoes_comerciais')
      .select(`
        id, aluno_id, valor_base, valor_comissao, tipo_comissao, percentual,
        status, data_credito, data_repasse, created_at, instituicao_id,
        aluno:alunos!aluno_id(id, nome, email, turmaid, turmas(id, unidadeid)),
        captado_por:usuarios!captado_por_id(id, nomecompleto)
      `)
      .order('data_credito', { ascending: false });

    if (!isGroupAdmin) {
      query = applyInstituicaoFilter(query, userInstituicaoId);
    }

    if (isOperador(authUser)) {
      query = query.eq('captado_por_id', authUser.id);
    } else if (isMasterRestrito(authUser)) {
      const equipeIds = await getEquipeIds(Number(authUser.id));
      query = query.in('captado_por_id', equipeIds);
    }

    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data: comissoesData, error } = await query;

    if (error) {
      if (error.code === '42P01' || String(error.message).includes('does not exist')) {
        return res.status(200).json({
          comissoes: [],
          aviso: 'Tabela não criada. Execute a migration 20260527_comissoes_comerciais.sql.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    const comissoesCarregadas = comissoesData || [];

    // ── 2. Resolução de Unidades em Lote (evita N+1 para usuários Filial) ────────
    const alunoIdsCarregados = Array.from(
      new Set(comissoesCarregadas.map((c) => c.aluno_id).filter(Boolean))
    );

    const alunoUnidadeMap = new Map();

    if (ctx.unidadesPermitidas !== null && alunoIdsCarregados.length > 0) {
      const { data: matriculasData, error: matriculasError } = await supabase
        .from('matriculas')
        .select(`
          id,
          aluno_id,
          turma_id,
          is_principal,
          turmas(id, unidadeid)
        `)
        .in('aluno_id', alunoIdsCarregados);

      if (matriculasError) {
        console.error('Aviso ao consultar matriculas para comissoes comerciais:', matriculasError);
      } else if (matriculasData) {
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

    // ── 3. Filtrar comissões por escopo de unidade (Filial) ──────────────────────
    const comissoesFiltradas = comissoesCarregadas.filter((c) => {
      // Matriz / Grupo Admin tem acesso a todas as comissões da instituição
      if (ctx.unidadesPermitidas === null) {
        return true;
      }

      // Se não houver aluno vinculado à comissão, preservar registro legado no escopo institucional
      if (!c.aluno_id) {
        return true;
      }

      // 1. Tentar obter unidade mapeada via matrículas
      let unidadeId = alunoUnidadeMap.get(c.aluno_id) ?? null;

      // 2. Fallback legado: aluno.turmas.unidadeid ou aluno.turmaid
      if (unidadeId === null && c.aluno?.turmas?.unidadeid != null) {
        unidadeId = Number(c.aluno.turmas.unidadeid);
      }

      // Se o aluno não possui unidade identificável, preservar no escopo institucional
      if (unidadeId === null) {
        return true;
      }

      return ctx.unidadesPermitidas.includes(unidadeId);
    });

    // Mapeia para manter o formato de resposta exato esperado pelo frontend
    const resultado = comissoesFiltradas.map((c) => {
      const alunoFormatado = c.aluno
        ? {
            nome: c.aluno.nome,
            email: c.aluno.email,
          }
        : null;

      return {
        id: c.id,
        valor_base: c.valor_base,
        valor_comissao: c.valor_comissao,
        tipo_comissao: c.tipo_comissao,
        percentual: c.percentual,
        status: c.status,
        data_credito: c.data_credito,
        data_repasse: c.data_repasse,
        created_at: c.created_at,
        aluno: alunoFormatado,
        captado_por: c.captado_por,
      };
    });

    return res.status(200).json({ comissoes: resultado });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
