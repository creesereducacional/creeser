// Orquestrador Central de Conversão de Leads (Integrado com ASAAS)
// Local: c:\PROJETOS\creeser\lib\comercial\conversion-service.js

import { criarCliente, criarCobranca } from '../payments/asaas-service';

export async function converterLead(supabase, leadId, dadosExtras = {}) {
  // 1. Carregar Lead
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadErr || !lead) {
    throw new Error('Lead não encontrado.');
  }

  // 2. Validar Dados Obrigatórios do Lead
  const erros = [];
  if (!lead.nome?.trim()) erros.push('Nome do lead é obrigatório.');
  if (!lead.email?.trim()) erros.push('E-mail do lead é obrigatório.');
  if (!lead.telefone?.trim() && !lead.whatsapp?.trim()) {
    erros.push('Pelo menos um telefone ou WhatsApp deve ser informado.');
  }
  if (!lead.curso_interesse?.trim() && !dadosExtras.curso_id) {
    erros.push('Curso de interesse não especificado.');
  }

  if (erros.length > 0) {
    return {
      status: 'REJEITADO',
      erros,
      lead
    };
  }

  // 3. Obter dados da Instituição
  const { data: inst, error: instErr } = await supabase
    .from('instituicoes')
    .select('*')
    .eq('id', lead.instituicao_id)
    .single();

  if (instErr || !inst) {
    throw new Error('Instituição do lead não é válida ou ativa.');
  }

  // 4. Carregar configurações da instituição (Configurações > Gateways)
  const { data: config } = await supabase
    .from('configuracoes_empresa')
    .select('financeiro')
    .eq('id', '00000000-0000-0000-0000-000000000001') // Registro seed padrão
    .maybeSingle();

  const financeiroConfig = config?.financeiro || {};

  // 5. Identificar Gateway Financeiro
  const isAsaasAtivo = financeiroConfig.ativarAsaas || false;
  const apiKey = financeiroConfig.apiKeyAsaas;
  const ambiente = financeiroConfig.ambienteAsaas || 'sandbox';

  if (!isAsaasAtivo || !apiKey) {
    throw new Error('Integração com Asaas não está ativa ou configurada na instituição.');
  }

  // 6. Criar ou Localizar Cliente no ASAAS
  let customer;
  try {
    const clienteData = {
      name: lead.nome,
      email: lead.email,
      phone: lead.whatsapp || lead.telefone,
      mobilePhone: lead.whatsapp || lead.telefone
    };
    customer = await criarCliente(apiKey, ambiente, clienteData);
  } catch (err) {
    throw new Error(`Erro ao criar cliente no Asaas: ${err.message}`);
  }

  // 7. Criar Cobrança no ASAAS
  let payment;
  try {
    const formaPagto = dadosExtras.forma_pagamento || 'BOLETO'; // BOLETO, PIX, CREDIT_CARD
    const cobrancaData = {
      customer: customer.id,
      billingType: formaPagto === 'BOLETO' ? 'BOLETO' : (formaPagto === 'PIX' ? 'PIX' : 'CREDIT_CARD'),
      value: dadosExtras.valor_matricula || dadosExtras.valor || 150.00, // Fallback matricula
      dueDate: dadosExtras.data_vencimento || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), // Vencimento em 3 dias
      description: `Taxa de Matrícula - Curso: ${lead.curso_interesse || 'Geral'}`
    };
    payment = await criarCobranca(apiKey, ambiente, cobrancaData);
  } catch (err) {
    throw new Error(`Erro ao criar cobrança no Asaas: ${err.message}`);
  }

  // 8. Salvar no Lead (com fallback robusto para observacoes caso a migration ainda não esteja rodada no dashboard)
  try {
    const { error: updateErr } = await supabase
      .from('leads')
      .update({
        asaas_customer_id: customer.id,
        asaas_payment_id: payment.id,
        asaas_payment_url: payment.invoiceUrl || '',
        asaas_invoice_url: payment.bankSlipUrl || payment.invoiceUrl || '',
        asaas_status_pagamento: 'PENDENTE',
        status: 'pre_matricula'
      })
      .eq('id', lead.id);

    if (updateErr) {
      // Fallback para observações
      const asaasData = {
        customer_id: customer.id,
        payment_id: payment.id,
        payment_url: payment.invoiceUrl || '',
        invoice_url: payment.bankSlipUrl || payment.invoiceUrl || '',
        status_pagamento: 'PENDENTE'
      };
      const updatedObs = `${lead.observacoes || ''}\n\n[FINANCEIRO ASAAS]\n${JSON.stringify(asaasData, null, 2)}`;
      await supabase
        .from('leads')
        .update({
          observacoes: updatedObs,
          status: 'pre_matricula'
        })
        .eq('id', lead.id);
    }
  } catch (e) {
    console.error('Falha ao atualizar lead:', e);
  }

  // 9. Registrar Auditoria do Funil
  await supabase
    .from('leads_auditoria')
    .insert({
      lead_id: lead.id,
      usuario_id: lead.captado_por_id || null,
      acao: 'conversao_financeira_asaas',
      dados_anteriores: { status: lead.status },
      dados_novos: {
        status: 'pre_matricula',
        asaas_customer_id: customer.id,
        asaas_payment_id: payment.id,
        asaas_payment_url: payment.invoiceUrl || '',
        asaas_invoice_url: payment.bankSlipUrl || payment.invoiceUrl || ''
      }
    });

  // Timeline 360
  try {
    const { registrarInteracao } = require('./interacao-service');
    await registrarInteracao(supabase, lead.id, {
      instituicao_id: lead.instituicao_id,
      usuario_id: lead.captado_por_id || null,
      tipo: 'cobranca_asaas',
      descricao: `Cobrança gerada no ASAAS. Valor: R$ ${(dadosExtras.valor_matricula || dadosExtras.valor || 150.00).toFixed(2)}. Link: ${payment.invoiceUrl || ''}`,
      metadata: { payment_id: payment.id, customer_id: customer.id }
    });
  } catch (_) {}

  return {
    status: 'CONVERTIDO_FINANCEIRO',
    lead_id: lead.id,
    gateway: 'asaas',
    payloadFinanceiro: {
      customerId: customer.id,
      paymentId: payment.id,
      paymentUrl: payment.invoiceUrl || '',
      invoiceUrl: payment.bankSlipUrl || payment.invoiceUrl || '',
      statusPagamento: 'PENDENTE'
    }
  };
}
