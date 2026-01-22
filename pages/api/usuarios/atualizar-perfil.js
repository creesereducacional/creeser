import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads/fotos'),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);

    const nome = fields.nome ? fields.nome[0] : '';
    const email = fields.email ? fields.email[0] : '';
    let fotoCaminho = null;

    // Se houver uma nova foto
    if (files.foto) {
      const fotoFile = files.foto[0];
      const novoNome = `${Date.now()}-${fotoFile.originalFilename}`;
      const novoPath = path.join(
        process.cwd(),
        'public/uploads/fotos',
        novoNome
      );

      // Mover arquivo
      fs.renameSync(fotoFile.filepath, novoPath);
      fotoCaminho = `/uploads/fotos/${novoNome}`;
    }

    // Carregar lista de usuários
    const usuariosPath = path.join(process.cwd(), 'data', 'usuarios.json');
    let usuarios = [];

    if (fs.existsSync(usuariosPath)) {
      const data = fs.readFileSync(usuariosPath, 'utf-8');
      usuarios = JSON.parse(data);
    }

    // Encontrar e atualizar usuário
    const usuarioIndex = usuarios.findIndex(u => u.email === email);
    if (usuarioIndex !== -1) {
      usuarios[usuarioIndex].nome = nome;
      usuarios[usuarioIndex].email = email;
      if (fotoCaminho) {
        usuarios[usuarioIndex].foto = fotoCaminho;
      }

      // Salvar alterações
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

      return res.status(200).json({
        message: 'Perfil atualizado com sucesso',
        usuario: usuarios[usuarioIndex]
      });
    } else {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil: ' + error.message });
  }
}
