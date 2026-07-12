import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
      return;
    }

    const { id } = req.query;
    const { telefone } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'ID da parcela é obrigatório' });
    }

    // Buscar a parcela e a ordem correspondente
    const { data: parcela, error: parcelaError } = await supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, valor, data_vencimento, status, boleto_url, ordem_pagamento_id, financeiro_ordens_pagamento(aluno_id, instituicao_id)')
      .eq('id', id)
      .maybeSingle();

    if (parcelaError || !parcela) {
      return res.status(404).json({ message: 'Parcela não encontrada' });
    }

    const o = parcela.financeiro_ordens_pagamento || {};
    const usuarioId = authUser.id ? Number(authUser.id) : null;

    // Registrar no financeiro_logs
    await supabase.from('financeiro_logs').insert({
      parcela_id: id,
      aluno_id: o.aluno_id || null,
      instituicao_id: o.instituicao_id || null,
      usuario_id: usuarioId,
      acao: 'whatsapp_segunda_via',
      metodo_pagamento: null,
      data_pagamento: null,
      observacao: `2ª via enviada via WhatsApp para o telefone: ${telefone || 'N/A'}`,
      dados_extras: {
        forma_envio: 'WhatsApp',
        ordem_pagamento_id: parcela.ordem_pagamento_id,
        telefone_utilizado: telefone || 'N/A',
        usuario_email: authUser.email || null,
      }
    });

    // Registrar no audit_logs se possível/existente (silencioso)
    try {
      await supabase.from('audit_logs').insert([{
        usuario_id: usuarioId,
        usuario_email: authUser.email || null,
        perfil: authUser.perfil || authUser.tipo || null,
        acao: 'WHATSAPP_SEGUNDA_VIA',
        detalhes: `Envio de 2ª via por WhatsApp da parcela #${parcela.numero_parcela} (Ordem: ${parcela.ordem_pagamento_id}) para o telefone ${telefone}`
      }]);
    } catch (_) {}

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro ao registrar log de auditoria do WhatsApp:', error);
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}
