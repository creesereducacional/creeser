import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Buscar apenas ordens simples (tipo = 'ordem_simples')
    const { data: ordens, error: ordensError } = await supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id,
        aluno_id,
        tipo,
        descricao,
        referencia,
        valor_total,
        percentual_desconto,
        valor_desconto,
        quantidade_parcelas,
        status,
        efi_charge_id,
        criado_por,
        created_at,
        updated_at,
        alunos(nome, cpf, email),
        financeiro_parcelas(id, numero_parcela, valor, data_vencimento, status, boleto_numero, efi_charge_id)
      `)
      .eq('tipo', 'ordem_simples')
      .order('created_at', { ascending: false });

    if (ordensError) throw ordensError;

    // Normalizar resposta
    const ordensNormalizadas = (ordens || []).map(o => {
      const parcela = (o.financeiro_parcelas || [])[0] || {};
      return {
        ...o,
        aluno_nome: o.alunos?.nome || 'N/A',
        aluno_cpf: o.alunos?.cpf || 'N/A',
        aluno_email: o.alunos?.email || 'N/A',
        data_vencimento: parcela.data_vencimento || null,
        status_parcela: parcela.status || o.status,
        cobranca: parcela.boleto_numero || parcela.efi_charge_id || o.efi_charge_id || '-',
        parcela_id: parcela.id || null
      };
    });

    return res.status(200).json({
      ordens: ordensNormalizadas,
      total: ordensNormalizadas.length
    });
  } catch (error) {
    console.error('Erro ao listar ordens:', error);
    return res.status(500).json({
      message: 'Erro ao listar ordens',
      error: error.message
    });
  }
}
