import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('disciplinas').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Disciplina não encontrada' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase.from('disciplinas').update({
      codigo:        body.codigo        || null,
      nome:          body.nome,
      curso:         body.curso         || null,
      periodo:       body.periodo       || null,
      carga_horaria: body.cargaHoraria  || body.carga_horaria || null,
      matriz:        body.matriz        ?? true,
      grade:         body.grade         || null,
      situacao:      body.situacao      || 'ATIVO',
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Disciplina removida com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
