import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataPath = path.join(process.cwd(), 'data', 'turmas.json');

const lerTurmas = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler turmas:', error);
    return [];
  }
};

const salvarTurmas = (turmas) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(turmas, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar turmas:', error);
  }
};

export default function handler(req, res) {
  if (req.method === 'GET') {
    const turmas = lerTurmas();
    res.status(200).json(turmas);
  } else if (req.method === 'POST') {
    const turmas = lerTurmas();
    const novaTurma = {
      id: uuidv4(),
      ...req.body,
    };
    turmas.push(novaTurma);
    salvarTurmas(turmas);
    res.status(201).json(novaTurma);
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
