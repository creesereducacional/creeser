import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getEmpresaData() {
  try {
    const { data } = await supabase
      .from('configuracoes_empresa')
      .select('nome_empresa, cnpj, razao_social, endereco, cidade, estado, telefone, logo')
      .eq('id', 1)
      .single();
    if (!data) return {};
    return {
      nomeEmpresa: data.nome_empresa || '',
      cnpj: data.cnpj || '',
      razaoSocial: data.razao_social || '',
      endereco: data.endereco || '',
      cidade: data.cidade || '',
      estado: data.estado || '',
      telefone: data.telefone || '',
      logo: data.logo || '',
    };
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método não permitido' });

  const { ordemId } = req.query;

  try {
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, descricao, referencia, valor_total, aluno_id, financeiro_parcelas(valor, data_vencimento, status, boleto_numero, updated_at)')
      .eq('id', ordemId)
      .single();

    if (ordemErr || !ordem) return res.status(404).json({ message: 'Ordem não encontrada' });

    const { data: aluno } = await supabase
      .from('alunos')
      .select('nome, cpf, turmaid, cursoid')
      .eq('id', ordem.aluno_id)
      .single();

    const [{ data: turma }, { data: curso }] = await Promise.all([
      aluno?.turmaid ? supabase.from('turmas').select('nome').eq('id', aluno.turmaid).single() : Promise.resolve({ data: null }),
      aluno?.cursoid ? supabase.from('cursos').select('nome').eq('id', aluno.cursoid).single() : Promise.resolve({ data: null }),
    ]);

    const empresa = await getEmpresaData();
    const parcela = (ordem.financeiro_parcelas || [])[0] || {};

    return res.status(200).json({
      ordem_id: ordem.id,
      descricao: ordem.descricao,
      referencia: ordem.referencia,
      valor: Number(parcela.valor || ordem.valor_total),
      data_vencimento: parcela.data_vencimento,
      data_pagamento: parcela.updated_at,
      boleto_numero: parcela.boleto_numero,
      aluno: { nome: aluno?.nome || '-', cpf: aluno?.cpf || '-' },
      turma: { nome: turma?.nome || '-' },
      curso: { nome: curso?.nome || '-' },
      instituicao: {
        nome: empresa.nomeEmpresa || empresa.nomeempresa || 'Instituição',
        cnpj: empresa.cnpj || '',
        razaoSocial: empresa.razaoSocial || empresa.razaosocial || '',
        endereco: empresa.endereco || '',
        cidade: empresa.cidade || '',
        estado: empresa.estado || '',
        telefone: empresa.telefone || '',
        logo: empresa.logo || '',
      },
    });
  } catch (error) {
    console.error('[recibo]', error);
    return res.status(500).json({ message: error.message });
  }
}
