import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { id } = req.query;

  try {
    const { data: ordens, error } = await supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id,
        tipo,
        descricao,
        referencia,
        valor_total,
        percentual_desconto,
        valor_desconto,
        quantidade_parcelas,
        status,
        efi_charge_id,
        observacoes,
        created_at,
        updated_at,
        financeiro_parcelas(id, numero_parcela, valor, data_vencimento, status, boleto_numero, boleto_url, efi_charge_id)
      `)
      .eq('aluno_id', id)
      .eq('tipo', 'ordem_simples')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const resultado = (ordens || []).map(o => {
      const parcela = (o.financeiro_parcelas || [])[0] || {};
      return {
        ...o,
        data_vencimento: parcela.data_vencimento || null,
        status_parcela: parcela.status || o.status,
        cobranca: parcela.boleto_numero || parcela.efi_charge_id || o.efi_charge_id || null,
        parcela_id: parcela.id || null,
        boleto_url: parcela.boleto_url || null,
        observacoes: o.observacoes || null,
        updated_at: o.updated_at || null,
      };
    });

    return res.status(200).json({ ordens: resultado });
  } catch (error) {
    console.error('Erro ao buscar ordens do aluno:', error);
    return res.status(500).json({ message: 'Erro ao buscar ordens', error: error.message });
  }
}
