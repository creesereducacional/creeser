import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  hasPerfil
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  // Apenas grupo_admin, instituicao_admin, admin e coordenador podem gerenciar os vínculos
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) {
    return;
  }

  const { id: professorIdQuery } = req.query;
  const professorId = parseInt(professorIdQuery, 10);

  if (Number.isNaN(professorId)) {
    return res.status(400).json({ error: 'ID de professor inválido' });
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
  }

  try {
    // GET: Listar todos os vínculos do professor correspondente filtrados por instituição
    if (req.method === 'GET') {
      let query = supabase
        .from('professor_turma_disciplinas')
        .select(`
          id,
          ativo,
          turma_id,
          disciplina_id,
          turmas (id, nome),
          disciplinas (id, nome)
        `)
        .eq('professor_id', professorId);

      if (!isGroupAdmin) {
        query = query.eq('instituicao_id', instituicaoId);
      }

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data || []);
    }

    // POST: Criar novo vínculo
    if (req.method === 'POST') {
      const { turma_id, disciplina_id } = req.body || {};

      if (!turma_id || !disciplina_id) {
        return res.status(400).json({ error: 'turma_id e disciplina_id são obrigatórios' });
      }

      // Validar se o professor existe e se pertence à mesma instituição do operador
      if (!isGroupAdmin) {
        const { data: prof, error: profError } = await supabase
          .from('professores')
          .select('id, instituicao_id')
          .eq('id', professorId)
          .eq('instituicao_id', instituicaoId)
          .maybeSingle();

        if (profError || !prof) {
          return res.status(403).json({ error: 'Acesso negado: professor não pertence à sua instituição.' });
        }
      }

      // Evitar duplicidade de vínculo
      const { data: existing, error: existError } = await supabase
        .from('professor_turma_disciplinas')
        .select('id')
        .eq('professor_id', professorId)
        .eq('turma_id', turma_id)
        .eq('disciplina_id', disciplina_id)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'Vínculo já cadastrado para este professor.' });
      }

      const payload = {
        professor_id: professorId,
        turma_id: parseInt(turma_id, 10),
        disciplina_id: parseInt(disciplina_id, 10),
        instituicao_id: instituicaoId,
        ativo: true
      };

      const { data, error } = await supabase
        .from('professor_turma_disciplinas')
        .insert([payload])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(data);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });

  } catch (error) {
    console.error('Erro na API de vinculos de professor:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição', message: error.message });
  }
}
