/**
 * FinanceEngine.js
 * Engine de cálculos financeiros centralizada do CREESER ERP.
 * Responsável por unificar toda a matemática financeira de faturamento, carnês, descontos, multas e juros.
 */

export const FinanceEngine = {
  /**
   * Calcula o valor do desconto de uma única parcela.
   * @param {number|string} valorNominal - Valor real da mensalidade.
   * @param {number|string} percentualOuValorDesconto - Taxa de desconto informada.
   * @param {string} tipoDesconto - '%' ou 'R$'.
   * @returns {number} Valor calculado do desconto.
   */
  calcularDescontoParcela: (valorNominal, percentualOuValorDesconto, tipoDesconto) => {
    const v = Number(valorNominal) || 0;
    const desc = Number(percentualOuValorDesconto) || 0;
    if (tipoDesconto === '%') {
      return (v * desc) / 100;
    }
    return desc;
  },

  /**
   * Calcula o valor líquido final de uma única parcela com desconto aplicado.
   * @param {number|string} valorNominal - Valor real da mensalidade.
   * @param {number|string} percentualOuValorDesconto - Taxa de desconto informada.
   * @param {string} tipoDesconto - '%' ou 'R$'.
   * @returns {number} Valor com desconto aplicado (mínimo 0).
   */
  calcularParcelaFinal: (valorNominal, percentualOuValorDesconto, tipoDesconto) => {
    const v = Number(valorNominal) || 0;
    const desconto = FinanceEngine.calcularDescontoParcela(valorNominal, percentualOuValorDesconto, tipoDesconto);
    return Math.max(0, v - desconto);
  },

  /**
   * Calcula o total nominal do carnê (valor nominal cheio das parcelas).
   * @param {number|string} valorNominal - Valor nominal de cada parcela.
   * @param {number|string} quantidadeParcelas - Quantidade total de parcelas.
   * @returns {number} Total nominal acumulado do carnê.
   */
  calcularTotalNominalCarne: (valorNominal, quantidadeParcelas) => {
    const v = Number(valorNominal) || 0;
    const qty = Number(quantidadeParcelas) || 1;
    return v * qty;
  },

  /**
   * Calcula o total final líquido do carnê (valor com descontos).
   * @param {number|string} valorNominal - Valor nominal de cada parcela.
   * @param {number|string} percentualOuValorDesconto - Taxa de desconto informada.
   * @param {string} tipoDesconto - '%' ou 'R$'.
   * @param {number|string} quantidadeParcelas - Quantidade total de parcelas.
   * @returns {number} Total líquido acumulado do carnê.
   */
  calcularTotalLiquidoCarne: (valorNominal, percentualOuValorDesconto, tipoDesconto, quantidadeParcelas) => {
    const parcelaFinal = FinanceEngine.calcularParcelaFinal(valorNominal, percentualOuValorDesconto, tipoDesconto);
    const qty = Number(quantidadeParcelas) || 1;
    return parcelaFinal * qty;
  },

  /**
   * Resolve o valor a ser considerado (usando 'valor' como fallback histórico se 'valor_nominal' for nulo/ausente).
   */
  obterValorVigente: (parcela) => {
    if (!parcela) return 0;
    return Number(parcela.valor_nominal !== undefined && parcela.valor_nominal !== null ? parcela.valor_nominal : parcela.valor) || 0;
  },

  /**
   * Retorna o resumo completo de informações financeiras estruturadas.
   */
  obterResumoFinanceiro: ({
    valorNominal,
    percentualOuValorDesconto,
    tipoDesconto,
    quantidadeParcelas,
    configFinanceira,
    valorFallback, // fallback se valorNominal for nulo
  }) => {
    const nominal = Number(valorNominal !== undefined && valorNominal !== null ? valorNominal : valorFallback) || 0;
    const qty = Number(quantidadeParcelas) || 1;
    const descontoUnitario = FinanceEngine.calcularDescontoParcela(nominal, percentualOuValorDesconto, tipoDesconto);
    const liquidoUnitario = FinanceEngine.calcularParcelaFinal(nominal, percentualOuValorDesconto, tipoDesconto);
    const totalNominal = FinanceEngine.calcularTotalNominalCarne(nominal, qty);
    const totalLiquido = FinanceEngine.calcularTotalLiquidoCarne(nominal, percentualOuValorDesconto, tipoDesconto, qty);

    return {
      valorNominalParcela: nominal,
      descontoParcela: descontoUnitario,
      valorAteDataLimite: liquidoUnitario,
      valorAposDataLimite: nominal,
      multaPercentual: Number(configFinanceira?.multa) || 2.0,
      jurosAoDiaPercentual: Number(configFinanceira?.juros) || 0.033,
      diasTolerancia: Number(configFinanceira?.tolerancia) || 0,
      quantidadeParcelas: qty,
      totalNominalCarne: totalNominal,
      totalLiquidoCarne: totalLiquido,
    };
  }
};
