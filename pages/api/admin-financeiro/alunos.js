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

    // Buscar resumo financeiro por aluno (parcelas)
    const hoje = new Date().toISOString().split('T')[0];
    const { data: parcelas } = await supabase
      .from('financeiro_parcelas')
      .select('valor, status, data_vencimento, financeiro_ordens_pagamento!inner(aluno_id)');

    // Agregar por aluno_id
    const resumoFinanceiro = {};
    for (const p of (parcelas || [])) {
      const alunoId = p.financeiro_ordens_pagamento?.aluno_id;
      if (!alunoId) continue;
      if (!resumoFinanceiro[alunoId]) {
        resumoFinanceiro[alunoId] = { aberto: 0, atraso: 0, pago: 0 };
      }
      const valor = Number(p.valor) || 0;
      if (p.status === 'pago') {
        resumoFinanceiro[alunoId].pago += valor;
      } else if (p.status === 'pendente' && p.data_vencimento < hoje) {
        resumoFinanceiro[alunoId].atraso += valor;
      } else if (p.status === 'vencido') {
        resumoFinanceiro[alunoId].atraso += valor;
      } else if (p.status === 'pendente' && p.data_vencimento >= hoje) {
        resumoFinanceiro[alunoId].aberto += valor;
      }
    }

    const alunosComResumo = (alunos || []).map(a => ({
      ...a,
      financeiro_aberto: resumoFinanceiro[a.id]?.aberto || 0,
      financeiro_atraso: resumoFinanceiro[a.id]?.atraso || 0,
      financeiro_pago: resumoFinanceiro[a.id]?.pago || 0,
    }));

    return res.status(200).json({
      alunos: alunosComResumo,
      turmas: turmas || [],
      cursos: cursos || [],
      total: alunosComResumo.length
    });
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    return res.status(500).json({ 
      message: 'Erro ao listar alunos',
      error: error.message 
    });
  }
}
