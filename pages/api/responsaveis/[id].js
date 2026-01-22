import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'responsaveis.json');

const lerResponsaveis = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler responsáveis:', error);
    return [];
  }
};

const salvarResponsaveis = (responsaveis) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(responsaveis, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar responsáveis:', error);
  }
};

export default function handler(req, res) {
  const { id } = req.query;
  const responsaveis = lerResponsaveis();
  const responsavelIndex = responsaveis.findIndex(r => r.id === id);

  if (req.method === 'GET') {
    if (responsavelIndex === -1) {
      return res.status(404).json({ erro: 'Responsável não encontrado' });
    }
    res.status(200).json(responsaveis[responsavelIndex]);
  } else if (req.method === 'PUT') {
    if (responsavelIndex === -1) {
      return res.status(404).json({ erro: 'Responsável não encontrado' });
    }
    responsaveis[responsavelIndex] = { ...responsaveis[responsavelIndex], ...req.body };
    salvarResponsaveis(responsaveis);
    res.status(200).json(responsaveis[responsavelIndex]);
  } else if (req.method === 'DELETE') {
    if (responsavelIndex === -1) {
      return res.status(404).json({ erro: 'Responsável não encontrado' });
    }
    responsaveis.splice(responsavelIndex, 1);
    salvarResponsaveis(responsaveis);
    res.status(200).json({ mensagem: 'Responsável deletado com sucesso' });
  } else {
    res.status(405).json({ erro: 'Método não permitido' });
  }
}
