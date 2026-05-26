import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase.from('solicitacoes_tipos').update({
      nome:                       body.nome                                                || null,
      dias_entrega:               body.diasEntrega              || body.dias_entrega       || null,
      tolerancia:                 body.tolerancia               || null,
      observacoes:                body.observacoes              || null,
      paga:                       body.paga                     ?? null,
      valor_solicitacao:          body.valorSolicitacao         || body.valor_solicitacao  || null,
      dias_vencimento:            body.diasVencimento           || body.dias_vencimento    || null,
      solicitacao_negociacao:     body.solicitacaoNegociacao    ?? null,
      solicitacao_contestacao:    body.solicitacaoContestacao   ?? null,
      situacao:                   body.situacao                 || null,
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('solicitacoes_tipos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
