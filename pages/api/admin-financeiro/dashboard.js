import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
      return;
    }

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
    const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

    if (!isGroupAdmin && !instituicaoId) {
      return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
    }

    // 1. Total de alunos com pendências
    let parcelasPendentesQuery = supabase
      .from('financeiro_parcelas')
      .select('aluno_id, valor')
      .eq('status', 'pendente');

    parcelasPendentesQuery = applyInstituicaoFilter(parcelasPendentesQuery, instituicaoId);
    const { data: parcelasPendentes } = await parcelasPendentesQuery;

    const alunosComPendencias = new Set((parcelasPendentes || []).map(p => p.aluno_id)).size;
    const totalReceber = (parcelasPendentes || []).reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

    // 2. Boletos vencidos
    const hoje = new Date().toISOString().split('T')[0];
    let parcelasVencidasQuery = supabase
      .from('financeiro_parcelas')
      .select('id, valor')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje);

    parcelasVencidasQuery = applyInstituicaoFilter(parcelasVencidasQuery, instituicaoId);
    const { data: parcelasVencidas } = await parcelasVencidasQuery;

    const qtdBoletosVencidos = (parcelasVencidas || []).length;
    const valorVencido = (parcelasVencidas || []).reduce((acc, p) => {
      return acc + (Number(p.valor) || 0);
    }, 0);

    // 4. Total de ordens (ordem_simples)
    let ordensQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('id, valor_total')
      .eq('tipo', 'ordem_simples');

    ordensQuery = applyInstituicaoFilter(ordensQuery, instituicaoId);
    const { data: ordens } = await ordensQuery;

    // 5. Total de carnês (carne)
    let carnesQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('id, valor_total')
      .eq('tipo', 'carne');

    carnesQuery = applyInstituicaoFilter(carnesQuery, instituicaoId);
    const { data: carnes } = await carnesQuery;

    // 6. Parcelas pagas (para calcular taxa de recebimento)
    let parcelasPagasQuery = supabase
      .from('financeiro_parcelas')
      .select('id, valor')
      .eq('status', 'pago');

    parcelasPagasQuery = applyInstituicaoFilter(parcelasPagasQuery, instituicaoId);
    const { data: parcelasPagas } = await parcelasPagasQuery;

    const totalRecebido = (parcelasPagas || []).reduce((acc, p) => {
      return acc + (Number(p.valor) || 0);
    }, 0);

    // 7. Total de todas as parcelas (para calcular taxa)
    let todasParcQuery = supabase
      .from('financeiro_parcelas')
      .select('id, valor');

    todasParcQuery = applyInstituicaoFilter(todasParcQuery, instituicaoId);
    const { data: todasParc } = await todasParcQuery;

    const totalGerado = (todasParc || []).reduce((acc, p) => {
      return acc + (Number(p.valor) || 0);
    }, 0);

    const taxaRecebimento = totalGerado > 0 ? ((totalRecebido / totalGerado) * 100).toFixed(1) : 0;

    // Buscar carnês ativos para calcular carnês a vencer
    let carnesAtivosQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('id, aluno_id, alunos(id, nome, matricula, cursos(nome), turmas(nome))')
      .eq('tipo', 'carne')
      .eq('status', 'ativo');

    carnesAtivosQuery = applyInstituicaoFilter(carnesAtivosQuery, instituicaoId);
    const { data: carnesList } = await carnesAtivosQuery;

    const carneIds = (carnesList || []).map(c => c.id);
    let parcelasCarne = [];
    if (carneIds.length > 0) {
      const { data: parcs } = await supabase
        .from('financeiro_parcelas')
        .select('id, ordem_pagamento_id, status, data_vencimento, valor')
        .in('ordem_pagamento_id', carneIds);
      if (parcs) parcelasCarne = parcs;
    }

    const carnesAVencerList = [];
    for (const c of (carnesList || [])) {
      const parcs = parcelasCarne.filter(p => p.ordem_pagamento_id === c.id);
      const restantes = parcs.filter(p => p.status !== 'pago' && p.status !== 'cancelado');
      if (restantes.length === 1) {
        const unica = restantes[0];
        carnesAVencerList.push({
          carne_id: c.id,
          aluno_id: c.aluno_id,
          aluno_nome: c.alunos?.nome || 'Sem nome',
          aluno_matricula: c.alunos?.matricula || '',
          curso: c.alunos?.cursos?.nome || '',
          turma: c.alunos?.turmas?.nome || '',
          valor_restante: Number(unica.valor) || 0,
          data_vencimento: unica.data_vencimento,
        });
      }
    }

    // Buscar detalhamento de alunos inadimplentes (valor em atraso)
    let parcelasAtrasoQuery = supabase
      .from('financeiro_parcelas')
      .select('valor, status, data_vencimento, aluno_id, alunos(id, nome, matricula, cursos(nome), turmas(nome))');

    parcelasAtrasoQuery = applyInstituicaoFilter(parcelasAtrasoQuery, instituicaoId);
    const { data: todasParcelasAtraso } = await parcelasAtrasoQuery;

    const hojeStr = new Date().toISOString().split('T')[0];
    const parcelasAtrasadas = (todasParcelasAtraso || []).filter(p => {
      const isVencido = p.status === 'vencido' || (p.status === 'pendente' && p.data_vencimento < hojeStr);
      return isVencido;
    });

    const inadimplentesMap = {};
    for (const p of parcelasAtrasadas) {
      const aluno = p.alunos;
      if (!aluno) continue;
      if (!inadimplentesMap[aluno.id]) {
        inadimplentesMap[aluno.id] = {
          aluno_id: aluno.id,
          nome: aluno.nome,
          matricula: aluno.matricula || '',
          curso: aluno.cursos?.nome || '',
          turma: aluno.turmas?.nome || '',
          valor_em_atraso: 0,
          qtd_parcelas_atrasadas: 0,
        };
      }
      inadimplentesMap[aluno.id].valor_em_atraso += Number(p.valor) || 0;
      inadimplentesMap[aluno.id].qtd_parcelas_atrasadas += 1;
    }

    const inadimplentesList = Object.values(inadimplentesMap).sort((a, b) => b.valor_em_atraso - a.valor_em_atraso);

    // Montar resposta
    const dados = {
      // EDUCACIONAL
      totalAlunosComPendencias: alunosComPendencias,
      totalAlunosAtivos: 0, // TODO: contar alunos com statusmatricula = ATIVO
      
      // FINANCEIRO
      totalAReceber: totalReceber,
      boletosVencidos: qtdBoletosVencidos,
      valorVencido: valorVencido,
      
      // ORDENS E CARNÊS
      totalOrdens: (ordens || []).length,
      valorTotalOrdens: (ordens || []).reduce((acc, o) => acc + (Number(o.valor_total) || 0), 0),
      totalCarnes: (carnes || []).length,
      valorTotalCarnes: (carnes || []).reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0),
      
      // RECEBIMENTO
      totalRecebido: totalRecebido,
      taxaRecebimento: parseFloat(taxaRecebimento),
      totalGerado: totalGerado,
      
      // NOVAS MÉTRICAS FASE 2A
      carnesAVencerCount: carnesAVencerList.length,
      carnesAVencerList: carnesAVencerList,
      alunosEmAtrasoList: inadimplentesList,
      
      // COMPATIBILIDADE COM INTERFACE ANTERIOR
      faturasPendentes: alunosComPendencias,
      receita30dias: totalReceber,
      mrr: totalReceber,
      arpu: alunosComPendencias > 0 ? (totalReceber / alunosComPendencias).toFixed(2) : 0
    };

    res.status(200).json(withLowercaseKeys(dados));
  } catch (error) {
    console.error('Erro ao calcular dashboard:', error);
    res.status(500).json({ 
      message: 'Erro ao calcular dashboard',
      error: error.message 
    });
  }
}
