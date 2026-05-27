import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  applyInstituicaoFilter,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS = ['grupo_admin', 'instituicao_admin', 'coordenador'];

async function registrarAuditoria(turmaId, usuarioId, dados) {
  try {
    await supabase.from('formacao_auditoria').insert({
      turma_id:   turmaId,
      usuario_id: usuarioId,
      acao:       'ABRIR_TURMA',
      dados:      JSON.stringify(dados),
      data_hora:  new Date().toISOString(),
    });
  } catch (_) { /* nao bloqueia */ }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const { id } = req.query;
  const turmaId = parseInt(id, 10);
  if (!turmaId || isNaN(turmaId)) return res.status(400).json({ error: 'ID invalido' });

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  // 1. Buscar e validar turma
  let turmaQuery = supabase
    .from('turmas')
    .select('id, nome, cursoid, unidadeid, instituicao_id, status_formacao, qtd_minima_alunos, cursos(nome), unidades(nome)')
    .eq('id', turmaId);
  turmaQuery = applyInstituicaoFilter(turmaQuery, instituicaoId);

  const { data: turma, error: turmaError } = await turmaQuery.maybeSingle();
  if (turmaError) return res.status(500).json({ error: turmaError.message });
  if (!turma)     return res.status(404).json({ error: 'Turma nao encontrada' });

  // 2. Impedir execucao duplicada
  if (turma.status_formacao === 'ATIVA') {
    return res.status(409).json({ error: 'Turma ja esta ATIVA. Execucao duplicada bloqueada.' });
  }
  if (turma.status_formacao !== 'PRONTA_PARA_ABRIR') {
    return res.status(400).json({
      error: `Turma nao esta PRONTA_PARA_ABRIR (status atual: ${turma.status_formacao}).`,
    });
  }

  // 3. Buscar apenas alunos AGUARDANDO_FORMACAO_TURMA desta turma e instituicao
  //    Seguranca: nao ativa PRE_CADASTRO, AGUARDANDO_PAGAMENTO, CANCELADO, DESISTENTE
  let alunosQuery = supabase
    .from('alunos')
    .select('id, nome, cpf, statusmatricula, instituicao_id, turmaid')
    .eq('statusmatricula', 'AGUARDANDO_FORMACAO_TURMA')
    .eq('turmaid', turmaId);
  alunosQuery = applyInstituicaoFilter(alunosQuery, instituicaoId);

  const { data: alunos, error: alunosError } = await alunosQuery;
  if (alunosError) return res.status(500).json({ error: alunosError.message });

  const qtdAtual = (alunos || []).length;
  const qtdMin   = turma.qtd_minima_alunos ?? 20;

  // 4. Validar qtd minima (double-check)
  if (qtdAtual === 0) {
    return res.status(400).json({ error: 'Nenhum aluno aguardando formacao nesta turma.' });
  }
  if (qtdAtual < qtdMin) {
    return res.status(400).json({
      error: `Turma ainda nao atingiu o minimo: ${qtdAtual}/${qtdMin} alunos.`,
    });
  }

  const alunoIds      = alunos.map(a => a.id);
  const dataAtivacao  = new Date().toISOString();

  // 5. Ativar alunos — tenta com data_ativacao, cai sem ela se coluna nao existir
  let ativarError;
  ({ error: ativarError } = await supabase
    .from('alunos')
    .update({ statusmatricula: 'ATIVO', data_ativacao: dataAtivacao })
    .in('id', alunoIds));

  if (ativarError) {
    const isColunaMissing =
      ativarError.code === '42703' ||
      String(ativarError.message).toLowerCase().includes('does not exist') ||
      String(ativarError.message).toLowerCase().includes('could not find');

    if (isColunaMissing) {
      // Fallback sem data_ativacao
      const { error: err2 } = await supabase
        .from('alunos')
        .update({ statusmatricula: 'ATIVO' })
        .in('id', alunoIds);
      if (err2) return res.status(500).json({ error: err2.message });
    } else {
      return res.status(500).json({ error: ativarError.message });
    }
  }

  // 6. Marcar turma como ATIVA
  const { error: turmaUpdateError } = await supabase
    .from('turmas')
    .update({ status_formacao: 'ATIVA' })
    .eq('id', turmaId);

  if (turmaUpdateError) return res.status(500).json({ error: turmaUpdateError.message });

  // 7. Auditoria
  await registrarAuditoria(turmaId, authUser.id, {
    qtd_alunos_ativados: qtdAtual,
    qtd_minima:          qtdMin,
    instituicao_id:      turma.instituicao_id,
    turma_nome:          turma.nome,
    data_abertura:       dataAtivacao,
    alunos_ids:          alunoIds,
  });

  return res.status(200).json({
    mensagem:       `Turma aberta com sucesso. ${qtdAtual} aluno(s) ativado(s).`,
    qtdAtivados:    qtdAtual,
    turmaId,
    status_formacao: 'ATIVA',
  });
}
