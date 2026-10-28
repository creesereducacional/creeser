/**
 * lib/turma-capacity.js
 *
 * Helper unificado para contagem de vínculos válidos e validação de capacidade máxima de turmas.
 * Regras:
 * - Conta cada vínculo válido de matrícula na turma (excluindo CANCELADO, DESISTENTE).
 * - Considera também eventuais registros legados diretos em alunos (alunos.turmaid = turma_id) que ainda não tenham vínculo na tabela matriculas.
 * - Bloqueia nova matrícula / transferência se capacidade máxima estiver definida e ocupadas >= capacidade máxima.
 * - Fornece métricas de mínimo de início (qtd_minima_alunos) e atingimento (percentualMinimo, minimoAtingido).
 */

export const STATUS_DESVINCULADOS = ['CANCELADO', 'DESISTENTE'];

/**
 * Conta os vínculos válidos de alunos para uma lista de turmas ou para todas as turmas da instituição.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {number|number[]} turmaIds
 * @param {string|null} instituicaoId
 * @returns {Promise<Record<number, number>>} Mapa turmaId -> totalVenculosValidos
 */
export async function contarVinculosValidosPorTurma(supabase, turmaIds, instituicaoId = null) {
  const ids = Array.isArray(turmaIds) ? turmaIds.map(Number).filter(Boolean) : [Number(turmaIds)].filter(Boolean);
  
  // 1. Buscar matrículas com status administrativo válido
  let matQuery = supabase
    .from('matriculas')
    .select('id, turma_id, aluno_id, status_administrativo')
    .not('turma_id', 'is', null);

  if (ids.length > 0) {
    matQuery = matQuery.in('turma_id', ids);
  }
  if (instituicaoId) {
    matQuery = matQuery.eq('instituicao_id', instituicaoId);
  }

  const { data: mats, error: errMats } = await matQuery;
  if (errMats) {
    console.error('[turma-capacity] Erro ao buscar matrículas:', errMats);
    throw errMats;
  }

  // 2. Buscar também alunos legados (alunos.turmaid) para cobrir eventuais alunos sem linha em matriculas
  let alQuery = supabase
    .from('alunos')
    .select('id, turmaid, statusmatricula')
    .not('turmaid', 'is', null);

  if (ids.length > 0) {
    alQuery = alQuery.in('turmaid', ids);
  }
  if (instituicaoId) {
    alQuery = alQuery.eq('instituicao_id', instituicaoId);
  }

  const { data: alunos, error: errAlunos } = await alQuery;
  if (errAlunos) {
    console.error('[turma-capacity] Erro ao buscar alunos legados:', errAlunos);
    throw errAlunos;
  }

  const contagemMap = {};
  const paresRegistrados = new Set();

  (mats || []).forEach((m) => {
    const status = String(m.status_administrativo || 'ATIVO').toUpperCase().trim();
    if (STATUS_DESVINCULADOS.includes(status)) return;
    if (!m.turma_id) return;

    const tId = Number(m.turma_id);
    const parKey = `${tId}_${m.aluno_id || m.id}`;
    if (!paresRegistrados.has(parKey)) {
      paresRegistrados.add(parKey);
      contagemMap[tId] = (contagemMap[tId] || 0) + 1;
    }
  });

  (alunos || []).forEach((a) => {
    const status = String(a.statusmatricula || 'ATIVO').toUpperCase().trim();
    if (STATUS_DESVINCULADOS.includes(status)) return;
    if (!a.turmaid) return;

    const tId = Number(a.turmaid);
    const parKey = `${tId}_${a.id}`;
    if (!paresRegistrados.has(parKey)) {
      paresRegistrados.add(parKey);
      contagemMap[tId] = (contagemMap[tId] || 0) + 1;
    }
  });

  return contagemMap;
}

/**
 * Valida se uma turma possui vaga disponível antes de matricular ou transferir um aluno.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {number} turmaId
 * @param {string|null} instituicaoId
 * @returns {Promise<{ ok: boolean, turma: any, ocupadas: number, capacidadeMaxima: number|null, message?: string }>}
 */
export async function validarCapacidadeTurma(supabase, turmaId, instituicaoId = null) {
  const turmaIdNum = Number(turmaId);
  if (!turmaIdNum) {
    return { ok: false, message: 'ID de turma inválido.' };
  }

  let query = supabase
    .from('turmas')
    .select('id, nome, capacidademaxima, qtd_minima_alunos, situacao, instituicao_id')
    .eq('id', turmaIdNum)
    .maybeSingle();

  if (instituicaoId) {
    query = query.eq('instituicao_id', instituicaoId);
  }

  const { data: turma, error } = await query;
  if (error || !turma) {
    return { ok: false, message: 'Turma não encontrada ou inacessível.' };
  }

  const capacidade = turma.capacidademaxima ? Number(turma.capacidademaxima) : null;
  const mapa = await contarVinculosValidosPorTurma(supabase, turmaIdNum, turma.instituicao_id);
  const ocupadas = mapa[turmaIdNum] || 0;

  if (capacidade !== null && capacidade > 0 && ocupadas >= capacidade) {
    return {
      ok: false,
      turma,
      ocupadas,
      capacidadeMaxima: capacidade,
      message: `A turma "${turma.nome}" atingiu a capacidade máxima de vagas permitida (${ocupadas}/${capacidade}).`,
    };
  }

  return {
    ok: true,
    turma,
    ocupadas,
    capacidadeMaxima: capacidade,
  };
}
