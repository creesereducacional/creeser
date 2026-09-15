import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
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

  // Resolve instituicao_id: query string tem prioridade, depois token
  const queryInstId = req.query?.instituicao_id || req.query?.instituicaoId || null;
  const tokenInstId = authUser.instituicao_id || authUser.instituicaoId || null;
  // grupo_admin sem parâmetro vê todos; demais usam queryParam ou token
  const instituicaoId = isGroupAdmin
    ? (queryInstId || null)
    : (queryInstId || tokenInstId || null);

  // Buscar TODOS os cursos ativos (sem filtro no banco — filtramos em memória)
  const { data: todosOsCursos, error } = await supabase
    .from('cursos')
    .select('id, nome, nivelensino, grauconferido, cargahoraria, instituicao_id')
    .or('situacao.eq.ATIVO,situacao.is.null')
    .order('nome');

  if (error) return res.status(500).json({ error: error.message });

  let resultado = todosOsCursos || [];

  // Se não tiver filtro de instituição, retorna todos
  if (!instituicaoId) {
    return res.status(200).json(resultado);
  }

  // Filtra em memória: cursos da instituição OU sem vínculo (null)
  const cursosDaInst = resultado.filter(c =>
    String(c.instituicao_id) === String(instituicaoId) ||
    c.instituicao_id === null ||
    c.instituicao_id === undefined
  );

  // Fallback: se filtro retornar vazio por inconsistência de dados, mostra todos
  resultado = cursosDaInst.length > 0 ? cursosDaInst : resultado;

  // Verificar vínculos na tabela curso_unidade para refinar (opcional)
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

      // Somente aplicar filtro restritivo se existirem vínculos explícitos
      if (links && links.length > 0) {
        const permitidos = new Set(links);
        resultado = resultado.filter((c) => permitidos.has(Number(c.id)));
      }
    }
  } catch (e) {
    console.error('Erro ao filtrar cursos por unidade:', e);
  }

  return res.status(200).json(resultado);
}
