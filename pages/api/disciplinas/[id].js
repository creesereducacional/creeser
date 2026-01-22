import fs from 'fs';
import path from 'path';

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
  const { id } = req.query;
  const disciplinas = lerDisciplinas();
  const disciplinaIndex = disciplinas.findIndex(d => d.id === id);

  if (req.method === 'GET') {
    if (disciplinaIndex === -1) {
      return res.status(404).json({ erro: 'Disciplina não encontrada' });
    }
    res.status(200).json(disciplinas[disciplinaIndex]);
  } else if (req.method === 'PUT') {
    if (disciplinaIndex === -1) {
      return res.status(404).json({ erro: 'Disciplina não encontrada' });
    }
    disciplinas[disciplinaIndex] = { ...disciplinas[disciplinaIndex], ...req.body };
    salvarDisciplinas(disciplinas);
    res.status(200).json(disciplinas[disciplinaIndex]);
  } else if (req.method === 'DELETE') {
    if (disciplinaIndex === -1) {
      return res.status(404).json({ erro: 'Disciplina não encontrada' });
    }
    disciplinas.splice(disciplinaIndex, 1);
    salvarDisciplinas(disciplinas);
    res.status(200).json({ mensagem: 'Disciplina deletada com sucesso' });
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
