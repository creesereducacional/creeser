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

const PERFIS        = ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'];
const PERFIS_EDICAO = ['grupo_admin', 'instituicao_admin', 'coordenador'];
const STATUS_VALIDOS = ['EM_FORMACAO', 'PRONTA_PARA_ABRIR', 'ATIVA', 'ENCERRADA'];

async function registrarAuditoria(turmaId, usuarioId, acao, dados) {
  try {
    await supabase.from('formacao_auditoria').insert({
      turma_id:   turmaId,
      usuario_id: usuarioId,
      acao,
      dados:      dados ? JSON.stringify(dados) : null,
      data_hora:  new Date().toISOString(),
    });
  } catch (_) { /* nao bloqueia */ }
}

function buildTurmaQuery(id, instituicaoId) {
  let q = supabase
    .from('turmas')
    .select('id, nome, cursoid, unidadeid, instituicao_id, situacao, qtd_minima_alunos, data_prevista_inicio, status_formacao, datainicio, cursos(id, nome), unidades(id, nome)')
    .eq('id', id);
  return applyInstituicaoFilter(q, instituicaoId);
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const { id } = req.query;
  const turmaId = parseInt(id, 10);
  if (!turmaId || isNaN(turmaId)) return res.status(400).json({ error: 'ID invalido' });

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  // ─── GET ────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: turma, error } = await buildTurmaQuery(turmaId, instituicaoId).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!turma) return res.status(404).json({ error: 'Turma nao encontrada' });

    const { count } = await supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true })
      .eq('statusmatricula', 'AGUARDANDO_FORMACAO_TURMA')
      .eq('turmaid', turmaId);

    return res.status(200).json({
      ...turma,
      cursoNome:  turma.cursos?.nome  || '',
      unidadeNome: turma.unidades?.nome || '',
      qtd_atual:  count || 0,
    });
  }

  // ─── PUT ────────────────────────────────────────────────
  if (req.method === 'PUT') {
    if (!hasPerfil(authUser, PERFIS_EDICAO)) {
      return res.status(403).json({ error: 'Sem permissao para editar' });
    }

    // Buscar estado atual
    const { data: atual, error: fetchError } = await buildTurmaQuery(turmaId, instituicaoId).maybeSingle();
    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!atual)     return res.status(404).json({ error: 'Turma nao encontrada' });

    const { qtd_minima_alunos, data_prevista_inicio, status_formacao } = req.body || {};
    const updates      = {};
    const auditDetails = {};

    if (qtd_minima_alunos !== undefined) {
      const v = parseInt(qtd_minima_alunos, 10);
      if (isNaN(v) || v < 1) return res.status(400).json({ error: 'qtd_minima_alunos deve ser >= 1' });
      if (v !== atual.qtd_minima_alunos) {
        updates.qtd_minima_alunos = v;
        auditDetails.qtd_minima_alunos = { de: atual.qtd_minima_alunos, para: v };
      }
    }

    if (data_prevista_inicio !== undefined) {
      const v = data_prevista_inicio || null;
      if (v !== atual.data_prevista_inicio) {
        updates.data_prevista_inicio = v;
        auditDetails.data_prevista_inicio = { de: atual.data_prevista_inicio, para: v };
      }
    }

    if (status_formacao !== undefined) {
      if (!STATUS_VALIDOS.includes(status_formacao)) {
        return res.status(400).json({ error: 'status_formacao invalido. Use: ' + STATUS_VALIDOS.join(', ') });
      }
      if (status_formacao !== atual.status_formacao) {
        updates.status_formacao = status_formacao;
        auditDetails.status_formacao = { de: atual.status_formacao, para: status_formacao };
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ message: 'Sem alteracoes' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('turmas')
      .update(updates)
      .eq('id', turmaId)
      .select('id, nome, qtd_minima_alunos, data_prevista_inicio, status_formacao')
      .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Auditoria por campo alterado
    for (const campo of Object.keys(auditDetails)) {
      let acao = campo;
      if (campo === 'qtd_minima_alunos')    acao = 'ALTERAR_QTD_MINIMA';
      if (campo === 'data_prevista_inicio')  acao = 'ALTERAR_DATA_INICIO';
      if (campo === 'status_formacao')       acao = 'ALTERAR_STATUS_FORMACAO';
      await registrarAuditoria(turmaId, authUser.id, acao, { [campo]: auditDetails[campo] });
    }

    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Metodo nao permitido' });
}
