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
    const unidades = lerUnidades();
    const unidade = unidades.find(u => u.id === String(id));

    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    res.status(200).json(unidade);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recuperar unidade' });
  }
}

function handlePut(req, res, id) {
  try {
    const unidades = lerUnidades();
    const indice = unidades.findIndex(u => u.id === String(id));

    if (indice === -1) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    const unidadeAtualizada = {
      ...unidades[indice],
      ...req.body,
      id: String(id),
      dataCriacao: unidades[indice].dataCriacao,
      dataAtualizacao: new Date().toISOString(),
    };

    unidades[indice] = unidadeAtualizada;
    salvarUnidades(unidades);

    res.status(200).json(unidadeAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar unidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar unidade' });
  }
}

function handleDelete(req, res, id) {
  try {
    const unidades = lerUnidades();
    const indice = unidades.findIndex(u => u.id === String(id));

    if (indice === -1) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    const unidadeRemovida = unidades.splice(indice, 1);
    salvarUnidades(unidades);

    res.status(200).json(unidadeRemovida[0]);
  } catch (error) {
    console.error('Erro ao deletar unidade:', error);
    res.status(500).json({ error: 'Erro ao deletar unidade' });
  }
}
