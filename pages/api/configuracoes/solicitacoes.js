import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'solicitacoes.json');

export default function handler(req, res) {
  try {
    // GET - Listar todas as solicitações
    if (req.method === 'GET') {
      if (!fs.existsSync(dataPath)) {
        return res.status(200).json([]);
      }

      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const solicitacoes = JSON.parse(fileContent || '[]');
      return res.status(200).json(solicitacoes);
    }

    // POST - Criar nova solicitação
    if (req.method === 'POST') {
      if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify([]));
      }

      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const solicitacoes = JSON.parse(fileContent || '[]');

      const newSolicitacao = {
        ...req.body,
        createdAt: new Date().toISOString()
      };

      solicitacoes.push(newSolicitacao);
      fs.writeFileSync(dataPath, JSON.stringify(solicitacoes, null, 2));

      return res.status(201).json(newSolicitacao);
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
}
