/**
 * PATCH /api/alunos/ativar
 *
 * Confirma a formação de turma e ativa o aluno.
 * Transição: AGUARDANDO_FORMACAO_TURMA → ATIVO
 *
 * Body: { aluno_id }
 *
 * Perfis permitidos: grupo_admin, instituicao_admin, admin
 */
import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin'];

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser);

  const { aluno_id, turmaid } = req.body || {};

  if (!aluno_id) {
    return res.status(400).json({ error: 'aluno_id é obrigatório.' });
  }

  // Buscar aluno para validar isolamento e status atual
  const { data: aluno, error: findError } = await supabase
    .from('alunos')
    .select('id, nome, statusmatricula, instituicao_id')
    .eq('id', aluno_id)
    .maybeSingle();

  if (findError) return res.status(500).json({ error: findError.message });
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado.' });

  // Isolamento multi-tenant
  if (!isGroupAdmin && aluno.instituicao_id && aluno.instituicao_id !== instituicaoId) {
    return res.status(403).json({ error: 'Acesso negado: aluno pertence a outra instituição.' });
  }

  // Validar status — só pode ativar quem está AGUARDANDO_FORMACAO_TURMA
  if (aluno.statusmatricula !== 'AGUARDANDO_FORMACAO_TURMA') {
    return res.status(422).json({
      error: `Aluno está com status "${aluno.statusmatricula}". Apenas alunos com status AGUARDANDO_FORMACAO_TURMA podem ser ativados.`,
    });
  }

  const agora = new Date().toISOString();
  const updateData = {
    statusmatricula: 'ATIVO',
    data_matricula: agora.slice(0, 10),
  };

  // Se uma nova turma foi fornecida, atualizar também
  if (turmaid) {
    updateData.turmaid = Number(turmaid);
  }

  const { data: atualizado, error: updateError } = await supabase
    .from('alunos')
    .update(updateData)
    .eq('id', aluno_id)
    .select('id, nome, statusmatricula, data_matricula')
    .single();

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  // Auditoria silenciosa
  try {
    await supabase.from('financeiro_logs').insert({
      aluno_id,
      instituicao_id: aluno.instituicao_id || null,
      usuario_id: authUser.id ? Number(authUser.id) : null,
      acao: 'ativar_aluno',
      dados_extras: {
        status_anterior: 'AGUARDANDO_FORMACAO_TURMA',
        status_novo: 'ATIVO',
        ...(turmaid ? { turmaid_novo: Number(turmaid) } : {}),
      },
    });
  } catch (_) { /* não bloqueia */ }

  return res.status(200).json({
    mensagem: `Aluno "${atualizado.nome}" ativado com sucesso.`,
    aluno: atualizado,
  });
}
