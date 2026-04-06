import fs from 'fs';
import path from 'path';

const gradesPath = path.join(process.cwd(), 'data', 'grades.json');

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

const getBodyValue = (body, key) => {
  if (!body) return undefined;
  return body[key] ?? body[key.toLowerCase()];
};

const parseAno = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const digits = String(value).replace(/\D/g, '');
  if (digits.length !== 4) return null;

  const parsed = Number.parseInt(digits, 10);
  if (Number.isNaN(parsed) || parsed < 1900 || parsed > 3000) return null;

  return parsed;
};

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
    res.status(200).json(grades.map(withLowercaseKeys));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recuperar grades' });
  }
}

function handlePost(req, res) {
  try {
    console.log('POST /api/grades - Body:', req.body);
    
    const id = getBodyValue(req.body, 'id');
    const instituicaoId = getBodyValue(req.body, 'instituicaoId');
    const instituicaoNome = getBodyValue(req.body, 'instituicaoNome');
    const cursoId = getBodyValue(req.body, 'cursoId');
    const cursoNome = getBodyValue(req.body, 'cursoNome');
    const ano = parseAno(getBodyValue(req.body, 'ano'));
    const nome = getBodyValue(req.body, 'nome');
    const situacao = getBodyValue(req.body, 'situacao');

    if (!instituicaoId) {
      return res.status(400).json({ error: 'Instituição é obrigatória' });
    }

    if (!cursoId) {
      return res.status(400).json({ error: 'Curso é obrigatório' });
    }

    if (ano === null) {
      return res.status(400).json({ error: 'Ano é obrigatório e deve conter 4 dígitos' });
    }

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const grades = lerGrades();
    const novaGrade = {
      id,
      instituicaoId,
      instituicaoNome: instituicaoNome || '',
      cursoId,
      cursoNome: cursoNome || '',
      ano,
      nome,
      situacao: situacao || 'ATIVO',
      dataCriacao: new Date().toISOString()
    };

    console.log('Creating new grade:', novaGrade);
    grades.push(novaGrade);
    salvarGrades(grades);
    console.log('Grade saved successfully');

    res.status(201).json(withLowercaseKeys(novaGrade));
  } catch (error) {
    console.error('POST Error:', error);
    res.status(500).json({ error: 'Erro ao criar grade: ' + error.message });
  }
}
