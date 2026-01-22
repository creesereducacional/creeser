export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // TODO: Implementar cálculos de métricas financeiras
    // Por enquanto, retornar dados de exemplo
    
    const dados = {
      totalClientes: 15,
      totalRecurring: 12,
      receita30dias: 45000.00,
      receita12meses: 520000.00,
      faturasPendentes: 5,
      taxaRetencao: 92.5,
      churnRate: 7.5,
      arpu: 3000.00,
      mrr: 35000.00
    };

    res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao calcular dashboard:', error);
    res.status(500).json({ message: 'Erro ao calcular dashboard' });
  }
}
