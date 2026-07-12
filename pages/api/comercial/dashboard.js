import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const resolvedInstituicaoId = resolveInstituicaoId(req, authUser);

  // Filtros da URL
  const { instituicao_id, captador_id, curso_id, data_inicio, data_fim } = req.query;

  try {
    // ── 1. BUSCA DE LEADS COM FILTROS ────────────────────────────────────────
    let queryLeads = supabase
      .from('leads')
      .select('id, nome, status, created_at, instituicao_id, captado_por_id, cursoid, observacoes, instituicoes(nome), usuarios:captado_por_id(nomecompleto), cursos:cursoid(nome)');

    // Filtros de Contexto & Rota
    if (resolvedInstituicaoId) {
      queryLeads = queryLeads.eq('instituicao_id', resolvedInstituicaoId);
    } else if (instituicao_id) {
      queryLeads = queryLeads.eq('instituicao_id', instituicao_id);
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

    const { data: leads = [], error: errorLeads } = await queryLeads;
    if (errorLeads) throw errorLeads;

    // ── 2. BUSCA DE VENDAS COM FILTROS ───────────────────────────────────────
    let queryVendas = supabase
      .from('vendas_comerciais')
      .select('id, lead_id, instituicao_id, captador_id, curso_id, valor, status, created_at');

    if (resolvedInstituicaoId) {
      queryVendas = queryVendas.eq('instituicao_id', resolvedInstituicaoId);
    } else if (instituicao_id) {
      queryVendas = queryVendas.eq('instituicao_id', instituicao_id);
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

    let { data: vendas = [], error: errorVendas } = await queryVendas;
    
    // Fallback: se a tabela de vendas ainda não estiver pronta
    if (errorVendas) {
      console.warn('[API Dashboard] Tabela de vendas não disponível, parseando observações...');
      vendas = [];
      leads.forEach(l => {
        const marker = '[VENDA COMERCIAL REGISTRADA]';
        const idx = l.observacoes?.indexOf(marker);
        if (idx !== -1 && idx !== undefined) {
          try {
            const jsonStr = l.observacoes.substring(idx + marker.length).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.vendas_comerciais) {
              vendas.push({
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

    // ── 3. BUSCA DE RECEITAS COM FILTROS ─────────────────────────────────────
    let queryReceitas = supabase
      .from('financeiro_receitas_comerciais')
      .select('id, lead_id, instituicao_id, captador_id, valor_bruto, status, data_pagamento');

    if (resolvedInstituicaoId) {
      queryReceitas = queryReceitas.eq('instituicao_id', resolvedInstituicaoId);
    } else if (instituicao_id) {
      queryReceitas = queryReceitas.eq('instituicao_id', instituicao_id);
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

    let { data: receitas = [], error: errorReceitas } = await queryReceitas;
    if (errorReceitas) {
      receitas = [];
      leads.forEach(l => {
        const marker = '[RECEITA FINANCEIRA ASAAS]';
        const idx = l.observacoes?.indexOf(marker);
        if (idx !== -1 && idx !== undefined) {
          try {
            const jsonStr = l.observacoes.substring(idx + marker.length).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.financeiro_receitas_comerciais) {
              receitas.push({
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

    // ── 4. BUSCA DE COMISSÕES COM FILTROS ────────────────────────────────────
    let queryComissoes = supabase
      .from('financeiro_comissoes')
      .select('id, lead_id, instituicao_id, captador_id, valor_comissao, status, created_at');

    if (resolvedInstituicaoId) {
      queryComissoes = queryComissoes.eq('instituicao_id', resolvedInstituicaoId);
    } else if (instituicao_id) {
      queryComissoes = queryComissoes.eq('instituicao_id', instituicao_id);
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

    let { data: comissoes = [], error: errorComissoes } = await queryComissoes;
    if (errorComissoes) {
      comissoes = [];
      leads.forEach(l => {
        const marker = '[COMISSÃO GERADA]';
        const idx = l.observacoes?.indexOf(marker);
        if (idx !== -1 && idx !== undefined) {
          try {
            const jsonStr = l.observacoes.substring(idx + marker.length).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.financeiro_comissoes) {
              comissoes.push({
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

    // ── 5. CALCULO DOS KPIS ──────────────────────────────────────────────────
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

    // ── 6. DADOS DOS GRÁFICOS ────────────────────────────────────────────────
    
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

    // ── 7. TABELA "ÚLTIMAS CONVERSÕES" ───────────────────────────────────────
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
