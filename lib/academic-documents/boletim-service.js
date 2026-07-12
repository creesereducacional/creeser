// Serviço de Emissão de Boletim Escolar (Migrado)
// Local: c:\PROJETOS\creeser\lib\academic-documents\boletim-service.js

import { calcularNotasAluno } from '../notas-calculo';

export async function obterDadosBoletim(supabase, alunoId, instituicaoId) {
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

  const gradeId = aluno.turmas?.gradeid || null;

  // 3. Obter todas as disciplinas da matriz curricular
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

  // 4. Carregar notas/faltas do aluno
  const { data: notasFaltas } = await supabase
    .from('notas_faltas')
    .select('*')
    .eq('matricula', aluno.matricula)
    .eq('turma', String(aluno.turmaid));

  const notasMap = new Map((notasFaltas || []).map(n => [String(n.disciplina), n]));

  // 5. Carregar professores vinculados a essa turma/disciplina
  const { data: vinculos } = await supabase
    .from('professor_turma_disciplinas')
    .select('disciplina_id, professores(nome)')
    .eq('turma_id', aluno.turmaid)
    .eq('ativo', true);

  const profMap = new Map((vinculos || []).map(v => [String(v.disciplina_id), v.professores?.nome]));

  // 6. Montar boletim por disciplina
  const disciplinasBoletim = [];
  for (const disc of disciplinas) {
    const notaReg = notasMap.get(String(disc.numero_id || disc.id));
    
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

    disciplinasBoletim.push({
      id: disc.id,
      nome: disc.nome,
      cargaHoraria: disc.carga_horaria || disc.cargaHoraria || 0,
      professor: profMap.get(String(disc.numero_id || disc.id)) || 'A definir',
      notas: calc.detalhes,
      mediaProva: calc.mediaProva,
      mediaFinal: calc.mediaFinal,
      frequencia: notaReg?.frequencia !== undefined && notaReg?.frequencia !== null ? parseFloat(notaReg.frequencia) : 100,
      situacao: calc.situacao
    });
  }

  return {
    instituicao: inst || { nome: 'CREESER Educacional' },
    aluno: {
      id: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      cpf: aluno.cpf
    },
    curso: aluno.cursos?.nome || 'Curso Técnico',
    turma: aluno.turmas?.nome || 'Turma Única',
    anoLetivo: aluno.ano_letivo || new Date().getFullYear(),
    disciplinas: disciplinasBoletim
  };
}
