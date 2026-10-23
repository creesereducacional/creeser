// lib/acordos-helper.js
// Auxiliares para processamento de Acordos Financeiros e Quitação de Entrada

const { encerrarCobrancasOriginais, anexarEventoNegociacao } = require('./negociacoes-service');

export async function verificarEProcessarPagamentoEntrada(supabase, parcelaId) {
  try {
    // 1. Buscar se a parcela é a entrada de algum acordo ativo
    const { data: ordem, error: findError } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, aluno_id, parcelas_origem_acordo, instituicao_id, descricao, status')
      .eq('entrada_parcela_id', parcelaId)
      .eq('tipo', 'acordo')
      .eq('status', 'ativo')
      .maybeSingle();

    if (findError || !ordem) return;

    const parcelasOriginaisIds = ordem.parcelas_origem_acordo;
    if (!Array.isArray(parcelasOriginaisIds) || parcelasOriginaisIds.length === 0) return;

    // 2. Encerrar com idempotência e sincronizar baixa bancária na EFI
    const resultadoEncerramento = await encerrarCobrancasOriginais({
      supabase,
      parcelaIds: parcelasOriginaisIds,
      ordemAcordoId: ordem.id,
      motivo: `Cancelada automaticamente por confirmação do pagamento da entrada do Acordo (Ordem ${ordem.id}).`,
      operador: { email: 'sistema_webhook_pagamento' }
    });

    const statusFinalAcordo = resultadoEncerramento.pendenteEfi ? 'sync_pendente' : 'concluido';

    // 3. Anexar evento no histórico estruturado da negociação
    await anexarEventoNegociacao({
      supabase,
      ordemId: ordem.id,
      tipoEvento: 'entrada_paga_originais_canceladas',
      operadorEmail: 'sistema',
      detalhes: {
        parcela_entrada_id: parcelaId,
        parcelas_canceladas_count: resultadoEncerramento.parcelasCanceladas.length,
        pendente_efi: resultadoEncerramento.pendenteEfi
      },
      novoStatus: statusFinalAcordo,
      sincronizacaoEfiExtra: resultadoEncerramento.resultadosEfi
    });

    // 4. Registrar auditoria em audit_logs e financeiro_logs
    try {
      await supabase.from('financeiro_logs').insert({
        aluno_id: ordem.aluno_id,
        instituicao_id: ordem.instituicao_id || null,
        acao: 'cancelamento_acordo_originais',
        observacao: `Cancelamento de parcelas originais após confirmação da entrada do Acordo (Ordem ${ordem.id}).`,
        dados_extras: {
          ordem_acordo_id: ordem.id,
          parcelas_originais_canceladas: resultadoEncerramento.parcelasCanceladas,
          resultados_efi: resultadoEncerramento.resultadosEfi
        }
      });
    } catch (logErr) {
      console.error('[acordos-helper] Falha ao registrar log financeiro:', logErr);
    }

    try {
      await supabase.from('audit_logs').insert({
        usuario_id: null,
        usuario_email: 'sistema',
        perfil: 'sistema',
        acao: 'CANCELAR_ORIGINAIS_ACORDO',
        modulo: 'financeiro',
        entidade: 'aluno',
        id_entidade: String(ordem.aluno_id),
        detalhes: {
          ordem_acordo_id: ordem.id,
          parcelas_originais_canceladas_count: resultadoEncerramento.parcelasCanceladas.length,
          pendente_efi: resultadoEncerramento.pendenteEfi
        },
        instituicao_id: ordem.instituicao_id || null
      });
    } catch (logErr) {
      console.error('[acordos-helper] Falha ao registrar audit log:', logErr);
    }

  } catch (err) {
    console.error('[acordos-helper] Erro ao processar quitação de entrada:', err);
  }
}
