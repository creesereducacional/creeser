import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

const isOperador = (user) =>
  hasPerfil(user, ['comercial_operador']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master']);

const isMasterRestrito = (user) =>
  hasPerfil(user, ['comercial_master']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

function calcularStats(leads) {
  const total       = leads.length;
  const novo        = leads.filter(l => l.status === 'novo').length;
  const contatado   = leads.filter(l => l.status === 'contatado').length;
  const interessado = leads.filter(l => l.status === 'interessado').length;
  const matriculado = leads.filter(l => l.status === 'matriculado').length;
  const perdido     = leads.filter(l => l.status === 'perdido').length;
  const taxaConversao = total > 0 ? Number(((matriculado / total) * 100).toFixed(1)) : 0;
  return { total, novo, contatado, interessado, matriculado, perdido, taxaConversao };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const operador   = isOperador(authUser);
  const master     = isMasterRestrito(authUser);
  const instituicaoId = resolveInstituicaoId(req, authUser);

  // ── Dados para OPERADOR (apenas seus próprios leads) ─────────────────────
  if (operador) {
    let leadsQuery = supabase.from('leads').select('status');
    if (instituicaoId) leadsQuery = applyInstituicaoFilter(leadsQuery, instituicaoId);
    leadsQuery = leadsQuery.eq('captado_por_id', authUser.id);

    const { data: leads = [], error } = await leadsQuery;
    if (error) return res.status(500).json({ error: error.message });

    const s = calcularStats(leads);

    // Comissões do operador
    const { data: comissoesOp = [] } = await supabase
      .from('comissoes_comerciais')
      .select('valor_comissao, status')
      .eq('captado_por_id', authUser.id);

    return res.status(200).json({
      tipo: 'operador',
      totalLeads: s.total,
      novo: s.novo,
      contatado: s.contatado,
      interessado: s.interessado,
      matriculado: s.matriculado,
      perdido: s.perdido,
      taxaConversao: s.taxaConversao,
      totalMatriculas: s.matriculado,
      comissoes: {
        pendente:  comissoesOp.filter(c => c.status === 'PENDENTE_REPASSE').reduce((sum, c) => sum + Number(c.valor_comissao || 0), 0),
        repassado: comissoesOp.filter(c => c.status === 'REPASSADO').reduce((sum, c) => sum + Number(c.valor_comissao || 0), 0),
        total:     comissoesOp.filter(c => c.status !== 'CANCELADO').reduce((sum, c) => sum + Number(c.valor_comissao || 0), 0),
      },
    });
  }

  // ── Dados para MASTER (próprios + equipe) ─────────────────────────────────
  if (master) {
    const masterId = Number(authUser.id);

    // 1. Buscar operadores vinculados
    const { data: operadores = [] } = await supabase
      .from('usuarios')
      .select('id, nomecompleto')
      .eq('comercial_master_id', masterId)
      .eq('perfil', 'comercial_operador');

    const operadorIds = operadores.map(o => o.id);
    const todosIds = [masterId, ...operadorIds];

    // 2. Buscar todos os leads da equipe (master + operadores)
    let leadsEquipeQuery = supabase.from('leads').select('captado_por_id, status');
    if (instituicaoId) leadsEquipeQuery = applyInstituicaoFilter(leadsEquipeQuery, instituicaoId);
    leadsEquipeQuery = leadsEquipeQuery.in('captado_por_id', todosIds);

    const { data: leadsEquipe = [], error: leadsError } = await leadsEquipeQuery;
    if (leadsError) return res.status(500).json({ error: leadsError.message });

    // 3. Stats gerais (equipe completa)
    const sGeral = calcularStats(leadsEquipe);

    // 4. Stats apenas meus (master)
    const meuLeads = leadsEquipe.filter(l => l.captado_por_id === masterId);
    const sMeu = calcularStats(meuLeads);

    const { data: comissoesEquipe = [] } = await supabase
      .from('comissoes_comerciais')
      .select('captado_por_id, valor_comissao, status')
      .in('captado_por_id', todosIds);

    const comissoesPorUser = {};
    for (const c of comissoesEquipe) {
      const uid = c.captado_por_id;
      if (!comissoesPorUser[uid]) comissoesPorUser[uid] = { total: 0, pendente: 0 };
      if (c.status !== 'CANCELADO') comissoesPorUser[uid].total += Number(c.valor_comissao || 0);
      if (c.status === 'PENDENTE_REPASSE') comissoesPorUser[uid].pendente += Number(c.valor_comissao || 0);
    }

    // 5. Ranking da equipe
    const ranking = todosIds.map(uid => {
      const isMe = uid === masterId;
      const nome = isMe
        ? (authUser.nome || authUser.nomecompleto || 'Você (Master)')
        : (operadores.find(o => o.id === uid)?.nomecompleto || `Operador #${uid}`);
      const leads = leadsEquipe.filter(l => l.captado_por_id === uid);
      const s = calcularStats(leads);
      const comissoes = comissoesPorUser[uid] || { total: 0, pendente: 0 };
      return {
        id: uid,
        nome,
        isMaster: isMe,
        totalLeads: s.total,
        matriculados: s.matriculado,
        taxaConversao: s.taxaConversao,
        valorComissao: comissoes.total,
        comissaoPendente: comissoes.pendente,
      };
    }).sort((a, b) => b.valorComissao - a.valorComissao || b.matriculados - a.matriculados);

    return res.status(200).json({
      tipo: 'master',
      // Stats equipe completa
      totalLeads:     sGeral.total,
      novo:           sGeral.novo,
      contatado:      sGeral.contatado,
      interessado:    sGeral.interessado,
      matriculado:    sGeral.matriculado,
      perdido:        sGeral.perdido,
      taxaConversao:  sGeral.taxaConversao,
      totalMatriculas: sGeral.matriculado,
      // Stats apenas do master
      meus: {
        totalLeads: sMeu.total,
        matriculado: sMeu.matriculado,
        taxaConversao: sMeu.taxaConversao,
      },
      // Equipe
      totalOperadores: operadores.length,
      ranking,
      // Resumo de comissões da equipe
      comissoes: {
        pendente:  comissoesEquipe.filter(c => c.status === 'PENDENTE_REPASSE').reduce((s, c) => s + Number(c.valor_comissao || 0), 0),
        repassado: comissoesEquipe.filter(c => c.status === 'REPASSADO').reduce((s, c) => s + Number(c.valor_comissao || 0), 0),
        total:     comissoesEquipe.filter(c => c.status !== 'CANCELADO').reduce((s, c) => s + Number(c.valor_comissao || 0), 0),
      },
    });
  }

  // ── Dados para ADMIN / GRUPO_ADMIN (visão institucional) ─────────────────
  let leadsQuery = supabase.from('leads').select('status');
  if (instituicaoId) leadsQuery = applyInstituicaoFilter(leadsQuery, instituicaoId);

  const { data: leads = [], error: leadsError } = await leadsQuery;
  if (leadsError) return res.status(500).json({ error: leadsError.message });

  const s = calcularStats(leads);

  let matriculasQuery = supabase.from('alunos').select('id', { count: 'exact', head: true });
  if (instituicaoId) matriculasQuery = applyInstituicaoFilter(matriculasQuery, instituicaoId);
  matriculasQuery = matriculasQuery.not('captado_por_id', 'is', null);
  const { count: totalMatriculas } = await matriculasQuery;

  return res.status(200).json({
    tipo: 'admin',
    totalLeads: s.total,
    novo: s.novo,
    contatado: s.contatado,
    interessado: s.interessado,
    matriculado: s.matriculado,
    perdido: s.perdido,
    taxaConversao: s.taxaConversao,
    totalMatriculas: totalMatriculas || 0,
  });
}

