import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Função auxiliar: derivar unidade do aluno através de matrículas/turmas ──
async function resolverUnidadeAluno(alunoId, turmaidLegado) {
  let turmaIdResolvida = null;
  const { data: matriculasAluno } = await supabase
    .from('matriculas')
    .select('turma_id, is_principal, instituicao_id')
    .eq('aluno_id', alunoId);

  if (Array.isArray(matriculasAluno) && matriculasAluno.length > 0) {
    const matAlvo = matriculasAluno.find(m => m.is_principal) || matriculasAluno[0];
    turmaIdResolvida = matAlvo?.turma_id || null;
  }

  if (!turmaIdResolvida) {
    turmaIdResolvida = turmaidLegado || null;
  }

  let unidadeIdDoAluno = null;
  let turmaInstituicaoId = null;

  if (turmaIdResolvida) {
    const { data: turmaData } = await supabase
      .from('turmas')
      .select('id, unidadeid, instituicao_id')
      .eq('id', turmaIdResolvida)
      .maybeSingle();

    if (turmaData) {
      unidadeIdDoAluno = turmaData.unidadeid != null ? Number(turmaData.unidadeid) : null;
      turmaInstituicaoId = turmaData.instituicao_id || null;
    }
  }

  return { turmaIdResolvida, unidadeIdDoAluno, turmaInstituicaoId };
}

