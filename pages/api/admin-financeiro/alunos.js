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

    const { anoLetivo, unidadeId, cursoId, turmaId, status, search } = req.query;

    // Buscar IDs de alunos por responsável financeiro se houver termo de busca
    let responsavelAlunoIds = [];
    if (search && String(search).trim()) {
      const term = String(search).trim();
      const { data: matchedResponsaveis } = await supabase
        .from('responsaveis')
        .select('id')
        .or(`nome.ilike.%${term}%,cpf.eq.${term}`);

      if (matchedResponsaveis && matchedResponsaveis.length > 0) {
        const respIds = matchedResponsaveis.map(r => r.id);
        const { data: matchedRelacoes } = await supabase
          .from('responsavel_aluno')
          .select('aluno_id')
          .in('responsavel_id', respIds);
        if (matchedRelacoes) {
          responsavelAlunoIds = matchedRelacoes.map(r => r.aluno_id).filter(Boolean);
        }
      }
    }

    // Buscar alunos com dados financeiros e relações
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
        endereco,
        ano_letivo,
        matricula,
        foto,
        cursos (
          id,
          nome
        ),
        turmas (
          id,
          nome,
          anoletivo,
          unidades (
            id,
            nome
          )
        )`
      )
      .order('nome', { ascending: true });

    alunosQuery = applyInstituicaoFilter(alunosQuery, instituicaoId);

    // Aplicar filtros dinâmicos
    if (status && String(status).trim()) {
      alunosQuery = alunosQuery.eq('statusmatricula', String(status).trim());
    }

    if (cursoId) {
      alunosQuery = alunosQuery.eq('cursoid', Number(cursoId));
    }

    if (turmaId) {
      alunosQuery = alunosQuery.eq('turmaid', Number(turmaId));
    }

    if (unidadeId) {
      const { data: turmasDaUnidade } = await supabase
        .from('turmas')
        .select('id')
        .eq('unidadeid', Number(unidadeId));
      const idsTurmasUnidade = (turmasDaUnidade || []).map(t => t.id);
      alunosQuery = alunosQuery.in('turmaid', idsTurmasUnidade.length > 0 ? idsTurmasUnidade : [-1]);
    }

    if (anoLetivo) {
      const { data: turmasDoAno } = await supabase
        .from('turmas')
        .select('id')
        .eq('anoletivo', String(anoLetivo));
      const idsTurmasAno = (turmasDoAno || []).map(t => t.id);
      alunosQuery = alunosQuery.or(`ano_letivo.eq.${anoLetivo},turmaid.in.(${idsTurmasAno.length > 0 ? idsTurmasAno.join(',') : -1})`);
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      let orFilter = `nome.ilike.%${term}%,cpf.eq.${term},matricula.ilike.%${term}%`;
      if (responsavelAlunoIds.length > 0) {
        orFilter += `,id.in.(${responsavelAlunoIds.join(',')})`;
      }
      alunosQuery = alunosQuery.or(orFilter);
    }

    const { data: alunos, error: alunosError } = await alunosQuery;

    if (alunosError) throw alunosError;

    // Buscar responsáveis financeiros dos alunos retornados em lote
    const alunoIds = (alunos || []).map(a => a.id);
    let relacoesResponsavel = [];
    if (alunoIds.length > 0) {
      const { data: relResp, error: relRespError } = await supabase
        .from('responsavel_aluno')
        .select(`
          aluno_id,
          responsaveis (
            id,
            nome,
            cpf
          )
        `)
        .in('aluno_id', alunoIds);
      if (!relRespError && relResp) {
        relacoesResponsavel = relResp;
      }
    }

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

    const mapResponsavel = (alunoId) => {
      const rels = relacoesResponsavel.filter(r => r.aluno_id === alunoId);
      if (rels.length === 0) return null;
      const resp = rels[0].responsaveis;
      if (!resp) return null;
      return {
        id: resp.id,
        nome: resp.nome || '',
        cpf: resp.cpf || '',
      };
    };

    const alunosComResumo = (alunos || []).map(a => {
      const turmaObj = a.turmas || {};
      const cursoObj = a.cursos || {};
      const unidadeObj = turmaObj.unidades || {};
      const responsavelObj = mapResponsavel(a.id);

      return {
        ...a,
        financeiro_aberto: resumoFinanceiro[a.id]?.aberto || 0,
        financeiro_atraso: resumoFinanceiro[a.id]?.atraso || 0,
        financeiro_pago: resumoFinanceiro[a.id]?.pago || 0,
        unidade: unidadeObj.nome || '',
        unidade_id: unidadeObj.id || null,
        curso: cursoObj.nome || '',
        turma: turmaObj.nome || '',
        ano_letivo_turma: turmaObj.anoletivo || '',
        responsavel: responsavelObj,
      };
    });

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
