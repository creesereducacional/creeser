/**
 * POST /api/contratos/aluno/[id]/marcar-gerado
 * Marca o contrato do aluno como GERADO quando o PDF é aberto.
 */
import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  applyInstituicaoFilter,
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS = ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'financeiro'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const alunoId = parseInt(req.query?.id, 10);
  if (!alunoId || isNaN(alunoId)) return res.status(400).json({ error: 'ID invalido' });

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  let q = supabase
    .from('alunos')
    .update({ status_contrato: 'GERADO' })
    .eq('id', alunoId)
    // Só atualizar se ainda NAO_GERADO (não retroagir de ASSINADO etc)
    .eq('status_contrato', 'NAO_GERADO');
  q = applyInstituicaoFilter(q, instituicaoId);

  const { error } = await q;
  if (error && (error.code === '42703' || String(error.message).includes('does not exist'))) {
    // Coluna ainda não existe — aceitar silenciosamente
    return res.status(200).json({ ok: true, aviso: 'Coluna status_contrato ainda nao aplicada no banco' });
  }
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true, status_contrato: 'GERADO' });
}
