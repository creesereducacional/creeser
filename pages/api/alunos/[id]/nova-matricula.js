/**
 * POST /api/alunos/[id]/nova-matricula
 *
 * Endpoint backend para criação transacional de uma nova matrícula em outro curso (matrícula simultânea).
 * Mantém intacta a matrícula atual do aluno no curso de origem.
 * Suporta pré-checagem de débitos operacionais e confirmação explícita.
 *
 * Body: {
 *   turma_id, (obrigatório, id da turma do novo curso)
 *   ano_letivo, (obrigatório, ex: 2026)
 *   semestre, (opcional, default '1')
 *   plano_financeiro, (opcional)
 *   valor_mensalidade, (opcional)
 *   observacao, (opcional)
 *   confirmar_debito (opcional, boolean)
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
    turma_id,
    ano_letivo,
    semestre,
    plano_financeiro,
    valor_mensalidade,
    observacao,
    confirmar_debito,
  } = req.body || {};

  const turmaIdNum = Number(turma_id);
  if (!turma_id || Number.isNaN(turmaIdNum)) {
    return res.status(400).json({ message: 'O parâmetro turma_id é obrigatório e deve ser numérico.' });
  }

  const anoLetivoNum = Number(ano_letivo);
  if (!ano_letivo || Number.isNaN(anoLetivoNum)) {
    return res.status(400).json({ message: 'O parâmetro ano_letivo é obrigatório e deve ser numérico.' });
  }

  try {
    // 1. Validar existência do aluno e isolamento multi-tenant
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

    // 2. PRÉ-VERIFICAÇÃO DE DÉBITOS FINANCEIROS OPERACIONAIS ('pendente', 'vencido')
    const { data: parcelasEmAberto, error: errParcelas } = await supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, valor, data_vencimento, status, observacoes')
      .eq('aluno_id', alunoIdNum)
      .in('status', ['pendente', 'vencido']);

    if (errParcelas) {
      console.error('❌ Erro ao consultar parcelas do aluno:', errParcelas);
      return res.status(500).json({ message: 'Erro ao verificar débitos financeiros do aluno', error: errParcelas.message });
    }

    const temDebitos = Array.isArray(parcelasEmAberto) && parcelasEmAberto.length > 0;
    const isConfirmadoExplicitamente = confirmar_debito === true || confirmar_debito === 'true';

    // Se existirem débitos e NÃO houver confirmação explícita do operador
    if (temDebitos && !isConfirmadoExplicitamente) {
      const quantidadeParcelas = parcelasEmAberto.length;
      const valorTotalEmAberto = parcelasEmAberto.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

      const parcelasResumidas = parcelasEmAberto.map((p) => ({
        id: p.id,
        numero_parcela: p.numero_parcela,
        valor: p.valor,
        data_vencimento: p.data_vencimento,
        status: p.status,
      }));

      return res.status(200).json({
        requer_confirmacao_debito: true,
        tem_debitos: true,
        quantidade_parcelas: quantidadeParcelas,
        valor_total_em_aberto: valorTotalEmAberto,
        parcelas: parcelasResumidas,
        mensagem: `Atenção: O aluno ${aluno.nome} possui ${quantidadeParcelas} parcela(s) financeira(s) em aberto totalizando R$ ${valorTotalEmAberto.toFixed(2)}. É necessária a confirmação explícita do operador para prosseguir com a matrícula no novo curso.`,
      });
    }

    // Se houver confirmação explícita com débitos, exije/valida a observação do operador
    let observacaoFinal = observacao ? String(observacao).trim() : '';
    if (temDebitos && isConfirmadoExplicitamente) {
      if (!observacaoFinal) {
        return res.status(400).json({
          message: 'Ao confirmar a matrícula em novo curso para aluno com débitos em aberto, é obrigatório informar uma observação de justificativa/autorização.',
        });
      }
      observacaoFinal = `[AUTORIZADO COM DÉBITOS] ${observacaoFinal}`;
    }

    if (!observacaoFinal) {
      observacaoFinal = 'Nova matrícula em outro curso simultâneo realizada via sistema web';
    }

    // 3. Executar exclusivamente a RPC PostgreSQL fn_executar_nova_matricula_curso
    const { data: matriculaId, error: rpcError } = await supabase.rpc('fn_executar_nova_matricula_curso', {
      p_aluno_id: alunoIdNum,
      p_turma_id: turmaIdNum,
      p_ano_letivo: anoLetivoNum,
      p_semestre: semestre ? String(semestre) : '1',
      p_plano_financeiro: plano_financeiro ? String(plano_financeiro) : null,
      p_valor_mensalidade: valor_mensalidade ? Number(valor_mensalidade) : null,
      p_observacao: observacaoFinal,
    });

    if (rpcError) {
      console.error('❌ Erro na RPC fn_executar_nova_matricula_curso:', rpcError);
      return res.status(422).json({
        message: rpcError.message || 'Erro ao executar nova matrícula em outro curso',
        error: rpcError.message,
        hint: rpcError.hint,
      });
    }

    return res.status(200).json({
      requer_confirmacao_debito: false,
      mensagem: 'Nova matrícula em outro curso criada com sucesso',
      matricula_id: matriculaId,
    });
  } catch (error) {
    console.error('❌ Erro inesperado no endpoint de nova matrícula:', error);
    return res.status(500).json({
      message: 'Erro interno ao processar nova matrícula',
      error: error.message,
    });
  }
}
