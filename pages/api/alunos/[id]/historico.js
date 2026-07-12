import { createClient } from '@supabase/supabase-js';
import { requireAuth, resolveInstituicaoId } from '../../../../lib/auth-server';
import { obterDadosHistorico } from '../../../../lib/academic-documents/historico-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const { id: alunoId } = req.query;
  const instituicaoId = resolveInstituicaoId(req, authUser);

  try {
    const data = await obterDadosHistorico(supabase, parseInt(alunoId, 10), instituicaoId);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro na API de histórico:', error);
    return res.status(500).json({ error: error.message || 'Erro ao carregar histórico escolar.' });
  }
}
