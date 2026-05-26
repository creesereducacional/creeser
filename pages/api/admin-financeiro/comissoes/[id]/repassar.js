import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function registrarLog(payload) {
  try { await supabase.from('financeiro_logs').insert(payload); } catch (_) {}
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const { id } = req.query;
  const { data_repasse, observacao } = req.body || {};

  if (!data_repasse || !/^\d{4}-\d{2}-\d{2}$/.test(String(data_repasse))) {
    return res.status(400).json({ message: 'data_repasse obrigatória no formato YYYY-MM-DD' });
  }

  // Buscar comissão
  const { data: comissao, error: findErr } = await supabase
    .from('comissoes_comerciais')
    .select('id, status, instituicao_id, captado_por_id, valor_comissao')
    .eq('id', id)
    .maybeSingle();

  if (findErr) return res.status(500).json({ message: findErr.message });
  if (!comissao) return res.status(404).json({ message: 'Comissão não encontrada' });

  // Isolamento multi-tenant
  if (!isGroupAdmin) {
    const tokenInst = authUser.instituicao_id || authUser.instituicaoId || null;
    if (tokenInst && comissao.instituicao_id && tokenInst !== comissao.instituicao_id) {
      return res.status(403).json({ message: 'Acesso negado: comissão pertence a outra instituição' });
    }
  }

  if (comissao.status !== 'PENDENTE_REPASSE') {
    return res.status(422).json({
      message: `Comissão não está pendente (status atual: ${comissao.status})`,
    });
  }

  const usuarioId = authUser.id ? Number(authUser.id) : null;
  const agora     = new Date().toISOString();

  const { data: updated, error: updErr } = await supabase
    .from('comissoes_comerciais')
    .update({
      status:            'REPASSADO',
      data_repasse:      String(data_repasse),
      repassado_por_id:  usuarioId,
      observacao:        observacao ? String(observacao).trim().slice(0, 500) : null,
      updated_at:        agora,
    })
    .eq('id', id)
    .select('id, status, data_repasse, valor_comissao')
    .single();

  if (updErr) return res.status(500).json({ message: updErr.message });

  await registrarLog({
    usuario_id:    usuarioId,
    acao:          'comissao_repassada',
    instituicao_id: comissao.instituicao_id,
    dados_extras:  {
      comissao_id:     id,
      captado_por_id:  comissao.captado_por_id,
      valor_comissao:  comissao.valor_comissao,
      data_repasse:    String(data_repasse),
    },
  });

  return res.status(200).json({
    message:  'Comissão marcada como repassada',
    comissao: updated,
  });
}
