import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, senhaAtual, novaSenha } = req.body;

    // Validações
    if (!email || !senhaAtual || !novaSenha) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    // Carregar usuários
    const usuariosPath = path.join(process.cwd(), 'data', 'usuarios.json');
    if (!fs.existsSync(usuariosPath)) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const data = fs.readFileSync(usuariosPath, 'utf-8');
    const usuarios = JSON.parse(data);

    // Encontrar usuário
    const usuario = usuarios.find(u => u.email === email);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const senhaAtualHash = crypto
      .createHash('sha256')
      .update(senhaAtual)
      .digest('hex');

    if (usuario.senha !== senhaAtualHash) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Atualizar para nova senha
    const novaSenhaHash = crypto
      .createHash('sha256')
      .update(novaSenha)
      .digest('hex');

    usuario.senha = novaSenhaHash;

    // Salvar alterações
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

    return res.status(200).json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ message: 'Erro ao alterar senha: ' + error.message });
  }
}
