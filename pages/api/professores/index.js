import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    if (req.method === 'GET') {
      const professores = lerProfessores();
      res.status(200).json(professores);
    } else if (req.method === 'POST') {
      const professores = lerProfessores();
      const novoProfessor = {
        id: uuidv4(),
        ...req.body,
        dataCriacao: new Date().toISOString()
      };
      professores.push(novoProfessor);
      salvarProfessores(professores);
      res.status(201).json(novoProfessor);
    } else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao processar requisição', error: error.message });
  }
}
