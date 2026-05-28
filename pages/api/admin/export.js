/**
 * pages/api/admin/export.js
 * Exportação segura de dados operacionais (alunos, financeiro, contratos).
 * Apenas grupo_admin / instituicao_admin.
 */

import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth, requirePerfil, resolveInstituicaoId, hasPerfil, applyInstituicaoFilter } from '../../../lib/auth-server';
import { writeAuditLog, auditFromReq } from '../../../lib/audit-log';

function toCsv(rows, cols) {
  const header = cols.map(c => c.label).join(';');
  const body = rows.map(row =>
    cols.map(c => {
      const v = row[c.key] ?? '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(';')
  );
  return '\uFEFF' + [header, ...body].join('\r\n');
}

const EXPORTS = {
  alunos: {
    table: 'alunos',
    select: 'id, nome, cpf, email, telefone_celular, statusmatricula, cursoid, turmaid, datacriacao, instituicao_id',
    cols: [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Nome' },
      { key: 'cpf', label: 'CPF' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone_celular', label: 'Telefone' },
      { key: 'statusmatricula', label: 'Status' },
      { key: 'cursoid', label: 'ID Curso' },
      { key: 'turmaid', label: 'ID Turma' },
      { key: 'datacriacao', label: 'Criado em' },
    ],
    order: 'nome',
    ascending: true,
  },
  contratos: {
    table: 'alunos',
    select: 'id, nome, cpf, email, status_contrato, data_envio_contrato, data_assinatura_contrato, instituicao_id',
    cols: [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Aluno' },
      { key: 'cpf', label: 'CPF' },
      { key: 'email', label: 'E-mail' },
      { key: 'status_contrato', label: 'Status Contrato' },
      { key: 'data_envio_contrato', label: 'Data Envio' },
      { key: 'data_assinatura_contrato', label: 'Data Assinatura' },
    ],
    order: 'nome',
    ascending: true,
  },
};

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

  const { tipo } = req.query;
  const cfg = EXPORTS[tipo];
  if (!cfg) {
    return res.status(400).json({ error: `Tipo de exportação inválido. Use: ${Object.keys(EXPORTS).join(', ')}` });
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = isGroupAdmin ? null : resolveInstituicaoId(req, authUser);

  let query = supabaseAdmin
    .from(cfg.table)
    .select(cfg.select)
    .order(cfg.order, { ascending: cfg.ascending })
    .limit(50_000);

  if (!isGroupAdmin && instituicaoId) {
    query = applyInstituicaoFilter(query, Number(instituicaoId));
  }

  const { data, error } = await query;

  if (error) {
    console.error('[admin/export]', error.message);
    return res.status(500).json({ error: 'Erro interno ao exportar dados' });
  }

  // Auditoria
  writeAuditLog(auditFromReq(req, authUser, {
    acao: 'EXPORTAR',
    modulo: 'admin',
    entidade: tipo,
    detalhes: { registros: (data || []).length },
  }));

  const csv = toCsv(data || [], cfg.cols);
  const filename = `creeser_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
}
