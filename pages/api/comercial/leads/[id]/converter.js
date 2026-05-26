import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
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

  const { id } = req.query;
  const instituicaoId = resolveInstituicaoId(req, authUser);

  // Buscar o lead com filtro de isolamento
  let selectQuery = supabase.from('leads').select('*').eq('id', id);
  selectQuery = applyInstituicaoFilter(selectQuery, instituicaoId);
  if (isComercialPuro(authUser)) {
    selectQuery = selectQuery.eq('captado_por_id', authUser.id);
  }

  const { data: lead, error: findError } = await selectQuery.maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

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
  } = req.body;

  // Verificar turma somente se fornecida
  if (turmaid) {
    const { data: turmaCheck, error: turmaErr } = await supabase
      .from('turmas')
      .select('id, situacao')
      .eq('id', Number(turmaid))
      .maybeSingle();
    if (turmaErr || !turmaCheck) {
      return res.status(400).json({ error: 'Turma não encontrada.' });
    }
    const situacaoTurma = String(turmaCheck.situacao || '').toUpperCase();
    if (situacaoTurma && !['ATIVO', 'EM_ANDAMENTO', 'ABERTA'].includes(situacaoTurma)) {
      return res.status(400).json({ error: 'A turma selecionada não está ativa.' });
    }
  }

  // Criar aluno com dados mínimos do lead + dados do curso/plano escolhidos
  const novoAluno = {
    nome: lead.nome,
    email: lead.email || null,
    telefone_celular: lead.whatsapp || lead.telefone || null,
    instituicao_id: lead.instituicao_id,
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
