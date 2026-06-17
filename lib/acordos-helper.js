// lib/acordos-helper.js
// Auxiliares para processamento de Acordos Financeiros

export async function verificarEProcessarPagamentoEntrada(supabase, parcelaId) {
  try {
    // 1. Buscar se a parcela é a entrada de algum acordo ativo
    const { data: ordem, error: findError } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, aluno_id, parcelas_origem_acordo, instituicao_id, descricao')
      .eq('entrada_parcela_id', parcelaId)
      .eq('tipo', 'acordo')
      .eq('status', 'ativo')
      .maybeSingle();

    if (findError || !ordem) return;

    const parcelasOriginais = ordem.parcelas_origem_acordo;
    if (!Array.isArray(parcelasOriginais) || parcelasOriginais.length === 0) return;

    // 2. Cancelar as parcelas originais incluídas no acordo
    const { data: parcelasCanceladas, error: cancelError } = await supabase
      .from('financeiro_parcelas')
      .update({
        status: 'cancelado',
        observacao_baixa: `Cancelada automaticamente por renegociação no Acordo (Ordem ${ordem.id}).`
      })
      .in('id', parcelasOriginais)
      .select('id, numero_parcela, valor');

    if (cancelError) {
      console.error('[acordos-helper] Erro ao cancelar parcelas originais:', cancelError);
      return;
    }

    // 3. Registrar auditoria em audit_logs e financeiro_logs
    try {
      await supabase.from('financeiro_logs').insert({
        aluno_id: ordem.aluno_id,
        instituicao_id: ordem.instituicao_id || null,
        acao: 'cancelamento_acordo_originais',
        observacao: `Cancelamento de parcelas originais após confirmação da entrada do Acordo (Ordem ${ordem.id}).`,
        dados_extras: {
          ordem_acordo_id: ordem.id,
          parcelas_originais_canceladas: parcelasCanceladas || []
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
          parcelas_originais_canceladas_count: parcelasCanceladas ? parcelasCanceladas.length : 0
        },
        instituicao_id: ordem.instituicao_id || null
      });
    } catch (logErr) {
      console.error('[acordos-helper] Falha ao registrar audit log:', logErr);
    }

  } catch (err) {
    console.error('[acordos-helper] Erro processar quitação de entrada:', err);
  }
}
