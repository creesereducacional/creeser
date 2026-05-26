import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('planejamento_diario').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Registro não encontrado' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase.from('planejamento_diario').update({
      professor:           body.professor            || null,
      turma:               body.turma                || null,
      disciplina:          body.disciplina           || null,
      data:                body.data                 || null,
      data_fim:            body.dataFim              || body.data_fim            || null,
      local:               body.local                || null,
      quantidade_aulas:    body.quantidadeAulas      || body.quantidade_aulas    || null,
      avaliacao_checkbox:  body.avaliacaoCheckbox    ?? body.avaliacao_checkbox  ?? false,
      unidade_bimestral:   body.unidadeBimestral     || body.unidade_bimestral   || null,
      conteudo_vivenciado: body.conteudoVivenciado   || body.conteudo_vivenciado || null,
      objetivo_aula:       body.objetivoAula         || body.objetivo_aula       || null,
      metodologias:        body.metodologias         || null,
      recursos:            body.recursos             || null,
      avaliacao:           body.avaliacao            || null,
    }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('planejamento_diario').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Registro removido com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
