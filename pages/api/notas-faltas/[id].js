import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'notas-faltas.json');

export default function handler(req, res) {
  try {
    const { id } = req.query;
    const data = fs.readFileSync(filePath, 'utf8');
    const registros = JSON.parse(data);

    if (req.method === 'GET') {
      const registro = registros.find(r => r.id === id);
      if (!registro) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }
      res.status(200).json(registro);
    } else if (req.method === 'PUT') {
      const index = registros.findIndex(r => r.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }
      
      registros[index] = {
        ...registros[index],
        ...req.body,
        atualizado: new Date().toISOString()
      };
      
      fs.writeFileSync(filePath, JSON.stringify(registros, null, 2));
      res.status(200).json(registros[index]);
    } else if (req.method === 'DELETE') {
      const index = registros.findIndex(r => r.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }
      
      registros.splice(index, 1);
      fs.writeFileSync(filePath, JSON.stringify(registros, null, 2));
      res.status(200).json({ message: 'Registro deletado com sucesso' });
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}
