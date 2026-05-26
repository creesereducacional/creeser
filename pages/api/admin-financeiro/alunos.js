import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
      return;
    }

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
    const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

    if (!isGroupAdmin && !instituicaoId) {
      return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
    }

    // Buscar todos os alunos com dados financeiros
    let alunosQuery = supabase
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

    alunosQuery = applyInstituicaoFilter(alunosQuery, instituicaoId);
    const { data: alunos, error: alunosError } = await alunosQuery;

    if (alunosError) throw alunosError;

    // Buscar turmas
    let turmasQuery = supabase
      .from('turmas')
      .select('id, nome')
      .order('nome', { ascending: true });

    turmasQuery = applyInstituicaoFilter(turmasQuery, instituicaoId);
    const { data: turmas, error: turmasError } = await turmasQuery;

    if (turmasError) throw turmasError;

    // Buscar cursos
    let cursosQuery = supabase
      .from('cursos')
      .select('id, nome')
      .order('nome', { ascending: true });

    cursosQuery = applyInstituicaoFilter(cursosQuery, instituicaoId);
    const { data: cursos, error: cursosError } = await cursosQuery;

    if (cursosError) throw cursosError;

    // Buscar resumo financeiro por aluno (parcelas)
    const hoje = new Date().toISOString().split('T')[0];
    let parcelasQuery = supabase
      .from('financeiro_parcelas')
      .select('valor, status, data_vencimento, financeiro_ordens_pagamento!inner(aluno_id)');

    parcelasQuery = applyInstituicaoFilter(parcelasQuery, instituicaoId);
    const { data: parcelas } = await parcelasQuery;

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
