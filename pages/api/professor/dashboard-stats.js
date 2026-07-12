import { createClient } from '@supabase/supabase-js';
import { requireAuth, resolveInstituicaoId } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const instituicaoId = resolveInstituicaoId(req, authUser);

  try {
    // 1. Obter o professor_id associado ao e-mail logado
    const { data: prof, error: profError } = await supabase
      .from('professores')
      .select('id')
      .eq('email', authUser.email)
      .eq('instituicao_id', instituicaoId)
      .maybeSingle();

    if (profError || !prof) {
      return res.status(200).json({
        turmasVinculadas: 0,
        disciplinasVinculadas: 0,
        totalAlunos: 0,
        aulasMinistradas: 0
      });
    }

    // 2. Obter vínculos ativos do professor
    const { data: vinculos, error: vinError } = await supabase
      .from('professor_turma_disciplinas')
      .select('turma_id, disciplina_id')
      .eq('professor_id', prof.id)
      .eq('ativo', true);

    if (vinError || !vinculos || vinculos.length === 0) {
      return res.status(200).json({
        turmasVinculadas: 0,
        disciplinasVinculadas: 0,
        totalAlunos: 0,
        aulasMinistradas: 0
      });
    }

    const uniqueTurmaIds = Array.from(new Set(vinculos.map(v => v.turma_id)));
    const uniqueDisciplinaIds = Array.from(new Set(vinculos.map(v => v.disciplina_id)));

    // 3. Obter contagem de alunos ativos nas turmas vinculadas
    const { count: totalAlunos, error: alunosError } = await supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true })
      .in('turmaid', uniqueTurmaIds)
      .eq('statusmatricula', 'ATIVO');

    if (alunosError) throw alunosError;

    // 4. Obter contagem de aulas ministradas (registros em planejamento_diario)
    // Na tabela planejamento_diario, a turma e a disciplina são salvas como TEXT.
    // Buscamos apenas os registros do professor logado.
    const { count: aulasMinistradas, error: aulasError } = await supabase
      .from('planejamento_diario')
      .select('id', { count: 'exact', head: true })
      .eq('professor', String(prof.id));

    if (aulasError) throw aulasError;

    return res.status(200).json({
      turmasVinculadas: uniqueTurmaIds.length,
      disciplinasVinculadas: uniqueDisciplinaIds.length,
      totalAlunos: totalAlunos || 0,
      aulasMinistradas: aulasMinistradas || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do professor:', error);
    return res.status(500).json({ error: 'Erro ao processar estatísticas', detail: error.message });
  }
}
