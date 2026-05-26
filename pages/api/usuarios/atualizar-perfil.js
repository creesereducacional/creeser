import path from 'path';
import fs from 'fs';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth-server';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  try {
    const uploadDir = path.join(process.cwd(), 'public/uploads/fotos');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = formidable({ uploadDir, keepExtensions: true, maxFileSize: 5 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    const nome  = fields.nome  ? fields.nome[0]  : '';
    const email = fields.email ? fields.email[0] : '';
    let fotoCaminho = null;

    if (files.foto) {
      const fotoFile = files.foto[0];
      const novoNome = `${Date.now()}-${fotoFile.originalFilename}`;
      const novoPath = path.join(uploadDir, novoNome);
      fs.renameSync(fotoFile.filepath, novoPath);
      fotoCaminho = `/uploads/fotos/${novoNome}`;
    }

    const updates = { nome };
    if (fotoCaminho) updates.foto = fotoCaminho;

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update(updates)
      .ilike('email', email.trim())
      .select()
      .single();

    if (error) return res.status(404).json({ message: 'Usuário não encontrado' });

    return res.status(200).json({ message: 'Perfil atualizado com sucesso', usuario });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil: ' + error.message });
  }
}
