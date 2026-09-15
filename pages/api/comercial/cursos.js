import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial', 'comercial_master', 'comercial_operador', 'recepcao'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  let query = supabase
    .from('cursos')
    .select('id, nome, nivelensino, grauconferido, cargahoraria, instituicao_id')
    .or('situacao.eq.ATIVO,situacao.is.null')
    .order('nome');

  if (instituicaoId) query = applyInstituicaoFilter(query, instituicaoId);

  const { data: cursos, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  let resultado = cursos || [];

  // Se a instituição estiver definida, checar se a instituição possui vínculos cadastrados na tabela curso_unidade
  if (instituicaoId && resultado.length > 0) {
    try {
      const { data: unidades } = await supabase
        .from('unidades')
        .select('id')
        .eq('instituicao_id', instituicaoId);

      const unidadeIds = (unidades || []).map((u) => u.id);

      if (unidadeIds.length > 0) {
        let links = null;
        for (const colPair of [
          { c: 'cursoid', u: 'unidadeid' },
          { c: 'curso_id', u: 'unidade_id' },
          { c: 'cursoId', u: 'unidadeId' },
        ]) {
          const { data: l, error: errL } = await supabase
            .from('curso_unidade')
            .select(`${colPair.c},${colPair.u}`)
            .in(colPair.u, unidadeIds);

          if (!errL && l && l.length > 0) {
            links = l.map((item) => Number(item[colPair.c]));
            break;
          }
        }

        // Somente aplicar o filtro restritivo se existirem vínculos explícitos na tabela curso_unidade para a instituição
        if (links && Array.isArray(links) && links.length > 0) {
          const cursoIdsPermitidos = new Set(links);
          resultado = resultado.filter((c) => cursoIdsPermitidos.has(Number(c.id)));
        }
      }
    } catch (e) {
      console.error('Erro ao filtrar cursos por unidade:', e);
    }
  }

  return res.status(200).json(resultado);
}
