import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'aluno', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('atividades_complementares').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Registro não encontrado' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase.from('atividades_complementares').update({
      nome_aluno:        body.nomeAluno       || body.nome_aluno       || null,
      matricula:         body.matricula       || null,
      curso:             body.curso           || null,
      turma:             body.turma           || null,
      tipo_atividade:    body.tipoAtividade   || body.tipo_atividade   || null,
      descricao:         body.descricao       || null,
      data_realizacao:   body.dataRealizacao  || body.data_realizacao  || null,
      carga_horaria:     body.cargaHoraria    || body.carga_horaria    || null,
      documento_enviado: body.documentoEnviado ?? body.documento_enviado ?? false,
      status:            body.status          || 'PENDENTE',
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('atividades_complementares').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Registro removido com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
