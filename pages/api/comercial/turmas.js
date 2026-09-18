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

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'recepcao'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  // ── Contexto de autorização (Instituição e Unidade) ──────────────────────────
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

  const { cursoid } = req.query;
  if (!cursoid) return res.status(400).json({ error: 'cursoid é obrigatório' });

  let query = supabase
    .from('turmas')
    .select('id, nome, cursoid, instituicao_id, mensalidade, matricula, mesescontrato, datainicio, datafim, situacao, turno, capacidademaxima, desconto, unidadeid, gradeid, tipocobranca')
    .eq('cursoid', cursoid)
    .order('nome');

  if (!isGroupAdmin) {
    query = applyInstituicaoFilter(query, userInstituicaoId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Filtrar turmas ativas e aplicar escopo de unidade para Filial
  const ativas = (data || []).filter(t => {
    const s = String(t.situacao || '').toUpperCase();
    const isAtiva = !s || s === 'ATIVO' || s === 'EM_ANDAMENTO' || s === 'ABERTA';
    if (!isAtiva) return false;

    // Se for Filial (ctx.unidadesPermitidas !== null), restringir à unidade autorizada
    if (ctx.unidadesPermitidas !== null) {
      if (t.unidadeid != null) {
        return ctx.unidadesPermitidas.includes(Number(t.unidadeid));
      }
      // Turmas legadas sem unidade permanecem acessíveis no escopo institucional
      return true;
    }

    // Matriz / Grupo Admin tem acesso a todas as turmas da instituição
    return true;
  });

  return res.status(200).json(ativas);
}
