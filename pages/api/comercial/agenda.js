import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const instituicaoId = resolveInstituicaoId(req, authUser);

  try {
    // 1. Buscar do Banco Físico
    const { data: followups = [], error } = await supabase
      .from('leads_followups')
      .select('*, leads(nome, telefone, whatsapp, email)')
      .eq('usuario_id', authUser.id)
      .eq('status', 'PENDENTE')
      .order('data_agendada', { ascending: true });

    if (error) {
      // Fallback
      console.warn('[API Agenda] Tabela leads_followups ausente ou erro, parseando observações de todos os leads...');
      
      let queryLeads = supabase.from('leads').select('id, nome, telefone, whatsapp, email, observacoes, instituicao_id');
      if (instituicaoId) queryLeads = queryLeads.eq('instituicao_id', instituicaoId);
      
      const { data: leads = [] } = await queryLeads;
      const parsedFollowups = [];

      leads.forEach(l => {
        const obs = l.observacoes || '';
        const marker = '[FOLLOWUP_AGENDADO]';
        const parts = obs.split(marker);

        parts.slice(1).forEach(part => {
          try {
            const lines = part.trim().split('\n\n')[0];
            const idxFim = lines.lastIndexOf('}');
            if (idxFim !== -1) {
              const cleanJson = lines.substring(0, idxFim + 1).trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed && parsed.status === 'PENDENTE') {
                parsedFollowups.push({
                  ...parsed,
                  lead_id: l.id,
                  leads: {
                    nome: l.nome,
                    telefone: l.telefone,
                    whatsapp: l.whatsapp,
                    email: l.email
                  }
                });
              }
            }
          } catch (_) {}
        });
      });

      return res.status(200).json(classificarFollowups(parsedFollowups));
    }

    return res.status(200).json(classificarFollowups(followups));
  } catch (err) {
    console.error('[API Agenda] Erro geral:', err.message);
    return res.status(500).json({ error: 'Erro interno ao carregar agenda.' });
  }
}

function classificarFollowups(list) {
  const agora = new Date();
  
  // Limiar de início do dia de hoje (00:00:00) e fim do dia (23:59:59)
  const hojeInicio = new Date(agora);
  hojeInicio.setHours(0, 0, 0, 0);
  const hojeFim = new Date(agora);
  hojeFim.setHours(23, 59, 59, 999);

  // Amanhã
  const amanhaInicio = new Date(hojeInicio);
  amanhaInicio.setDate(amanhaInicio.getDate() + 1);
  const amanhaFim = new Date(hojeFim);
  amanhaFim.setDate(amanhaFim.getDate() + 1);

  // Próximos 7 dias (excluindo hoje e amanhã)
  const proximosFim = new Date(hojeFim);
  proximosFim.setDate(proximosFim.getDate() + 7);

  const atrasados = [];
  const hoje = [];
  const amanha = [];
  const proximos = [];

  list.forEach(item => {
    const dataAg = new Date(item.data_agendada);

    if (dataAg < hojeInicio) {
      atrasados.push(item);
    } else if (dataAg >= hojeInicio && dataAg <= hojeFim) {
      hoje.push(item);
    } else if (dataAg >= amanhaInicio && dataAg <= amanhaFim) {
      amanha.push(item);
    } else if (dataAg > amanhaFim && dataAg <= proximosFim) {
      proximos.push(item);
    }
  });

  return {
    kpis: {
      totalAtrasados: atrasados.length,
      totalHoje: hoje.length,
      totalAmanha: amanha.length,
      totalProximos: proximos.length
    },
    atrasados,
    hoje,
    amanha,
    proximos
  };
}
