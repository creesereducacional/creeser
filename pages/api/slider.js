import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const slidesDirectory = path.join(process.cwd(), 'public', 'images', 'slider');

export default async function handler(req, res) {
  // GET é público
  if (req.method !== 'GET') {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin'])) return;
  }

  if (req.method === 'GET') {
    if (!fs.existsSync(slidesDirectory)) {
      return res.status(200).json([]);
    }
    const imageFiles = fs.readdirSync(slidesDirectory)
      .filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));

    const { data: metaRows = [] } = await supabase.from('slider').select('*');

    const slides = imageFiles.map((fileName, index) => {
      const meta = metaRows.find(m => m.file_name === fileName);
      return {
        id:       meta?.id || index + 1,
        url:      `/images/slider/${fileName}`,
        nome:     fileName,
        titulo:   meta?.title       || `Slide ${index + 1}`,
        descricao: meta?.description || `Descrição do slide ${index + 1}.`,
      };
    });

    return res.status(200).json(slides);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const fileName   = body.fileName   || body.file_name;
    const title      = body.title;
    const description = body.description;

    if (!fileName || !title) {
      return res.status(400).json({ error: 'Nome do arquivo e título são obrigatórios.' });
    }

    const { error } = await supabase.from('slider').upsert(
      { file_name: fileName, title, description },
      { onConflict: 'file_name' }
    );
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Dados do slide salvos com sucesso.' });
  }

  if (req.method === 'DELETE') {
    const body = req.body || {};
    const fileName = body.fileName || body.file_name;

    if (!fileName) {
      return res.status(400).json({ error: 'Nome do arquivo é obrigatório.' });
    }

    const filePath = path.join(slidesDirectory, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado.' });
    }
    fs.unlinkSync(filePath);

    await supabase.from('slider').delete().eq('file_name', fileName);
    return res.status(200).json({ success: true, message: 'Slide excluído com sucesso.' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
