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
    let query = supabase.from('grades').select('*').order('ano', { ascending: false });
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const reqInstId = body.instituicaoId || body.instituicao_id || instId;
    const anoVal = parseAno(body.ano);

    if (!reqInstId) return res.status(400).json({ error: 'Instituição é obrigatória' });
    if (!body.cursoId && !body.curso_id) return res.status(400).json({ error: 'Curso é obrigatório' });
    if (anoVal === null) return res.status(400).json({ error: 'Ano é obrigatório e deve conter 4 dígitos' });
    if (!body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    // Aceitar ID enviado pelo frontend (compatibilidade) ou gerar novo
    const insertPayload = {
      instituicao_id:   reqInstId,
      instituicao_nome: body.instituicaoNome || body.instituicao_nome || null,
      curso_id:         String(body.cursoId  || body.curso_id),
      curso_nome:       body.cursoNome       || body.curso_nome       || null,
      ano:              anoVal,
      nome:             body.nome,
      situacao:         body.situacao        || 'ATIVO',
    };

    if (body.id) insertPayload.id = body.id;

    const { data, error } = await supabase.from('grades').insert(insertPayload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
