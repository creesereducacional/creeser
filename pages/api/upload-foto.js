import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { requireAuth } from '../../lib/auth-server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    // No Vercel/Serverless, /var/task é read-only. Usamos os.tmpdir() (/tmp)
    const uploadDir = os.tmpdir();

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filename: (name, ext, part, form) => {
        const cleanName = (part?.originalFilename || 'foto.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${Date.now()}-${cleanName}`;
      },
    });

    const [fields, files] = await form.parse(req);

    const file = files.foto;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fileArray = Array.isArray(file) ? file : [file];
    const uploadedFile = fileArray[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'Arquivo inválido' });
    }

    // Verificar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const mimetype = uploadedFile.mimetype || 'image/jpeg';

    if (!allowedTypes.includes(mimetype.toLowerCase())) {
      if (uploadedFile.filepath && fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }
      return res.status(400).json({ error: 'Tipo de arquivo não permitido. Use imagem JPG ou PNG' });
    }

    // Converter para Data URL / Base64 otimizada para persistência segura em banco serverless
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Data}`;

    // Limpar arquivo temporário de /tmp
    if (uploadedFile.filepath && fs.existsSync(uploadedFile.filepath)) {
      fs.unlinkSync(uploadedFile.filepath);
    }

    return res.status(200).json({
      success: true,
      url: dataUrl,
      nome: uploadedFile.originalFilename || 'foto.jpg'
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return res.status(500).json({ error: error.message || 'Erro ao fazer upload da foto' });
  }
}
