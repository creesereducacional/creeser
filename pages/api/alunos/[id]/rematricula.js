/**
 * POST /api/alunos/[id]/rematricula
 *
 * Endpoint backend para rematrícula transacional de aluno.
 * Invoca a RPC PostgreSQL fn_executar_rematricula_aluno.
 *
 * Body: {
 *   novo_ano_letivo, (obrigatório, ex: 2027)
 *   novo_semestre, (opcional, default '1')
 *   nova_turma_id, (opcional, se null mantém a mesma turma)
 *   plano_financeiro, (opcional)
 *   valor_mensalidade, (opcional)
 *   observacao (opcional)
 * }
 *
 * Perfis permitidos: grupo_admin, instituicao_admin, admin, secretaria, coordenador
 */
import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'secretaria', 'coordenador'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const userInstituicaoId = resolveInstituicaoId(req, authUser);

  const { id } = req.query;
  const alunoIdNum = Number(id);

  if (!id || Number.isNaN(alunoIdNum)) {
    return res.status(400).json({ message: 'ID do aluno é inválido ou obrigatório.' });
  }

  const {
    novo_ano_letivo,
    novo_semestre,
    nova_turma_id,
    plano_financeiro,
    valor_mensalidade,
    observacao,
  } = req.body || {};

  const anoLetivoNum = Number(novo_ano_letivo);
  if (!novo_ano_letivo || Number.isNaN(anoLetivoNum)) {
    return res.status(400).json({ message: 'O parâmetro novo_ano_letivo é obrigatório e deve ser numérico.' });
  }

  try {
    // Validar existência do aluno e isolamento multi-tenant
    const { data: aluno, error: errAluno } = await supabase
      .from('alunos')
      .select('id, nome, instituicao_id')
      .eq('id', alunoIdNum)
      .maybeSingle();

    if (errAluno) {
      return res.status(500).json({ message: 'Erro ao consultar aluno', error: errAluno.message });
    }

    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado.' });
    }

    if (!isGroupAdmin && aluno.instituicao_id && aluno.instituicao_id !== userInstituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: aluno pertence a outra instituição.' });
    }

    // Executar exclusivamente a RPC PostgreSQL fn_executar_rematricula_aluno
    const { data: matriculaId, error: rpcError } = await supabase.rpc('fn_executar_rematricula_aluno', {
      p_aluno_id: alunoIdNum,
      p_novo_ano_letivo: anoLetivoNum,
      p_novo_semestre: novo_semestre ? String(novo_semestre) : '1',
      p_nova_turma_id: nova_turma_id ? Number(nova_turma_id) : null,
      p_plano_financeiro: plano_financeiro ? String(plano_financeiro) : null,
      p_valor_mensalidade: valor_mensalidade ? Number(valor_mensalidade) : null,
      p_observacao: observacao ? String(observacao) : 'Rematrícula realizada via sistema web',
    });

    if (rpcError) {
      console.error('❌ Erro na RPC fn_executar_rematricula_aluno:', rpcError);
      return res.status(422).json({
        message: 'Erro ao executar rematrícula',
        error: rpcError.message,
        hint: rpcError.hint,
      });
    }

    return res.status(200).json({
      mensagem: 'Rematrícula realizada com sucesso',
      matricula_id: matriculaId,
    });
  } catch (error) {
    console.error('❌ Erro inesperado no endpoint de rematrícula:', error);
    return res.status(500).json({
      message: 'Erro interno ao processar rematrícula',
      error: error.message,
    });
  }
}
