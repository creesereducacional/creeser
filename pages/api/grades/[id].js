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

    res.status(200).json(withLowercaseKeys(grade));
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

    const instituicaoId = getBodyValue(req.body, 'instituicaoId');
    const instituicaoNome = getBodyValue(req.body, 'instituicaoNome');
    const cursoId = getBodyValue(req.body, 'cursoId');
    const cursoNome = getBodyValue(req.body, 'cursoNome');
    const anoRaw = getBodyValue(req.body, 'ano');
    const nome = getBodyValue(req.body, 'nome');
    const situacao = getBodyValue(req.body, 'situacao');

    const anoFoiInformado = anoRaw !== undefined;
    const ano = anoFoiInformado ? parseAno(anoRaw) : null;

    if (anoFoiInformado && ano === null) {
      return res.status(400).json({ error: 'Ano deve conter 4 dígitos' });
    }

    grades[index] = {
      ...grades[index],
      instituicaoId: instituicaoId ?? grades[index].instituicaoId,
      instituicaoNome: instituicaoNome ?? grades[index].instituicaoNome,
      cursoId: cursoId ?? grades[index].cursoId,
      cursoNome: cursoNome ?? grades[index].cursoNome,
      ano: anoFoiInformado ? ano : grades[index].ano,
      nome: nome ?? grades[index].nome,
      situacao: situacao ?? grades[index].situacao,
      dataAtualizacao: new Date().toISOString()
    };

    salvarGrades(grades);
    res.status(200).json(withLowercaseKeys(grades[index]));
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
