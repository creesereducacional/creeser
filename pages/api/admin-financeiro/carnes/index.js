import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Buscar apenas carnês (tipo = 'carne')
    const { data: carnes, error: carnesError } = await supabase
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
        efi_carnet_id,
        efi_status,
        criado_por,
        created_at,
        updated_at,
        alunos(nome, cpf, email)
      `)
      .eq('tipo', 'carne')
      .order('created_at', { ascending: false });

    if (carnesError) throw carnesError;

    // Buscar parcelas para cada carnê
    const carnesComParcelas = [];
    for (const carne of (carnes || [])) {
      const { data: parcelas, error: parcelasError } = await supabase
        .from('financeiro_parcelas')
        .select('id, numero_parcela, valor, data_vencimento, status, boleto_numero, boleto_url, efi_charge_id')
        .eq('ordem_pagamento_id', carne.id)
        .order('numero_parcela', { ascending: true });

      if (!parcelasError) {
        carnesComParcelas.push({
          ...carne,
          aluno_nome: carne.alunos?.nome || 'N/A',
          aluno_cpf: carne.alunos?.cpf || 'N/A',
          aluno_email: carne.alunos?.email || 'N/A',
          parcelas: parcelas || []
        });
      }
    }

    return res.status(200).json({
      carnes: carnesComParcelas,
      total: carnesComParcelas.length
    });
  } catch (error) {
    console.error('Erro ao listar carnês:', error);
    return res.status(500).json({
      message: 'Erro ao listar carnês',
      error: error.message
    });
  }
}
