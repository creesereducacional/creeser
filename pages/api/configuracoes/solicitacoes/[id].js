import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'solicitacoes.json');

export default function handler(req, res) {
  try {
    const { id } = req.query;

    // PUT - Atualizar solicitação
    if (req.method === 'PUT') {
      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }

      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      let solicitacoes = JSON.parse(fileContent || '[]');

      const index = solicitacoes.findIndex(s => s.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }

      solicitacoes[index] = {
        ...solicitacoes[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(dataPath, JSON.stringify(solicitacoes, null, 2));
      return res.status(200).json(solicitacoes[index]);
    }

    // DELETE - Deletar solicitação
    if (req.method === 'DELETE') {
      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }

      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      let solicitacoes = JSON.parse(fileContent || '[]');

      solicitacoes = solicitacoes.filter(s => s.id !== id);
      fs.writeFileSync(dataPath, JSON.stringify(solicitacoes, null, 2));

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
}
