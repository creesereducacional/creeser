import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataPath = path.join(process.cwd(), 'data', 'cursos.json');

function lerCursos() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler cursos:', error);
  }
  return [];
}

function salvarCursos(cursos) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(cursos, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar cursos:', error);
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const cursos = lerCursos();
    return res.status(200).json(cursos);
  }

  if (req.method === 'POST') {
    const cursos = lerCursos();
    const novoCurso = {
      id: uuidv4(),
      ...req.body,
      criado_em: new Date().toISOString()
    };
    cursos.push(novoCurso);
    salvarCursos(cursos);
    return res.status(201).json(novoCurso);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
