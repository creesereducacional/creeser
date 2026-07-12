// Serviço de Emissão de Histórico Escolar
// Local: c:\PROJETOS\creeser\lib\academic-documents\historico-service.js

import { calcularNotasAluno } from '../notas-calculo';

export async function obterDadosHistorico(supabase, alunoId, instituicaoId) {
  // 1. Obter aluno
  const { data: aluno, error: alunoErr } = await supabase
    .from('alunos')
    .select('*, turmas(gradeid, nome), cursos(nome)')
    .eq('id', alunoId)
    .single();

  if (alunoErr || !aluno) {
    throw new Error('Aluno não encontrado');
  }

  // 2. Obter dados da instituição
  const { data: inst } = await supabase
    .from('instituicoes')
    .select('id, nome, cnpj, endereco, email, telefone')
    .eq('id', instituicaoId || aluno.instituicao_id)
    .maybeSingle();

  // 3. Obter livro de registro de conclusão (se houver)
  const { data: livroReg } = await supabase
    .from('livro_registro')
    .select('*')
    .eq('nome_aluno', aluno.nome)
    .eq('turma', aluno.turmas?.nome)
    .maybeSingle();

  const gradeId = aluno.turmas?.gradeid || null;

  // 4. Obter todas as disciplinas da matriz curricular
  let disciplinas = [];
  if (gradeId) {
    const { data: ds, error: dsErr } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('grade', gradeId);
    if (!dsErr && ds) {
      disciplinas = ds;
    }
  }

  // 5. Carregar notas/faltas do aluno
  const { data: notasFaltas } = await supabase
    .from('notas_faltas')
    .select('*')
    .eq('matricula', aluno.matricula)
    .eq('turma', String(aluno.turmaid));

  const notasMap = new Map((notasFaltas || []).map(n => [String(n.disciplina), n]));

  // 6. Montar histórico por disciplina
  const disciplinasHistorico = [];
  for (const disc of disciplinas) {
    const notaReg = notasMap.get(String(disc.numero_id || disc.id));
    
    // Se há registro de nota cadastrado, computar pelo motor
    const calc = await calcularNotasAluno(
      supabase,
      aluno.instituicao_id,
      aluno.cursoid,
      notaReg?.detalhes_notas || {
        AP1: notaReg?.ap1,
        AP2: notaReg?.ap2,
        AP3: notaReg?.ap3,
        EF: notaReg?.exame_final
      },
      notaReg?.frequencia
    );

    disciplinasHistorico.push({
      id: disc.id,
      nome: disc.nome,
      cargaHoraria: disc.carga_horaria || disc.cargaHoraria || 0,
      periodo: disc.periodo || '1º Período',
      mediaFinal: notaReg ? calc.mediaFinal : null,
      frequencia: notaReg ? (notaReg.frequencia !== null ? `${notaReg.frequencia}%` : '100%') : '0%',
      situacao: notaReg ? calc.situacao : 'NÃO INICIADO'
    });
  }

  return {
    instituicao: inst || { nome: 'CREESER Educacional' },
    aluno: {
      id: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      cpf: aluno.cpf,
      rg: aluno.rg,
      dataNascimento: aluno.data_nascimento || aluno.dataNascimento || null
    },
    livroRegistro: {
      numeroRegistro: livroReg?.numero_registro || 'N/A',
      livro: livroReg?.livro || 'N/A',
      folha: livroReg?.folha || 'N/A',
      dataConclusao: livroReg?.data || null
    },
    curso: aluno.cursos?.nome || 'Curso Técnico',
    turma: aluno.turmas?.nome || 'Turma Única',
    anoLetivo: aluno.ano_letivo || new Date().getFullYear(),
    disciplinas: disciplinasHistorico
  };
}
