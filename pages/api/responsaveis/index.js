import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataPath = path.join(process.cwd(), 'data', 'responsaveis.json');

const lerResponsaveis = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler responsáveis:', error);
    return [];
  }
};

const salvarResponsaveis = (responsaveis) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(responsaveis, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar responsáveis:', error);
  }
};

export default function handler(req, res) {
  if (req.method === 'GET') {
    const responsaveis = lerResponsaveis();
    res.status(200).json(responsaveis);
  } else if (req.method === 'POST') {
    const responsaveis = lerResponsaveis();
    const novoResponsavel = {
      id: uuidv4(),
      ...req.body,
    };
    responsaveis.push(novoResponsavel);
    salvarResponsaveis(responsaveis);
    res.status(201).json(novoResponsavel);
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
