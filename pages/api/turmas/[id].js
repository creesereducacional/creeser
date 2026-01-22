import fs from 'fs';
import path from 'path';

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
  const { id } = req.query;
  const turmas = lerTurmas();
  const turmaIndex = turmas.findIndex(t => t.id === id);

  if (req.method === 'GET') {
    if (turmaIndex === -1) {
      return res.status(404).json({ erro: 'Turma não encontrada' });
    }
    res.status(200).json(turmas[turmaIndex]);
  } else if (req.method === 'PUT') {
    if (turmaIndex === -1) {
      return res.status(404).json({ erro: 'Turma não encontrada' });
    }
    turmas[turmaIndex] = { ...turmas[turmaIndex], ...req.body };
    salvarTurmas(turmas);
    res.status(200).json(turmas[turmaIndex]);
  } else if (req.method === 'DELETE') {
    if (turmaIndex === -1) {
      return res.status(404).json({ erro: 'Turma não encontrada' });
    }
    turmas.splice(turmaIndex, 1);
    salvarTurmas(turmas);
    res.status(200).json({ mensagem: 'Turma deletada com sucesso' });
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
