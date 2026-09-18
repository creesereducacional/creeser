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
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 6.1.9: Resolver contexto de escopo institucional ───────────────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[comissoes/config] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  // A tabela comissoes_config é exclusivamente institucional (UNIQUE por instituicao_id).
  // Não há conceito de unidade_id na tabela comissoes_config.
  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;

  const instituicaoId = isGroupAdmin
    ? (req.query.instituicao_id || req.body?.instituicao_id || userInstituicaoId)
    : userInstituicaoId;
  // ────────────────────────────────────────────────────────────────────────────

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!instituicaoId && !isGroupAdmin) {
      return res.status(400).json({ message: 'Instituição não identificada' });
    }

    let query = supabase.from('comissoes_config').select('*');
    if (instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (error.code === '42P01') return res.status(200).json({ config: null });
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json({ config: data || null });
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { modo, percentual, valor_fixo, ativo, instituicao_id: bodyInstId } = req.body || {};

    // Validar instituição do servidor: usuários que não sejam grupo_admin não podem alterar outra instituição
    if (!isGroupAdmin) {
      if (bodyInstId && userInstituicaoId && bodyInstId !== userInstituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: não é permitido alterar configuração de outra instituição' });
      }
    }

    const instId = isGroupAdmin ? (bodyInstId || instituicaoId) : userInstituicaoId;

    if (!instId) {
      return res.status(400).json({ message: 'instituicao_id é obrigatório' });
    }

    if (!modo || !['PERCENTUAL', 'VALOR_FIXO'].includes(String(modo))) {
      return res.status(400).json({ message: 'modo deve ser PERCENTUAL ou VALOR_FIXO' });
    }

    if (modo === 'PERCENTUAL') {
      const p = Number(percentual);
      if (!Number.isFinite(p) || p <= 0 || p > 100) {
        return res.status(400).json({ message: 'percentual deve ser entre 0 e 100' });
      }
    }

    if (modo === 'VALOR_FIXO') {
      const v = Number(valor_fixo);
      if (!Number.isFinite(v) || v <= 0) {
        return res.status(400).json({ message: 'valor_fixo deve ser maior que zero' });
      }
    }

    const payload = {
      instituicao_id: instId,
      modo:           String(modo),
      percentual:     modo === 'PERCENTUAL' ? Number(percentual) : null,
      valor_fixo:     modo === 'VALOR_FIXO' ? Number(valor_fixo) : null,
      ativo:          ativo !== false && ativo !== 'false',
    };

    const { data, error } = await supabase
      .from('comissoes_config')
      .upsert(payload, { onConflict: 'instituicao_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });

    return res.status(200).json({ message: 'Configuração salva', config: data });
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
