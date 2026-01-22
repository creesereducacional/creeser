import fs from 'fs';
import path from 'path';

const gradesPath = path.join(process.cwd(), 'data', 'grades.json');

const lerGrades = () => {
  try {
    if (fs.existsSync(gradesPath)) {
      const data = fs.readFileSync(gradesPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler grades:', error);
    return [];
  }
};

const salvarGrades = (grades) => {
  try {
    const dir = path.dirname(gradesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(gradesPath, JSON.stringify(grades, null, 2));
  } catch (error) {
    console.error('Erro ao salvar grades:', error);
  }
};

export default function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return handleGet(req, res, id);
    case 'PUT':
      return handlePut(req, res, id);
    case 'DELETE':
      return handleDelete(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function handleGet(req, res, id) {
  try {
    const grades = lerGrades();
    const grade = grades.find(g => g.id === id);

    if (!grade) {
      return res.status(404).json({ error: 'Grade não encontrada' });
    }

    res.status(200).json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recuperar grade' });
  }
}

function handlePut(req, res, id) {
  try {
    const grades = lerGrades();
    const index = grades.findIndex(g => g.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Grade não encontrada' });
    }

    grades[index] = {
      ...grades[index],
      nome: req.body.nome,
      situacao: req.body.situacao,
      dataAtualizacao: new Date().toISOString()
    };

    salvarGrades(grades);
    res.status(200).json(grades[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar grade' });
  }
}

function handleDelete(req, res, id) {
  try {
    const grades = lerGrades();
    const index = grades.findIndex(g => g.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Grade não encontrada' });
    }

    grades.splice(index, 1);
    salvarGrades(grades);

    res.status(200).json({ message: 'Grade deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar grade' });
  }
}
