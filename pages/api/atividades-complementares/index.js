import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

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
    let query = supabase.from('atividades_complementares').select('*').order('created_at', { ascending: false });
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const { data, error } = await supabase.from('atividades_complementares').insert({
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
      instituicao_id:    instId               || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