export default async function handler(req, res) {
  const { id } = req.query;

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 6.1.7: Resolver contexto de escopo (Instituição × Unidade) ──────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[admin-financeiro/alunos/id] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  const instituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
  }
  // ────────────────────────────────────────────────────────────────────────────

  if (req.method === 'GET') {
    // Buscar aluno específico
    try {
      let query = supabase
        .from('alunos')
        .select(
          `id,
          nome,
          cpf,
          email,
          turmaid,
          cursoid,
          statusmatricula,
          valor_matricula,
          valor_mensalidade,
          percentual_desconto,
          qtd_parcelas,
          dia_pagamento,
          telefone_celular,
          endereco,
          instituicao_id`
        )
        .eq('id', Number(id));

      if (!isGroupAdmin) {
        query = applyInstituicaoFilter(query, instituicaoId);
      }
      const { data, error } = query.single ? await query.single() : await query;

      if (error || !data) {
        return res.status(404).json({ message: 'Aluno não encontrado' });
      }

      // ── Validação de Escopo de Unidade e Instituição (Fase 6.1.7) ───────────
      const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(data.id, data.turmaid);

      if (!isGroupAdmin) {
        if (data.instituicao_id && instituicaoId && data.instituicao_id !== instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
        }
        if (turmaInstituicaoId && instituicaoId && turmaInstituicaoId !== instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
        }
      }

      if (ctx.unidadesPermitidas !== null) {
        if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
          return res.status(403).json({
            message: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
          });
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao buscar aluno:', error);
      return res.status(500).json({ message: 'Erro ao buscar aluno' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { acao, observacao_trancamento } = req.body || {};

      if (acao !== 'trancar') {
        return res.status(400).json({ message: 'Ação inválida ou não suportada' });
      }

      if (!observacao_trancamento || !observacao_trancamento.trim()) {
        return res.status(400).json({ message: 'Observação de trancamento é obrigatória' });
      }

      // Buscar aluno
      let alunoQuery = supabase
        .from('alunos')
        .select('id, statusmatricula, instituicao_id, turmaid')
        .eq('id', Number(id));

      if (!isGroupAdmin) {
        alunoQuery = applyInstituicaoFilter(alunoQuery, instituicaoId);
      }

      const { data: aluno, error: alunoError } = await alunoQuery.maybeSingle();
      if (alunoError) {
        return res.status(500).json({ message: 'Erro ao buscar aluno: ' + alunoError.message });
      }
      if (!aluno) {
        return res.status(404).json({ message: 'Aluno não encontrado' });
      }

      // ── Validação de Escopo de Unidade e Instituição (Fase 6.1.7) ───────────
      const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(aluno.id, aluno.turmaid);

      if (!isGroupAdmin) {
        if (aluno.instituicao_id && instituicaoId && aluno.instituicao_id !== instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
        }
        if (turmaInstituicaoId && instituicaoId && turmaInstituicaoId !== instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
        }
      }

      if (ctx.unidadesPermitidas !== null) {
        if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
          return res.status(403).json({
            message: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
          });
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      // Bloquear trancamento de alunos cancelados/desistentes
      if (aluno.statusmatricula === 'CANCELADO' || aluno.statusmatricula === 'DESISTENTE' || aluno.statusmatricula === 'TRANCADO' || aluno.statusmatricula === 'TRANCADO_COM_DEBITO') {
        return res.status(422).json({ message: `Não é possível trancar aluno com status ${aluno.statusmatricula}` });
      }

      // Validar pendências financeiras (parcelas vencidas/atrasadas não pagas)
      const today = new Date().toISOString().split('T')[0];
      const { data: parcelasAtrasadas, error: parcelasError } = await supabase
        .from('financeiro_parcelas')
        .select('id, status, data_vencimento')
        .eq('aluno_id', aluno.id)
        .not('status', 'eq', 'pago')
        .not('status', 'eq', 'cancelado')
        .lt('data_vencimento', today);

      if (parcelasError) {
        return res.status(500).json({ message: 'Erro ao validar parcelas do aluno: ' + parcelasError.message });
      }

      const temAtraso = parcelasAtrasadas && parcelasAtrasadas.length > 0;
      const novoStatusMatricula = temAtraso ? 'TRANCADO_COM_DEBITO' : 'TRANCADO';

      const agora = new Date().toISOString();
      const { data: alunoAtualizado, error: updateAlunoError } = await supabase
        .from('alunos')
        .update({
          statusmatricula: novoStatusMatricula,
          data_trancamento: agora,
          observacao_trancamento: observacao_trancamento.trim()
        })
        .eq('id', aluno.id)
        .select()
        .single();

      if (updateAlunoError) {
        return res.status(500).json({ message: 'Erro ao atualizar status do aluno: ' + updateAlunoError.message });
      }

      // Cancelar parcelas futuras pendentes
      const { data: parcelasCanceladas, error: cancelError } = await supabase
        .from('financeiro_parcelas')
        .update({
          status: 'cancelado',
          observacao_baixa: `Cancelada devido ao trancamento da matrícula em ${new Date().toLocaleDateString('pt-BR')}.`
        })
        .eq('aluno_id', aluno.id)
        .not('status', 'eq', 'pago')
        .not('status', 'eq', 'cancelado')
        .gte('data_vencimento', today)
        .select('id');

      if (cancelError) {
        console.error('Erro ao cancelar parcelas futuras:', cancelError);
      }

      // Registrar log em audit_logs e/ou financeiro_logs
      const usuarioId = authUser.id ? Number(authUser.id) : null;
      try {
        await supabase.from('financeiro_logs').insert({
          aluno_id: aluno.id,
          instituicao_id: aluno.instituicao_id || null,
          usuario_id: usuarioId,
          acao: 'trancar_matricula',
          observacao: observacao_trancamento.trim(),
          dados_extras: {
            data_trancamento: agora,
            statusmatricula_anterior: aluno.statusmatricula,
            statusmatricula_novo: novoStatusMatricula,
            parcelas_canceladas_ids: parcelasCanceladas ? parcelasCanceladas.map(p => p.id) : [],
            parcelas_atrasadas_mantidas_count: parcelasAtrasadas ? parcelasAtrasadas.length : 0
          }
        });
      } catch (_) {}

      try {
        await supabase.from('audit_logs').insert({
          usuario_id: usuarioId,
          usuario_email: authUser.email || null,
          perfil: authUser.perfil || authUser.tipo || null,
          acao: 'TRANCAR_MATRICULA',
          modulo: 'financeiro',
          entidade: 'aluno',
          id_entidade: String(aluno.id),
          detalhes: {
            observacao: observacao_trancamento.trim(),
            status_matricula_aplicado: novoStatusMatricula,
            parcelas_canceladas_count: parcelasCanceladas ? parcelasCanceladas.length : 0,
            parcelas_atrasadas_mantidas_count: parcelasAtrasadas ? parcelasAtrasadas.length : 0
          }
        });
      } catch (_) {}

      return res.status(200).json({
        message: 'Aluno trancado com sucesso.',
        aluno: alunoAtualizado,
        parcelas_canceladas: parcelasCanceladas ? parcelasCanceladas.length : 0
      });

    } catch (error) {
      console.error('Erro ao processar trancamento:', error);
      return res.status(500).json({ message: 'Erro interno ao trancar aluno' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
