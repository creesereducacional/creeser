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
  'recepcao',
  'grupo_admin',
  'instituicao_admin',
  'admin',
  'coordenador',
  'secretaria',
  'financeiro',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

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
    // 1. Buscar cursos da instituição
    let cursosQuery = supabase
      .from('cursos')
      .select('id, nome, nivelensino, grauconferido, cargahoraria, duracao, situacao, valormensalidade, instituicao_id')
      .order('nome');

    if (!isGroupAdmin) {
      cursosQuery = applyInstituicaoFilter(cursosQuery, userInstituicaoId);
    }

    const { data: cursos, error: cursosErr } = await cursosQuery;
    if (cursosErr) {
      return res.status(500).json({ error: cursosErr.message });
    }

    // 2. Buscar turmas da instituição para cálculo de quantitativos
    let turmasQuery = supabase
      .from('turmas')
      .select('id, cursoid, situacao');

    if (!isGroupAdmin) {
      turmasQuery = applyInstituicaoFilter(turmasQuery, userInstituicaoId);
    }

    const { data: turmas, error: turmasErr } = await turmasQuery;
    if (turmasErr) {
      return res.status(500).json({ error: turmasErr.message });
    }

    // Contagem de turmas por curso
    const turmasPorCurso = {};
    const turmasAtivasPorCurso = {};

    (turmas || []).forEach((t) => {
      const cid = t.cursoid;
      if (!cid) return;
      turmasPorCurso[cid] = (turmasPorCurso[cid] || 0) + 1;
      const s = String(t.situacao || '').toUpperCase();
      const isAtiva = !s || s === 'ATIVO' || s === 'EM_ANDAMENTO' || s === 'ABERTA';
      if (isAtiva) {
        turmasAtivasPorCurso[cid] = (turmasAtivasPorCurso[cid] || 0) + 1;
      }
    });

    const resultado = (cursos || []).map((c) => ({
      id: c.id,
      nome: c.nome,
      nivelensino: c.nivelensino || null,
      grauconferido: c.grauconferido || null,
      cargahoraria: c.cargahoraria || null,
      duracao: c.duracao || null,
      situacao: c.situacao || 'ATIVO',
      valormensalidade: c.valormensalidade || null,
      instituicao_id: c.instituicao_id,
      total_turmas: turmasPorCurso[c.id] || 0,
      total_turmas_ativas: turmasAtivasPorCurso[c.id] || 0,
    }));

    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro na API de cursos da recepção:', err);
    return res.status(500).json({ error: 'Erro interno ao consultar cursos' });
  }
}
