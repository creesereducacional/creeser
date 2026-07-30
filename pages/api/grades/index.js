import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const parseAno = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length !== 4) return null;
  const parsed = Number.parseInt(digits, 10);
  if (Number.isNaN(parsed) || parsed < 1900 || parsed > 3000) return null;
  return parsed;
};

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('grades').select('*').order('nome', { ascending: true });
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const normalized = (data || []).map(g => ({
      ...g,
      curso_id: g.curso_id ? String(g.curso_id) : g.cursoid ? String(g.cursoid) : null,
      cursoId: g.curso_id ? String(g.curso_id) : g.cursoid ? String(g.cursoid) : null,
      created_at: g.created_at || g.datacriacao || null,
      updated_at: g.updated_at || g.dataatualizacao || null,
      situacao: g.situacao || 'ATIVO',
    }));

    return res.status(200).json(normalized);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const reqInstId = body.instituicaoId || body.instituicao_id || instId;
    const anoVal = parseAno(body.ano);
    const rawCursoId = body.cursoId || body.curso_id;

    if (!reqInstId) return res.status(400).json({ error: 'Instituição é obrigatória' });
    if (!rawCursoId) return res.status(400).json({ error: 'Curso é obrigatório' });
    if (anoVal === null) return res.status(400).json({ error: 'Ano é obrigatório e deve conter 4 dígitos' });
    if (!body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    const numericCursoId = Number(rawCursoId) || null;

    const insertPayload = {
      nome:             body.nome,
      descricao:        body.descricao        || null,
      curso_id:         numericCursoId,
      cursoid:          numericCursoId,
      curso_nome:       body.cursoNome       || body.curso_nome       || null,
      instituicao_id:   reqInstId            || null,
      instituicao_nome: body.instituicaoNome || body.instituicao_nome || null,
      ano:              anoVal,
      situacao:         body.situacao        || 'ATIVO',
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString()
    };

    if (body.id) insertPayload.id = body.id;

    let { data, error } = await supabase.from('grades').insert(insertPayload).select().single();
    
    // Fallback gracioso para banco antes de aplicar migration física
    if (error && error.message && error.message.includes('column')) {
      const fallbackPayload = {
        nome: body.nome,
        descricao: body.descricao || null,
        cursoid: numericCursoId,
        ano: anoVal,
      };
      if (body.id) fallbackPayload.id = body.id;

      const fallbackResult = await supabase.from('grades').insert(fallbackPayload).select().single();
      if (fallbackResult.error) return res.status(500).json({ error: fallbackResult.error.message });
      data = {
        ...fallbackResult.data,
        curso_id: String(fallbackResult.data.cursoid || rawCursoId),
        created_at: fallbackResult.data.datacriacao,
        updated_at: fallbackResult.data.dataatualizacao,
        situacao: 'ATIVO'
      };
      error = null;
    }

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
