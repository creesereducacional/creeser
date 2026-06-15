import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
      return;
    }

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
    const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

    if (!instituicaoId && !isGroupAdmin) {
      return res.status(400).json({ message: 'Instituição obrigatória' });
    }

    const {
      turmaId,
      alunoIds,
      periodo_inicio,
      periodo_fim,
      qtd_parcelas,
      dia_vencimento
    } = req.body || {};

    if (!turmaId || !Array.isArray(alunoIds) || alunoIds.length === 0 || !periodo_inicio || !periodo_fim || !qtd_parcelas || !dia_vencimento) {
      return res.status(400).json({
        message: 'Campos obrigatórios faltando: turmaId, alunoIds, periodo_inicio, periodo_fim, qtd_parcelas, dia_vencimento'
      });
    }

    // 1. Validar status da turma (não iniciada/não ativa)
    const { data: turma, error: turmaErr } = await supabase
      .from('turmas')
      .select('id, nome, status_formacao, instituicao_id')
      .eq('id', Number(turmaId))
      .maybeSingle();

    if (turmaErr || !turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }

    // Validação de segurança multi-tenant
    if (!isGroupAdmin && turma.instituicao_id && turma.instituicao_id !== instituicaoId) {
      return res.status(403).json({ message: 'Acesso negado para a turma informada' });
    }

    // Turma precisa estar no status "Não Iniciada" (representado por "EM_FORMACAO" ou nulo)
    const statusFormacao = turma.status_formacao || 'EM_FORMACAO';
    if (statusFormacao !== 'EM_FORMACAO') {
      return res.status(422).json({
        message: 'A geração em lote só é permitida para turmas com status Não Iniciada.'
      });
    }

    // 2. Validar período do primeiro semestre (Janeiro a Junho)
    const dateInicio = new Date(periodo_inicio);
    const dateFim = new Date(periodo_fim);

    const isFirstSemester = (d) => {
      const month = d.getUTCMonth() + 1; // 1-12
      return month >= 1 && month <= 6;
    };

    if (!isFirstSemester(dateInicio) || !isFirstSemester(dateFim)) {
      return res.status(422).json({
        message: 'A geração em lote é restrita ao período do primeiro semestre (Janeiro a Junho).'
      });
    }

    const report = {
      gerados: [],
      ignorados: [],
      erros: []
    };

    // Processar cada aluno
    for (const alunoId of alunoIds) {
      try {
        const { data: aluno, error: alunoErr } = await supabase
          .from('alunos')
          .select('id, nome, valor_mensalidade, percentual_desconto, instituicao_id')
          .eq('id', Number(alunoId))
          .maybeSingle();

        if (alunoErr || !aluno) {
          report.erros.push({ alunoId, nome: `ID #${alunoId}`, motivo: 'Aluno não encontrado ou erro ao buscar' });
          continue;
        }

        const valorMensalidade = Number(aluno.valor_mensalidade);
        if (!valorMensalidade || valorMensalidade <= 0) {
          report.ignorados.push({
            alunoId: aluno.id,
            nome: aluno.nome,
            motivo: 'Mensalidade do aluno não está configurada ou é zero'
          });
          continue;
        }

        // 4. Validar se aluno já possui parcelas/carnê ativo no período
        const { data: existingParcelas, error: checkErr } = await supabase
          .from('financeiro_parcelas')
          .select('id')
          .eq('aluno_id', aluno.id)
          .not('status', 'eq', 'cancelado')
          .gte('data_vencimento', periodo_inicio)
          .lte('data_vencimento', periodo_fim)
          .limit(1);

        if (checkErr) {
          report.erros.push({ alunoId: aluno.id, nome: aluno.nome, motivo: 'Erro ao validar duplicidade de parcelas' });
          continue;
        }

        if (existingParcelas && existingParcelas.length > 0) {
          report.ignorados.push({
            alunoId: aluno.id,
            nome: aluno.nome,
            motivo: 'Já possui carnê ou faturas ativas no período selecionado'
          });
          continue;
        }

        // Reutilizar lógica para inserir Ordem
        const instFinal = aluno.instituicao_id || instituicaoId;
        const totalCarnetValue = valorMensalidade * Number(qtd_parcelas);

        const { data: ordem, error: insertOrdemErr } = await supabase
          .from('financeiro_ordens_pagamento')
          .insert([{
            instituicao_id: instFinal,
            aluno_id: aluno.id,
            tipo: 'carne',
            descricao: `CARNÊ EM LOTE - ${turma.nome}`,
            referencia: '1º Semestre',
            valor_total: totalCarnetValue,
            percentual_desconto: Number(aluno.percentual_desconto) || 0,
            valor_desconto: (Number(aluno.percentual_desconto) || 0) > 0 ? (totalCarnetValue * (Number(aluno.percentual_desconto) / 100)) : 0,
            quantidade_parcelas: Number(qtd_parcelas),
            status: 'ativo',
            criado_por: authUser.email || 'sistema_lote'
          }])
          .select()
          .single();

        if (insertOrdemErr || !ordem) {
          report.erros.push({ alunoId: aluno.id, nome: aluno.nome, motivo: 'Falha ao criar ordem de pagamento' });
          continue;
        }

        // Gerar parcelas
        const parcelas = [];
        const baseDate = new Date(periodo_inicio);

        for (let i = 0; i < Number(qtd_parcelas); i++) {
          const dateVenc = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + i, Number(dia_vencimento)));
          parcelas.push({
            instituicao_id: instFinal,
            ordem_pagamento_id: ordem.id,
            aluno_id: aluno.id,
            numero_parcela: i + 1,
            valor: valorMensalidade,
            data_vencimento: dateVenc.toISOString().split('T')[0],
            status: 'pendente'
          });
        }

        const { error: insertParcelasErr } = await supabase
          .from('financeiro_parcelas')
          .insert(parcelas);

        if (insertParcelasErr) {
          // Rollback silencioso deletando a ordem se falhar a inserção de parcelas
          await supabase.from('financeiro_ordens_pagamento').delete().eq('id', ordem.id);
          report.erros.push({ alunoId: aluno.id, nome: aluno.nome, motivo: 'Falha ao gerar parcelas do carnê' });
          continue;
        }

        report.gerados.push({ alunoId: aluno.id, nome: aluno.nome, valor: totalCarnetValue });

      } catch (e) {
        report.erros.push({ alunoId, nome: `Aluno #${alunoId}`, motivo: e.message });
      }
    }

    // Registrar log global da ação de lote
    const usuarioId = authUser.id ? Number(authUser.id) : null;
    try {
      await supabase.from('audit_logs').insert([{
        usuario_id: usuarioId,
        usuario_email: authUser.email || null,
        perfil: authUser.perfil || authUser.tipo || null,
        acao: 'GERAR_CARNE_LOTE',
        modulo: 'financeiro',
        entidade: 'turma',
        id_entidade: String(turmaId),
        detalhes: {
          turma_nome: turma.nome,
          periodo: `${periodo_inicio} até ${periodo_fim}`,
          qtd_alunos_enviados: alunoIds.length,
          gerados_count: report.gerados.length,
          ignorados_count: report.ignorados.length,
          erros_count: report.erros.length
        }
      }]);
    } catch (_) {}

    return res.status(200).json({
      sucesso: true,
      relatorio: report
    });

  } catch (error) {
    console.error('Erro na geração em lote:', error);
    return res.status(500).json({ message: 'Erro interno na geração em lote', error: error.message });
  }
}
