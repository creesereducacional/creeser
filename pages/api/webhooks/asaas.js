import { createClient } from '@supabase/supabase-js';
import { calcularComissaoReceita } from '../../../lib/comercial/comissao-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // 1. Receber evento
  const body = req.body;
  const tokenRecebido = req.headers['asaas-access-token'];

  // Registrar todos os eventos recebidos (Log de auditoria geral ou console)
  console.log('[Webhook Asaas] Recebido evento:', body.event, 'Payment ID:', body.payment?.id);

  try {
    // 2. Validar assinatura/token
    const { data: config } = await supabase
      .from('configuracoes_empresa')
      .select('financeiro')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle();

    const financeiroConfig = config?.financeiro || {};
    const tokenConfigurado = financeiroConfig.webhookTokenAsaas;

    if (tokenConfigurado && tokenRecebido !== tokenConfigurado) {
      console.warn('[Webhook Asaas] Token de acesso inválido.');
      return res.status(401).json({ error: 'Assinatura inválida.' });
    }

    const event = body.event;
    const payment = body.payment;

    if (!payment || !payment.id) {
      return res.status(400).json({ error: 'Dados do pagamento ausentes.' });
    }

    // 3. Localizar o Lead pelo asaas_payment_id
    // Tentamos buscar pela coluna física
    let { data: lead, error: findErr } = await supabase
      .from('leads')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .maybeSingle();

    // Fallback: buscar leads em pré-matrícula e procurar o paymentId no campo observações
    if (!lead || findErr) {
      const { data: leadsPre } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'pre_matricula');

      lead = (leadsPre || []).find(l => l.observacoes?.includes(payment.id));
    }

    if (!lead) {
      console.warn(`[Webhook Asaas] Lead não localizado para o pagamento ${payment.id}`);
      return res.status(200).json({ success: false, message: 'Lead não encontrado.' });
    }

    // 4. Ignorar eventos duplicados ou status já consolidados
    if (lead.asaas_status_pagamento === 'RECEIVED' || lead.asaas_status_pagamento === 'CONFIRMED') {
      console.log(`[Webhook Asaas] Pagamento ${payment.id} já processado anteriormente.`);
      return res.status(200).json({ success: true, message: 'Já processado.' });
    }

    // Mapear status do Asaas
    const novoStatus = payment.status; // RECEIVED, CONFIRMED, OVERDUE, etc.
    const dataPagamento = payment.paymentDate || payment.confirmedDate || null;
    const valorPago = payment.value || null;

    // 5. Atualizar Lead (com fallback robusto para observacoes)
    try {
      const { error: updateErr } = await supabase
        .from('leads')
        .update({
          asaas_status_pagamento: novoStatus,
          data_pagamento: dataPagamento,
          valor_pago: valorPago,
          status: novoStatus === 'RECEIVED' || novoStatus === 'CONFIRMED' ? 'matriculado' : lead.status
        })
        .eq('id', lead.id);

      if (updateErr) {
        // Fallback para observações
        const paymentDetails = {
          status_pagamento: novoStatus,
          data_pagamento: dataPagamento,
          valor_pago: valorPago
        };
        const updatedObs = `${lead.observacoes || ''}\n\n[PAGAMENTO WEBHOOK ASAAS]\n${JSON.stringify(paymentDetails, null, 2)}`;
        await supabase
          .from('leads')
          .update({
            observacoes: updatedObs,
            status: novoStatus === 'RECEIVED' || novoStatus === 'CONFIRMED' ? 'matriculado' : lead.status
          })
          .eq('id', lead.id);
      }
    } catch (updateFail) {
      console.error('[Webhook Asaas] Falha ao atualizar lead:', updateFail);
    }

    // 5.B. Criar Lançamento Financeiro de Receita (RECEIVED/CONFIRMED)
    if (novoStatus === 'RECEIVED' || novoStatus === 'CONFIRMED') {
      try {
        const { data: existingRevenue } = await supabase
          .from('financeiro_receitas_comerciais')
          .select('id')
          .eq('gateway_payment_id', payment.id)
          .maybeSingle();

        if (!existingRevenue) {
          const rawValue = payment.value || 0;
          const netValue = payment.netValue || null;
          const formaPagto = payment.billingType || 'BOLETO';

          const { data: newRev, error: insertErr } = await supabase
            .from('financeiro_receitas_comerciais')
            .insert({
              lead_id: lead.id,
              instituicao_id: lead.instituicao_id,
              curso_nome: lead.curso_interesse,
              captador_id: lead.captado_por_id || null,
              forma_pagamento: formaPagto,
              gateway: 'asaas',
              gateway_payment_id: payment.id,
              valor_bruto: rawValue,
              valor_liquido: netValue,
              data_pagamento: dataPagamento || new Date().toISOString(),
              status: 'Recebido'
            })
            .select('id')
            .single();

          if (newRev && !insertErr) {
            // Calcular comissão automaticamente
            await calcularComissaoReceita(supabase, newRev.id);
            
            // Timeline 360
            try {
              const { registrarInteracao } = require('../../../lib/comercial/interacao-service');
              await registrarInteracao(supabase, lead.id, {
                instituicao_id: lead.instituicao_id,
                tipo: 'pagamento_confirmado',
                descricao: `Pagamento de matrícula confirmado pelo gateway Asaas. Valor: R$ ${rawValue.toFixed(2)}`
              });
              await registrarInteracao(supabase, lead.id, {
                instituicao_id: lead.instituicao_id,
                tipo: 'receita_criada',
                descricao: `Lançamento de receita comercial gerado no financeiro. ID: ${newRev.id}`
              });
            } catch (_) {}
          }

          if (insertErr) {
            console.error('[Webhook Asaas] Erro ao inserir receita comercial (tentando fallback):', insertErr);
            const fallbackData = {
              financeiro_receitas_comerciais: {
                lead_id: lead.id,
                instituicao_id: lead.instituicao_id,
                curso_nome: lead.curso_interesse,
                captador_id: lead.captado_por_id || null,
                forma_pagamento: formaPagto,
                gateway: 'asaas',
                gateway_payment_id: payment.id,
                valor_bruto: rawValue,
                valor_liquido: netValue,
                data_pagamento: dataPagamento || new Date().toISOString(),
                status: 'Recebido'
              }
            };
            const updatedObs = `${lead.observacoes || ''}\n\n[RECEITA FINANCEIRA ASAAS]\n${JSON.stringify(fallbackData, null, 2)}`;
            await supabase
              .from('leads')
              .update({ observacoes: updatedObs })
              .eq('id', lead.id);

            // Fallback de comissão simulada para observações
            const percentual = 10.0;
            const valorComissao = parseFloat((rawValue * (percentual / 100)).toFixed(2));
            const fallbackComissao = {
              financeiro_comissoes: {
                receita_id: null,
                lead_id: lead.id,
                captador_id: lead.captado_por_id || null,
                instituicao_id: lead.instituicao_id,
                percentual_aplicado: percentual,
                valor_base: rawValue,
                valor_comissao: valorComissao,
                status: 'PENDENTE'
              }
            };
            const updatedObsComissao = `${updatedObs}\n\n[COMISSÃO GERADA]\n${JSON.stringify(fallbackComissao, null, 2)}`;
            await supabase
              .from('leads')
              .update({ observacoes: updatedObsComissao })
              .eq('id', lead.id);
          }
        } else {
          // Se a receita já existia, mas por algum motivo a comissão não foi calculada, tenta calcular
          await calcularComissaoReceita(supabase, existingRevenue.id);
        }
      } catch (revError) {
        console.error('[Webhook Asaas] Erro geral ao processar receita comercial:', revError);
      }
    }

    // 5.C. Criar ou Atualizar Venda Comercial
    try {
      const rawValue = payment.value || 0;
      const statusVenda = novoStatus === 'RECEIVED' || novoStatus === 'CONFIRMED' ? 'PAGO' : (novoStatus === 'OVERDUE' ? 'AGUARDANDO_PAGAMENTO' : (novoStatus === 'DELETED' || novoStatus === 'REFUNDED' ? 'CANCELADO' : 'AGUARDANDO_PAGAMENTO'));

      // Obter receita correspondente se existir
      const { data: rec } = await supabase
        .from('financeiro_receitas_comerciais')
        .select('id')
        .eq('gateway_payment_id', payment.id)
        .maybeSingle();

      const { data: existingSale } = await supabase
        .from('vendas_comerciais')
        .select('id')
        .eq('gateway_payment_id', payment.id)
        .maybeSingle();

      if (existingSale) {
        await supabase
          .from('vendas_comerciais')
          .update({
            status: statusVenda,
            receita_id: rec?.id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSale.id);
      } else {
        const { data: newSale, error: insertSaleErr } = await supabase
          .from('vendas_comerciais')
          .insert({
            lead_id: lead.id,
            receita_id: rec?.id || null,
            instituicao_id: lead.instituicao_id,
            curso_id: lead.cursoid || null,
            captador_id: lead.captado_por_id || null,
            gateway: 'asaas',
            gateway_payment_id: payment.id,
            valor: rawValue,
            status: statusVenda
          })
          .select()
          .single();

        if (!insertSaleErr) {
          // Timeline 360
          try {
            const { registrarInteracao } = require('../../../lib/comercial/interacao-service');
            await registrarInteracao(supabase, lead.id, {
              instituicao_id: lead.instituicao_id,
              tipo: 'venda_criada',
              descricao: `Nova venda comercial registrada. Gateway: Asaas. Valor: R$ ${rawValue.toFixed(2)}. Status: ${statusVenda}`
            });
          } catch (_) {}
        }

        if (insertSaleErr) {
          console.error('[Webhook Asaas] Erro ao inserir venda comercial (tentando fallback):', insertSaleErr);
          const fallbackVenda = {
            vendas_comerciais: {
              lead_id: lead.id,
              receita_id: rec?.id || null,
              instituicao_id: lead.instituicao_id,
              curso_id: lead.cursoid || null,
              captador_id: lead.captado_por_id || null,
              gateway: 'asaas',
              gateway_payment_id: payment.id,
              valor: rawValue,
              status: statusVenda
            }
          };
          const leadObs = lead.observacoes || '';
          const updatedObs = `${leadObs}\n\n[VENDA COMERCIAL REGISTRADA]\n${JSON.stringify(fallbackVenda, null, 2)}`;
          await supabase
            .from('leads')
            .update({ observacoes: updatedObs })
            .eq('id', lead.id);
        }
      }
    } catch (vendaError) {
      console.error('[Webhook Asaas] Erro geral ao processar venda comercial:', vendaError);
    }

    // 6. Registrar Auditoria
    await supabase
      .from('leads_auditoria')
      .insert({
        lead_id: lead.id,
        usuario_id: lead.captado_por_id || null,
        acao: 'webhook_asaas_recebido',
        dados_anteriores: {
          asaas_status_pagamento: lead.asaas_status_pagamento || 'PENDENTE',
          status: lead.status
        },
        dados_novos: {
          asaas_status_pagamento: novoStatus,
          data_pagamento: dataPagamento,
          valor_pago: valorPago,
          evento: event
        }
      });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook Asaas] Erro crítico no webhook:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
