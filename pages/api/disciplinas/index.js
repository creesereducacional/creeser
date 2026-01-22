import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataPath = path.join(process.cwd(), 'data', 'disciplinas.json');

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
    res.status(200).json(disciplinas);
  } else if (req.method === 'POST') {
    const disciplinas = lerDisciplinas();
    const novaDisciplina = {
      id: uuidv4(),
      ...req.body,
    };
    disciplinas.push(novaDisciplina);
    salvarDisciplinas(disciplinas);
    res.status(201).json(novaDisciplina);
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
