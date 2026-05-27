import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  applyInstituicaoFilter,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS = ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'financeiro'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo nao permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  const { status_contrato, curso, turma, formato } = req.query;

  try {
    let q = supabase
      .from('alunos')
      .select('id, nome, cpf, email, statusmatricula, status_contrato, data_envio_contrato, data_assinatura_contrato, cursoid, turmaid, cursos(nome), turmas(nome), instituicao_id')
      .order('nome');

    q = applyInstituicaoFilter(q, instituicaoId);

    if (status_contrato) q = q.eq('status_contrato', status_contrato);
    if (curso)           q = q.eq('cursoid', parseInt(curso, 10));
    if (turma)           q = q.eq('turmaid', parseInt(turma, 10));

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    const rows = (data || []).map(a => ({
      id:                     a.id,
      nome:                   a.nome,
      cpf:                    a.cpf || '',
      email:                  a.email || '',
      statusMatricula:        a.statusmatricula || '',
      statusContrato:         a.status_contrato || 'NAO_GERADO',
      dataEnvioContrato:      a.data_envio_contrato || '',
      dataAssinaturaContrato: a.data_assinatura_contrato || '',
      curso:                  a.cursos?.nome || '',
      turma:                  a.turmas?.nome || '',
    }));

    // Exportar CSV
    if (formato === 'csv') {
      const header = ['ID', 'Nome', 'CPF', 'Email', 'Status Matricula', 'Status Contrato', 'Envio Contrato', 'Assinatura Contrato', 'Curso', 'Turma'];
      const lines  = rows.map(r => [
        r.id, `"${r.nome}"`, r.cpf, r.email, r.statusMatricula,
        r.statusContrato, r.dataEnvioContrato, r.dataAssinaturaContrato,
        `"${r.curso}"`, `"${r.turma}"`,
      ].join(','));
      const csv = [header.join(','), ...lines].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-contratos.csv"');
      return res.status(200).send('\uFEFF' + csv); // BOM para Excel
    }

    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
