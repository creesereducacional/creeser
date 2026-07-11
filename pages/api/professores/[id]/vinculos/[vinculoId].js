import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  hasPerfil
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;

  // Apenas grupo_admin, instituicao_admin, admin e coordenador
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) {
    return;
  }

  const { id: professorIdQuery, vinculoId: vinculoIdQuery } = req.query;
  const professorId = parseInt(professorIdQuery, 10);
  const vinculoId = parseInt(vinculoIdQuery, 10);

  if (Number.isNaN(professorId) || Number.isNaN(vinculoId)) {
    return res.status(400).json({ error: 'IDs de professor ou vínculo inválidos' });
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
  }

  try {
    if (req.method === 'DELETE') {
      // Buscar o vínculo para validar se pertence à mesma instituição
      let query = supabase
        .from('professor_turma_disciplinas')
        .select('id, instituicao_id')
        .eq('id', vinculoId)
        .eq('professor_id', professorId);

      if (!isGroupAdmin) {
        query = query.eq('instituicao_id', instituicaoId);
      }

      const { data: vinculo, error: findError } = await query.maybeSingle();

      if (findError || !vinculo) {
        return res.status(404).json({ error: 'Vínculo não encontrado ou acesso não autorizado.' });
      }

      // Remover vínculo
      const { error: deleteError } = await supabase
        .from('professor_turma_disciplinas')
        .delete()
        .eq('id', vinculoId);

      if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
      }

      return res.status(200).json({ success: true, message: 'Vínculo removido com sucesso.' });
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });

  } catch (error) {
    console.error('Erro na rota DELETE de vinculos do professor:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição', message: error.message });
  }
}
