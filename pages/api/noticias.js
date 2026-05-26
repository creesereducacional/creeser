import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    const { id } = req.query;
    if (id) {
      const { data, error } = await supabase.from('noticias').select('*').eq('id', id).single();
      if (error) return res.status(404).json({ error: 'Notícia não encontrada' });
      return res.status(200).json(data);
    }
    let query = supabase.from('noticias').select('*').order('data_criacao', { ascending: false });
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const { data, error } = await supabase.from('noticias').insert({
      titulo:          body.titulo          || '',
      resumo:          body.resumo          || null,
      conteudo:        body.conteudo        || null,
      imagem:          body.imagem          || '',
      autor:           body.autor           || 'Admin',
      categoria:       body.categoria       || 'Geral',
      ativo:           body.ativo           !== false,
      data_publicacao: body.dataPublicacao  || body.data_publicacao || new Date().toISOString(),
      instituicao_id:  instId               || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório para atualização' });
    const { data, error } = await supabase.from('noticias').update({
      titulo:          body.titulo          || '',
      resumo:          body.resumo          || null,
      conteudo:        body.conteudo        || null,
      imagem:          body.imagem          || null,
      autor:           body.autor           || null,
      categoria:       body.categoria       || null,
      ativo:           body.ativo           !== undefined ? body.ativo : true,
      data_publicacao: body.dataPublicacao  || body.data_publicacao || null,
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
    const { error } = await supabase.from('noticias').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Notícia excluída com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
