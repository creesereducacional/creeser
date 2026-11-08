import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import {
  requireAuth,
  requirePerfil,
  applyInstituicaoFilter,
  resolveContextoUsuario,
} from '../../../../lib/auth-server.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = [
  'grupo_admin',
  'instituicao_admin',
  'admin',
  'coordenador',
  'secretaria',
  'recepcao',
  'professor',
];

// Helper para converter imagem local para Base64 Data URL (para renderização garantida no PDF sem bloqueio CORS)
function getLocalImageAsDataUrl(relativePath) {
  try {
    const fullPath = path.join(process.cwd(), 'public', relativePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).replace('.', '').toLowerCase();
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      const fileBuffer = fs.readFileSync(fullPath);
      return `data:${mime};base64,${fileBuffer.toString('base64')}`;
    }
  } catch (err) {
    console.warn('[frequencia-mensal] Falha ao ler imagem local:', err.message);
  }
  return null;
}

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

  const { id: turmaIdParam } = req.query;
  const turmaId = Number(turmaIdParam);

  if (Number.isNaN(turmaId) || turmaId <= 0) {
    return res.status(400).json({ error: 'ID da turma inválido' });
  }

  try {
    // 1. Buscar a Turma, Curso e Instituição vinculada
    let turmaQuery = supabase
      .from('turmas')
      .select(`
        id,
        nome,
        turno,
        gradeid,
        cursoid,
        instituicao_id,
        situacao,
        cursos (
          id,
          nome,
          instituicao_id,
          instituicoes (
            id,
            nome,
            cnpj,
            telefone,
            email,
            cidade,
            estado,
            logo
          )
        ),
        instituicoes (
          id,
          nome,
          cnpj,
          telefone,
          email,
          cidade,
          estado,
          logo
        )
      `)
      .eq('id', turmaId)
      .maybeSingle();

    if (!isGroupAdmin) {
      turmaQuery = applyInstituicaoFilter(turmaQuery, userInstituicaoId);
    }

    const { data: turma, error: turmaErr } = await turmaQuery;

    if (turmaErr) {
      console.error('[frequencia-mensal] Erro ao buscar turma:', turmaErr);
      return res.status(500).json({ error: turmaErr.message });
    }

    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada ou acesso não autorizado' });
    }

    // Resolver instituição vinculada (prioridade: turma.instituicoes -> turma.cursos.instituicoes)
    const instituicaoVinculada = turma.instituicoes || turma.cursos?.instituicoes || null;

    // Resolver logotipo:
    // Estrita regra institucional: usar SOMENTE a logomarca da instituição vinculada.
    // Nunca utilizar fallback para outra instituição ou empresa caso a instituição não tenha logo próprio.
    let resolvedLogo = instituicaoVinculada?.logo || null;
    let pendenciaLogo = false;

    if (!resolvedLogo) {
      pendenciaLogo = true;
    }

    // 2. Buscar Disciplinas disponíveis para a turma (via gradeid ou cursoid)
    let disciplinas = [];
    if (turma.gradeid) {
      const { data: dGrade } = await supabase
        .from('disciplinas')
        .select('id, nome, cargahoraria, periodo')
        .or(`grade.eq.${turma.gradeid},grade_id.eq.${turma.gradeid}`)
        .order('nome');

      if (dGrade && dGrade.length > 0) {
        disciplinas = dGrade;
      }
    }

    // Fallback por cursoid caso não haja disciplinas vinculadas diretamente pela grade
    if (disciplinas.length === 0 && turma.cursoid) {
      const { data: dCurso } = await supabase
        .from('disciplinas')
        .select('id, nome, cargahoraria, periodo')
        .eq('cursoid', turma.cursoid)
        .order('nome');

      if (dCurso && dCurso.length > 0) {
        disciplinas = dCurso;
      }
    }

    // 3. Buscar Alunos com matrícula ATIVA exclusivamente nesta turma
    let matriculasQuery = supabase
      .from('matriculas')
      .select(`
        id,
        codigo_matricula,
        status_administrativo,
        turma_id,
        instituicao_id,
        alunos (
          id,
          nome,
          cpf,
          matricula,
          email,
          telefone_celular,
          statusmatricula
        )
      `)
      .eq('turma_id', turmaId)
      .eq('status_administrativo', 'ATIVO');

    if (!isGroupAdmin) {
      matriculasQuery = applyInstituicaoFilter(matriculasQuery, userInstituicaoId);
    }

    const { data: matriculas, error: matErr } = await matriculasQuery;

    if (matErr) {
      console.error('[frequencia-mensal] Erro ao buscar matrículas ativas:', matErr);
      return res.status(500).json({ error: matErr.message });
    }

    // Desduplicar por aluno.id e ordenar alfabeticamente por nome
    const mapaAlunos = new Map();

    (matriculas || []).forEach((m) => {
      const al = m.alunos;
      if (al && al.id && !mapaAlunos.has(al.id)) {
        mapaAlunos.set(al.id, {
          id: al.id,
          matriculaId: m.id,
          nome: (al.nome || '').trim(),
          matricula: m.codigo_matricula || al.matricula || '—',
          cpf: al.cpf || '—',
          status: m.status_administrativo,
        });
      }
    });

    const alunosAtivos = Array.from(mapaAlunos.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    );

    return res.status(200).json({
      turma: {
        id: turma.id,
        nome: turma.nome,
        turno: turma.turno || '—',
        curso: turma.cursos?.nome || '—',
        cursoId: turma.cursoid,
        gradeId: turma.gradeid,
        situacao: turma.situacao,
      },
      instituicao: instituicaoVinculada
        ? {
            id: instituicaoVinculada.id,
            nome: instituicaoVinculada.nome,
            cnpj: instituicaoVinculada.cnpj || '',
            telefone: instituicaoVinculada.telefone || '',
            email: instituicaoVinculada.email || '',
            cidade: instituicaoVinculada.cidade || '',
            estado: instituicaoVinculada.estado || '',
            logo: resolvedLogo,
            pendenciaLogo,
          }
        : null,
      disciplinas,
      alunos: alunosAtivos,
      totalAlunosAtivos: alunosAtivos.length,
    });
  } catch (error) {
    console.error('[frequencia-mensal] Erro inesperado:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar dados de frequência da turma' });
  }
}
