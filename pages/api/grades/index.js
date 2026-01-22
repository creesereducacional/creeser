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

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function handleGet(req, res) {
  try {
    const grades = lerGrades();
    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recuperar grades' });
  }
}

function handlePost(req, res) {
  try {
    console.log('POST /api/grades - Body:', req.body);
    
    if (!req.body.nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const grades = lerGrades();
    const novaGrade = {
      id: req.body.id,
      nome: req.body.nome,
      situacao: req.body.situacao || 'ATIVO',
      dataCriacao: new Date().toISOString()
    };

    console.log('Creating new grade:', novaGrade);
    grades.push(novaGrade);
    salvarGrades(grades);
    console.log('Grade saved successfully');

    res.status(201).json(novaGrade);
  } catch (error) {
    console.error('POST Error:', error);
    res.status(500).json({ error: 'Erro ao criar grade: ' + error.message });
  }
}
