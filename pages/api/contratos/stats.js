import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  applyInstituicaoFilter,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STATUS_CONTRATO = ['NAO_GERADO', 'GERADO', 'ENVIADO_ASSINATURA', 'ASSINADO', 'RECUSADO', 'EXPIRADO'];
const PERFIS = ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'financeiro'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo nao permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  try {
    // Buscar contagem por status_contrato
    const counts = {};
    for (const status of STATUS_CONTRATO) {
      let q = supabase
        .from('alunos')
        .select('id', { count: 'exact', head: true })
        .eq('status_contrato', status);
      q = applyInstituicaoFilter(q, instituicaoId);
      const { count } = await q;
      counts[status] = count || 0;
    }

    // Alunos ATIVO sem contrato assinado (alerta)
    let alertQ = supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true })
      .eq('statusmatricula', 'ATIVO')
      .neq('status_contrato', 'ASSINADO');
    alertQ = applyInstituicaoFilter(alertQ, instituicaoId);
    const { count: ativosSemContrato } = await alertQ;

    // Total de alunos
    let totalQ = supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true });
    totalQ = applyInstituicaoFilter(totalQ, instituicaoId);
    const { count: total } = await totalQ;

    return res.status(200).json({
      counts,
      ativosSemContrato: ativosSemContrato || 0,
      total:             total || 0,
      pendentesAssinatura: (counts['GERADO'] || 0) + (counts['ENVIADO_ASSINATURA'] || 0),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
