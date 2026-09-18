import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';
import { rateLimit, getClientIp } from '../../../../lib/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

const STATUS_VALIDOS = ['novo', 'contatado', 'interessado', 'proposta_enviada', 'aguardando_pagamento', 'pago', 'matriculado', 'perdido', 'pre_matricula', 'desistente'];

async function registrarAuditoria(leadId, usuarioId, acao, dadosAnteriores, dadosNovos) {
  try {
    await supabase.from('leads_auditoria').insert({
      lead_id: leadId,
      usuario_id: usuarioId,
      acao,
      dados_anteriores: dadosAnteriores || null,
      dados_novos: dadosNovos || null,
    });
  } catch (_) { /* auditoria não deve bloquear a operação */ }
}

// Operador só vê seus próprios leads
const isOperador = (user) =>
  hasPerfil(user, ['comercial_operador']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'comercial_master']);

// Master (inclui legacy 'comercial') vê equipe — não é admin-level
const isMasterRestrito = (user) =>
  hasPerfil(user, ['comercial_master']) &&
  !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

// Obtém IDs dos operadores vinculados ao master
async function getEquipeIds(masterId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('comercial_master_id', masterId)
    .eq('perfil', 'comercial_operador');
  return (data || []).map(o => o.id);
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

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

  // ── GET: listar leads ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isGroupAdmin) {
      query = applyInstituicaoFilter(query, userInstituicaoId);
    }

    if (isOperador(authUser)) {
      // Operador: apenas seus próprios leads
      query = query.eq('captado_por_id', authUser.id);
    } else if (isMasterRestrito(authUser)) {
      // Master: próprios leads + leads dos operadores vinculados
      const operadorIds = await getEquipeIds(Number(authUser.id));
      const todosIds = [Number(authUser.id), ...operadorIds];
      query = query.in('captado_por_id', todosIds);
    }
    // Admin-level: vê todos da instituição (sem filtro adicional)

    const { status } = req.query;
    if (status && STATUS_VALIDOS.includes(status)) {
      query = query.eq('status', status);
    }

    const { data: rawLeads, error } = await query;
    if (error) {
      console.error('[leads/GET]', error.message);
      return res.status(500).json({ error: 'Erro interno ao carregar leads' });
    }

    const leadsCarregados = rawLeads || [];

    // ── Resolução de Unidade em Lote para Filial ─────────────────────────────
    let leadsFiltrados = leadsCarregados;

    if (ctx.unidadesPermitidas !== null && leadsCarregados.length > 0) {
      const alunoConvertidoIds = Array.from(
        new Set(leadsCarregados.map(l => l.aluno_convertido_id).filter(Boolean))
      );

      const alunoUnidadeMap = new Map();

      if (alunoConvertidoIds.length > 0) {
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
          .in('aluno_id', alunoConvertidoIds);

        if (matriculasData) {
          const matriculasOrdenadas = [...matriculasData].sort((a, b) => {
            if (a.is_principal && !b.is_principal) return -1;
            if (!a.is_principal && b.is_principal) return 1;
            return 0;
          });

          for (const m of matriculasOrdenadas) {
            if (!alunoUnidadeMap.has(m.aluno_id)) {
              const uid = m.turmas?.unidadeid != null ? Number(m.turmas.unidadeid) : null;
              if (uid !== null) {
                alunoUnidadeMap.set(m.aluno_id, uid);
              }
            }
          }
        }

        // 2. Fallback legado em alunos(turmaid, turmas(unidadeid))
        const pendentesAlunoIds = alunoConvertidoIds.filter(id => !alunoUnidadeMap.has(id));
        if (pendentesAlunoIds.length > 0) {
          const { data: alunosData } = await supabase
            .from('alunos')
            .select('id, turmaid, turmas(id, unidadeid)')
            .in('id', pendentesAlunoIds);

          if (alunosData) {
            for (const a of alunosData) {
              const uid = a.turmas?.unidadeid != null ? Number(a.turmas.unidadeid) : null;
              if (uid !== null) {
                alunoUnidadeMap.set(a.id, uid);
              }
            }
          }
        }
      }

      leadsFiltrados = leadsCarregados.filter(l => {
        // Lead não convertido: permanece na regra de carteira/institucional
        if (!l.aluno_convertido_id) {
          return true;
        }

        // Lead convertido: verificar unidade do aluno
        const unidadeId = alunoUnidadeMap.get(l.aluno_convertido_id) ?? null;

        // Se a unidade for indeterminável, preservar no escopo institucional legado
        if (unidadeId === null) {
          return true;
        }

        return ctx.unidadesPermitidas.includes(unidadeId);
      });
    }

    // Buscar followups pendentes dos leads da lista filtrada
    const leadIds = leadsFiltrados.map(l => l.id);
    let followupsMap = {};
    if (leadIds.length > 0) {
      try {
        const { data: followupsList } = await supabase
          .from('leads_followups')
          .select('lead_id, data_agendada, prioridade')
          .in('lead_id', leadIds)
          .eq('status', 'PENDENTE')
          .order('data_agendada', { ascending: true });

        if (followupsList) {
          followupsList.forEach(f => {
            if (!followupsMap[f.lead_id]) {
              followupsMap[f.lead_id] = f; // Mais próximo
            }
          });
        }
      } catch (_) {}
    }

    // Enriquecer dados dos leads
    const enrichedData = leadsFiltrados.map(l => {
      let nextF = followupsMap[l.id];
      if (!nextF) {
        // Tentar parsear das observações (fallback)
        const obs = l.observacoes || '';
        const marker = '[FOLLOWUP_AGENDADO]';
        const parts = obs.split(marker);
        let firstPending = null;
        parts.slice(1).forEach(part => {
          try {
            const lines = part.trim().split('\n\n')[0];
            const idxFim = lines.lastIndexOf('}');
            if (idxFim !== -1) {
              const cleanJson = lines.substring(0, idxFim + 1).trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed && parsed.status === 'PENDENTE') {
                if (!firstPending || new Date(parsed.data_agendada) < new Date(firstPending.data_agendada)) {
                  firstPending = parsed;
                }
              }
            }
          } catch (_) {}
        });
        if (firstPending) {
          nextF = {
            data_agendada: firstPending.data_agendada,
            prioridade: firstPending.prioridade
          };
        }
      }

      let diasAtraso = 0;
      if (nextF) {
        const diffTime = new Date() - new Date(nextF.data_agendada);
        if (diffTime > 0) {
          diasAtraso = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      return {
        ...l,
        proximo_contato: nextF ? nextF.data_agendada : null,
        dias_em_atraso: diasAtraso,
        prioridade_followup: nextF ? nextF.prioridade : null
      };
    });

    return res.status(200).json(enrichedData);
  }

  // ── POST: criar lead ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    // Rate limit: 30 leads por IP a cada hora
    const ip = getClientIp(req);
    const rl = rateLimit({ key: `lead_criar:${ip}`, limit: 30, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de criar mais leads.' });
    }
    const { nome, telefone, whatsapp, email, curso_interesse, origem, observacoes, status } = req.body || {};

    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const statusFinal = status && STATUS_VALIDOS.includes(status) ? status : 'novo';

    const novoLead = {
      instituicao_id: userInstituicaoId,
      nome: String(nome).trim(),
      telefone: telefone ? String(telefone).trim() : null,
      whatsapp: whatsapp ? String(whatsapp).trim() : null,
      email: email ? String(email).trim().toLowerCase() : null,
      curso_interesse: curso_interesse ? String(curso_interesse).trim() : null,
      origem: origem ? String(origem).trim() : null,
      observacoes: observacoes ? String(observacoes).trim() : null,
      status: statusFinal,
      captado_por_id: authUser.id,
    };

    const { data, error } = await supabase.from('leads').insert(novoLead).select().single();
    if (error) return res.status(500).json({ error: error.message });

    await registrarAuditoria(data.id, authUser.id, 'criacao', null, novoLead);

    // Timeline 360
    try {
      const { registrarInteracao } = require('../../../../lib/comercial/interacao-service');
      await registrarInteracao(supabase, data.id, {
        instituicao_id: userInstituicaoId,
        usuario_id: authUser.id,
        tipo: 'criacao',
        descricao: 'Ficha de Matrícula Comercial cadastrada no sistema'
      });
    } catch (_) {}

    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
