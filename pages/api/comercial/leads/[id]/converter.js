import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial'];

const isComercialPuro = (user) =>
  hasPerfil(user, ['comercial']) && !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 7.1.1: Resolver contexto de escopo (Instituição × Unidade) ──────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[comercial/leads/converter] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível para resolução de contexto do usuário',
      message: ctx.queryError.message,
    });
  }

  const userInstituicaoId = ctx.instituicaoId || (ctx.legacyFallback ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin }) : null);

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ error: 'Instituição não definida para o usuário atual' });
  }
  // ────────────────────────────────────────────────────────────────────────────

  const { id } = req.query;

  // Buscar o lead com filtro de isolamento
  let selectQuery = supabase.from('leads').select('*').eq('id', id);
  if (!isGroupAdmin) {
    selectQuery = applyInstituicaoFilter(selectQuery, userInstituicaoId);
  }
  if (isComercialPuro(authUser)) {
    selectQuery = selectQuery.eq('captado_por_id', authUser.id);
  }

  const { data: lead, error: findError } = await selectQuery.maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

  // Validação institucional direta do lead
  if (!isGroupAdmin && lead.instituicao_id && userInstituicaoId && lead.instituicao_id !== userInstituicaoId) {
    return res.status(403).json({ error: 'Acesso negado: o lead pertence a outra instituição.' });
  }

  if (lead.status === 'pre_matricula' || lead.status === 'matriculado') {
    return res.status(400).json({ error: 'Este lead já foi convertido em pré-matrícula ou matrícula' });
  }

  const {
    cursoid,
    turmaid,
    plano_financeiro,
    valor_matricula,
    valor_mensalidade,
    qtd_parcelas,
    dia_pagamento,
  } = req.body || {};

  // ── Validar turma destino por Instituição e Unidade (ANTES de qualquer escrita)
  if (turmaid) {
    const { data: turmaCheck, error: turmaErr } = await supabase
      .from('turmas')
      .select('id, situacao, instituicao_id, unidadeid')
      .eq('id', Number(turmaid))
      .maybeSingle();

    if (turmaErr || !turmaCheck) {
      return res.status(400).json({ error: 'Turma não encontrada.' });
    }

    // 1. Validar instituição da turma
    if (!isGroupAdmin && turmaCheck.instituicao_id && userInstituicaoId && turmaCheck.instituicao_id !== userInstituicaoId) {
      return res.status(403).json({ error: 'Acesso negado: a turma selecionada pertence a outra instituição.' });
    }

    // 2. Validar escopo de unidade para Filial
    if (ctx.unidadesPermitidas !== null) {
      const unidadeIdTurma = turmaCheck.unidadeid != null ? Number(turmaCheck.unidadeid) : null;
      if (unidadeIdTurma !== null && !ctx.unidadesPermitidas.includes(unidadeIdTurma)) {
        return res.status(403).json({
          error: 'Acesso negado: a turma selecionada pertence a uma unidade fora do seu escopo permitido.'
        });
      }
    }

    // 3. Validar situação da turma
    const situacaoTurma = String(turmaCheck.situacao || '').toUpperCase();
    if (situacaoTurma && !['ATIVO', 'EM_ANDAMENTO', 'ABERTA'].includes(situacaoTurma)) {
      return res.status(400).json({ error: 'A turma selecionada não está ativa.' });
    }
  }

  // Criar aluno com dados mínimos do lead + dados do curso/plano escolhidos
  const instituicaoFinal = lead.instituicao_id || userInstituicaoId;

  const novoAluno = {
    nome: lead.nome,
    email: lead.email || null,
    telefone_celular: lead.whatsapp || lead.telefone || null,
    instituicao_id: instituicaoFinal,
    captado_por_id: lead.captado_por_id || authUser.id,
    statusmatricula: 'PRE_CADASTRO',
    data_captacao: new Date().toISOString().slice(0, 10),
    ...(cursoid           ? { cursoid: Number(cursoid) }                 : {}),
    ...(turmaid           ? { turmaid: Number(turmaid) }                 : {}),
    ...(plano_financeiro  ? { plano_financeiro }                         : {}),
    ...(valor_matricula   ? { valor_matricula: Number(valor_matricula) }  : {}),
    ...(valor_mensalidade ? { valor_mensalidade: Number(valor_mensalidade) } : {}),
    ...(qtd_parcelas      ? { qtd_parcelas: Number(qtd_parcelas) }       : {}),
    ...(dia_pagamento     ? { dia_pagamento: Number(dia_pagamento) }      : {}),
  };

  const { data: aluno, error: alunoError } = await supabase
    .from('alunos')
    .insert(novoAluno)
    .select('id, nome')
    .single();

  if (alunoError) {
    return res.status(500).json({ error: `Erro ao criar aluno: ${alunoError.message}` });
  }

  // Atualizar lead: status = pre_matricula + vínculo com o aluno
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      status: 'pre_matricula',
      aluno_convertido_id: aluno.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({
      error: `Aluno criado (id=${aluno.id}) mas erro ao atualizar lead: ${updateError.message}`,
    });
  }

  // Registrar auditoria
  try {
    await supabase.from('leads_auditoria').insert({
      lead_id: id,
      usuario_id: authUser.id,
      acao: 'conversao',
      dados_anteriores: { status: lead.status },
      dados_novos: { status: 'pre_matricula', aluno_id: aluno.id, aluno_nome: aluno.nome },
    });
  } catch (_) {}

  return res.status(200).json({
    aluno_id: aluno.id,
    aluno_nome: aluno.nome,
    mensagem: 'Pré-matrícula criada com sucesso. A matrícula será confirmada após complementação cadastral e confirmação de pagamento.',
  });
}

