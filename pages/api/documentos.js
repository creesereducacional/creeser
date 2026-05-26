import path from 'path';
import fs from 'fs';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../lib/auth-server';

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
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'comercial', 'admin'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
  }

  if (req.method === 'GET') {
    let query = supabase.from('documentos').select('*').order('created_at', { ascending: false });
    if (instituicaoId) query = query.eq('instituicao_id', instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    if (!instituicaoId) {
      return res.status(400).json({ error: 'Instituicao obrigatoria para enviar documento' });
    }
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documentos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
      filename: (_name, _ext, part) => `${Date.now()}-${part.originalFilename}`,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Erro ao fazer upload do documento' });
      try {
        const file = files.documento[0];
        const fileName = path.basename(file.filepath);
        const { data, error } = await supabase.from('documentos').insert({
          instituicao_id:   instituicaoId,
          curso_id:         fields.cursoId?.[0]    || null,
          curso_nome:       fields.cursoNome?.[0]  || null,
          aula_id:          fields.aulaId?.[0]     || null,
          aula_nome:        fields.aulaNome?.[0]   || null,
          aluno_id:         fields.alunoId?.[0]    || null,
          aluno_nome:       fields.alunoNome?.[0]  || null,
          descricao:        fields.descricao?.[0]  || '',
          arquivo:          fileName,
          arquivo_original: file.originalFilename,
          tamanho:          file.size,
          tipo:             file.mimetype,
          url:              `/uploads/documentos/${fileName}`,
          status:           'pendente',
          visualizado:      false,
        }).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ message: 'Documento enviado com sucesso', documento: data });
      } catch (e) {
        return res.status(500).json({ error: 'Erro ao salvar documento' });
      }
    });
    return;
  }

  if (req.method === 'PUT') {
    // PUT precisa parsear JSON — reformidable não é usado aqui
    // Reabilitar body parser para PUT via formidable sem arquivo
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields) => {
      if (err) return res.status(500).json({ error: 'Erro ao parsear dados' });
      const id   = fields.id?.[0]   || req.body?.id;
      const status     = fields.status?.[0];
      const comentario = fields.comentario?.[0];
      const visualizado = fields.visualizado?.[0];

      const updates = {};
      if (status !== undefined)     updates.status     = status;
      if (comentario !== undefined) updates.comentario = comentario;
      if (visualizado !== undefined) updates.visualizado = visualizado === 'true';
      updates.data_atualizacao = new Date().toISOString();

      const { data, error } = await supabase.from('documentos').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ message: 'Documento atualizado com sucesso', documento: data });
    });
    return;
  }

  if (req.method === 'DELETE') {
    // GET params parsed normally even with bodyParser: false
    const { id } = req.query;
    // Fetch first to get file path
    const { data: doc, error: fetchErr } = await supabase.from('documentos').select('url').eq('id', id).single();
    if (fetchErr) return res.status(404).json({ error: 'Documento não encontrado' });
    if (doc?.url) {
      const filePath = path.join(process.cwd(), 'public', doc.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    const { error } = await supabase.from('documentos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Documento excluído com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
