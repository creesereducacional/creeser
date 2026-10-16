import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';
import {
  validarEmailUnico,
  isDuplicateEmailError,
  MSG_EMAIL_DUPLICADO,
  normalizeEmail,
} from '../../../../lib/api-helpers';

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

async function enriquecerDadosCursoTurma(dadosAluno) {
  if (!dadosAluno) return dadosAluno;
  let curso_nome = null;
  let turma_nome = null;
  let unidade_id = null;
  let unidade_nome = null;

  if (dadosAluno.cursoid) {
    const { data: curso } = await supabase
      .from('cursos')
      .select('nome')
      .eq('id', dadosAluno.cursoid)
      .maybeSingle();
    if (curso?.nome) curso_nome = curso.nome;
  }

  if (dadosAluno.turmaid) {
    const { data: turma } = await supabase
      .from('turmas')
      .select('id, nome, turno, unidadeid, unidades(id, nome)')
      .eq('id', dadosAluno.turmaid)
      .maybeSingle();
    if (turma?.nome) {
      turma_nome = turma.nome + (turma.turno ? ` — ${turma.turno}` : '');
    }
    if (turma?.unidadeid != null) {
      unidade_id = turma.unidadeid;
      unidade_nome = turma.unidades?.nome || null;
    }
  }

  // Fallback: se não tiver turma com unidade, verificar curso_unidade
  if (!unidade_id && dadosAluno.cursoid) {
    const { data: cuLinks } = await supabase
      .from('curso_unidade')
      .select('unidadeid, unidades(id, nome)')
      .eq('cursoid', dadosAluno.cursoid);

    if (Array.isArray(cuLinks) && cuLinks.length === 1) {
      unidade_id = cuLinks[0].unidadeid;
      unidade_nome = cuLinks[0].unidades?.nome || null;
    }
  }

  return {
    ...dadosAluno,
    curso_nome,
    turma_nome,
    unidade_id,
    unidade_nome,
  };
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
    const alunoEnriquecido = await enriquecerDadosCursoTurma(aluno);
    return res.status(200).json(alunoEnriquecido);
  }

  // ── PUT ─ editar campos basicos (recepcao nao altera status) ─────────────
  if (req.method === 'PUT') {
    const {
      nome, cpf, email, telefone_celular, observacoes_adicionais,
      data_nascimento, cursoid, turmaid,
    } = req.body || {};

    if (nome !== undefined && !String(nome || '').trim()) {
      return res.status(400).json({ error: 'Nome nao pode ser vazio' });
    }

    // Validar data_nascimento quando informada
    if (data_nascimento !== undefined && data_nascimento !== null && data_nascimento !== '') {
      const d = new Date(data_nascimento);
      if (isNaN(d.getTime()) || d > new Date()) {
        return res.status(400).json({ error: 'Data de nascimento inválida' });
      }
    }

    // Validar cursoid quando informado
    if (cursoid !== undefined && cursoid !== null && cursoid !== '') {
      const cid = Number(cursoid);
      if (!Number.isInteger(cid) || cid <= 0) {
        return res.status(400).json({ error: 'Curso inválido' });
      }
    }

    // Validar coerência de unidade_id, cursoid e turmaid se fornecidos
    const { unidade_id } = req.body || {};
    const unidadeIdNum = unidade_id ? Number(unidade_id) : null;
    const cursoIdNum = (cursoid !== undefined && cursoid !== null && cursoid !== '') ? Number(cursoid) : (cursoid === null || cursoid === '' ? null : aluno.cursoid);
    const turmaIdNum = (turmaid !== undefined && turmaid !== null && turmaid !== '') ? Number(turmaid) : (turmaid === null || turmaid === '' ? null : aluno.turmaid);

    if (unidadeIdNum && cursoIdNum) {
      const { data: vinculoCu } = await supabase
        .from('curso_unidade')
        .select('id')
        .eq('cursoid', cursoIdNum)
        .eq('unidadeid', unidadeIdNum)
        .limit(1);

      if (!vinculoCu || vinculoCu.length === 0) {
        const { data: turmasDaUnid } = await supabase
          .from('turmas')
          .select('id')
          .eq('cursoid', cursoIdNum)
          .eq('unidadeid', unidadeIdNum)
          .limit(1);

        if (!turmasDaUnid || turmasDaUnid.length === 0) {
          return res.status(400).json({ error: 'O curso selecionado não é ofertado na unidade escolhida.' });
        }
      }
    }

    if (turmaIdNum) {
      const { data: turmaValida } = await supabase
        .from('turmas')
        .select('id, cursoid, unidadeid')
        .eq('id', turmaIdNum)
        .maybeSingle();

      if (!turmaValida) {
        return res.status(400).json({ error: 'Turma selecionada não encontrada.' });
      }

      if (cursoIdNum && Number(turmaValida.cursoid) !== cursoIdNum) {
        return res.status(400).json({ error: 'A turma selecionada não pertence ao curso escolhido.' });
      }

      if (unidadeIdNum && turmaValida.unidadeid && Number(turmaValida.unidadeid) !== unidadeIdNum) {
        return res.status(400).json({ error: 'A turma selecionada não pertence à unidade escolhida.' });
      }
    }

    const updates = {};
    if (nome               !== undefined) updates.nome                = String(nome).trim();
    if (cpf                !== undefined) updates.cpf                 = cpf                ? String(cpf).trim() : null;
    if (email              !== undefined) updates.email               = normalizeEmail(email);
    if (telefone_celular   !== undefined) updates.telefone_celular    = telefone_celular   ? String(telefone_celular).trim() : null;
    if (observacoes_adicionais !== undefined) updates.observacoes_adicionais = observacoes_adicionais || null;
    if (data_nascimento    !== undefined) updates.data_nascimento     = data_nascimento    || null;
    if (cursoid            !== undefined) updates.cursoid             = cursoid            ? Number(cursoid) : null;
    // Ao limpar o curso, limpar a turma também
    if (turmaid            !== undefined) updates.turmaid             = turmaid            ? Number(turmaid) : null;
    if (cursoid !== undefined && !cursoid && turmaid === undefined) updates.turmaid = null;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    if (updates.email) {
      const emailCheck = await validarEmailUnico({
        email: updates.email,
        currentAlunoId: id,
        supabaseClient: supabase,
      });

      if (!emailCheck.valid) {
        return res.status(409).json({ error: emailCheck.error || MSG_EMAIL_DUPLICADO });
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('alunos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (isDuplicateEmailError(updateError)) {
        return res.status(409).json({ error: MSG_EMAIL_DUPLICADO });
      }
      return res.status(500).json({ error: updateError.message });
    }

    await registrarAuditoria(id, authUser.id, 'EDITAR_PRE_CADASTRO', {
      antes: {
        nome: aluno.nome, cpf: aluno.cpf, email: aluno.email,
        telefone_celular: aluno.telefone_celular,
        data_nascimento: aluno.data_nascimento,
        cursoid: aluno.cursoid, turmaid: aluno.turmaid,
      },
      depois: updates,
    });

    const updatedEnriquecido = await enriquecerDadosCursoTurma(updated);
    return res.status(200).json(updatedEnriquecido);
  }


  return res.status(405).json({ error: 'Metodo nao permitido' });
}
