import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'aluno', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    const { cursoId } = req.query;
    let query = supabase
      .from('forum_topicos')
      .select('*, forum_respostas(*)')
      .order('fixado', { ascending: false })
      .order('data_ultima_resposta', { ascending: false });

    query = applyInstituicaoFilter(query, instituicaoId);
    if (cursoId) query = query.eq('curso_id', cursoId);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);

    if (!body.cursoId && !body.curso_id) return res.status(400).json({ error: 'cursoId é obrigatório' });
    if (!body.autorId && !body.autor_id) return res.status(400).json({ error: 'autorId é obrigatório' });
    if (!body.titulo || !body.conteudo) return res.status(400).json({ error: 'titulo e conteudo são obrigatórios' });

    const { data, error } = await supabase.from('forum_topicos').insert({
      instituicao_id:        instId || null,
      curso_id:              body.cursoId  || body.curso_id,
      autor_id:              body.autorId  || body.autor_id,
      autor_nome:            body.autorNome || body.autor_nome || null,
      autor_tipo:            body.autorTipo || body.autor_tipo || null,
      titulo:                body.titulo,
      conteudo:              body.conteudo,
      visualizacoes:         0,
      fixado:                false,
      fechado:               false,
      data_ultima_resposta:  new Date().toISOString(),
    }).select('*, forum_respostas(*)').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { acao, ...dados } = req.body || {};

    if (acao === 'responder') {
      const { data, error } = await supabase.from('forum_respostas').insert({
        topico_id:  id,
        autor_id:   dados.autorId  || dados.autor_id  || null,
        autor_nome: dados.autorNome || dados.autor_nome || null,
        autor_tipo: dados.autorTipo || dados.autor_tipo || null,
        conteudo:   dados.conteudo,
      }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      // Atualizar data_ultima_resposta
      await supabase.from('forum_topicos').update({ data_ultima_resposta: new Date().toISOString() }).eq('id', id);
      return res.status(200).json(data);
    }

    if (acao === 'fixar') {
      const { data: current } = await supabase.from('forum_topicos').select('fixado').eq('id', id).single();
      const { data, error } = await supabase.from('forum_topicos').update({ fixado: !current?.fixado }).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (acao === 'fechar') {
      const { data: current } = await supabase.from('forum_topicos').select('fechado').eq('id', id).single();
      const { data, error } = await supabase.from('forum_topicos').update({ fechado: !current?.fechado }).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (acao === 'visualizar') {
      const { data: current } = await supabase.from('forum_topicos').select('visualizacoes').eq('id', id).single();
      const { data, error } = await supabase.from('forum_topicos').update({ visualizacoes: (current?.visualizacoes || 0) + 1 }).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // Atualização geral
    const updates = {};
    if (dados.titulo)   updates.titulo   = dados.titulo;
    if (dados.conteudo) updates.conteudo = dados.conteudo;
    const { data, error } = await supabase.from('forum_topicos').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id, respostaId } = req.query;
    if (respostaId) {
      const { error } = await supabase.from('forum_respostas').delete().eq('id', respostaId);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      await supabase.from('forum_respostas').delete().eq('topico_id', id);
      const { error } = await supabase.from('forum_topicos').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ mensagem: 'Excluído com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
