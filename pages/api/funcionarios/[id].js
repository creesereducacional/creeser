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
  const { id } = req.query;
  const idNumerico = parseInt(id, 10); // Converter id para número

  console.log(`[API] Requisição ${req.method} - ID: ${id} (numérico: ${idNumerico})`);

  if (req.method === 'GET') {
    try {
      const funcionarios = lerFuncionarios();
      const funcionario = funcionarios.find(f => f.id === idNumerico);

      if (!funcionario) {
        console.log(`[API] Funcionário não encontrado. IDs disponíveis:`, funcionarios.map(f => f.id));
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }

      res.status(200).json(funcionario);
    } catch (error) {
      console.error('[API GET Error]', error);
      res.status(500).json({ message: 'Erro ao carregar funcionário', error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const funcionarios = lerFuncionarios();
      const index = funcionarios.findIndex(f => f.id === idNumerico);

      if (index === -1) {
        console.log(`[API] Funcionário não encontrado para UPDATE. IDs disponíveis:`, funcionarios.map(f => f.id));
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }

      funcionarios[index] = {
        ...funcionarios[index],
        ...req.body,
        id: funcionarios[index].id, // Manter ID original
        dataCriacao: funcionarios[index].dataCriacao, // Manter data de criação
        dataAtualizacao: new Date().toISOString()
      };

      if (salvarFuncionarios(funcionarios)) {
        console.log(`[API] Funcionário ${idNumerico} atualizado com sucesso`);
        res.status(200).json(funcionarios[index]);
      } else {
        console.error('[API] Erro ao salvar arquivo');
        res.status(500).json({ message: 'Erro ao atualizar funcionário' });
      }
    } catch (error) {
      console.error('[API PUT Error]', error);
      res.status(500).json({ message: 'Erro ao atualizar funcionário', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const funcionarios = lerFuncionarios();
      console.log(`[API DELETE] Buscando funcionário ${idNumerico}. Funcionários disponíveis:`, funcionarios.map(f => ({ id: f.id, nome: f.nome })));
      
      const index = funcionarios.findIndex(f => f.id === idNumerico);
      console.log(`[API DELETE] Índice encontrado:`, index);

      if (index === -1) {
        console.log(`[API] Funcionário não encontrado para DELETE. IDs:`, funcionarios.map(f => f.id));
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }

      const funcionarioRemovido = funcionarios.splice(index, 1)[0];
      console.log(`[API DELETE] Removendo:`, funcionarioRemovido.nome);

      if (salvarFuncionarios(funcionarios)) {
        console.log(`[API] Funcionário ${idNumerico} removido com sucesso`);
        res.status(200).json({ message: 'Funcionário removido com sucesso', funcionario: funcionarioRemovido });
      } else {
        console.error('[API] Erro ao salvar arquivo após DELETE');
        res.status(500).json({ message: 'Erro ao remover funcionário' });
      }
    } catch (error) {
      console.error('[API DELETE Error]', error);
      res.status(500).json({ message: 'Erro ao remover funcionário', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}
