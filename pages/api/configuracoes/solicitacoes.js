import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('solicitacoes_tipos').select('*').order('nome');
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const { data, error } = await supabase.from('solicitacoes_tipos').insert({
      nome:                       body.nome                                                || '',
      dias_entrega:               body.diasEntrega              || body.dias_entrega       || 5,
      tolerancia:                 body.tolerancia               || null,
      observacoes:                body.observacoes              || null,
      paga:                       body.paga                     ?? false,
      valor_solicitacao:          body.valorSolicitacao         || body.valor_solicitacao  || 0,
      dias_vencimento:            body.diasVencimento           || body.dias_vencimento    || null,
      solicitacao_negociacao:     body.solicitacaoNegociacao    ?? false,
      solicitacao_contestacao:    body.solicitacaoContestacao   ?? false,
      situacao:                   body.situacao                 || 'ATIVO',
      instituicao_id:             instId                        || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
