import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

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

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('grades').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Grade não encontrada' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const anoRaw = body.ano ?? body.Ano;
    const anoFoiInformado = anoRaw !== undefined;
    const ano = anoFoiInformado ? parseAno(anoRaw) : undefined;

    if (anoFoiInformado && ano === null) {
      return res.status(400).json({ error: 'Ano deve conter 4 dígitos' });
    }

    const updates = {};
    if (body.instituicaoId  || body.instituicao_id)   updates.instituicao_id   = body.instituicaoId  || body.instituicao_id;
    if (body.instituicaoNome || body.instituicao_nome) updates.instituicao_nome = body.instituicaoNome || body.instituicao_nome;
    if (body.cursoId || body.curso_id)                 updates.curso_id         = String(body.cursoId || body.curso_id);
    if (body.cursoNome || body.curso_nome)             updates.curso_nome       = body.cursoNome || body.curso_nome;
    if (anoFoiInformado)                               updates.ano              = ano;
    if (body.nome)                                     updates.nome             = body.nome;
    if (body.situacao)                                 updates.situacao         = body.situacao;

    const { data, error } = await supabase.from('grades').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Grade removida com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
