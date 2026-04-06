import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Buscar aluno específico
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select(
          `id,
          nome,
          cpf,
          email,
          turmaid,
          cursoid,
          statusmatricula,
          valor_matricula,
          valor_mensalidade,
          percentual_desconto,
          qtd_parcelas,
          dia_pagamento,
          telefone_celular,
          endereco`
        )
        .eq('id', Number(id))
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao buscar aluno:', error);
      return res.status(500).json({ message: 'Erro ao buscar aluno' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
