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
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
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

  try {
    // ── 2. Buscar Followups Físicos ──────────────────────────────────────────
    let queryFollowups = supabase
      .from('leads_followups')
      .select(`
        *,
        leads(id, nome, telefone, whatsapp, email, instituicao_id, aluno_convertido_id)
      `)
      .eq('usuario_id', authUser.id)
      .eq('status', 'PENDENTE')
      .order('data_agendada', { ascending: true });

    if (!isGroupAdmin) {
      queryFollowups = applyInstituicaoFilter(queryFollowups, userInstituicaoId);
    }

    const { data: followupsRaw = [], error } = await queryFollowups;

    if (error) {
      // ── Fallback caso a tabela física não exista ou dê erro ────────────────
      console.warn('[API Agenda] Tabela leads_followups ausente ou erro, parseando observações dos leads...');

      let queryLeads = supabase
        .from('leads')
        .select('id, nome, telefone, whatsapp, email, observacoes, instituicao_id, aluno_convertido_id');

      if (!isGroupAdmin) {
        queryLeads = applyInstituicaoFilter(queryLeads, userInstituicaoId);
      }

      const { data: leadsFallback = [] } = await queryLeads;
      const parsedFollowups = [];

      leadsFallback.forEach((l) => {
        const obs = l.observacoes || '';
        const marker = '[FOLLOWUP_AGENDADO]';
        const parts = obs.split(marker);

        parts.slice(1).forEach((part) => {
          try {
            const lines = part.trim().split('\n\n')[0];
            const idxFim = lines.lastIndexOf('}');
            if (idxFim !== -1) {
              const cleanJson = lines.substring(0, idxFim + 1).trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed && parsed.status === 'PENDENTE') {
                parsedFollowups.push({
                  ...parsed,
                  lead_id: l.id,
                  instituicao_id: l.instituicao_id,
                  leads: {
                    id: l.id,
                    nome: l.nome,
                    telefone: l.telefone,
                    whatsapp: l.whatsapp,
                    email: l.email,
                    instituicao_id: l.instituicao_id,
                    aluno_convertido_id: l.aluno_convertido_id,
                  },
                });
              }
            }
          } catch (_) {}
        });
      });

      const followupsFiltradosFallback = await filtrarFollowupsPorEscopo(
        parsedFollowups,
        ctx,
        isGroupAdmin,
        userInstituicaoId
      );

      return res.status(200).json(classificarFollowups(followupsFiltradosFallback));
    }

    // ── 3. Aplicar Filtro de Escopo Instituição × Unidade ────────────────────
    const followupsFiltrados = await filtrarFollowupsPorEscopo(
      followupsRaw,
      ctx,
      isGroupAdmin,
      userInstituicaoId
    );

    return res.status(200).json(classificarFollowups(followupsFiltrados));
  } catch (err) {
    console.error('[API Agenda] Erro geral:', err.message);
    return res.status(500).json({ error: 'Erro interno ao carregar agenda.' });
  }
}

/**
 * Filtra agendamentos/followups conforme o escopo de Instituição e Unidade.
 */
async function filtrarFollowupsPorEscopo(list, ctx, isGroupAdmin, userInstituicaoId) {
  if (!Array.isArray(list) || list.length === 0) return [];

  // Se não for grupo_admin, valida instituição
  const listaInstitucional = list.filter((item) => {
    if (isGroupAdmin) return true;
    const instId = item.instituicao_id || item.leads?.instituicao_id;
    if (!instId) return true;
    return String(instId) === String(userInstituicaoId);
  });

  // Se for Matriz / Grupo Admin, tem acesso a todas as unidades da instituição
  if (ctx.unidadesPermitidas === null) {
    return listaInstitucional;
  }

  // Se for Filial, resolver unidades dos alunos convertidos em lote
  const alunoConvertidoIds = Array.from(
    new Set(
      listaInstitucional
        .map((item) => item.leads?.aluno_convertido_id)
        .filter(Boolean)
    )
  );

  const alunoUnidadeMap = new Map();

  if (alunoConvertidoIds.length > 0) {
    // 1. Matrículas ativas
    const { data: matriculasData } = await supabase
      .from('matriculas')
      .select(`
        id,
        aluno_id,
        turma_id,
        is_principal,
        turmas(id, unidadeid)
      `)
      .in('aluno_id', alunoConvertidoIds);

    if (matriculasData) {
      const ordenadas = [...matriculasData].sort((a, b) => {
        if (a.is_principal && !b.is_principal) return -1;
        if (!a.is_principal && b.is_principal) return 1;
        return 0;
      });

      for (const m of ordenadas) {
        if (!alunoUnidadeMap.has(m.aluno_id)) {
          const uid = m.turmas?.unidadeid != null ? Number(m.turmas.unidadeid) : null;
          if (uid !== null) {
            alunoUnidadeMap.set(m.aluno_id, uid);
          }
        }
      }
    }

    // 2. Fallback legado em alunos(turmaid, turmas(unidadeid))
    const pendentes = alunoConvertidoIds.filter((id) => !alunoUnidadeMap.has(id));
    if (pendentes.length > 0) {
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('id, turmaid, turmas(id, unidadeid)')
        .in('id', pendentes);

      if (alunosData) {
        for (const a of alunosData) {
          const uid = a.turmas?.unidadeid != null ? Number(a.turmas.unidadeid) : null;
          if (uid !== null) {
            alunoUnidadeMap.set(a.id, uid);
          }
        }
      }
    }
  }

  return listaInstitucional.filter((item) => {
    const alunoId = item.leads?.aluno_convertido_id;

    // Se o lead ainda não foi convertido, permanece no escopo institucional comercial
    if (!alunoId) {
      return true;
    }

    // Se foi convertido, derivar unidade do aluno
    const unidadeId = alunoUnidadeMap.get(alunoId) ?? null;

    // Se unidade for indeterminável, preservar no escopo institucional legado
    if (unidadeId === null) {
      return true;
    }

    return ctx.unidadesPermitidas.includes(unidadeId);
  });
}

function classificarFollowups(list) {
  const agora = new Date();

  // Limiar de início do dia de hoje (00:00:00) e fim do dia (23:59:59)
  const hojeInicio = new Date(agora);
  hojeInicio.setHours(0, 0, 0, 0);
  const hojeFim = new Date(agora);
  hojeFim.setHours(23, 59, 59, 999);

  // Amanhã
  const amanhaInicio = new Date(hojeInicio);
  amanhaInicio.setDate(amanhaInicio.getDate() + 1);
  const amanhaFim = new Date(hojeFim);
  amanhaFim.setDate(amanhaFim.getDate() + 1);

  // Próximos 7 dias (excluindo hoje e amanhã)
  const proximosFim = new Date(hojeFim);
  proximosFim.setDate(proximosFim.getDate() + 7);

  const atrasados = [];
  const hoje = [];
  const amanha = [];
  const proximos = [];

  list.forEach((item) => {
    const dataAg = new Date(item.data_agendada);

    if (dataAg < hojeInicio) {
      atrasados.push(item);
    } else if (dataAg >= hojeInicio && dataAg <= hojeFim) {
      hoje.push(item);
    } else if (dataAg >= amanhaInicio && dataAg <= amanhaFim) {
      amanha.push(item);
    } else if (dataAg > amanhaFim && dataAg <= proximosFim) {
      proximos.push(item);
    }
  });

  return {
    kpis: {
      totalAtrasados: atrasados.length,
      totalHoje: hoje.length,
      totalAmanha: amanha.length,
      totalProximos: proximos.length,
    },
    atrasados,
    hoje,
    amanha,
    proximos,
  };
}
