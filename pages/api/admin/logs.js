/**
 * pages/api/admin/logs.js
 * API paginada de logs de auditoria — apenas grupo_admin / instituicao_admin.
 */

import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth, requirePerfil, resolveInstituicaoId, hasPerfil } from '../../../lib/auth-server';

const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin'])) return;

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Serviço indisponível' });
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = isGroupAdmin ? null : resolveInstituicaoId(req, authUser);

  // Parâmetros de paginação e filtros
  const {
    page = '1',
    limit: limitRaw = String(PAGE_SIZE),
    modulo,
    acao,
    perfil,
    usuario_email,
    data_inicio,
    data_fim,
    exportCsv,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limitRaw, 10) || PAGE_SIZE));
  const offset = (pageNum - 1) * pageSize;

  // Montar query
  let query = supabaseAdmin
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Filtro multi-tenant (instituicao_admin vê apenas sua instituição)
  if (!isGroupAdmin && instituicaoId) {
    query = query.eq('instituicao_id', Number(instituicaoId));
  }

  if (modulo)        query = query.eq('modulo', modulo);
  if (acao)          query = query.eq('acao', String(acao).toUpperCase());
  if (perfil)        query = query.eq('perfil', perfil);
  if (usuario_email) query = query.ilike('usuario_email', `%${usuario_email}%`);
  if (data_inicio)   query = query.gte('created_at', data_inicio);
  if (data_fim)      query = query.lte('created_at', data_fim + 'T23:59:59Z');

  // Exportação CSV (sem paginação)
  if (exportCsv === '1') {
    const { data, error } = await query.limit(10_000);
    if (error) {
      console.error('[admin/logs] Erro export:', error.message);
      return res.status(500).json({ error: 'Erro interno ao exportar logs' });
    }

    const cols = ['id', 'created_at', 'usuario_email', 'perfil', 'acao', 'modulo', 'entidade', 'id_entidade', 'ip', 'instituicao_id'];
    const csv = [
      cols.join(';'),
      ...(data || []).map(row =>
        cols.map(c => {
          const v = row[c] ?? '';
          const s = String(v).replace(/"/g, '""');
          return s.includes(';') || s.includes('"') ? `"${s}"` : s;
        }).join(';')
      ),
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().slice(0,10)}.csv"`);
    return res.status(200).send('\uFEFF' + csv); // BOM para Excel
  }

  // Paginação normal
  const { data, error, count } = await query.range(offset, offset + pageSize - 1);

  if (error) {
    // Tabela pode não existir ainda — retornar lista vazia
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return res.status(200).json({ logs: [], total: 0, page: pageNum, pageSize, totalPages: 0 });
    }
    console.error('[admin/logs] Erro:', error.message);
    return res.status(500).json({ error: 'Erro interno ao carregar logs' });
  }

  return res.status(200).json({
    logs: data || [],
    total: count || 0,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}
