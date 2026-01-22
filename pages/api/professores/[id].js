import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'professores.json');

function lerProfessores() {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function salvarProfessores(professores) {
  fs.writeFileSync(dataPath, JSON.stringify(professores, null, 2), 'utf-8');
}

export default function handler(req, res) {
  try {
    const { id } = req.query;
    const professores = lerProfessores();
    const professorIndex = professores.findIndex(p => p.id === id);

    if (professorIndex === -1) {
      return res.status(404).json({ message: 'Professor não encontrado' });
    }

    if (req.method === 'GET') {
      res.status(200).json(professores[professorIndex]);
    } else if (req.method === 'PUT') {
      professores[professorIndex] = {
        ...professores[professorIndex],
        ...req.body,
        id: professores[professorIndex].id,
        dataCriacao: professores[professorIndex].dataCriacao,
        dataAtualizacao: new Date().toISOString()
      };
      salvarProfessores(professores);
      res.status(200).json(professores[professorIndex]);
    } else if (req.method === 'DELETE') {
      professores.splice(professorIndex, 1);
      salvarProfessores(professores);
      res.status(200).json({ message: 'Professor deletado com sucesso' });
    } else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao processar requisição', error: error.message });
  }
}
