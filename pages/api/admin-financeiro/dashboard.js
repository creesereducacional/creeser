import { createClient } from '@supabase/supabase-js';

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
    // 1. Total de alunos com pendências
    const { data: parcelasPendentes } = await supabase
      .from('financeiro_parcelas')
      .select('aluno_id, valor')
      .eq('status', 'pendente');

    const alunosComPendencias = new Set((parcelasPendentes || []).map(p => p.aluno_id)).size;
    const totalReceber = (parcelasPendentes || []).reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

    // 2. Boletos vencidos
    const hoje = new Date().toISOString().split('T')[0];
    const { data: parcelasVencidas } = await supabase
      .from('financeiro_parcelas')
      .select('id, valor')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje);

    const qtdBoletosVencidos = (parcelasVencidas || []).length;
    const valorVencido = (parcelasVencidas || []).reduce((acc, p) => {
      return acc + (Number(p.valor) || 0);
    }, 0);

    // 4. Total de ordens (ordem_simples)
    const { data: ordens } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, valor_total')
      .eq('tipo', 'ordem_simples');

    // 5. Total de carnês (carne)
    const { data: carnes } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, valor_total')
      .eq('tipo', 'carne');

    // 6. Parcelas pagas (para calcular taxa de recebimento)
    const { data: parcelasPagas } = await supabase
      .from('financeiro_parcelas')
      .select('id, valor')
      .eq('status', 'pago');

    const totalRecebido = (parcelasPagas || []).reduce((acc, p) => {
      return acc + (Number(p.valor) || 0);
    }, 0);

    // 7. Total de todas as parcelas (para calcular taxa)
    const { data: todasParc } = await supabase
      .from('financeiro_parcelas')
      .select('id, valor');

    const totalGerado = (todasParc || []).reduce((acc, p) => {
      return acc + (Number(p.valor) || 0);
    }, 0);

    const taxaRecebimento = totalGerado > 0 ? ((totalRecebido / totalGerado) * 100).toFixed(1) : 0;

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
