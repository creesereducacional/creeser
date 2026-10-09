import { obterCursosEAD } from '../../../../lib/ead/cursosStorage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  const { id } = req.query;
  try {
    const cursos = await obterCursosEAD(false);
    const curso = cursos.find(c => String(c.id) === String(id));
    if (!curso) {
      return res.status(404).json({ error: 'Curso EAD não encontrado' });
    }

    // Se o curso for rascunho (inativo), verificar se quem consulta é admin autenticado
    if (curso.ativo === false) {
      const { requireAuth, hasPerfil } = await import('@/lib/auth-server');
      const user = requireAuth(req, res);
      if (!user) {
        // requireAuth já envia 401
        return;
      }
      const isAdmin = hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin']);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Curso em rascunho indisponível para consulta pública' });
      }
    }

    // Verificar se quem consulta é gestor/admin para decidir se inclui gabarito da avaliação
    const { requireAuth, hasPerfil } = await import('@/lib/auth-server');
    let isGestor = false;
    try {
      const user = requireAuth(req, res, { silent: true });
      if (user && hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) {
        isGestor = true;
      }
    } catch (e) {}

    // Sanitizar cópia do curso para não expor gabarito (respostaCorreta / explicacao) a alunos ou público geral
    const cursoSanitizado = JSON.parse(JSON.stringify(curso));
    if (!isGestor && cursoSanitizado.avaliacao && Array.isArray(cursoSanitizado.avaliacao.questoes)) {
      cursoSanitizado.avaliacao.questoes = cursoSanitizado.avaliacao.questoes.map(q => {
        const { respostaCorreta, explicacao, ...qPublica } = q;
        return qPublica;
      });
    }

    return res.status(200).json(cursoSanitizado);
  } catch (error) {
    console.error('Erro na API de detalhe do curso EAD:', error);
    return res.status(500).json({ error: 'Erro ao buscar curso EAD' });
  }
}
