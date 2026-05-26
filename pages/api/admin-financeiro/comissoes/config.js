import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
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

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = req.query.instituicao_id || resolveInstituicaoId(req, authUser);

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
    const instId = bodyInstId || instituicaoId;

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
