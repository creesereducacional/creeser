/**
 * PATCH /api/alunos/desistir
 *
 * Marca aluno como DESISTENTE (antes do ATIVO) ou CANCELADO (após ter sido ATIVO).
 *
 * Transições permitidas:
 *   PRE_CADASTRO | AGUARDANDO_PAGAMENTO_MATRICULA | AGUARDANDO_FORMACAO_TURMA → DESISTENTE
 *   ATIVO → CANCELADO
 *
 * Body: { aluno_id, motivo? }
 *
 * Perfis: grupo_admin, instituicao_admin, admin, financeiro
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

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro'];

const STATUS_ANTES_ATIVO  = ['PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO_MATRICULA', 'AGUARDANDO_FORMACAO_TURMA'];
const STATUS_APOS_ATIVO   = ['ATIVO'];

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser);

  const { aluno_id, motivo } = req.body || {};

  if (!aluno_id) {
    return res.status(400).json({ error: 'aluno_id é obrigatório.' });
  }

  const { data: aluno, error: findError } = await supabase
    .from('alunos')
    .select('id, nome, statusmatricula, instituicao_id')
    .eq('id', aluno_id)
    .maybeSingle();

  if (findError) return res.status(500).json({ error: findError.message });
  if (!aluno)   return res.status(404).json({ error: 'Aluno não encontrado.' });

  // Isolamento multi-tenant
  if (!isGroupAdmin && aluno.instituicao_id && aluno.instituicao_id !== instituicaoId) {
    return res.status(403).json({ error: 'Acesso negado: aluno pertence a outra instituição.' });
  }

  let novoStatus;
  if (STATUS_ANTES_ATIVO.includes(aluno.statusmatricula)) {
    novoStatus = 'DESISTENTE';
  } else if (STATUS_APOS_ATIVO.includes(aluno.statusmatricula)) {
    novoStatus = 'CANCELADO';
  } else {
    return res.status(422).json({
      error: `Status "${aluno.statusmatricula}" não permite esta transição. Aluno já está ${aluno.statusmatricula}.`,
    });
  }

  const agora = new Date().toISOString();

  const { data: atualizado, error: updateError } = await supabase
    .from('alunos')
    .update({
      statusmatricula: novoStatus,
      ...(motivo ? { observacoes_adicionais: String(motivo).slice(0, 1000) } : {}),
    })
    .eq('id', aluno_id)
    .select('id, nome, statusmatricula')
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });

  // Auditoria silenciosa
  try {
    await supabase.from('financeiro_logs').insert({
      aluno_id,
      instituicao_id: aluno.instituicao_id || null,
      usuario_id: authUser.id ? Number(authUser.id) : null,
      acao: novoStatus === 'DESISTENTE' ? 'marcar_desistente' : 'marcar_cancelado',
      dados_extras: {
        status_anterior: aluno.statusmatricula,
        status_novo: novoStatus,
        motivo: motivo || null,
      },
    });
  } catch (_) { /* não bloqueia */ }

  return res.status(200).json({
    mensagem: `Aluno "${atualizado.nome}" marcado como ${novoStatus}.`,
    aluno: atualizado,
  });
}
