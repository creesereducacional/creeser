import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Buscar todos os alunos com dados financeiros
    const { data: alunos, error: alunosError } = await supabase
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
      .order('nome', { ascending: true });

    if (alunosError) throw alunosError;

    // Buscar turmas
    const { data: turmas, error: turmasError } = await supabase
      .from('turmas')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (turmasError) throw turmasError;

    // Buscar cursos
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (cursosError) throw cursosError;

    return res.status(200).json({
      alunos: alunos || [],
      turmas: turmas || [],
      cursos: cursos || [],
      total: alunos ? alunos.length : 0
    });
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    return res.status(500).json({ 
      message: 'Erro ao listar alunos',
      error: error.message 
    });
  }
}
