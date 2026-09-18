import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 6.4: Resolver contexto de escopo (Instituição × Unidade) ──────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[comissoes/index] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({
      message: 'Serviço temporariamente indisponível para resolução de contexto do usuário',
      error: ctx.queryError.message,
    });
  }

  const instituicaoId = ctx.instituicaoId || (ctx.legacyFallback ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin }) : null);

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
  }
  // ────────────────────────────────────────────────────────────────────────────

  try {
    let query = supabase
      .from('comissoes_comerciais')
      .select(`
        id, aluno_id, valor_base, valor_comissao, tipo_comissao, percentual,
        status, data_credito, data_repasse, observacao, created_at,
        aluno:alunos!aluno_id(id, nome, email, turmaid, turmas(id, nome, unidadeid)),
        captado_por:usuarios!captado_por_id(id, nomecompleto)
      `)
      .order('data_credito', { ascending: false });

    // Multi-tenant
    if (!isGroupAdmin && instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId);
    }

    // Filtros opcionais
    const { status, captado_por_id, data_inicio, data_fim } = req.query;
    if (status)         query = query.eq('status', status);
    if (captado_por_id) query = query.eq('captado_por_id', captado_por_id);
    if (data_inicio)    query = query.gte('data_credito', data_inicio);
    if (data_fim)       query = query.lte('data_credito', data_fim);

    const { data: comissoes, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return res.status(200).json({
          comissoes: [],
          resumo: { pendentes: 0, valorPendente: 0, repassadas: 0, valorRepassado: 0 },
          aviso: 'Tabela não criada. Execute a migration 20260527_comissoes_comerciais.sql.',
        });
      }
      return res.status(500).json({ message: error.message });
    }

    const comissoesCarregadas = comissoes || [];

    // ── Resolução de Matrículas e Unidade em Lote (evita N+1 queries) ───────────
    const alunoIdsCarregados = Array.from(
      new Set(comissoesCarregadas.map(c => c.aluno_id).filter(Boolean))
    );

    const alunoUnidadeMap = new Map();

    if (ctx.unidadesPermitidas !== null && alunoIdsCarregados.length > 0) {
      const { data: matriculasData, error: matriculasError } = await supabase
        .from('matriculas')
        .select(`
          id,
          aluno_id,
          is_principal,
          turma_id,
          turmas(id, unidadeid)
        `)
        .in('aluno_id', alunoIdsCarregados);

      if (matriculasError) {
        console.error('Aviso ao consultar matriculas para comissoes:', matriculasError);
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

    // Filtrar comissões por escopo de unidade (para Usuário Filial)
    const comissoesFiltradas = comissoesCarregadas.filter((c) => {
      // Matriz / Grupo Admin tem acesso a todas as comissões da instituição
      if (ctx.unidadesPermitidas === null) {
        return true;
      }

      // Se não houver aluno vinculado à comissão, preservar registro legado
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

    // Calcular resumo sobre o conjunto estritamente autorizado
    const resumo = { pendentes: 0, valorPendente: 0, repassadas: 0, valorRepassado: 0 };
    for (const c of comissoesFiltradas) {
      const v = Number(c.valor_comissao || 0);
      if (c.status === 'PENDENTE_REPASSE') {
        resumo.pendentes++;
        resumo.valorPendente += v;
      } else if (c.status === 'REPASSADO') {
        resumo.repassadas++;
        resumo.valorRepassado += v;
      }
    }

    return res.status(200).json({ comissoes: comissoesFiltradas, resumo });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno: ' + (err?.message || err) });
  }
}

