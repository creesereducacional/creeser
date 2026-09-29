import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = [
  'recepcao',
  'grupo_admin',
  'instituicao_admin',
  'admin',
  'coordenador',
  'secretaria',
  'financeiro',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível ao verificar permissões de acesso',
      code: 'AUTH_CONTEXT_UNAVAILABLE',
    });
  }

  const isGroupAdmin = authUser.perfil === 'grupo_admin' || authUser.is_superadmin;
  const userInstituicaoId = ctx.instituicaoId;

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ error: 'Instituição não definida para o usuário atual' });
  }

  const { turma_id } = req.query;

  try {
    // ── CASO A: Consulta de Alunos de uma Turma Específica ─────────────────
    if (turma_id) {
      const turmaIdNum = Number(turma_id);
      if (Number.isNaN(turmaIdNum)) {
        return res.status(400).json({ error: 'ID da turma inválido' });
      }

      // 1. Obter dados da turma
      let turmaQuery = supabase
        .from('turmas')
        .select(`
          id,
          nome,
          cursoid,
          situacao,
          turno,
          capacidademaxima,
          instituicao_id,
          cursos (
            id,
            nome
          )
        `)
        .eq('id', turmaIdNum)
        .maybeSingle();

      if (!isGroupAdmin) {
        turmaQuery = applyInstituicaoFilter(turmaQuery, userInstituicaoId);
      }

      const { data: turma, error: turmaErr } = await turmaQuery;
      if (turmaErr) return res.status(500).json({ error: turmaErr.message });
      if (!turma) return res.status(404).json({ error: 'Turma não encontrada ou sem acesso' });

      // 2. Buscar alunos vinculados (via alunos.turmaid e matriculas.turma_id)
      let alunosQuery = supabase
        .from('alunos')
        .select('id, nome, cpf, matricula, email, telefone_celular, statusmatricula, turmaid, datacriacao')
        .eq('turmaid', turmaIdNum)
        .order('nome');

      if (!isGroupAdmin) {
        alunosQuery = applyInstituicaoFilter(alunosQuery, userInstituicaoId);
      }

      const { data: alunosDiretos, error: alunosErr } = await alunosQuery;
      if (alunosErr) return res.status(500).json({ error: alunosErr.message });

      // Buscar também via tabela matriculas (para casos de rematrícula ou matrícula simultânea)
      let matriculasQuery = supabase
        .from('matriculas')
        .select(`
          id,
          codigo_matricula,
          status_administrativo,
          situacao_academica,
          aluno_id,
          alunos (
            id,
            nome,
            cpf,
            email,
            telefone_celular,
            statusmatricula,
            matricula
          )
        `)
        .eq('turma_id', turmaIdNum);

      if (!isGroupAdmin) {
        matriculasQuery = applyInstituicaoFilter(matriculasQuery, userInstituicaoId);
      }

      const { data: matriculasData } = await matriculasQuery;

      // Consolidar alunos sem duplicidade
      const mapaAlunos = new Map();

      (alunosDiretos || []).forEach((a) => {
        mapaAlunos.set(a.id, {
          id: a.id,
          nome: a.nome,
          cpf: a.cpf || '—',
          matricula: a.matricula || '—',
          email: a.email || '—',
          telefone_celular: a.telefone_celular || '—',
          status: a.statusmatricula || 'ATIVO',
          origem: 'DIRETO',
        });
      });

      (matriculasData || []).forEach((m) => {
        const al = m.alunos;
        if (al && al.id) {
          mapaAlunos.set(al.id, {
            id: al.id,
            nome: al.nome,
            cpf: al.cpf || '—',
            matricula: m.codigo_matricula || al.matricula || '—',
            email: al.email || '—',
            telefone_celular: al.telefone_celular || '—',
            status: m.status_administrativo || al.statusmatricula || 'ATIVO',
            origem: 'MATRICULA',
          });
        }
      });

      const listaAlunos = Array.from(mapaAlunos.values()).sort((a, b) =>
        (a.nome || '').localeCompare(b.nome || '')
      );

      return res.status(200).json({
        turma: {
          id: turma.id,
          nome: turma.nome,
          curso: turma.cursos?.nome || '—',
          cursoId: turma.cursoid,
          situacao: turma.situacao || 'ATIVO',
          turno: turma.turno || '—',
          capacidadeMaxima: turma.capacidademaxima || null,
          totalAlunos: listaAlunos.length,
        },
        alunos: listaAlunos,
      });
    }

    // ── CASO B: Listagem Geral de Turmas com Quantitativos ─────────────────
    let turmasQuery = supabase
      .from('turmas')
      .select(`
        id,
        nome,
        cursoid,
        situacao,
        turno,
        capacidademaxima,
        datainicio,
        datafim,
        unidadeid,
        instituicao_id,
        cursos (
          id,
          nome
        ),
        unidades (
          id,
          nome
        )
      `)
      .order('nome');

    if (!isGroupAdmin) {
      turmasQuery = applyInstituicaoFilter(turmasQuery, userInstituicaoId);
    }

    const { data: turmas, error: turmasErr } = await turmasQuery;
    if (turmasErr) return res.status(500).json({ error: turmasErr.message });

    // Buscar contagem de alunos por turma (alunos ativos)
    let alunosContagemQuery = supabase
      .from('alunos')
      .select('id, turmaid')
      .not('turmaid', 'is', null);

    if (!isGroupAdmin) {
      alunosContagemQuery = applyInstituicaoFilter(alunosContagemQuery, userInstituicaoId);
    }

    const { data: alunosData } = await alunosContagemQuery;

    // Buscar também na tabela matriculas
    let matriculasContagemQuery = supabase
      .from('matriculas')
      .select('id, turma_id, aluno_id')
      .not('turma_id', 'is', null);

    if (!isGroupAdmin) {
      matriculasContagemQuery = applyInstituicaoFilter(matriculasContagemQuery, userInstituicaoId);
    }

    const { data: matriculasData } = await matriculasContagemQuery;

    // Agregar contagem de alunos únicos por turma
    const alunosPorTurma = {};

    (alunosData || []).forEach((a) => {
      if (!a.turmaid) return;
      if (!alunosPorTurma[a.turmaid]) alunosPorTurma[a.turmaid] = new Set();
      alunosPorTurma[a.turmaid].add(`aluno_${a.id}`);
    });

    (matriculasData || []).forEach((m) => {
      if (!m.turma_id || !m.aluno_id) return;
      if (!alunosPorTurma[m.turma_id]) alunosPorTurma[m.turma_id] = new Set();
      alunosPorTurma[m.turma_id].add(`aluno_${m.aluno_id}`);
    });

    const resultado = (turmas || []).map((t) => {
      const totalAlunos = alunosPorTurma[t.id] ? alunosPorTurma[t.id].size : 0;
      const capacidade = t.capacidademaxima ? Number(t.capacidademaxima) : null;
      const taxaOcupacao = capacidade && capacidade > 0 ? Math.round((totalAlunos / capacidade) * 100) : null;

      return {
        id: t.id,
        nome: t.nome,
        cursoId: t.cursoid,
        cursoNome: t.cursos?.nome || '—',
        unidadeId: t.unidadeid,
        unidadeNome: t.unidades?.nome || '—',
        situacao: t.situacao || 'ATIVO',
        turno: t.turno || '—',
        dataInicio: t.datainicio || null,
        dataFim: t.datafim || null,
        capacidadeMaxima: capacidade,
        totalAlunos,
        taxaOcupacao,
      };
    });

    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro na API de turmas da recepção:', err);
    return res.status(500).json({ error: 'Erro interno ao consultar turmas' });
  }
}
