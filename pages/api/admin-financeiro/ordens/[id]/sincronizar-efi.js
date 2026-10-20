import { createClient } from '@supabase/supabase-js';
import {
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';
import { sincronizarBaixaEfi } from '../../../../../lib/efi/EfiSyncService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser)
    : ctx.instituicaoId;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'ID da ordem não informado' });
  }

  // 1. Buscar ordem
  const { data: ordem, error: findError } = await supabase
    .from('financeiro_ordens_pagamento')
    .select('id, status, instituicao_id, efi_charge_id, efi_carnet_id, efi_status')
    .eq('id', id)
    .maybeSingle();

  if (findError || !ordem) {
    return res.status(404).json({ message: 'Ordem não encontrada.' });
  }

  if (!isGroupAdmin) {
    const ordemInst = ordem.instituicao_id || null;
    if (userInstituicaoId && ordemInst && userInstituicaoId !== ordemInst) {
      return res.status(403).json({ message: 'Acesso negado: a ordem pertence a outra instituição' });
    }
  }

  // Idempotência: não permitir sincronização se a ordem estiver cancelada
  if (ordem.status === 'cancelado') {
    return res.status(422).json({ message: 'Ordem cancelada. Sincronização não permitida.' });
  }

  const usuarioId = authUser.id ? Number(authUser.id) : null;

  try {
    const resultadoEfi = await sincronizarBaixaEfi({
      supabase,
      ordemId: id,
      usuarioId,
    });

    return res.status(200).json({
      message: resultadoEfi.mensagem,
      efi: resultadoEfi,
      sync_status: resultadoEfi.syncStatus,
    });
  } catch (err) {
    console.error('[ordens/sincronizar-efi] Erro na sincronização:', err);
    return res.status(500).json({
      message: 'Falha ao sincronizar com a EFI: ' + err.message,
      sync_status: 'pendente',
    });
  }
}
