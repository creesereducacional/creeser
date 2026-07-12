import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../../lib/auth-server';
import { registrarFollowUp, concluirFollowUp } from '../../../../../lib/comercial/followup-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const { id } = req.query;
  const leadId = id;
  if (!leadId) {
    return res.status(400).json({ error: 'ID do lead inválido.' });
  }

  const instituicaoId = resolveInstituicaoId(req, authUser);

  // ── GET: Listar Followups do Lead ──────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: dbFollowups, error } = await supabase
      .from('leads_followups')
      .select('*, usuarios(nomecompleto)')
      .eq('lead_id', leadId)
      .order('data_agendada', { ascending: true });

    if (error) {
      // Fallback
      const { data: lead } = await supabase.from('leads').select('observacoes').eq('id', leadId).single();
      if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

      const fakeFollowups = [];
      const obs = lead.observacoes || '';
      const marker = '[FOLLOWUP_AGENDADO]';
      const parts = obs.split(marker);

      parts.slice(1).forEach(part => {
        try {
          const lines = part.trim().split('\n\n')[0]; // Pega apenas o JSON
          const idxFim = lines.lastIndexOf('}');
          if (idxFim !== -1) {
            const cleanJson = lines.substring(0, idxFim + 1).trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && parsed.tipo) {
              fakeFollowups.push({
                ...parsed,
                lead_id: leadId,
                usuarios: { nomecompleto: 'Sistema (Fallback)' }
              });
            }
          }
        } catch (_) {}
      });

      return res.status(200).json(fakeFollowups);
    }

    return res.status(200).json(dbFollowups || []);
  }

  // ── POST: Agendar Followup ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { tipo, assunto, observacao, data_agendada, prioridade } = req.body || {};

    if (!tipo || !assunto?.trim() || !data_agendada) {
      return res.status(400).json({ error: 'Tipo, assunto e data agendada são obrigatórios.' });
    }

    const resFollowup = await registrarFollowUp(supabase, {
      lead_id: leadId,
      instituicao_id: instituicaoId,
      usuario_id: authUser.id,
      tipo,
      assunto: String(assunto).trim(),
      observacao: String(observacao || '').trim(),
      data_agendada,
      prioridade
    });

    return res.status(201).json({
      mensagem: 'Follow-up agendado com sucesso.',
      followup: resFollowup.data || { tipo, assunto, data_agendada, prioridade, status: 'PENDENTE' }
    });
  }

  // ── PUT: Concluir Followup ──────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { followupId, observacao_conclusao } = req.body || {};

    if (!followupId) {
      return res.status(400).json({ error: 'ID do follow-up é obrigatório.' });
    }

    const resultado = await concluirFollowUp(supabase, followupId, {
      lead_id: leadId,
      instituicao_id: instituicaoId,
      usuario_id: authUser.id,
      observacao_conclusao
    });

    if (resultado.status === 'ERRO') {
      return res.status(500).json({ error: resultado.error });
    }

    return res.status(200).json({ mensagem: 'Follow-up concluído com sucesso.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
