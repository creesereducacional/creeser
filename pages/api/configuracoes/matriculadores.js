import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'matriculadores.json');

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
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao ler dados' });
    }
  } else if (req.method === 'POST') {
    try {
      const data = await readData();
      const { v4: uuid } = require('uuid');
      data.push({
        id: uuid(),
        ...req.body,
        criado: new Date().toISOString()
      });
      await writeData(data);
      res.status(200).json(req.body);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { email } = req.query;
      let data = await readData();
      data = data.filter(m => m.email !== email);
      await writeData(data);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao deletar dados' });
    }
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
