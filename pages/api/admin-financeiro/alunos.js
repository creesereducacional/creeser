import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
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

    // ── FASE 6.2.1: Resolver contexto de escopo (Instituição × Unidade) ──────────
    const ctx = await resolveContextoUsuario(req, authUser);

    if (ctx.queryError) {
      console.error('[admin-financeiro/alunos] Falha ao resolver contexto de escopo:', ctx.queryError);
      return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
    }

    const instituicaoId = ctx.legacyFallback
      ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
      : ctx.instituicaoId;

    if (!isGroupAdmin && !instituicaoId) {
      return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
    }
    // ────────────────────────────────────────────────────────────────────────────

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
        instituicao_id,
        cursos (
          id,
          nome
        ),
        turmas (
          id,
          nome,
          unidadeid,
          mesescontrato,
          desconto,
          unidades (
            id,
            nome
          )
        )`
      )
      .order('nome', { ascending: true });

    if (!isGroupAdmin) {
      alunosQuery = applyInstituicaoFilter(alunosQuery, instituicaoId);
    } else if (req.query.instituicao_id) {
      alunosQuery = alunosQuery.eq('instituicao_id', req.query.instituicao_id);
    }

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
      alunosQuery = alunosQuery.eq('ano_letivo', Number(anoLetivo));
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      let orFilter = `nome.ilike.%${term}%,cpf.eq.${term},matricula.ilike.%${term}%`;
      if (responsavelAlunoIds.length > 0) {
        orFilter += `,id.in.(${responsavelAlunoIds.join(',')})`;
      }
      alunosQuery = alunosQuery.or(orFilter);
    }

    const { data: alunosData, error: alunosError } = await alunosQuery;

    if (alunosError) throw alunosError;

    const alunosCarregados = alunosData || [];
    const alunoIdsCarregados = alunosCarregados.map(a => a.id).filter(Boolean);

    // ── Resolução de Matrículas e Unidade em Lote (evita N+1 queries) ───────────
    let matriculasPorAluno = {};
    if (alunoIdsCarregados.length > 0) {
      const { data: matriculasData } = await supabase
        .from('matriculas')
        .select(`
          id,
          aluno_id,
          turma_id,
          is_principal,
          turmas (
            id,
            nome,
            unidadeid,
            unidades (
              id,
              nome
            )
          )
        `)
        .in('aluno_id', alunoIdsCarregados);

      if (Array.isArray(matriculasData)) {
        matriculasData.forEach(mat => {
          if (!matriculasPorAluno[mat.aluno_id]) {
            matriculasPorAluno[mat.aluno_id] = [];
          }
          matriculasPorAluno[mat.aluno_id].push(mat);
        });
      }
    }

    // Filtrar alunos conforme o escopo de unidade (para filial) e derivar unidade ativa
    const alunos = alunosCarregados.filter(aluno => {
      // 1. Prioriza matrícula (is_principal = true ou a primeira)
      const mats = matriculasPorAluno[aluno.id] || [];
      let matAlvo = mats.find(m => m.is_principal) || mats[0] || null;

      let unidadeIdDoAluno = null;
      let unidadeNomeDoAluno = null;

      if (matAlvo?.turmas) {
        unidadeIdDoAluno = matAlvo.turmas.unidadeid != null ? Number(matAlvo.turmas.unidadeid) : null;
        unidadeNomeDoAluno = matAlvo.turmas.unidades?.nome || null;
      }

      // 2. Fallback para alunos.turmaid (legado)
      if (unidadeIdDoAluno === null && aluno.turmas) {
        unidadeIdDoAluno = aluno.turmas.unidadeid != null
          ? Number(aluno.turmas.unidadeid)
          : (aluno.turmas.unidades?.id != null ? Number(aluno.turmas.unidades.id) : null);
        unidadeNomeDoAluno = aluno.turmas.unidades?.nome || null;
      }

      // Guardar referências enriquecidas no objeto do aluno
      aluno._resolvidaUnidadeId = unidadeIdDoAluno;
      aluno._resolvidaUnidadeNome = unidadeNomeDoAluno;

      // Se for Matriz ou Grupo Admin ou Legado irrestrito (ctx.unidadesPermitidas === null)
      if (ctx.unidadesPermitidas === null) {
        return true;
      }

      // Se for Filial, somente permitir se a unidade estiver em ctx.unidadesPermitidas
      if (unidadeIdDoAluno !== null) {
        return ctx.unidadesPermitidas.includes(unidadeIdDoAluno);
      }

      // Se não possui nenhuma unidade associada, permitir (dados legados incompletos)
      return true;
    });

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
        unidade: a._resolvidaUnidadeNome || unidadeObj.nome || '',
        unidade_id: a._resolvidaUnidadeId || unidadeObj.id || null,
        curso: cursoObj.nome || '',
        turma: turmaObj.nome || '',
        ano_letivo_turma: a.ano_letivo || '',
        mesescontrato_turma: turmaObj.mesescontrato || null,
        desconto_turma: turmaObj.desconto || null,
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
