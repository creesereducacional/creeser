import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataPath = path.join(process.cwd(), 'data', 'disciplinas.json');

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

const lerDisciplinas = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler disciplinas:', error);
    return [];
  }
};

const salvarDisciplinas = (disciplinas) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(disciplinas, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar disciplinas:', error);
  }
};

export default function handler(req, res) {
  if (req.method === 'GET') {
    const disciplinas = lerDisciplinas();
    res.status(200).json(disciplinas.map(withLowercaseKeys));
  } else if (req.method === 'POST') {
    const disciplinas = lerDisciplinas();
    const body = req.body || {};
    const novaDisciplina = {
      id: uuidv4(),
      ...body,
    };
    disciplinas.push(novaDisciplina);
    salvarDisciplinas(disciplinas);
    res.status(201).json(withLowercaseKeys(novaDisciplina));
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
