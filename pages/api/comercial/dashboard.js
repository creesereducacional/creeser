import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = [
  'grupo_admin',
  'instituicao_admin',
  'admin',
  'financeiro',
  'comercial',
  'comercial_master',
  'comercial_operador',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

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

  // Filtros da URL
  const { captador_id, curso_id, data_inicio, data_fim } = req.query;

  try {
    // ── 2. BUSCA DE LEADS COM FILTROS ────────────────────────────────────────
    let queryLeads = supabase
      .from('leads')
      .select(`
        id, nome, status, created_at, instituicao_id, captado_por_id, cursoid, observacoes,
        aluno_convertido_id,
        instituicoes(nome), usuarios:captado_por_id(nomecompleto), cursos:cursoid(nome)
      `);

    if (!isGroupAdmin) {
      queryLeads = applyInstituicaoFilter(queryLeads, userInstituicaoId);
    }

    if (captador_id) {
      queryLeads = queryLeads.eq('captado_por_id', captador_id);
    }
    if (curso_id) {
      queryLeads = queryLeads.eq('cursoid', curso_id);
    }
    if (data_inicio) {
      queryLeads = queryLeads.gte('created_at', data_inicio);
    }
    if (data_fim) {
      queryLeads = queryLeads.lte('created_at', data_fim);
    }

    const { data: rawLeads = [], error: errorLeads } = await queryLeads;
    if (errorLeads) throw errorLeads;

    // ── 3. BUSCA DE VENDAS COM FILTROS ───────────────────────────────────────
    let queryVendas = supabase
      .from('vendas_comerciais')
      .select('id, lead_id, instituicao_id, captador_id, curso_id, valor, status, created_at');

    if (!isGroupAdmin) {
      queryVendas = applyInstituicaoFilter(queryVendas, userInstituicaoId);
    }
    if (captador_id) {
      queryVendas = queryVendas.eq('captador_id', captador_id);
    }
    if (curso_id) {
      queryVendas = queryVendas.eq('curso_id', curso_id);
    }
    if (data_inicio) {
      queryVendas = queryVendas.gte('created_at', data_inicio);
    }
    if (data_fim) {
      queryVendas = queryVendas.lte('created_at', data_fim);
    }

    let { data: rawVendas = [], error: errorVendas } = await queryVendas;

    // Fallback: se a tabela de vendas ainda não estiver pronta
    if (errorVendas) {
      console.warn('[API Dashboard] Tabela de vendas não disponível, parseando observações...');
      rawVendas = [];
      rawLeads.forEach(l => {
        const marker = '[VENDA COMERCIAL REGISTRADA]';
        const idx = l.observacoes?.indexOf(marker);
        if (idx !== -1 && idx !== undefined) {
          try {
            const jsonStr = l.observacoes.substring(idx + marker.length).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.vendas_comerciais) {
              rawVendas.push({
                lead_id: l.id,
                instituicao_id: l.instituicao_id,
                captador_id: l.captado_por_id,
                curso_id: l.cursoid,
                valor: parsed.vendas_comerciais.valor,
                status: parsed.vendas_comerciais.status,
                created_at: l.created_at
              });
            }
          } catch (_) {}
        }
      });
    }

    // ── 4. BUSCA DE RECEITAS COM FILTROS ─────────────────────────────────────
    let queryReceitas = supabase
      .from('financeiro_receitas_comerciais')
      .select('id, lead_id, instituicao_id, captador_id, valor_bruto, status, data_pagamento');

    if (!isGroupAdmin) {
      queryReceitas = applyInstituicaoFilter(queryReceitas, userInstituicaoId);
    }
    if (captador_id) {
      queryReceitas = queryReceitas.eq('captador_id', captador_id);
    }
    if (data_inicio) {
      queryReceitas = queryReceitas.gte('data_pagamento', data_inicio);
    }
    if (data_fim) {
      queryReceitas = queryReceitas.lte('data_pagamento', data_fim);
    }

    let { data: rawReceitas = [], error: errorReceitas } = await queryReceitas;
    if (errorReceitas) {
      rawReceitas = [];
      rawLeads.forEach(l => {
        const marker = '[RECEITA FINANCEIRA ASAAS]';
        const idx = l.observacoes?.indexOf(marker);
        if (idx !== -1 && idx !== undefined) {
          try {
            const jsonStr = l.observacoes.substring(idx + marker.length).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.financeiro_receitas_comerciais) {
              rawReceitas.push({
                lead_id: l.id,
                instituicao_id: l.instituicao_id,
                captador_id: l.captado_por_id,
                valor_bruto: parsed.financeiro_receitas_comerciais.valor_bruto,
                status: parsed.financeiro_receitas_comerciais.status,
                data_pagamento: parsed.financeiro_receitas_comerciais.data_pagamento
              });
            }
          } catch (_) {}
        }
      });
    }

    // ── 5. BUSCA DE COMISSÕES COM FILTROS ────────────────────────────────────
    let queryComissoes = supabase
      .from('financeiro_comissoes')
      .select('id, lead_id, instituicao_id, captador_id, valor_comissao, status, created_at');

    if (!isGroupAdmin) {
      queryComissoes = applyInstituicaoFilter(queryComissoes, userInstituicaoId);
    }
    if (captador_id) {
      queryComissoes = queryComissoes.eq('captador_id', captador_id);
    }
    if (data_inicio) {
      queryComissoes = queryComissoes.gte('created_at', data_inicio);
    }
    if (data_fim) {
      queryComissoes = queryComissoes.lte('created_at', data_fim);
    }

    let { data: rawComissoes = [], error: errorComissoes } = await queryComissoes;
    if (errorComissoes) {
      rawComissoes = [];
      rawLeads.forEach(l => {
        const marker = '[COMISSÃO GERADA]';
        const idx = l.observacoes?.indexOf(marker);
        if (idx !== -1 && idx !== undefined) {
          try {
            const jsonStr = l.observacoes.substring(idx + marker.length).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.financeiro_comissoes) {
              rawComissoes.push({
                lead_id: l.id,
                instituicao_id: l.instituicao_id,
                captador_id: l.captado_por_id,
                valor_comissao: parsed.financeiro_comissoes.valor_comissao,
                status: parsed.financeiro_comissoes.status,
                created_at: l.created_at
              });
            }
          } catch (_) {}
        }
      });
    }

    // ── 6. RESOLUÇÃO DE ESCOPO DE UNIDADE PARA FILIAL (LOTE / SEM N+1) ────────
    let leads = rawLeads;
    let vendas = rawVendas;
    let receitas = rawReceitas;
    let comissoes = rawComissoes;

    if (ctx.unidadesPermitidas !== null) {
      // Coletar alunos convertidos vinculados aos leads carregados
      const alunoConvertidoIds = Array.from(
        new Set(rawLeads.map(l => l.aluno_convertido_id).filter(Boolean))
      );

      const alunoUnidadeMap = new Map();

      if (alunoConvertidoIds.length > 0) {
        // 1. Buscar matrículas com turmas(unidadeid)
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

        // 2. Fallback legado em alunos(turmaid, turmas(unidadeid)) para os que restaram sem unidade
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

      // Mapear cada lead para sua unidade determinável
      const leadUnidadeMap = new Map();
      const leadsPermitidosSet = new Set();

      for (const l of rawLeads) {
        let uId = null;
        if (l.aluno_convertido_id) {
          uId = alunoUnidadeMap.get(l.aluno_convertido_id) ?? null;
        }

        if (uId !== null) {
          leadUnidadeMap.set(l.id, uId);
          if (ctx.unidadesPermitidas.includes(uId)) {
            leadsPermitidosSet.add(l.id);
          }
        } else {
          // Lead sem aluno/unidade determinável: permanece no escopo institucional
          leadsPermitidosSet.add(l.id);
        }
      }

      // Filtrar leads
      leads = rawLeads.filter(l => leadsPermitidosSet.has(l.id));

      // Filtrar vendas: se vinculada a lead, deve pertencer a lead permitido
      vendas = rawVendas.filter(v => {
        if (!v.lead_id) return true;
        return leadsPermitidosSet.has(v.lead_id);
      });

      // Filtrar receitas: se vinculada a lead, deve pertencer a lead permitido
      receitas = rawReceitas.filter(r => {
        if (!r.lead_id) return true;
        return leadsPermitidosSet.has(r.lead_id);
      });

      // Filtrar comissoes: se vinculada a lead, deve pertencer a lead permitido
      comissoes = rawComissoes.filter(c => {
        if (!c.lead_id) return true;
        return leadsPermitidosSet.has(c.lead_id);
      });
    }

    // ── 7. CÁLCULO DOS KPIS (SOMENTE SOBRE O CONJUNTO AUTORIZADO) ────────────
    const totalLeads = leads.length;
    const leadsNovos = leads.filter(l => l.status === 'novo').length;
    const leadsNegociacao = leads.filter(l => l.status === 'contatado' || l.status === 'interessado').length;

    // Cobranças Pendentes (Vendas aguardando pagamento)
    const cobrancasPendentes = vendas.filter(v => v.status === 'AGUARDANDO_PAGAMENTO').length;
    
    // Pagamentos Confirmados (Vendas pagas ou matriculadas)
    const pagamentosConfirmados = vendas.filter(v => v.status === 'PAGO' || v.status === 'MATRICULADO').length;
    const vendasConvertidas = vendas.filter(v => v.status === 'MATRICULADO').length;

    const taxaConversao = totalLeads > 0 ? parseFloat(((vendasConvertidas / totalLeads) * 100).toFixed(1)) : 0;

    // Receita comercial
    const receitaComercial = receitas
      .filter(r => r.status === 'Recebido')
      .reduce((sum, r) => sum + parseFloat(r.valor_bruto || 0), 0);

    // Comissões
    const comissaoPendente = comissoes
      .filter(c => c.status === 'PENDENTE')
      .reduce((sum, c) => sum + parseFloat(c.valor_comissao || 0), 0);
    const comissaoLiberada = comissoes
      .filter(c => c.status === 'REPASSADO')
      .reduce((sum, c) => sum + parseFloat(c.valor_comissao || 0), 0);

    // ── 8. DADOS DOS GRÁFICOS (RECALCULADOS SOBRE CONJUNTO AUTORIZADO) ────────
    
    // 1. Evolução de Leads por Mês
    const leadsPorMesMap = {};
    leads.forEach(l => {
      if (!l.created_at) return;
      const date = new Date(l.created_at);
      const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      leadsPorMesMap[label] = (leadsPorMesMap[label] || 0) + 1;
    });
    const evolucaoLeads = Object.entries(leadsPorMesMap).map(([rotulo, total]) => ({ rotulo, total }));

    // 2. Funil Comercial
    const funil = {
      lead: totalLeads,
      negociacao: leadsNegociacao,
      cobranca: cobrancasPendentes + pagamentosConfirmados,
      pago: pagamentosConfirmados,
      matriculado: vendasConvertidas
    };

    // 3. Receita Comercial por Instituição
    const receitaPorInstMap = {};
    receitas.forEach(r => {
      const instNome = r.instituicoes?.nome || `Instituição #${r.instituicao_id}`;
      receitaPorInstMap[instNome] = (receitaPorInstMap[instNome] || 0) + parseFloat(r.valor_bruto || 0);
    });
    const receitaPorInstituicao = Object.entries(receitaPorInstMap).map(([instituicao, total]) => ({
      instituicao,
      total
    }));

    // 4. Conversões por Captador
    const conversorMap = {};
    vendas.filter(v => v.status === 'MATRICULADO').forEach(v => {
      const captadorNome = leads.find(l => l.id === v.lead_id)?.usuarios?.nomecompleto || `Captador #${v.captador_id}`;
      conversorMap[captadorNome] = (conversorMap[captadorNome] || 0) + 1;
    });
    const conversõesPorCaptador = Object.entries(conversorMap).map(([captador, total]) => ({
      captador,
      total
    }));

    // ── 9. TABELA "ÚLTIMAS CONVERSÕES" ───────────────────────────────────────
    const ultimasVendas = vendas
      .filter(v => v.status === 'MATRICULADO' || v.status === 'PAGO')
      .slice(0, 10)
      .map(v => {
        const leadObj = leads.find(l => l.id === v.lead_id) || {};
        return {
          aluno: leadObj.nome || '—',
          instituicao: leadObj.instituicoes?.nome || '—',
          curso: leadObj.cursos?.nome || leadObj.curso_interesse || '—',
          captador: leadObj.usuarios?.nomecompleto || '—',
          valor: v.valor,
          status: v.status,
          data: v.created_at
        };
      });

    return res.status(200).json({
      kpis: {
        leadsNovos,
        leadsNegociacao,
        cobrancasPendentes,
        pagamentosConfirmados,
        vendasConvertidas,
        taxaConversao,
        receitaComercial,
        comissaoPendente,
        comissaoLiberada
      },
      graficos: {
        evolucaoLeads,
        funil,
        receitaPorInstituicao,
        conversõesPorCaptador
      },
      ultimasConversoes: ultimasVendas
    });
  } catch (error) {
    console.error('[API Dashboard Executivo] Erro:', error);
    return res.status(500).json({ error: 'Erro interno ao processar estatísticas.' });
  }
}
