import { createClient } from '@supabase/supabase-js';
import { applyInstituicaoFilter, hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Buscar aluno específico
    try {
      const authUser = requireAuth(req, res);
      if (!authUser) return;
      if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
        return;
      }

      const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
      const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

      if (!isGroupAdmin && !instituicaoId) {
        return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
      }

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
          endereco`
        )
        .eq('id', Number(id));

      query = applyInstituicaoFilter(query, instituicaoId);
      const { data, error } = query.single ? await query.single() : await query;

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao buscar aluno:', error);
      return res.status(500).json({ message: 'Erro ao buscar aluno' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const authUser = requireAuth(req, res);
      if (!authUser) return;
      if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
        return;
      }

      const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
      const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

      if (!isGroupAdmin && !instituicaoId) {
        return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
      }

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
        .select('id, statusmatricula, instituicao_id')
        .eq('id', Number(id));

      alunoQuery = applyInstituicaoFilter(alunoQuery, instituicaoId);

      const { data: aluno, error: alunoError } = await alunoQuery.maybeSingle();
      if (alunoError) {
        return res.status(500).json({ message: 'Erro ao buscar aluno: ' + alunoError.message });
      }
      if (!aluno) {
        return res.status(404).json({ message: 'Aluno não encontrado' });
      }

      // Bloquear trancamento de alunos cancelados/desistentes
      if (aluno.statusmatricula === 'CANCELADO' || aluno.statusmatricula === 'DESISTENTE' || aluno.statusmatricula === 'TRANCADO') {
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

      if (parcelasAtrasadas && parcelasAtrasadas.length > 0) {
        return res.status(422).json({
          message: 'Não é permitido trancar aluno com parcelas em atraso. Regularize as pendências primeiro.'
        });
      }

      const agora = new Date().toISOString();
      const { data: alunoAtualizado, error: updateAlunoError } = await supabase
        .from('alunos')
        .update({
          statusmatricula: 'TRANCADO',
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
            parcelas_canceladas_ids: parcelasCanceladas ? parcelasCanceladas.map(p => p.id) : []
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
            parcelas_canceladas_count: parcelasCanceladas ? parcelasCanceladas.length : 0
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
