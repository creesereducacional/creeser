import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const filePath = path.join(process.cwd(), 'data', 'livro-registro.json');

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = fs.readFileSync(filePath, 'utf8');
      const registros = JSON.parse(data);
      res.status(200).json(registros.map(withLowercaseKeys));
    } else if (req.method === 'POST') {
      const data = fs.readFileSync(filePath, 'utf8');
      const registros = JSON.parse(data);
      
      const novoRegistro = {
        id: uuidv4(),
        ...req.body,
        criado: new Date().toISOString(),
        atualizado: new Date().toISOString()
      };
      
      registros.push(novoRegistro);
      fs.writeFileSync(filePath, JSON.stringify(registros, null, 2));
      
      res.status(201).json(withLowercaseKeys(novoRegistro));
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}
