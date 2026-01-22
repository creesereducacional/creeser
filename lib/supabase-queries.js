/**
 * Funções auxiliares para operações comuns com Supabase
 * Use este arquivo para centralizar queries e operações do banco
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// OPERAÇÕES COM USUÁRIOS
// =====================================================

export async function buscarUsuarioPorEmail(email) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  return { data, error };
}

export async function buscarUsuarioPorId(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function buscarTodosDosUsuarios(filtros = {}) {
  let query = supabase.from('usuarios').select('*');

  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo);
  }

  if (filtros.status) {
    query = query.eq('status', filtros.status);
  }

  const { data, error } = await query.order('dataCriacao', { ascending: false });
  return { data, error };
}

export async function criarUsuario(dadosUsuario) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([dadosUsuario])
    .select();

  return { data, error };
}

export async function atualizarUsuario(id, dadosAtualizacao) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(dadosAtualizacao)
    .eq('id', id)
    .select();

  return { data, error };
}

export async function deletarUsuario(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM ALUNOS
// =====================================================

export async function buscarAlunosPorCurso(cursoId) {
  const { data, error } = await supabase
    .from('alunos')
    .select(`
      *,
      usuarios (id, nomeCompleto, email, cpf, foto),
      cursos (id, nome),
      turmas (id, nome)
    `)
    .eq('cursoId', cursoId);

  return { data, error };
}

export async function buscarAlunosPorTurma(turmaId) {
  const { data, error } = await supabase
    .from('alunos')
    .select(`
      *,
      usuarios (id, nomeCompleto, email, cpf, foto)
    `)
    .eq('turmaId', turmaId);

  return { data, error };
}

export async function buscarAlunoPorUsuarioId(usuarioId) {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('usuarioId', usuarioId)
    .single();

  return { data, error };
}

export async function criarAluno(dadosAluno) {
  const { data, error } = await supabase
    .from('alunos')
    .insert([dadosAluno])
    .select();

  return { data, error };
}

export async function atualizarAluno(id, dadosAtualizacao) {
  const { data, error } = await supabase
    .from('alunos')
    .update(dadosAtualizacao)
    .eq('id', id)
    .select();

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM PROFESSORES
// =====================================================

export async function buscarProfessoresPorTurma(turmaId) {
  const { data, error } = await supabase
    .from('professor_disciplina')
    .select(`
      *,
      professores (
        id,
        usuarios (id, nomeCompleto, email, cpf)
      ),
      disciplinas (id, nome),
      turmas (id, nome)
    `)
    .eq('turmaId', turmaId);

  return { data, error };
}

export async function buscarProfessorPorUsuarioId(usuarioId) {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('usuarioId', usuarioId)
    .single();

  return { data, error };
}

export async function buscarTurmasDoProfessor(professorId) {
  const { data, error } = await supabase
    .from('professor_disciplina')
    .select(`
      *,
      turmas (id, nome, cursos (id, nome)),
      disciplinas (id, nome)
    `)
    .eq('professorId', professorId);

  return { data, error };
}

export async function criarProfessor(dadosProfessor) {
  const { data, error } = await supabase
    .from('professores')
    .insert([dadosProfessor])
    .select();

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM TURMAS
// =====================================================

export async function buscarTodasAsTurmas() {
  const { data, error } = await supabase
    .from('turmas')
    .select(`
      *,
      cursos (id, nome),
      unidades (id, nome)
    `)
    .order('dataCriacao', { ascending: false });

  return { data, error };
}

export async function buscarTurmaPorId(id) {
  const { data, error } = await supabase
    .from('turmas')
    .select(`
      *,
      cursos (id, nome),
      unidades (id, nome)
    `)
    .eq('id', id)
    .single();

  return { data, error };
}

export async function buscarTurmasPorCurso(cursoId) {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('cursoId', cursoId)
    .order('dataCriacao', { ascending: false });

  return { data, error };
}

export async function criarTurma(dadosTurma) {
  const { data, error } = await supabase
    .from('turmas')
    .insert([dadosTurma])
    .select();

  return { data, error };
}

export async function atualizarTurma(id, dadosAtualizacao) {
  const { data, error } = await supabase
    .from('turmas')
    .update(dadosAtualizacao)
    .eq('id', id)
    .select();

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM NOTAS E FALTAS
// =====================================================

export async function buscarNotasAlunosPorDisciplina(disciplinaId, turmaId) {
  const { data, error } = await supabase
    .from('notas_faltas')
    .select(`
      *,
      alunos (
        id,
        usuarios (id, nomeCompleto, email)
      )
    `)
    .eq('disciplinaId', disciplinaId)
    .eq('turmaId', turmaId);

  return { data, error };
}

export async function buscarBoletimAluno(alunoId, turmaId) {
  const { data, error } = await supabase
    .from('notas_faltas')
    .select(`
      *,
      disciplinas (id, nome),
      avaliacoes (id, nome, tipo)
    `)
    .eq('alunoId', alunoId)
    .eq('turmaId', turmaId);

  return { data, error };
}

export async function registrarNota(dadosNota) {
  const { data, error } = await supabase
    .from('notas_faltas')
    .insert([dadosNota])
    .select();

  return { data, error };
}

export async function atualizarNota(id, dadosAtualizacao) {
  const { data, error } = await supabase
    .from('notas_faltas')
    .update(dadosAtualizacao)
    .eq('id', id)
    .select();

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM CONTEÚDO (BLOG, NOTÍCIAS, FÓRUM)
// =====================================================

export async function buscarTodasAsNoticias() {
  const { data, error } = await supabase
    .from('noticias')
    .select(`
      *,
      usuarios:autorId (id, nomeCompleto, foto)
    `)
    .eq('publica', true)
    .order('dataPublicacao', { ascending: false });

  return { data, error };
}

export async function buscarNoticiasDestaque() {
  const { data, error } = await supabase
    .from('noticias')
    .select(`
      *,
      usuarios:autorId (id, nomeCompleto, foto)
    `)
    .eq('publica', true)
    .eq('destaque', true)
    .order('dataPublicacao', { ascending: false })
    .limit(3);

  return { data, error };
}

export async function criarNoticia(dadosNoticia) {
  const { data, error } = await supabase
    .from('noticias')
    .insert([dadosNoticia])
    .select();

  return { data, error };
}

export async function buscarPostsBlogs() {
  const { data, error } = await supabase
    .from('blog')
    .select(`
      *,
      usuarios:autorId (id, nomeCompleto, foto)
    `)
    .eq('publicado', true)
    .order('dataPublicacao', { ascending: false });

  return { data, error };
}

export async function buscarPostBlogPorSlug(slug) {
  const { data, error } = await supabase
    .from('blog')
    .select(`
      *,
      usuarios:autorId (id, nomeCompleto, foto)
    `)
    .eq('slug', slug)
    .eq('publicado', true)
    .single();

  return { data, error };
}

export async function buscarTopicosForum(turmaId = null) {
  let query = supabase
    .from('forum')
    .select(`
      *,
      usuarios:autorId (id, nomeCompleto, foto)
    `)
    .order('dataPostagem', { ascending: false });

  if (turmaId) {
    query = query.eq('turmaId', turmaId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function buscarRespostasForum(forumId) {
  const { data, error } = await supabase
    .from('respostas_forum')
    .select(`
      *,
      usuarios:autorId (id, nomeCompleto, foto)
    `)
    .eq('forumId', forumId)
    .order('dataPostagem', { ascending: false });

  return { data, error };
}

export async function criarTopicoForum(dadosTopic) {
  const { data, error } = await supabase
    .from('forum')
    .insert([dadosTopic])
    .select();

  return { data, error };
}

export async function criarRespostaForum(dadosResposta) {
  const { data, error } = await supabase
    .from('respostas_forum')
    .insert([dadosResposta])
    .select();

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM DOCUMENTOS
// =====================================================

export async function buscarDocumentosPorTurma(turmaId) {
  const { data, error } = await supabase
    .from('documentos')
    .select(`
      *,
      usuarios:uploadadoPor (id, nomeCompleto)
    `)
    .eq('turmaId', turmaId)
    .eq('publica', true);

  return { data, error };
}

export async function buscarDocumentosPorDisciplina(disciplinaId) {
  const { data, error } = await supabase
    .from('documentos')
    .select(`
      *,
      usuarios:uploadadoPor (id, nomeCompleto)
    `)
    .eq('disciplinaId', disciplinaId)
    .eq('publica', true);

  return { data, error };
}

export async function criarDocumento(dadosDocumento) {
  const { data, error } = await supabase
    .from('documentos')
    .insert([dadosDocumento])
    .select();

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM CURSOS
// =====================================================

export async function buscarTodosCursos() {
  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .eq('situacao', 'ATIVO')
    .order('dataCriacao', { ascending: false });

  return { data, error };
}

export async function buscarCursoPorId(id) {
  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM UNIDADES
// =====================================================

export async function buscarTodasAsUnidades() {
  const { data, error } = await supabase
    .from('unidades')
    .select('*')
    .eq('ativo', true);

  return { data, error };
}

// =====================================================
// OPERAÇÕES COM FUNCIONÁRIOS
// =====================================================

export async function buscarTodosFuncionarios() {
  const { data, error } = await supabase
    .from('funcionarios')
    .select(`
      *,
      usuarios (id, nomeCompleto, email, cpf, foto)
    `)
    .eq('status', 'ATIVO');

  return { data, error };
}

export async function buscarFuncionarioPorUsuarioId(usuarioId) {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .eq('usuarioId', usuarioId)
    .single();

  return { data, error };
}
