import fs from 'fs';
import path from 'path';

const unidadesPath = path.join(process.cwd(), 'data', 'unidades.json');

// Função auxiliar para ler dados
const lerUnidades = () => {
  try {
    if (fs.existsSync(unidadesPath)) {
      const data = fs.readFileSync(unidadesPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler unidades:', error);
    return [];
  }
};

// Função auxiliar para salvar dados
const salvarUnidades = (unidades) => {
  try {
    const dir = path.dirname(unidadesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(unidadesPath, JSON.stringify(unidades, null, 2));
  } catch (error) {
    console.error('Erro ao salvar unidades:', error);
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
    const unidades = lerUnidades();
    res.status(200).json(unidades);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recuperar unidades' });
  }
}

function handlePost(req, res) {
  try {
    const unidades = lerUnidades();
    
    // Gerar novo ID
    const novoId = unidades.length > 0
      ? Math.max(...unidades.map(u => parseInt(u.id) || 0)) + 1
      : 1;

    const novaUnidade = {
      id: String(novoId),
      ...req.body,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };

    unidades.push(novaUnidade);
    salvarUnidades(unidades);

    res.status(201).json(novaUnidade);
  } catch (error) {
    console.error('Erro ao criar unidade:', error);
    res.status(500).json({ error: 'Erro ao criar unidade' });
  }
}
