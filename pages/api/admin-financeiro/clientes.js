export default async function handler(req, res) {
  if (req.method === 'GET') {
    // TODO: Buscar clientes do Supabase/Prisma
    // Fazer join com Assinatura e Plano para obter status e MRR
    
    try {
      const clientes = [
        {
          id: '1',
          nome: 'CREESER EDUCACIONAL',
          cnpj: '12.345.678/0001-90',
          email: 'admin@creeser.com.br',
          plano: 'Pro',
          status: 'ativa',
          dataProximoVencimento: '2025-01-15',
          mrr: 5000.00
        },
        {
          id: '2',
          nome: 'ESCOLA XYZ',
          cnpj: '98.765.432/0001-01',
          email: 'admin@escola-xyz.com.br',
          plano: 'Básico',
          status: 'ativa',
          dataProximoVencimento: '2025-01-20',
          mrr: 2000.00
        }
      ];

      res.status(200).json(clientes);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
  }
  else if (req.method === 'POST') {
    // TODO: Criar novo cliente
    try {
      res.status(201).json({ message: 'Cliente criado com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar cliente' });
    }
  }
  else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}
