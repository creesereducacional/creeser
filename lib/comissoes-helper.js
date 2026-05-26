/**
 * lib/comissoes-helper.js
 *
 * Geração automática de comissões comerciais após confirmação de pagamento
 * de matrícula. Chamado a partir de:
 *   - pages/api/admin-financeiro/parcelas/[id]/pagar.js  (baixa manual)
 *   - pages/api/admin-financeiro/efi/webhook.js           (webhook EFI)
 *
 * SEGURO: captura todos os erros internamente — nunca propaga exceções
 * para não bloquear o fluxo principal de pagamento.
 *
 * Regras de negócio:
 *   1. Aluno deve ter captado_por_id
 *   2. Instituição deve ter comissoes_config ativo
 *   3. Não cria duplicata: unique constraint em ordem_pagamento_id
 */

/**
 * Tenta criar uma comissão para uma ordem de matrícula recém-paga.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object}      params
 * @param {string}      params.ordemId        - UUID da financeiro_ordens_pagamento
 * @param {number}      params.alunoId        - ID do aluno
 * @param {string|null} params.instituicaoId  - UUID da instituição (opcional: buscado do aluno)
 * @param {string|null} params.dataPagamento  - YYYY-MM-DD (data crédito da comissão)
 * @param {string|null} params.parcelaId      - UUID da parcela que completou o pagamento
 */
export async function tentarCriarComissao(supabase, {
  ordemId,
  alunoId,
  instituicaoId = null,
  dataPagamento = null,
  parcelaId = null,
}) {
  try {
    if (!ordemId || !alunoId) return;

    // ── 1. Verificar duplicidade ─────────────────────────────────────────────
    const { data: existente } = await supabase
      .from('comissoes_comerciais')
      .select('id')
      .eq('ordem_pagamento_id', ordemId)
      .maybeSingle();

    if (existente) return; // Comissão já existe para esta ordem

    // ── 2. Buscar aluno: captado_por_id e instituicao_id ────────────────────
    const { data: aluno } = await supabase
      .from('alunos')
      .select('captado_por_id, instituicao_id')
      .eq('id', alunoId)
      .maybeSingle();

    if (!aluno?.captado_por_id) return; // Aluno sem captador → sem comissão

    const instId = instituicaoId || aluno.instituicao_id;
    if (!instId) return; // Sem instituição identificada

    // ── 3. Buscar configuração ativa ─────────────────────────────────────────
    const { data: config } = await supabase
      .from('comissoes_config')
      .select('modo, percentual, valor_fixo')
      .eq('instituicao_id', instId)
      .eq('ativo', true)
      .maybeSingle();

    if (!config) return; // Instituição não tem configuração → sem comissão

    // ── 4. Calcular valor_base (soma dos valores pagos da ordem) ─────────────
    const { data: parcelas } = await supabase
      .from('financeiro_parcelas')
      .select('valor_pago, valor')
      .eq('ordem_pagamento_id', ordemId);

    const valorBase = (parcelas || []).reduce((sum, p) =>
      sum + Number(p.valor_pago ?? p.valor ?? 0), 0
    );

    if (valorBase <= 0) return;

    // ── 5. Calcular valor da comissão ────────────────────────────────────────
    let tipoComissao, percentualUsado, valorComissao;

    if (config.modo === 'PERCENTUAL') {
      tipoComissao    = 'percentual';
      percentualUsado = Number(config.percentual || 0);
      valorComissao   = Math.round((valorBase * percentualUsado / 100) * 100) / 100;
    } else {
      tipoComissao    = 'fixa';
      percentualUsado = null;
      valorComissao   = Number(config.valor_fixo || 0);
    }

    if (valorComissao <= 0) return;

    // ── 6. Inserir comissão ──────────────────────────────────────────────────
    const dataCredito = dataPagamento || new Date().toISOString().slice(0, 10);

    const { error: insertErr } = await supabase
      .from('comissoes_comerciais')
      .insert({
        instituicao_id:     instId,
        aluno_id:           Number(alunoId),
        captado_por_id:     Number(aluno.captado_por_id),
        ordem_pagamento_id: ordemId,
        parcela_id:         parcelaId || null,
        valor_base:         valorBase,
        tipo_comissao:      tipoComissao,
        percentual:         percentualUsado,
        valor_comissao:     valorComissao,
        status:             'PENDENTE_REPASSE',
        data_credito:       dataCredito,
      });

    if (insertErr && insertErr.code !== '23505') {
      // 23505 = unique_violation (duplicata) — aceitável como race condition
      console.error('[comissoes-helper] Erro ao inserir comissão:', insertErr.message);
    } else if (!insertErr) {
      console.log(
        `[comissoes] Comissão gerada: ordem=${ordemId} captador=${aluno.captado_por_id} ` +
        `valor=R$${valorComissao.toFixed(2)} (${tipoComissao})`
      );
    }
  } catch (err) {
    // Nunca propaga — comissão não deve bloquear confirmação de pagamento
    console.error('[comissoes-helper] Erro não crítico:', err?.message || err);
  }
}
