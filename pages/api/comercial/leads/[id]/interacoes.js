import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';
import { registrarInteracaoLead } from '../../../../../lib/comercial/interacao-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

const isOperador = (user) =>
  hasPerfil(user, ['comercial_operador']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master']);

const isMasterRestrito = (user) =>
  (hasPerfil(user, ['comercial_master']) || hasPerfil(user, ['comercial'])) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

async function getEquipeIds(masterId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('comercial_master_id', masterId)
    .eq('perfil', 'comercial_operador');
  return (data || []).map(o => o.id);
}

/**
 * Resolve a unidade física de um aluno convertido:
 * aluno_convertido_id -> matriculas (prioriza is_principal) -> turmas.unidadeid
 * fallback: alunos.turmaid -> turmas.unidadeid
 */
async function resolverUnidadeAluno(alunoId) {
  if (!alunoId) return null;

  // 1. Matrículas com turmas(unidadeid)
  const { data: matriculasData } = await supabase
    .from('matriculas')
    .select(`
      id,
      aluno_id,
      turma_id,
      is_principal,
      turmas(id, unidadeid)
    `)
    .eq('aluno_id', alunoId);

  if (matriculasData && matriculasData.length > 0) {
    const matriculasOrdenadas = [...matriculasData].sort((a, b) => {
      if (a.is_principal && !b.is_principal) return -1;
      if (!a.is_principal && b.is_principal) return 1;
      return 0;
    });

    for (const m of matriculasOrdenadas) {
      const uid = m.turmas?.unidadeid != null ? Number(m.turmas.unidadeid) : null;
      if (uid !== null) {
        return uid;
      }
    }
  }

  // 2. Fallback legado: alunos.turmaid -> turmas.unidadeid
  const { data: alunoData } = await supabase
    .from('alunos')
    .select('id, turmaid, turmas(id, unidadeid)')
    .eq('id', alunoId)
    .maybeSingle();

  if (alunoData?.turmas?.unidadeid != null) {
    return Number(alunoData.turmas.unidadeid);
  }

  return null;
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const { id } = req.query;
  const leadId = id;
  if (!leadId) {
    return res.status(400).json({ error: 'ID do lead inválido.' });
  }

  // ── 1. Resolução do Contexto Instituição × Unidade ───────────────────────────
  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível ao verificar permissões de acesso',
      code: 'AUTH_CONTEXT_UNAVAILABLE',
    });
  }

  const isGroupAdmin = authUser.perfil === 'grupo_admin' || authUser.is_superadmin;
  const userInstituicaoId = ctx.instituicaoId;

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ error: 'Instituição não definida para o usuário atual' });
  }

  // ── 2. Buscar o lead com filtro de instituição + isolamento por perfil ───────
  let selectQuery = supabase.from('leads').select('*').eq('id', leadId);
  if (!isGroupAdmin) {
    selectQuery = applyInstituicaoFilter(selectQuery, userInstituicaoId);
  }

  if (isOperador(authUser)) {
    selectQuery = selectQuery.eq('captado_por_id', authUser.id);
  } else if (isMasterRestrito(authUser)) {
    const operadorIds = await getEquipeIds(Number(authUser.id));
    const todosIds = [Number(authUser.id), ...operadorIds];
    selectQuery = selectQuery.in('captado_por_id', todosIds);
  }

  const { data: lead, error: findError } = await selectQuery.maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

  // ── 3. Validação de Unidade para Filial se lead estiver convertido ───────────
  if (ctx.unidadesPermitidas !== null && lead.aluno_convertido_id) {
    const unidadeId = await resolverUnidadeAluno(lead.aluno_convertido_id);
    if (unidadeId !== null && !ctx.unidadesPermitidas.includes(unidadeId)) {
      return res.status(403).json({
        error: 'Acesso negado: lead convertido para unidade fora do seu escopo autorizado',
      });
    }
  }

  // ── GET: listar interações ────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: dbInteracoes, error } = await supabase
      .from('leads_interacoes')
      .select('*, usuarios(nomecompleto)')
      .eq('lead_id', leadId)
      .order('data_evento', { ascending: false });

    // Fallback: Se a tabela não existir, ler do campo observações do lead
    if (error) {
      const fakeInteracoes = [];
      
      // Adicionar criação inicial fictícia
      fakeInteracoes.push({
        id: 'initial',
        lead_id: leadId,
        tipo: 'criacao',
        titulo: 'Ficha Cadastrada',
        descricao: 'Ficha de Matrícula Comercial cadastrada no sistema',
        data_evento: lead.created_at || new Date().toISOString(),
        usuarios: { nomecompleto: 'Sistema (Conversão)' }
      });

      // Parsear as observações em busca de logs
      const obs = lead.observacoes || '';
      const regex = /\[TIMELINE_([^\]]+)\]\s*\[([^\]]+)\]\s*(?:\[([^\]]+)\]\s*)?(.*)/g;
      let match;
      let count = 0;
      while ((match = regex.exec(obs)) !== null) {
        const [, tipoLog, dataStr, tituloLog, desc] = match;
        
        // Tentar parsear a data
        let dEvt = new Date().toISOString();
        try {
          const [d, t] = dataStr.split(' ');
          const [day, month, year] = d.split('/');
          dEvt = new Date(`${year}-${month}-${day}T${t}`).toISOString();
        } catch (_) {}

        const finalTipo = tipoLog.toLowerCase();
        fakeInteracoes.push({
          id: `fake_${count++}`,
          lead_id: leadId,
          tipo: finalTipo,
          titulo: tituloLog || (finalTipo.charAt(0).toUpperCase() + finalTipo.slice(1).replace('_', ' ')),
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
    const { tipo, titulo, descricao } = req.body || {};

    if (!tipo || !descricao?.trim()) {
      return res.status(400).json({ error: 'Tipo e descrição são obrigatórios.' });
    }

    const resultado = await registrarInteracaoLead(supabase, leadId, {
      instituicao_id: lead.instituicao_id || userInstituicaoId,
      usuario_id: authUser.id,
      tipo,
      titulo: titulo || null,
      descricao: String(descricao).trim(),
      metadata: { cadastrado_por: authUser.nome || authUser.email }
    });

    return res.status(201).json({
      mensagem: 'Interação registrada com sucesso.',
      interacao: resultado.data || { tipo, titulo, descricao, data_evento: new Date().toISOString() }
    });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
