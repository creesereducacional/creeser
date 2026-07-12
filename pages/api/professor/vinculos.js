import { createClient } from '@supabase/supabase-js';
import { requireAuth, resolveInstituicaoId } from '../../lib/auth-server';

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
      return res.status(200).json({ turmas: [], disciplinas: [], vinculos: [] });
    }

    // 2. Obter vínculos ativos do professor
    const { data: vinculos, error: vinError } = await supabase
      .from('professor_turma_disciplinas')
      .select(`
        id,
        turma_id,
        disciplina_id,
        turmas(id, nome, gradeid),
        disciplinas(id, numero_id, nome)
      `)
      .eq('professor_id', prof.id)
      .eq('ativo', true);

    if (vinError) throw vinError;

    // Extrair listas únicas de turmas e disciplinas
    const turmasMap = new Map();
    const disciplinasMap = new Map();

    (vinculos || []).forEach(v => {
      if (v.turmas) {
        turmasMap.set(v.turmas.id, v.turmas);
      }
      if (v.disciplinas) {
        disciplinasMap.set(v.disciplinas.numero_id || v.disciplinas.id, v.disciplinas);
      }
    });

    return res.status(200).json({
      turmas: Array.from(turmasMap.values()),
      disciplinas: Array.from(disciplinasMap.values()),
      vinculos: vinculos || []
    });
  } catch (error) {
    console.error('Erro ao carregar vínculos do professor:', error);
    return res.status(500).json({ error: 'Erro ao processar vínculos', detail: error.message });
  }
}
