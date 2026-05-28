/**
 * lib/audit-log.js
 * Gravação centralizada de logs de auditoria operacional.
 * Escreve na tabela `audit_logs` do Supabase (schema em supabase/migrations/).
 */

import { supabaseAdmin } from './supabase';

/**
 * Grava um evento de auditoria de forma assíncrona (fire-and-forget).
 * Nunca lança exceção — falhas são logadas apenas no servidor.
 *
 * @param {object} opts
 * @param {number|string} [opts.usuario_id]
 * @param {string}        [opts.usuario_email]
 * @param {string}        [opts.perfil]           - ex: 'admin', 'financeiro'
 * @param {string}         opts.acao              - ex: 'LOGIN', 'CRIAR_LEAD', 'DELETAR_ALUNO'
 * @param {string}        [opts.modulo]           - ex: 'auth', 'comercial', 'financeiro'
 * @param {string}        [opts.entidade]         - ex: 'lead', 'aluno', 'contrato'
 * @param {string|number} [opts.id_entidade]
 * @param {string}        [opts.ip]
 * @param {object}        [opts.detalhes]         - dados extras (serializados como JSONB)
 * @param {number|string} [opts.instituicao_id]
 */
export async function writeAuditLog(opts = {}) {
  if (!supabaseAdmin) return;

  const {
    usuario_id = null,
    usuario_email = null,
    perfil = null,
    acao,
    modulo = null,
    entidade = null,
    id_entidade = null,
    ip = null,
    detalhes = null,
    instituicao_id = null,
  } = opts;

  if (!acao) return;

  try {
    await supabaseAdmin.from('audit_logs').insert({
      usuario_id: usuario_id ? Number(usuario_id) : null,
      usuario_email,
      perfil,
      acao: String(acao).toUpperCase(),
      modulo,
      entidade,
      id_entidade: id_entidade !== null ? String(id_entidade) : null,
      ip,
      detalhes,
      instituicao_id: instituicao_id ? Number(instituicao_id) : null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Nunca quebrar o fluxo principal por falha de auditoria
    console.error('[audit-log] Falha ao gravar:', err?.message || err);
  }
}

/**
 * Helper para construir o objeto de auditoria a partir de um request autenticado.
 * Uso: await writeAuditLog(auditFromReq(req, user, { acao: 'LOGIN' }));
 */
export function auditFromReq(req, user, extra = {}) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? String(forwarded).split(',')[0].trim()
    : req.socket?.remoteAddress || '—';

  return {
    usuario_id: user?.id ?? null,
    usuario_email: user?.email ?? null,
    perfil: user?.perfil ?? user?.tipo ?? null,
    instituicao_id: user?.instituicao_id ?? null,
    ip,
    ...extra,
  };
}
