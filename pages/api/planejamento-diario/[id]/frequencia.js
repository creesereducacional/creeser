import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função centralizada e reutilizável para recálculo da frequência acumulada
export async function recalcularFrequenciaAluno(supabase, alunoId, turmaId, disciplinaId) {
  // 1. Obter total de aulas ministradas para a turma nesta disciplina
  const { count: totalAulas, error: errorAulas } = await supabase
    .from('planejamento_diario')
    .select('id', { count: 'exact', head: true })
    .eq('turma', String(turmaId))
    .eq('disciplina', String(disciplinaId));

  if (errorAulas) throw errorAulas;
  if (!totalAulas || totalAulas === 0) return 100.00;

  // 2. Obter total de faltas do aluno
  const { data: faltasData, error: errorFaltas } = await supabase
    .from('diario_frequencia')
    .select(`
      id,
      presenca,
      planejamento_diario!inner(turma, disciplina)
    `)
    .eq('aluno_id', alunoId)
    .eq('presenca', false)
    .eq('planejamento_diario.turma', String(turmaId))
    .eq('planejamento_diario.disciplina', String(disciplinaId));

  if (errorFaltas) throw errorFaltas;
  const totalFaltas = faltasData?.length || 0;

  const percentual = parseFloat((((totalAulas - totalFaltas) / totalAulas) * 100).toFixed(2));

  // 3. Atualizar a tabela notas_faltas
  const { data: aluno } = await supabase
    .from('alunos')
    .select('matricula')
    .eq('id', alunoId)
    .maybeSingle();

  if (aluno?.matricula) {
    await supabase
      .from('notas_faltas')
      .update({ frequencia: percentual })
      .eq('matricula', aluno.matricula)
      .eq('turma', String(turmaId))
      .eq('disciplina', String(disciplinaId));
  }

  return percentual;
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'admin'])) return;

  const { id: aulaId } = req.query;
  const instituicaoId = resolveInstituicaoId(req, authUser);

  try {
    // Carregar a aula
    const { data: aula, error: aulaError } = await supabase
      .from('planejamento_diario')
      .select('*')
      .eq('id', aulaId)
      .single();

    if (aulaError || !aula) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }

    const turmaId = parseInt(aula.turma, 10);
    const disciplinaId = parseInt(aula.disciplina, 10);

    if (req.method === 'GET') {
      // 1. Carregar alunos ativos da turma
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('id, nome, matricula')
        .eq('turmaid', turmaId)
        .eq('statusmatricula', 'ATIVO')
        .order('nome', { ascending: true });

      if (alunosError) throw alunosError;

      // 2. Carregar frequências já salvas
      const { data: frequencias, error: freqError } = await supabase
        .from('diario_frequencia')
        .select('*')
        .eq('aula_id', aulaId);

      if (freqError) throw freqError;

      const freqMap = new Map(frequencias.map(f => [f.aluno_id, f]));

      // 3. Montar listagem consolidada
      const listagem = (alunos || []).map(aluno => {
        const registro = freqMap.get(aluno.id);
        return {
          id: aluno.id,
          nome: aluno.nome,
          matricula: aluno.matricula,
          presenca: registro ? registro.presenca : true,
          justificativa: registro ? registro.justificativa || '' : ''
        };
      });

      return res.status(200).json(listagem);
    }

    if (req.method === 'POST') {
      const { presencas } = req.body || {};
      if (!Array.isArray(presencas)) {
        return res.status(400).json({ error: 'Payload de presenças inválido.' });
      }

      // Upsert das presenças
      for (const item of presencas) {
        const { aluno_id, presenca, justificativa } = item;
        const { error: upsertError } = await supabase
          .from('diario_frequencia')
          .upsert({
            aula_id: aulaId,
            aluno_id: parseInt(aluno_id, 10),
            presenca: Boolean(presenca),
            justificativa: justificativa || null,
            usuario_id: authUser.id || null,
            instituicao_id: instituicaoId
          }, { onConflict: 'aula_id,aluno_id' });

        if (upsertError) throw upsertError;

        // Recalcular frequência acumulada para o aluno
        await recalcularFrequenciaAluno(supabase, aluno_id, turmaId, disciplinaId);
      }

      return res.status(200).json({ message: 'Frequência salva e atualizada com sucesso!' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  } catch (error) {
    console.error('Erro na API de frequência:', error);
    return res.status(500).json({ error: 'Erro no processamento da frequência', detail: error.message });
  }
}
