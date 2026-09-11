/**
 * POST /api/alunos/[id]/transferir
 *
 * Endpoint backend para transferência de turma no mesmo período acadêmico.
 * Opera rigorosamente sobre matricula_id para suportar com total segurança
 * alunos com MÚLTIPLAS MATRÍCULAS SIMULTÂNEAS em cursos diferentes.
 *
 * Body: {
 *   matricula_id: string (UUID, opcional/recomendado - se não fornecido, busca a matrícula principal)
 *   turma_id: number (obrigatório - nova turma de destino)
 *   observacao: string (opcional)
 * }
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

  const { matricula_id, turma_id, observacao } = req.body || {};
  const novaTurmaIdNum = Number(turma_id);

  if (!turma_id || Number.isNaN(novaTurmaIdNum)) {
    return res.status(400).json({ message: 'A turma de destino (turma_id) é obrigatória.' });
  }

  try {
    // 1. Obter dados do aluno e validar multi-tenant
    const { data: aluno, error: errAluno } = await supabase
      .from('alunos')
      .select('id, nome, instituicao_id, turmaid, cursoid')
      .eq('id', alunoIdNum)
      .maybeSingle();

    if (errAluno || !aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado.' });
    }

    if (!isGroupAdmin && aluno.instituicao_id && aluno.instituicao_id !== userInstituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: aluno pertence a outra instituição.' });
    }

    // 2. Identificar a MATRÍCULA ESPECÍFICA a ser transferida
    let queryMatricula = supabase
      .from('matriculas')
      .select('id, aluno_id, instituicao_id, curso_id, turma_id, grade_id, ano_letivo, semestre, status_administrativo, is_principal');

    if (matricula_id) {
      queryMatricula = queryMatricula.eq('id', matricula_id).eq('aluno_id', alunoIdNum);
    } else {
      // Fallback para matrícula principal se matricula_id não foi passado
      queryMatricula = queryMatricula.eq('aluno_id', alunoIdNum).eq('is_principal', true);
    }

    const { data: matriculaAlvo, error: errMat } = await queryMatricula.maybeSingle();

    if (errMat || !matriculaAlvo) {
      return res.status(404).json({
        message: matricula_id
          ? 'A matrícula informada não foi encontrada para este aluno.'
          : 'Nenhuma matrícula principal ativa foi encontrada para este aluno.',
      });
    }

    if (Number(matriculaAlvo.turma_id) === novaTurmaIdNum) {
      return res.status(400).json({ message: 'Esta matrícula já está vinculada à turma selecionada.' });
    }

    // 3. Inspecionar e validar a nova turma de destino
    const { data: novaTurma, error: errTurma } = await supabase
      .from('turmas')
      .select('id, nome, cursoid, gradeid, situacao, instituicao_id')
      .eq('id', novaTurmaIdNum)
      .maybeSingle();

    if (errTurma || !novaTurma) {
      return res.status(404).json({ message: 'Turma de destino não encontrada.' });
    }

    if (novaTurma.situacao && novaTurma.situacao !== 'ATIVO') {
      return res.status(400).json({ message: `A turma de destino não está ativa (situação: ${novaTurma.situacao}).` });
    }

    // Validar se a nova turma pertence ao mesmo curso da matrícula que está sendo transferida
    if (novaTurma.cursoid && String(novaTurma.cursoid) !== String(matriculaAlvo.curso_id)) {
      return res.status(400).json({
        message: `Transferência inválida: A turma selecionada pertence a outro curso. A transferência de turma deve ocorrer no mesmo curso (${matriculaAlvo.curso_id}). Para ingressar em outro curso, utilize a opção "Novo Curso".`,
      });
    }

    // 4. Inspecionar curso da turma de origem para o log de movimentação
    let cursoOrigemId = matriculaAlvo.curso_id;
    if (matriculaAlvo.turma_id) {
      const { data: turmaOrigem } = await supabase
        .from('turmas')
        .select('cursoid')
        .eq('id', matriculaAlvo.turma_id)
        .maybeSingle();
      if (turmaOrigem?.cursoid) cursoOrigemId = turmaOrigem.cursoid;
    }

    // 5. ATUALIZAR EXCLUSIVAMENTE A MATRÍCULA ESPECÍFICA NA TABELA public.matriculas
    const { error: errUpdateMatricula } = await supabase
      .from('matriculas')
      .update({
        turma_id: novaTurmaIdNum,
        grade_id: novaTurma.gradeid || matriculaAlvo.grade_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matriculaAlvo.id);

    if (errUpdateMatricula) {
      console.error('❌ Erro ao atualizar matrícula:', errUpdateMatricula);
      return res.status(500).json({ message: 'Erro ao transferir turma na matrícula.', error: errUpdateMatricula.message });
    }

    // 6. Sincronizar public.alunos.turmaid APENAS se esta for a matrícula PRINCIPAL do aluno
    if (matriculaAlvo.is_principal) {
      const { error: errUpdateAluno } = await supabase
        .from('alunos')
        .update({
          turmaid: novaTurmaIdNum,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alunoIdNum);

      if (errUpdateAluno) {
        console.error('⚠️ Aviso: Erro ao sincronizar turma principal na tabela de alunos:', errUpdateAluno);
      }
    }

    // 7. REGISTRAR O HISTÓRICO DE TRANSFERÊNCIA DE TURMA EM public.movimentacoes_matricula
    const obsHistorico = observacao && String(observacao).trim()
      ? String(observacao).trim()
      : 'Transferência de turma realizada no mesmo período acadêmico';

    const { error: errMovimentacao } = await supabase
      .from('movimentacoes_matricula')
      .insert({
        matricula_id: matriculaAlvo.id,
        tipo_movimentacao: 'TRANSFERENCIA_TURMA',
        turma_origem_id: matriculaAlvo.turma_id || null,
        turma_destino_id: novaTurmaIdNum,
        curso_origem_id: cursoOrigemId,
        curso_destino_id: novaTurma.cursoid || matriculaAlvo.curso_id,
        ano_letivo_origem: matriculaAlvo.ano_letivo,
        ano_letivo_destino: matriculaAlvo.ano_letivo,
        status_anterior: matriculaAlvo.status_administrativo,
        status_novo: matriculaAlvo.status_administrativo,
        observacao: obsHistorico,
        usuario_email: authUser.email || null,
      });

    if (errMovimentacao) {
      console.error('⚠️ Aviso: Erro ao registrar histórico em movimentacoes_matricula:', errMovimentacao);
    }

    return res.status(200).json({
      success: true,
      message: `Matrícula transferida com sucesso para a turma "${novaTurma.nome}".`,
      matricula_id: matriculaAlvo.id,
      turma_id: novaTurmaIdNum,
      turma_nome: novaTurma.nome,
    });
  } catch (error) {
    console.error('❌ Erro ao executar transferência:', error);
    return res.status(500).json({ message: 'Erro interno ao processar transferência', error: error.message });
  }
}

