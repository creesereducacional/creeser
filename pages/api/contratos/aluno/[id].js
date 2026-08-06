import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  applyInstituicaoFilter,
} from '../../../../lib/auth-server';
import { ContratoResolverService } from '../../../../lib/contracts/ContratoResolverService';

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'secretaria', 'comercial', 'admin'])) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  try {
    const alunoId = req.query?.id;
    if (!alunoId) {
      return res.status(400).json({ error: 'ID do aluno inválido' });
    }

    const result = await ContratoResolverService.resolveContratoAluno(alunoId, {
      applyFilter: (query) => {
        if (!isGroupAdmin || instituicaoId) {
          return applyInstituicaoFilter(query, instituicaoId);
        }
        return query;
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro em GET /api/contratos/aluno/[id]:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Erro ao obter contrato do aluno' });
  }
}
