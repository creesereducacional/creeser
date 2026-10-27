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

    // Buscar alunos base (sem filtrar aqui por curso/turma/status para permitir
    // desdobramento correto de múltiplos cursos na tabela matriculas)
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
        numero_id,
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
          instituicao_id,
          unidades (
            id,
            nome
          )
        )`
      )
      .order('nome', { ascending: true });

    const reqInstituicaoId = req.query.instituicao_id || req.query.instituicaoId;
    const effectiveInstituicaoId = reqInstituicaoId ? String(reqInstituicaoId) : instituicaoId;

    if (effectiveInstituicaoId) {
      alunosQuery = alunosQuery.eq('instituicao_id', effectiveInstituicaoId);
    } else if (!isGroupAdmin) {
      alunosQuery = applyInstituicaoFilter(alunosQuery, instituicaoId);
    }

    // Filtro de busca textual em alunos (nome, CPF, matrícula ou responsável)
    if (search && String(search).trim()) {
      const term = String(search).trim();
      let orFilter = `nome.ilike.%${term}%,cpf.eq.${term},matricula.ilike.%${term}%`;
      if (responsavelAlunoIds.length > 0) {
        orFilter += `,id.in.(${responsavelAlunoIds.join(',')})`;
      }
      alunosQuery = alunosQuery.or(orFilter);
    }

    let totalGeralQuery = supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true });

    if (effectiveInstituicaoId) {
      totalGeralQuery = totalGeralQuery.eq('instituicao_id', effectiveInstituicaoId);
    } else if (!isGroupAdmin) {
      totalGeralQuery = applyInstituicaoFilter(totalGeralQuery, instituicaoId);
    }

    const [{ count: totalGeralCount }, { data: alunosData, error: alunosError }] = await Promise.all([
      totalGeralQuery,
      alunosQuery
    ]);

    if (alunosError) throw alunosError;

    const alunosCarregados = alunosData || [];
    const alunoIdsCarregados = alunosCarregados.map(a => a.id).filter(Boolean);

    // ── Resolução de Matrículas e Vínculos Acadêmicos em Lote ───────────────────
    let matriculasPorAluno = {};
    let matriculaInstitucionalPorAluno = {};

    if (alunoIdsCarregados.length > 0) {
      const { data: matriculasData, error: matError } = await supabase
        .from('matriculas')
        .select(`
          id,
          codigo_matricula,
          aluno_id,
          instituicao_id,
          curso_id,
          turma_id,
          ano_letivo,
          semestre,
          status_administrativo,
          situacao_academica,
          is_principal,
          tipo_origem,
          created_at,
          data_matricula,
          valor_matricula,
          valor_mensalidade,
          percentual_desconto,
          qtd_parcelas,
          dia_pagamento,
          qtd_meses_contrato,
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
            instituicao_id,
            unidades (
              id,
              nome
            )
          )
        `)
        .in('aluno_id', alunoIdsCarregados)
        .order('is_principal', { ascending: false })
        .order('created_at', { ascending: false });

      if (!matError && Array.isArray(matriculasData)) {
        matriculasData.forEach(mat => {
          if (!matriculasPorAluno[mat.aluno_id]) {
            matriculasPorAluno[mat.aluno_id] = [];
          }
          matriculasPorAluno[mat.aluno_id].push(mat);
        });

        // Resolução canônica da Matrícula Institucional Única por Aluno
        alunoIdsCarregados.forEach(aid => {
          const alunoObj = alunosCarregados.find(a => a.id === aid);
          if (alunoObj?.matricula) {
            matriculaInstitucionalPorAluno[aid] = String(alunoObj.matricula).trim();
            return;
          }

          const mats = matriculasPorAluno[aid] || [];
          if (mats.length > 0) {
            const matsCronologicas = [...mats].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            const matInaugural = matsCronologicas.find(m => !m.tipo_origem && m.codigo_matricula) ||
                                 matsCronologicas.find(m => m.codigo_matricula) ||
                                 mats[0];
            matriculaInstitucionalPorAluno[aid] = matInaugural?.codigo_matricula || null;
          } else {
            matriculaInstitucionalPorAluno[aid] = alunoObj?.numero_id ? String(alunoObj.numero_id) : null;
          }
        });
      }
    }

    // Helper: verificação de escopo de unidade (Fase 6.2)
    const unidadePermitida = (uid) => {
      if (!ctx.unidadesPermitidas) return true; // irrestrito (matriz/grupo_admin)
      if (uid == null) return true;            // sem unidade definida -> não ocultar dado incompleto
      return ctx.unidadesPermitidas.includes(Number(uid));
    };

    // Desdobrar cada aluno em seus vínculos acadêmicos reais (1 linha por Matrícula / Curso)
    const registrosDesdobrados = [];

    alunosCarregados.forEach(aluno => {
      const matriculasDoAluno = matriculasPorAluno[aluno.id] || [];
      const numeroMatriculaInstitucional = matriculaInstitucionalPorAluno[aluno.id] || aluno.matricula || aluno.numero_id || null;

      if (matriculasDoAluno.length > 0) {
        matriculasDoAluno.forEach(mat => {
          const turmaObj = mat.turmas || aluno.turmas || {};
          const cursoObj = mat.cursos || aluno.cursos || {};
          const unidadeObj = turmaObj.unidades || (aluno.turmas?.unidades ? aluno.turmas.unidades : {});

          const unidadeIdMatricula = turmaObj?.unidadeid != null
            ? Number(turmaObj.unidadeid)
            : (aluno.turmas?.unidadeid != null ? Number(aluno.turmas.unidadeid) : (unidadeObj.id != null ? Number(unidadeObj.id) : null));
          const unidadeNomeMatricula = unidadeObj.nome || (aluno.turmas?.unidades?.nome || null);

          // Validação de escopo de filial
          if (!unidadePermitida(unidadeIdMatricula)) return;

          registrosDesdobrados.push({
            ...aluno,
            // Identificador e dados da matrícula específica
            matricula_id: mat.id,
            is_principal: Boolean(mat.is_principal),
            codigo_vinculo_matricula: mat.codigo_matricula,
            // Matrícula Institucional Única para exibição consistente
            matricula: numeroMatriculaInstitucional,
            matricula_institucional: numeroMatriculaInstitucional,
            // Curso da matrícula
            cursoid: mat.curso_id || aluno.cursoid,
            curso_id: mat.curso_id || aluno.cursoid,
            curso: cursoObj.nome || aluno.cursos?.nome || '',
            cursos: cursoObj,
            // Turma da matrícula
            turmaid: mat.turma_id || aluno.turmaid,
            turma_id: mat.turma_id || aluno.turmaid,
            turma: turmaObj.nome || aluno.turmas?.nome || '',
            turmas: turmaObj,
            // Unidade da matrícula
            unidade_id: unidadeIdMatricula,
            unidade: unidadeNomeMatricula || '',
            // Status do vínculo
            statusmatricula: mat.status_administrativo || aluno.statusmatricula || 'ATIVO',
            ano_letivo: mat.ano_letivo || aluno.ano_letivo,
            ano_letivo_turma: mat.ano_letivo || aluno.ano_letivo || '',
            semestre: mat.semestre || aluno.semestre || '1',
            // Valores financeiros específicos da matrícula com fallback para aluno/turma
            valor_matricula: mat.valor_matricula != null ? mat.valor_matricula : aluno.valor_matricula,
            valor_mensalidade: mat.valor_mensalidade != null ? mat.valor_mensalidade : aluno.valor_mensalidade,
            percentual_desconto: mat.percentual_desconto != null ? mat.percentual_desconto : (aluno.percentual_desconto || turmaObj.desconto || null),
            qtd_parcelas: mat.qtd_parcelas != null ? mat.qtd_parcelas : (aluno.qtd_parcelas || turmaObj.mesescontrato || null),
            dia_pagamento: mat.dia_pagamento != null ? mat.dia_pagamento : aluno.dia_pagamento,
            mesescontrato_turma: turmaObj.mesescontrato || aluno.turmas?.mesescontrato || null,
            desconto_turma: turmaObj.desconto || aluno.turmas?.desconto || null,
          });
        });
      } else {
        // Fallback para registro legado sem linha na tabela matriculas
        const turmaObj = aluno.turmas || {};
        const cursoObj = aluno.cursos || {};
        const unidadeObj = turmaObj.unidades || {};

        const unidadeIdLegado = turmaObj?.unidadeid != null
          ? Number(turmaObj.unidadeid)
          : (unidadeObj.id != null ? Number(unidadeObj.id) : null);
        const unidadeNomeLegado = unidadeObj.nome || null;

        if (!unidadePermitida(unidadeIdLegado)) return;

        registrosDesdobrados.push({
          ...aluno,
          matricula_id: null,
          is_principal: true,
          codigo_vinculo_matricula: null,
          matricula: numeroMatriculaInstitucional,
          matricula_institucional: numeroMatriculaInstitucional,
          cursoid: aluno.cursoid,
          curso_id: aluno.cursoid,
          curso: cursoObj.nome || '',
          cursos: cursoObj,
          turmaid: aluno.turmaid,
          turma_id: aluno.turmaid,
          turma: turmaObj.nome || '',
          turmas: turmaObj,
          unidade_id: unidadeIdLegado,
          unidade: unidadeNomeLegado || '',
          statusmatricula: aluno.statusmatricula || 'ATIVO',
          ano_letivo: aluno.ano_letivo,
          ano_letivo_turma: aluno.ano_letivo || '',
          mesescontrato_turma: turmaObj.mesescontrato || null,
          desconto_turma: turmaObj.desconto || null,
        });
      }
    });

    // ── Aplicação de Filtros sobre os Vínculos Acadêmicos Desdobrados ────────────
    let alunosFiltrados = registrosDesdobrados;

    if (status && String(status).trim()) {
      const s = String(status).trim();
      alunosFiltrados = alunosFiltrados.filter(a => a.statusmatricula === s);
    }

    if (cursoId) {
      const cid = Number(cursoId);
      alunosFiltrados = alunosFiltrados.filter(a => Number(a.cursoid) === cid);
    }

    if (turmaId) {
      const tid = Number(turmaId);
      alunosFiltrados = alunosFiltrados.filter(a => Number(a.turmaid) === tid);
    }

    if (unidadeId) {
      const uid = Number(unidadeId);
      alunosFiltrados = alunosFiltrados.filter(a => Number(a.unidade_id) === uid);
    }

    if (anoLetivo) {
      const ano = Number(anoLetivo);
      alunosFiltrados = alunosFiltrados.filter(a => Number(a.ano_letivo) === ano);
    }

    // Buscar responsáveis financeiros dos alunos retornados em lote
    const alunoIdsUnicos = [...new Set(alunosFiltrados.map(a => a.id).filter(Boolean))];
    let relacoesResponsavel = [];
    if (alunoIdsUnicos.length > 0) {
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
        .in('aluno_id', alunoIdsUnicos);
      if (!relRespError && relResp) {
        relacoesResponsavel = relResp;
      }
    }

    // Buscar turmas para os selects de filtro
    let turmasQuery = supabase
      .from('turmas')
      .select('id, nome, unidadeid, cursoid')
      .order('nome', { ascending: true });

    turmasQuery = applyInstituicaoFilter(turmasQuery, effectiveInstituicaoId);
    const { data: turmas, error: turmasError } = await turmasQuery;

    if (turmasError) throw turmasError;

    // Buscar cursos para os selects de filtro
    let cursosQuery = supabase
      .from('cursos')
      .select('id, nome')
      .order('nome', { ascending: true });

    cursosQuery = applyInstituicaoFilter(cursosQuery, effectiveInstituicaoId);
    const { data: cursos, error: cursosError } = await cursosQuery;

    if (cursosError) throw cursosError;

    // Buscar resumo financeiro por aluno (parcelas)
    const hoje = new Date().toISOString().split('T')[0];
    let parcelasQuery = supabase
      .from('financeiro_parcelas')
      .select('valor, status, data_vencimento, financeiro_ordens_pagamento!inner(aluno_id)');

    parcelasQuery = applyInstituicaoFilter(parcelasQuery, effectiveInstituicaoId);
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

    const alunosComResumo = alunosFiltrados.map(a => {
      const responsavelObj = mapResponsavel(a.id);

      return {
        ...a,
        financeiro_aberto: resumoFinanceiro[a.id]?.aberto || 0,
        financeiro_atraso: resumoFinanceiro[a.id]?.atraso || 0,
        financeiro_pago: resumoFinanceiro[a.id]?.pago || 0,
        responsavel: responsavelObj,
      };
    });

    const totalAlunosUnicos = new Set(alunosComResumo.map(a => a.id)).size;

    return res.status(200).json({
      alunos: alunosComResumo,
      turmas: turmas || [],
      cursos: cursos || [],
      total: alunosComResumo.length,
      totalFiltrado: alunosComResumo.length,
      totalAlunosUnicos,
      totalMatriculas: alunosComResumo.length,
      totalGeral: totalGeralCount ?? totalAlunosUnicos,
    });
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    return res.status(500).json({ 
      message: 'Erro ao listar alunos',
      error: error.message 
    });
  }
}
