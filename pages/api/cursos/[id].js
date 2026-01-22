import fs from 'fs';
import path from 'path';

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
  const { id } = req.query;

  if (req.method === 'GET') {
    const cursos = lerCursos();
    const curso = cursos.find(c => c.id === id);
    
    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    return res.status(200).json(curso);
  }

  if (req.method === 'PUT') {
    const cursos = lerCursos();
    const index = cursos.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    cursos[index] = {
      ...cursos[index],
      ...req.body,
      id: cursos[index].id,
      criado_em: cursos[index].criado_em,
      atualizado_em: new Date().toISOString()
    };
    
    salvarCursos(cursos);
    return res.status(200).json(cursos[index]);
  }

  if (req.method === 'DELETE') {
    const cursos = lerCursos();
    const novosCursos = cursos.filter(c => c.id !== id);
    
    if (novosCursos.length === cursos.length) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    salvarCursos(novosCursos);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
