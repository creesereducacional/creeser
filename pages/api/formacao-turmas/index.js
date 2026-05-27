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

const PERFIS = ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo nao permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  // Buscar turmas com relacionamentos
  let turmasQuery = supabase
    .from('turmas')
    .select('id, nome, cursoid, unidadeid, instituicao_id, situacao, qtd_minima_alunos, data_prevista_inicio, status_formacao, datainicio, datafim, cursos(id, nome), unidades(id, nome)')
    .order('nome');

  turmasQuery = applyInstituicaoFilter(turmasQuery, instituicaoId);

  const { data: turmas, error: turmasError } = await turmasQuery;
  if (turmasError) return res.status(500).json({ error: turmasError.message });
  if (!turmas || turmas.length === 0) return res.status(200).json([]);

  // Contar alunos aguardando formacao por turma
  let alunosQuery = supabase
    .from('alunos')
    .select('turmaid')
    .eq('statusmatricula', 'AGUARDANDO_FORMACAO_TURMA');

  alunosQuery = applyInstituicaoFilter(alunosQuery, instituicaoId);
  const { data: alunosForm } = await alunosQuery;

  const contagemPorTurma = {};
  (alunosForm || []).forEach(a => {
    if (a.turmaid) contagemPorTurma[a.turmaid] = (contagemPorTurma[a.turmaid] || 0) + 1;
  });

  // Regra automatica: EM_FORMACAO -> PRONTA_PARA_ABRIR se qtd_atual >= qtd_minima
  const paraAtualizar = turmas
    .filter(t => {
      const qtdAtual = contagemPorTurma[t.id] || 0;
      const qtdMin   = t.qtd_minima_alunos ?? 20;
      const sf       = t.status_formacao || 'EM_FORMACAO';
      return sf === 'EM_FORMACAO' && qtdMin > 0 && qtdAtual >= qtdMin;
    })
    .map(t => t.id);

  if (paraAtualizar.length > 0) {
    await supabase
      .from('turmas')
      .update({ status_formacao: 'PRONTA_PARA_ABRIR' })
      .in('id', paraAtualizar);
  }

  // Montar resposta
  const resultado = turmas.map(t => {
    const qtdAtual = contagemPorTurma[t.id] || 0;
    const qtdMin   = t.qtd_minima_alunos ?? 20;
    const sfFinal  = paraAtualizar.includes(t.id) ? 'PRONTA_PARA_ABRIR' : (t.status_formacao || 'EM_FORMACAO');

    return {
      id:                   t.id,
      nome:                 t.nome || '',
      cursoId:              t.cursoid,
      cursoNome:            t.cursos?.nome || '',
      unidadeId:            t.unidadeid,
      unidadeNome:          t.unidades?.nome || '',
      instituicaoId:        t.instituicao_id,
      situacao:             t.situacao || '',
      qtd_minima_alunos:    qtdMin,
      qtd_atual:            qtdAtual,
      data_prevista_inicio: t.data_prevista_inicio || null,
      status_formacao:      sfFinal,
      datainicio:           t.datainicio || null,
      datafim:              t.datafim || null,
      percentual:           qtdMin > 0 ? Math.min(100, Math.round((qtdAtual / qtdMin) * 100)) : 0,
    };
  });

  return res.status(200).json(resultado);
}
