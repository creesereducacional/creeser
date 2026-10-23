// pages/api/admin-financeiro/acordos/create.js
// POST — Criar Acordo Financeiro com suporte a entrada (espécie/EFI) ou sem entrada,
// cálculo de encargos e descontos, encerramento de originais na EFI e histórico completo.

import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';
import {
  validarObservacaoOperador,
  encerrarCobrancasOriginais,
  registrarNegociacao,
} from '../../../../lib/negociacoes-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── Contexto de escopo (Instituição × Unidade) ─────────────────────────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[acordos/create] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ message: 'Instituição não definida para o usuário atual' });
  }

  try {
    const {
      aluno_id,
      descricao,
      observacao_operador,
      parcelas_originais,
      possui_entrada,
      tipo_entrada, // 'sem_entrada', 'especie', 'efi'
      valor_entrada,
      data_vencimento_entrada,
      quantidade_parcelas,
      dia_vencimento_parcelas,
      valor_encargos,
      valor_desconto,
      confirmacao_operador,
    } = req.body || {};

    // ── 1. Validações básicas e Observação do Operador ───────────────────────
    if (!aluno_id) return res.status(400).json({ message: 'aluno_id é obrigatório.' });

    // Observação do Operador obrigatória e significativa
    const validacaoObs = validarObservacaoOperador(observacao_operador || descricao);
    if (!validacaoObs.valido) {
      return res.status(400).json({ message: validacaoObs.erro });
    }
    const obsOperadorLimpa = validacaoObs.observacao;

    if (!Array.isArray(parcelas_originais) || parcelas_originais.length === 0) {
      return res.status(400).json({ message: 'Selecione ao menos uma parcela original para renegociação.' });
    }

    // Regras de Entrada
    const temEntrada = Boolean(possui_entrada) && Number(valor_entrada) > 0;
    const entradaNum = temEntrada ? Number(Number(valor_entrada).toFixed(2)) : 0;
    const modoEntrada = temEntrada ? (tipo_entrada === 'especie' ? 'especie' : 'efi') : 'sem_entrada';

    if (temEntrada && !data_vencimento_entrada && modoEntrada === 'efi') {
      return res.status(400).json({ message: 'Data de vencimento da entrada via EFI é obrigatória.' });
    }

    if (!temEntrada && !confirmacao_operador) {
      return res.status(400).json({
        message: 'Para acordos sem entrada, é necessária a confirmação formal explícita do operador para encerrar os débitos originais.'
      });
    }

    const qtdParcelasNum = Math.floor(Number(quantidade_parcelas)) || 0;
    if (qtdParcelasNum <= 0) {
      return res.status(400).json({ message: 'A quantidade de parcelas do saldo deve ser ao menos 1.' });
    }

    const diaVencNum = Math.floor(Number(dia_vencimento_parcelas)) || 10;
    if (diaVencNum < 1 || diaVencNum > 31) {
      return res.status(400).json({ message: 'Dia de vencimento das parcelas deve ser entre 1 e 31.' });
    }

    // ── 2. Carregar aluno e validar escopo ─────────────────────────────────────
    let alunoQuery = supabase
      .from('alunos')
      .select('id, nome, cpf, instituicao_id, turmaid')
      .eq('id', Number(aluno_id));
    if (!isGroupAdmin) {
      alunoQuery = applyInstituicaoFilter(alunoQuery, userInstituicaoId);
    }
    const { data: aluno } = await alunoQuery.maybeSingle();

    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    // Resolução de Unidade
    let turmaIdResolvida = null;
    const { data: matriculasAluno } = await supabase
      .from('matriculas')
      .select('turma_id, is_principal, instituicao_id')
      .eq('aluno_id', aluno.id);

    if (Array.isArray(matriculasAluno) && matriculasAluno.length > 0) {
      const matAlvo = matriculasAluno.find(m => m.is_principal) || matriculasAluno[0];
      turmaIdResolvida = matAlvo?.turma_id || null;
    }
    if (!turmaIdResolvida) {
      turmaIdResolvida = aluno.turmaid || null;
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

    if (!isGroupAdmin) {
      if (aluno.instituicao_id && userInstituicaoId && aluno.instituicao_id !== userInstituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
      }
      if (turmaInstituicaoId && userInstituicaoId && turmaInstituicaoId !== userInstituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
      }
    }

    if (ctx.unidadesPermitidas !== null) {
      if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
        return res.status(403).json({
          message: 'Acesso negado: a turma/matrícula do aluno pertence a uma unidade fora do seu escopo permitido.'
        });
      }
    }

    const instituicaoFinal = isGroupAdmin
      ? (aluno.instituicao_id || userInstituicaoId || null)
      : userInstituicaoId;

    // ── 3. Carregar e validar parcelas originais ───────────────────────────────
    const { data: parcelasOriginais, error: findParcelasErr } = await supabase
      .from('financeiro_parcelas')
      .select(`
        id,
        ordem_pagamento_id,
        status,
        valor,
        numero_parcela,
        data_vencimento,
        efi_charge_id,
        boleto_numero,
        financeiro_ordens_pagamento!ordem_pagamento_id (
          id,
          tipo,
          status,
          descricao,
          referencia,
          efi_charge_id,
          efi_carnet_id
        )
      `)
      .eq('aluno_id', aluno.id)
      .in('id', parcelas_originais);

    if (findParcelasErr || !parcelasOriginais || parcelasOriginais.length !== parcelas_originais.length) {
      return res.status(422).json({ message: 'Uma ou mais parcelas originais não foram encontradas no cadastro deste aluno.' });
    }

    // Conferir se nenhuma parcela original já está quitada
    for (const p of parcelasOriginais) {
      if (p.status === 'pago') {
        return res.status(422).json({
          message: `A parcela #${p.numero_parcela} já foi paga e não pode ser renegociada.`
        });
      }
      if (p.status === 'cancelado') {
        return res.status(422).json({
          message: `A parcela #${p.numero_parcela} já se encontra cancelada.`
        });
      }
    }

    // ── 4. Cálculos: Encargos, Descontos, Saldo e Parcelas ─────────────────────
    const totalOriginal = parcelasOriginais.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const encargosNum = Math.max(0, Number(valor_encargos) || 0);
    const descontoNum = Math.max(0, Number(valor_desconto) || 0);

    const totalNegociado = Math.max(0, Number((totalOriginal + encargosNum - descontoNum).toFixed(2)));

    if (entradaNum > totalNegociado) {
      return res.status(400).json({ message: 'O valor de entrada não pode ser maior que o valor total negociado.' });
    }

    // A entrada efetivamente paga/acordada é abatida do saldo e NÃO integra as novas parcelas
    const saldoRestante = Math.max(0, Number((totalNegociado - entradaNum).toFixed(2)));

    if (saldoRestante <= 0 && !temEntrada) {
      return res.status(400).json({ message: 'O valor do acordo deve ser maior que zero.' });
    }

    const valorParcelaSaldo = saldoRestante > 0 ? Number((saldoRestante / qtdParcelasNum).toFixed(2)) : 0;

    // ── 5. Criar Ordem do tipo ACORDO ──────────────────────────────────────────
    const hojeStr = new Date().toISOString().split('T')[0];
    const { data: ordem, error: createOrdemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .insert([{
        instituicao_id: aluno.instituicao_id || instituicaoFinal,
        aluno_id: aluno.id,
        tipo: 'acordo',
        descricao: (descricao || 'Acordo Financeiro').trim(),
        referencia: 'Acordo Financeiro',
        valor_total: totalNegociado,
        valor_desconto: descontoNum,
        quantidade_parcelas: temEntrada && modoEntrada === 'efi' ? qtdParcelasNum + 1 : qtdParcelasNum,
        observacoes: obsOperadorLimpa,
        status: 'ativo',
        parcelas_origem_acordo: parcelas_originais,
        criado_por: authUser.email || authUser.id || 'financeiro'
      }])
      .select()
      .single();

    if (createOrdemErr || !ordem) {
      throw new Error('Erro ao criar ordem do acordo: ' + (createOrdemErr?.message || 'Erro desconhecido'));
    }

    // ── 6. Gerar Parcelas do Acordo ────────────────────────────────────────────
    const novasParcelas = [];
    let entradaParcelaCriada = null;

    // 6.1 Tratamento da Entrada
    if (temEntrada) {
      if (modoEntrada === 'especie') {
        // Recebimento imediato registrado fora da EFI
        novasParcelas.push({
          instituicao_id: aluno.instituicao_id || instituicaoFinal,
          ordem_pagamento_id: ordem.id,
          aluno_id: aluno.id,
          numero_parcela: 1,
          valor: entradaNum,
          valor_pago: entradaNum,
          data_vencimento: hojeStr,
          data_pagamento: hojeStr,
          status: 'pago',
          metodo_pagamento: 'dinheiro',
          observacao_baixa: `Entrada em espécie de R$ ${entradaNum.toFixed(2)} recebida no ato da negociação.`,
          observacoes: 'Entrada quitada em dinheiro/espécie.'
        });
      } else {
        // Entrada digital via EFI (boleto/pix pendente)
        novasParcelas.push({
          instituicao_id: aluno.instituicao_id || instituicaoFinal,
          ordem_pagamento_id: ordem.id,
          aluno_id: aluno.id,
          numero_parcela: 1,
          valor: entradaNum,
          data_vencimento: data_vencimento_entrada || hojeStr,
          status: 'pendente',
          observacoes: 'Entrada via EFI (Boleto/PIX).'
        });
      }
    }

    // 6.2 Parcelas do Saldo Restante
    if (saldoRestante > 0) {
      const dataBase = data_vencimento_entrada || hojeStr;
      let currentVenc = new Date(dataBase + 'T12:00:00');
      const startParcelaNum = (temEntrada && modoEntrada === 'efi') ? 2 : (temEntrada && modoEntrada === 'especie' ? 2 : 1);

      for (let i = 0; i < qtdParcelasNum; i++) {
        currentVenc.setMonth(currentVenc.getMonth() + 1);
        currentVenc.setDate(diaVencNum);

        novasParcelas.push({
          instituicao_id: aluno.instituicao_id || instituicaoFinal,
          ordem_pagamento_id: ordem.id,
          aluno_id: aluno.id,
          numero_parcela: startParcelaNum + i,
          valor: valorParcelaSaldo,
          data_vencimento: currentVenc.toISOString().split('T')[0],
          status: 'pendente',
          observacoes: `Parcela ${i + 1}/${qtdParcelasNum} do saldo renegociado.`
        });
      }
    }

    const { data: parcelasCriadas, error: insertParcelasErr } = await supabase
      .from('financeiro_parcelas')
      .insert(novasParcelas)
      .select();

    if (insertParcelasErr || !parcelasCriadas) {
      throw new Error('Erro ao inserir parcelas do acordo: ' + (insertParcelasErr?.message || 'Erro desconhecido'));
    }

    if (temEntrada) {
      entradaParcelaCriada = parcelasCriadas.find(p => p.numero_parcela === 1);
      if (entradaParcelaCriada) {
        await supabase
          .from('financeiro_ordens_pagamento')
          .update({ entrada_parcela_id: entradaParcelaCriada.id })
          .eq('id', ordem.id);
      }
    }

    // ── 7. Encerramento das Cobranças Originais (Regra de Negócio 4 e 5) ────────
    // Com entrada paga em espécie OU Sem entrada (com confirmação do operador):
    // Inicia imediatamente o cancelamento no CREESER e a baixa bancária na EFI.
    let resultadoCancelamento = { sucesso: true, parcelasCanceladas: [], resultadosEfi: [], pendenteEfi: false };
    let statusNegociacao = 'concluido';

    const deveCancelarOriginaisAgora = (!temEntrada) || (temEntrada && modoEntrada === 'especie');

    if (deveCancelarOriginaisAgora) {
      resultadoCancelamento = await encerrarCobrancasOriginais({
        supabase,
        parcelaIds: parcelas_originais,
        ordemAcordoId: ordem.id,
        motivo: !temEntrada
          ? `Cancelada por formalização de Acordo sem entrada (Ordem ${ordem.id}).`
          : `Cancelada por quitação da entrada em espécie no Acordo (Ordem ${ordem.id}).`,
        operador: { id: authUser.id, email: authUser.email }
      });

      if (resultadoCancelamento.pendenteEfi) {
        statusNegociacao = 'sync_pendente';
      }
    } else {
      // Com entrada digital via EFI: aguarda quitação da entrada
      statusNegociacao = 'pendente_entrada';
    }

    // Snapshot das parcelas originais para o histórico
    const snapshotOriginais = parcelasOriginais.map(p => ({
      id: p.id,
      numero_parcela: p.numero_parcela,
      valor: p.valor,
      data_vencimento: p.data_vencimento,
      status_anterior: p.status,
      efi_charge_id: p.efi_charge_id || p.financeiro_ordens_pagamento?.efi_charge_id || null,
      boleto_numero: p.boleto_numero || null,
      descricao: p.financeiro_ordens_pagamento?.descricao || 'Fatura Original'
    }));

    // Snapshot das parcelas geradas
    const snapshotGeradas = parcelasCriadas.map(p => ({
      id: p.id,
      numero_parcela: p.numero_parcela,
      valor: p.valor,
      data_vencimento: p.data_vencimento,
      status: p.status,
      eh_entrada: temEntrada && p.numero_parcela === 1
    }));

    // ── 8. Gravar Histórico Estruturado e Auditoria (Regras 6, 7 e 8) ──────────
    const operadorObj = {
      id: authUser.id,
      email: authUser.email,
      perfil: authUser.perfil || authUser.tipo || 'financeiro'
    };

    await registrarNegociacao({
      supabase,
      ordemId: ordem.id,
      alunoId: aluno.id,
      instituicaoId: aluno.instituicao_id || instituicaoFinal,
      unidadeId: unidadeIdDoAluno,
      operador: operadorObj,
      valorTotalOriginal: totalOriginal,
      valorEncargos: encargosNum,
      valorDesconto: descontoNum,
      valorTotalNegociado: totalNegociado,
      possuiEntrada: temEntrada,
      valorEntrada: entradaNum,
      tipoEntrada: modoEntrada,
      entradaParcelaId: entradaParcelaCriada?.id || null,
      entradaPaga: temEntrada && modoEntrada === 'especie',
      dataPagamentoEntrada: temEntrada && modoEntrada === 'especie' ? hojeStr : null,
      valorSaldo: saldoRestante,
      quantidadeParcelas: qtdParcelasNum,
      diaVencimentoParcelas: diaVencNum,
      status: statusNegociacao,
      observacaoOperador: obsOperadorLimpa,
      parcelasOriginais: snapshotOriginais,
      parcelasGeradas: snapshotGeradas,
      sincronizacaoEfi: resultadoCancelamento.resultadosEfi,
      eventoInicial: deveCancelarOriginaisAgora ? 'acordo_formalizado_originais_canceladas' : 'acordo_aguardando_entrada_efi'
    });

    // Auditoria nos logs legados
    try {
      await supabase.from('financeiro_logs').insert({
        aluno_id: aluno.id,
        instituicao_id: aluno.instituicao_id || null,
        usuario_id: authUser.id ? Number(authUser.id) : null,
        acao: 'criar_acordo_financeiro',
        observacao: obsOperadorLimpa,
        dados_extras: {
          ordem_id: ordem.id,
          valor_total_original: totalOriginal,
          valor_total_negociado: totalNegociado,
          possui_entrada: temEntrada,
          tipo_entrada: modoEntrada,
          valor_entrada: entradaNum,
          valor_saldo: saldoRestante,
          quantidade_parcelas: qtdParcelasNum,
          parcelas_originais: parcelas_originais,
          pendente_efi: resultadoCancelamento.pendenteEfi
        }
      });
    } catch (_) {}

    try {
      await supabase.from('audit_logs').insert({
        usuario_id: authUser.id ? Number(authUser.id) : null,
        usuario_email: authUser.email || null,
        perfil: authUser.perfil || authUser.tipo || null,
        acao: 'CRIAR_ACORDO_FINANCEIRO',
        modulo: 'financeiro',
        entidade: 'aluno',
        id_entidade: String(aluno.id),
        detalhes: {
          ordem_id: ordem.id,
          valor_total_negociado: totalNegociado,
          possui_entrada: temEntrada,
          tipo_entrada: modoEntrada,
          valor_entrada: entradaNum,
          quantidade_parcelas: qtdParcelasNum,
          status_negociacao: statusNegociacao,
          pendente_efi: resultadoCancelamento.pendenteEfi,
          observacao: obsOperadorLimpa
        },
        instituicao_id: aluno.instituicao_id || null
      });
    } catch (_) {}

    return res.status(201).json({
      sucesso: true,
      message: 'Acordo financeiro registrado com sucesso.',
      ordem,
      parcelas: parcelasCriadas,
      status_negociacao: statusNegociacao,
      entrada_parcela: entradaParcelaCriada,
      pendente_efi: resultadoCancelamento.pendenteEfi,
      resultados_cancelamento: resultadoCancelamento
    });

  } catch (err) {
    console.error('[ACORDOS CREATE]', err);
    return res.status(500).json({ message: err.message || 'Erro interno ao processar acordo' });
  }
}
