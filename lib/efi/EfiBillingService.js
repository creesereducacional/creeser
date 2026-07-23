/**
 * EfiBillingService
 *
 * Serviço puro de integração com o gateway EFI (Efí Pay).
 *
 * RESPONSABILIDADES:
 *   - Montar e enviar o payload de cobrança à EFI.
 *   - Retornar os dados da emissão (charge_id, boleto_url, barcode).
 *   - Persistir o registro em financeiro_boletos e atualizar a parcela/ordem no banco.
 *
 * NÃO É RESPONSABILIDADE DESTE SERVIÇO:
 *   - Executar rollback de ordens ou parcelas.
 *   - Conhecer regras de negócio do ERP.
 *   - Excluir registros de financeiro_parcelas ou financeiro_ordens_pagamento.
 *
 * O rollback transacional é responsabilidade exclusiva de quem chama este serviço
 * (ex: ordens/create.js).
 *
 * IMPORTANTE: Este arquivo usa CommonJS (require/module.exports) para manter
 * compatibilidade com efi-client.js, que também usa CommonJS (module.exports).
 * Usar ESM (import/export) com um módulo CJS causa o erro "efi.default.X is not a function"
 * porque o transpilador Next.js envolve o módulo em { default: { ... } }.
 */

const efi = require('../efi-client');

/**
 * Converte qualquer erro/objeto num string legível para mensagens ao usuário.
 * @param {*} err
 * @returns {string}
 */
function resolverMensagemErro(err) {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  if (err instanceof Error) {
    const efiResp = err.efiResponse;
    if (efiResp) {
      return (
        efiResp.error_description ||
        efiResp.message ||
        efiResp.error ||
        JSON.stringify(efiResp)
      );
    }
    return err.message;
  }
  // Objeto genérico
  return err.message || err.error_description || err.error || JSON.stringify(err);
}

/**
 * Emite um boleto único na EFI para uma parcela já existente no banco.
 *
 * @param {object} params
 * @param {object} params.parcela          - Objeto parcela com os campos necessários
 * @param {object} params.aluno            - Objeto aluno com nome, cpf, email, telefone, data_nascimento
 * @param {string} params.descricao        - Texto do item no boleto
 * @param {object} params.configFinanceiro - Config da empresa (juros, multa, etc.)
 * @param {object} params.supabase         - Cliente Supabase (service role)
 * @param {string|null} params.instituicaoId   - ID da instituição para persistência
 * @param {string|null} params.notificationUrl - URL do webhook EFI (opcional)
 *
 * @returns {Promise<{ charge_id: string, boleto_url: string|null, barcode: string|null }>}
 * @throws {Error} Lança erro com mensagem legível — o chamador é responsável pelo rollback
 */
