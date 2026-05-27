import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['recepcao', 'grupo_admin', 'instituicao_admin', 'admin', 'financeiro'];

async function registrarAuditoria(alunoId, usuarioId, acao, dados) {
  try {
    await supabase.from('recepcao_auditoria').insert({
      aluno_id:   alunoId,
      usuario_id: usuarioId,
      acao,
      dados:      dados ? JSON.stringify(dados) : null,
      data_hora:  new Date().toISOString(),
    });
  } catch (_) { /* auditoria nao deve bloquear a operacao */ }
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID nao informado' });

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  let baseQuery = supabase.from('alunos').select('*').eq('id', id);
  baseQuery = applyInstituicaoFilter(baseQuery, instituicaoId);

  const { data: aluno, error: findError } = await baseQuery.maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!aluno)  return res.status(404).json({ error: 'Pre-cadastro nao encontrado' });

  // ── GET ─────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    return res.status(200).json(aluno);
  }

  // ── PUT ─ editar campos basicos (recepcao nao altera status) ─────────────
  if (req.method === 'PUT') {
    const { nome, cpf, email, telefone_celular, observacoes_adicionais } = req.body || {};

    if (nome !== undefined && !String(nome || '').trim()) {
      return res.status(400).json({ error: 'Nome nao pode ser vazio' });
    }

    const updates = {};
    if (nome               !== undefined) updates.nome                = String(nome).trim();
    if (cpf                !== undefined) updates.cpf                 = cpf                ? String(cpf).trim() : null;
    if (email              !== undefined) updates.email               = email              ? String(email).trim().toLowerCase() : null;
    if (telefone_celular   !== undefined) updates.telefone_celular    = telefone_celular   ? String(telefone_celular).trim() : null;
    if (observacoes_adicionais !== undefined) updates.observacoes_adicionais = observacoes_adicionais || null;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('alunos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    await registrarAuditoria(id, authUser.id, 'EDITAR_PRE_CADASTRO', {
      antes: { nome: aluno.nome, cpf: aluno.cpf, email: aluno.email, telefone_celular: aluno.telefone_celular },
      depois: updates,
    });

    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Metodo nao permitido' });
}
