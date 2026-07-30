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
    const normalized = {
      ...data,
      curso_id: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : null,
      cursoId: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : null,
      created_at: data.created_at || data.datacriacao || null,
      updated_at: data.updated_at || data.dataatualizacao || null,
      situacao: data.situacao || 'ATIVO',
    };
    return res.status(200).json(normalized);
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
    if (body.cursoId || body.curso_id) {
      const cId = Number(body.cursoId || body.curso_id);
      updates.curso_id = cId;
      updates.cursoid = cId;
    }
    if (body.cursoNome || body.curso_nome)             updates.curso_nome       = body.cursoNome || body.curso_nome;
    if (anoFoiInformado)                               updates.ano              = ano;
    if (body.nome)                                     updates.nome             = body.nome;
    if (body.situacao)                                 updates.situacao         = body.situacao;
    updates.updated_at = new Date().toISOString();

    let { data, error } = await supabase.from('grades').update(updates).eq('id', id).select().single();
    if (error && error.message && error.message.includes('column')) {
      const fallbackUpdates = {};
      if (updates.cursoid) fallbackUpdates.cursoid = updates.cursoid;
      if (updates.ano) fallbackUpdates.ano = updates.ano;
      if (updates.nome) fallbackUpdates.nome = updates.nome;
      fallbackUpdates.dataatualizacao = new Date().toISOString();

      const fallbackResult = await supabase.from('grades').update(fallbackUpdates).eq('id', id).select().single();
      if (fallbackResult.error) return res.status(500).json({ error: fallbackResult.error.message });
      data = {
        ...fallbackResult.data,
        curso_id: Number(fallbackResult.data.cursoid || updates.cursoid),
        cursoId: Number(fallbackResult.data.cursoid || updates.cursoid),
        updated_at: fallbackResult.data.dataatualizacao,
        situacao: 'ATIVO'
      };
      error = null;
    }
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({
      ...data,
      curso_id: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : null,
      cursoId: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : null,
    });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Grade removida com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