async function emitirBoletoEfi({
  parcela,
  aluno,
  descricao,
  configFinanceiro = {},
  supabase,
  instituicaoId = null,
  notificationUrl = null,
}) {
  // ── 1. Montar valor em centavos (valor_nominal com fallback para valor legado) ──
  const valorBase =
    parcela.valor_nominal !== undefined && parcela.valor_nominal !== null
      ? Number(parcela.valor_nominal)
      : Number(parcela.valor);
  const valorCentavos = Math.round(valorBase * 100);

  // ── 2. Criar cobrança (charge) vazia na EFI ──
  let chargeData;
  try {
    chargeData = await efi.createCharge([
      { name: descricao, value: valorCentavos, amount: 1 },
    ]);
  } catch (createErr) {
    const msg = resolverMensagemErro(createErr);
    console.error('[EfiBillingService] Falha ao criar charge na EFI:', msg);
    const err = new Error(`Falha ao criar cobrança na EFI: ${msg}`);
    err.statusCode = createErr.statusCode;
    err.efiResponse = createErr.efiResponse;
    throw err;
  }

  console.log('[EfiBillingService] createCharge resposta:', JSON.stringify(chargeData));

  const chargeId = chargeData?.data?.charge_id ?? chargeData?.charge_id;
  if (!chargeId) {
    throw new Error(
      `charge_id não retornado pela EFI. Resposta: ${JSON.stringify(chargeData)}`
    );
  }

  // ── 3. Registrar notification_url via metadata ──
  if (notificationUrl) {
    await efi
      .updateChargeMetadata(chargeId, notificationUrl)
      .catch((err) =>
        console.warn('[EfiBillingService] Falha ao definir notification_url:', resolverMensagemErro(err))
      );
  }

  // ── 4. Montar dados do cliente ──
  const cpfLimpo = (aluno.cpf || '').replace(/\D/g, '');
  const phoneDigits = (aluno.telefone_celular || '').replace(/\D/g, '');
  const birthRaw = aluno.data_nascimento || null;
  const birth = birthRaw ? String(birthRaw).substring(0, 10) : undefined;

  const customer = { name: aluno.nome, cpf: cpfLimpo };
  if (aluno.email) customer.email = aluno.email;
  if (phoneDigits.length === 10 || phoneDigits.length === 11)
    customer.phone_number = phoneDigits;
  if (birth && /^\d{4}-\d{2}-\d{2}$/.test(birth)) customer.birth = birth;

  // ── 5. Configurações de encargos (multa e juros) ──
  const configurations = {};
  const multaPercentual =
    Number(configFinanceiro.multaGerencianet) || Number(configFinanceiro.multa) || 0;
  if (multaPercentual > 0) {
    configurations.fine = {
      value: Math.round(multaPercentual * 100), // ex: 2% → 200
      type: 'percentage',
    };
  }

  const jurosPercentualDiario =
    Number(configFinanceiro.jurosGerencianet) || Number(configFinanceiro.juros) || 0;
  if (jurosPercentualDiario > 0) {
    configurations.interest = {
      value: Math.round(jurosPercentualDiario * 1000), // ex: 0.033% → 33
      type: 'percentage',
    };
  }

  // ── 6. Desconto condicional por pontualidade ──
  const discountValue = Number(parcela.valor_desconto) || 0;
  const discount = {};
  if (discountValue > 0 && parcela.data_limite_desconto) {
    discount.value = Math.round(discountValue * 100);
    discount.type = 'currency';
    discount.until_date = parcela.data_limite_desconto;
  }

  // ── 7. Associar boleto bancário ao charge ──
  const bankingBilletPayload = {
    expire_at: parcela.data_vencimento,
    customer,
  };
  if (Object.keys(configurations).length > 0) {
    bankingBilletPayload.configurations = configurations;
  }
  if (Object.keys(discount).length > 0) {
    bankingBilletPayload.discount = discount;
  }

  console.log('[EfiBillingService] customer:', JSON.stringify(customer));
  console.log('[EfiBillingService] expire_at:', parcela.data_vencimento);

  let billetData;
  try {
    billetData = await efi._request('POST', `/v1/charge/${chargeId}/pay`, {
      payment: { banking_billet: bankingBilletPayload },
    });
  } catch (billetErr) {
    // Limpar a cobrança órfã criada na EFI antes de propagar o erro
    const msg = resolverMensagemErro(billetErr);
    console.error(
      '[EfiBillingService] Falha ao associar boleto na EFI. Solicitando cancelamento:',
      chargeId, msg
    );
    try {
      await efi.cancelCharge(Number(chargeId));
    } catch (cancelErr) {
      console.error(
        '[EfiBillingService] Falha ao cancelar cobrança órfã na EFI:',
        chargeId, resolverMensagemErro(cancelErr)
      );
    }
    const err = new Error(`Falha ao emitir boleto bancário na EFI: ${msg}`);
    err.statusCode = billetErr.statusCode;
    err.efiResponse = billetErr.efiResponse;
    throw err;
  }

  const billet = billetData.data;
  const barcode = billet.barcode || billet.identifications?.barcode || null;
  const boletoUrl = billet.link || billet.pdf?.charge || null;

  // ── 8. Persistir em financeiro_boletos ──
  try {
    await supabase.from('financeiro_boletos').insert({
      parcela_id: parcela.id,
      instituicao_id: instituicaoId,
      gateway: 'efi',
      boleto_id_gateway: String(chargeId),
      boleto_numero: barcode,
      boleto_barcode: barcode,
      boleto_url: boletoUrl,
      status_gateway: 'waiting',
      resposta_json: billet,
    });

    // ── 9. Atualizar parcela com dados do boleto ──
    await supabase
      .from('financeiro_parcelas')
      .update({
        efi_charge_id: String(chargeId),
        boleto_barcode: barcode,
        boleto_url: boletoUrl,
      })
      .eq('id', parcela.id);

    // ── 10. Atualizar ordem com o charge_id ──
    if (parcela.ordem_pagamento_id) {
      await supabase
        .from('financeiro_ordens_pagamento')
        .update({ efi_charge_id: String(chargeId), efi_status: 'waiting' })
        .eq('id', parcela.ordem_pagamento_id);
    }
  } catch (dbPersistenceErr) {
    // Tentar cancelar a cobrança na EFI para evitar faturas em aberto
    const msg = resolverMensagemErro(dbPersistenceErr);
    console.error(
      '[EfiBillingService] Erro ao persistir dados do boleto. Solicitando cancelamento na EFI:',
      chargeId, msg
    );
    try {
      await efi.cancelCharge(Number(chargeId));
    } catch (cancelErr) {
      console.error(
        '[EfiBillingService] Falha ao cancelar cobrança após erro de persistência:',
        chargeId, resolverMensagemErro(cancelErr)
      );
    }
    // Relançar para o chamador executar rollback das entidades ERP
    const err = new Error(`Erro ao salvar dados do boleto no banco: ${msg}`);
    err.statusCode = 500;
    throw err;
  }

  return {
    charge_id: String(chargeId),
    boleto_url: boletoUrl,
    barcode,
  };
}

module.exports = { emitirBoletoEfi };
