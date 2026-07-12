import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, hasPerfil, resolveInstituicaoId } from '../../../lib/auth-server';
import { calcularNotasAluno } from '../../../lib/notas-calculo';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'secretaria'])) return;

  const { id } = req.query;

  // Se for perfil professor, carregar o registro da nota/falta para verificar se a turma e a disciplina pertencem ao vinculo dele
  let isProfessor = hasPerfil(authUser, ['professor']);
  let profId = null;
  let profInstId = null;

  if (isProfessor) {
    profInstId = resolveInstituicaoId(req, authUser);
    if (!profInstId) return res.status(403).json({ error: 'Acesso negado: instituição não localizada.' });

    const { data: prof, error: profError } = await supabase
      .from('professores')
      .select('id')
      .eq('email', authUser.email)
      .eq('instituicao_id', profInstId)
      .maybeSingle();

    if (profError || !prof) return res.status(403).json({ error: 'Acesso negado: professor não cadastrado.' });
    profId = prof.id;

    // Se for PUT, validar também os novos dados do body
    if (req.method === 'PUT') {
      const body = req.body || {};
      const { turma: bodyTurma, disciplina: bodyDisciplina } = body;
      if (bodyTurma && bodyDisciplina) {
        const { data: bodyVin, error: bodyVinErr } = await supabase
          .from('professor_turma_disciplinas')
          .select('id')
          .eq('professor_id', profId)
          .eq('turma_id', parseInt(bodyTurma, 10))
          .eq('disciplina_id', parseInt(bodyDisciplina, 10))
          .eq('ativo', true)
          .maybeSingle();

        if (bodyVinErr || !bodyVin) {
          return res.status(403).json({ error: 'Acesso negado: você não possui vínculo ativo com a turma/disciplina do payload enviado.' });
        }
      }
    }
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('notas_faltas').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Registro não encontrado' });

    if (isProfessor) {
      const { data: vin, error: vinErr } = await supabase
        .from('professor_turma_disciplinas')
        .select('id')
        .eq('professor_id', profId)
        .eq('turma_id', parseInt(data.turma, 10))
        .eq('disciplina_id', parseInt(data.disciplina, 10))
        .eq('ativo', true)
        .maybeSingle();

      if (vinErr || !vin) {
        return res.status(403).json({ error: 'Acesso negado: você não possui vínculo com este registro de nota/falta.' });
      }
    }

    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    // Verificar primeiro se o registro atual pertence ao professor
    if (isProfessor) {
      const { data: current, error: currentErr } = await supabase.from('notas_faltas').select('turma, disciplina').eq('id', id).single();
      if (currentErr || !current) return res.status(404).json({ error: 'Registro não encontrado' });

      const { data: vin, error: vinErr } = await supabase
        .from('professor_turma_disciplinas')
        .select('id')
        .eq('professor_id', profId)
        .eq('turma_id', parseInt(current.turma, 10))
        .eq('disciplina_id', parseInt(current.disciplina, 10))
        .eq('ativo', true)
        .maybeSingle();

      if (vinErr || !vin) {
        return res.status(403).json({ error: 'Acesso negado: você não possui vínculo com este registro de nota/falta.' });
      }
    }

    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);

    // Obter o curso da turma
    let cursoId = null;
    if (body.turma) {
      const { data: tm } = await supabase
        .from('turmas')
        .select('cursoid')
        .eq('id', parseInt(body.turma, 10))
        .maybeSingle();
      if (tm) {
        cursoId = tm.cursoid;
      }
    }

    const calcResult = await calcularNotasAluno(
      supabase,
      instId,
      cursoId,
      body.detalhes_notas || body.detalhesNotas || {
        AP1: body.ap1,
        AP2: body.ap2,
        AP3: body.ap3,
        Rec: body.rec,
        EF: body.exameFinal || body.exame_final
      },
      body.frequencia
    );

    const { data, error } = await supabase.from('notas_faltas').update({
      nome_aluno:  body.nomeAluno  || body.nome_aluno  || null,
      matricula:   body.matricula  || null,
      turma:       body.turma      || null,
      disciplina:  body.disciplina || null,
      ap1:         calcResult.ap1,
      ap2:         calcResult.ap2,
      ap3:         calcResult.ap3,
      media_prova: calcResult.mediaProva,
      exame_final: body.exameFinal || body.exame_final || null,
      frequencia:  body.frequencia || null,
      media_final: calcResult.mediaFinal,
      situacao:    calcResult.situacao,
      detalhes_notas: calcResult.detalhes,
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    if (isProfessor) {
      const { data: current, error: currentErr } = await supabase.from('notas_faltas').select('turma, disciplina').eq('id', id).single();
      if (currentErr || !current) return res.status(404).json({ error: 'Registro não encontrado' });

      const { data: vin, error: vinErr } = await supabase
        .from('professor_turma_disciplinas')
        .select('id')
        .eq('professor_id', profId)
        .eq('turma_id', parseInt(current.turma, 10))
        .eq('disciplina_id', parseInt(current.disciplina, 10))
        .eq('ativo', true)
        .maybeSingle();

      if (vinErr || !vin) {
        return res.status(403).json({ error: 'Acesso negado: você não possui vínculo com este registro de nota/falta.' });
      }
    }

    const { error } = await supabase.from('notas_faltas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Registro removido com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
