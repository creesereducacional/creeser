import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser);

  try {
    let query = supabase
      .from('comissoes_comerciais')
      .select(`
        id, valor_base, valor_comissao, tipo_comissao, percentual,
        status, data_credito, data_repasse, observacao, created_at,
        aluno:alunos!aluno_id(nome, email),
        captado_por:usuarios!captado_por_id(id, nomecompleto)
      `)
      .order('data_credito', { ascending: false });

    // Multi-tenant
    if (!isGroupAdmin && instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId);
    }

    // Filtros opcionais
    const { status, captado_por_id, data_inicio, data_fim } = req.query;
    if (status)         query = query.eq('status', status);
    if (captado_por_id) query = query.eq('captado_por_id', captado_por_id);
    if (data_inicio)    query = query.gte('data_credito', data_inicio);
    if (data_fim)       query = query.lte('data_credito', data_fim);

    const { data: comissoes, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return res.status(200).json({
          comissoes: [],
          resumo: { pendentes: 0, valorPendente: 0, repassadas: 0, valorRepassado: 0 },
          aviso: 'Tabela não criada. Execute a migration 20260527_comissoes_comerciais.sql.',
        });
      }
      return res.status(500).json({ message: error.message });
    }

    // Calcular resumo
    const resumo = { pendentes: 0, valorPendente: 0, repassadas: 0, valorRepassado: 0 };
    for (const c of comissoes || []) {
      const v = Number(c.valor_comissao || 0);
      if (c.status === 'PENDENTE_REPASSE') {
        resumo.pendentes++;
        resumo.valorPendente += v;
      } else if (c.status === 'REPASSADO') {
        resumo.repassadas++;
        resumo.valorRepassado += v;
      }
    }

    return res.status(200).json({ comissoes: comissoes || [], resumo });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno: ' + (err?.message || err) });
  }
}
