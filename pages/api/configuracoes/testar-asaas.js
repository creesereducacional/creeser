import { requireAuth } from '../../../lib/auth-server';
import { validarConexao } from '../../../lib/payments/asaas-service';

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { apiKey, ambiente } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key é obrigatória para testar.' });
  }

  try {
    const result = await validarConexao(apiKey, ambiente || 'sandbox');
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao validar conexão com Asaas.' });
  }
}
