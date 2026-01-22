import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataFilePath = path.join(process.cwd(), 'data', 'anos-letivos.json');

function lerAnosLetivos() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
    return [];
  }
}

function salvarAnosLetivos(dados) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(dados, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    throw error;
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const anosLetivos = lerAnosLetivos();
    return res.status(200).json(anosLetivos);
  }

  if (req.method === 'POST') {
    const anosLetivos = lerAnosLetivos();
    const novoAnoLetivo = {
      id: uuidv4().substring(0, 8),
      ...req.body,
      criadoEm: new Date().toISOString()
    };
    anosLetivos.push(novoAnoLetivo);
    salvarAnosLetivos(anosLetivos);
    return res.status(201).json(novoAnoLetivo);
  }

  if (req.method === 'PUT') {
    const anosLetivos = lerAnosLetivos();
    const index = anosLetivos.findIndex(a => a.id === req.body.id);
    
    if (index !== -1) {
      anosLetivos[index] = { ...anosLetivos[index], ...req.body };
      salvarAnosLetivos(anosLetivos);
      return res.status(200).json(anosLetivos[index]);
    }
    
    return res.status(404).json({ error: 'Ano letivo não encontrado' });
  }

  if (req.method === 'DELETE') {
    const anosLetivos = lerAnosLetivos();
    const novaLista = anosLetivos.filter(a => a.id !== req.body.id);
    
    if (novaLista.length !== anosLetivos.length) {
      salvarAnosLetivos(novaLista);
      return res.status(200).json({ message: 'Ano letivo deletado' });
    }
    
    return res.status(404).json({ error: 'Ano letivo não encontrado' });
  }

  res.status(405).json({ error: 'Método não permitido' });
}
