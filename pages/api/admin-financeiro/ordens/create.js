import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const {
      aluno_id,
      tipo,
      descricao,
      referencia,
      valor_total,
      percentual_desconto,
      valor_desconto,
      quantidade_parcelas,
      observacoes,
      criado_por,
      data_vencimento_primeira,
      intervalo_dias
    } = req.body;

    // Validações
    if (!aluno_id || !tipo || !descricao || !valor_total || valor_total <= 0) {
      return res.status(400).json({ 
        message: 'Dados obrigatórios faltando: aluno_id, tipo, descricao, valor_total' 
      });
    }

    // Validar tipo
    if (!['ordem_simples', 'carne'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido. Use: ordem_simples ou carne' });
    }

    // Criar ordem principal
    const { data: ordemData, error: ordemError } = await supabase
      .from('financeiro_ordens_pagamento')
      .insert([{
        aluno_id,
        tipo,
        descricao,
        referencia: referencia || null,
        valor_total,
        percentual_desconto: percentual_desconto || 0,
        valor_desconto: valor_desconto || 0,
        quantidade_parcelas: quantidade_parcelas || 1,
        observacoes: observacoes || null,
        status: 'ativo',
        criado_por: criado_por || 'financeiro'
      }])
      .select()
      .single();

    if (ordemError) throw ordemError;

    const ordem_id = ordemData.id;

    // Gerar parcelas
    const parcelas = [];
    const qtd = quantidade_parcelas || 1;
    const valorParcela = valor_total / qtd;

    let dataVencimento = new Date(data_vencimento_primeira || Date.now());
    const dias = intervalo_dias || 30;

    for (let i = 1; i <= qtd; i++) {
      parcelas.push({
        ordem_pagamento_id: ordem_id,
        aluno_id,
        numero_parcela: i,
        valor: Number(valorParcela.toFixed(2)),
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        status: 'pendente'
      });

      // Próximo vencimento (incremente os dias)
      dataVencimento.setDate(dataVencimento.getDate() + dias);
    }

    // Inserir todas as parcelas
    const { data: parcelasData, error: parcelasError } = await supabase
      .from('financeiro_parcelas')
      .insert(parcelas)
      .select();

    if (parcelasError) throw parcelasError;

    return res.status(201).json({
      sucesso: true,
      ordem: ordemData,
      parcelas: parcelasData,
      total_parcelas: parcelasData.length,
      mensagem: `${tipo === 'ordem_simples' ? 'Ordem' : 'Carnê'} criado com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao criar ordem:', error);
    return res.status(500).json({ 
      message: 'Erro ao criar ordem',
      error: error.message 
    });
  }
}
