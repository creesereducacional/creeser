import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'configuracoes-empresa.json');

async function readData() {
  try {
    const data = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await readData();
      res.status(200).json(data[0] || {});
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao ler dados' });
    }
  } else if (req.method === 'POST') {
    try {
      const data = [req.body];
      await writeData(data);
      res.status(200).json(req.body);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
