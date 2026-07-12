import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../../lib/auth-server';
import { registrarInteracao } from '../../../../../lib/comercial/interacao-service';

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
  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({ error: 'ID do lead inválido.' });
  }

  const instituicaoId = resolveInstituicaoId(req, authUser);

  // ── GET: listar interações ────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: dbInteracoes, error } = await supabase
      .from('leads_interacoes')
      .select('*, usuarios(nomecompleto)')
      .eq('lead_id', leadId)
      .order('data_evento', { ascending: false });

    // Fallback: Se a tabela não existir, ler do campo observações do lead
    if (error) {
      const { data: lead } = await supabase
        .from('leads')
        .select('observacoes, created_at')
        .eq('id', leadId)
        .single();

      if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

      const fakeInteracoes = [];
      
      // Adicionar criação inicial fictícia
      fakeInteracoes.push({
        id: 'initial',
        lead_id: leadId,
        tipo: 'criacao',
        descricao: 'Ficha de Matrícula Comercial cadastrada no sistema',
        data_evento: lead.created_at || new Date().toISOString(),
        usuarios: { nomecompleto: 'Sistema (Conversão)' }
      });

      // Parsear as observações em busca de logs
      const obs = lead.observacoes || '';
      const regex = /\[TIMELINE_([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)/g;
      let match;
      let count = 0;
      while ((match = regex.exec(obs)) !== null) {
        const [, tipoLog, dataStr, desc] = match;
        
        // Tentar parsear a data
        let dEvt = new Date().toISOString();
        try {
          const [d, t] = dataStr.split(' ');
          const [day, month, year] = d.split('/');
          dEvt = new Date(`${year}-${month}-${day}T${t}`).toISOString();
        } catch (_) {}

        fakeInteracoes.push({
          id: `fake_${count++}`,
          lead_id: leadId,
          tipo: tipoLog.toLowerCase(),
          descricao: desc.trim(),
          data_evento: dEvt,
          usuarios: { nomecompleto: 'Sistema' }
        });
      }

      // Ordenar cronologicamente decrescente
      fakeInteracoes.sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));
      return res.status(200).json(fakeInteracoes);
    }

    return res.status(200).json(dbInteracoes || []);
  }

  // ── POST: criar interação manual ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { tipo, descricao } = req.body || {};

    if (!tipo || !descricao?.trim()) {
      return res.status(400).json({ error: 'Tipo e descrição são obrigatórios.' });
    }

    const resultado = await registrarInteracao(supabase, leadId, {
      instituicao_id: instituicaoId,
      usuario_id: authUser.id,
      tipo,
      descricao: String(descricao).trim(),
      metadata: { cadastrado_por: authUser.nome || authUser.email }
    });

    return res.status(201).json({
      mensagem: 'Interação registrada com sucesso.',
      interacao: resultado.data || { tipo, descricao, data_evento: new Date().toISOString() }
    });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
