import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'funcionarios.json');

// Função para ler dados
function lerFuncionarios() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler funcionários:', error);
  }
  return [];
}

// Função para salvar dados
function salvarFuncionarios(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar funcionários:', error);
    return false;
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const funcionarios = lerFuncionarios();
      res.status(200).json(funcionarios);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar funcionários', error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const funcionarios = lerFuncionarios();
      
      // Gerar novo ID como número
      const novoId = funcionarios.length > 0 
        ? Math.max(...funcionarios.map(f => f.id || 0)) + 1 
        : 2001;

      const novoFuncionario = {
        id: novoId,
        ...req.body,
        dataCriacao: new Date().toISOString()
      };

      funcionarios.push(novoFuncionario);
      
      if (salvarFuncionarios(funcionarios)) {
        res.status(201).json(novoFuncionario);
      } else {
        res.status(500).json({ message: 'Erro ao salvar funcionário' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erro ao cadastrar funcionário', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}
