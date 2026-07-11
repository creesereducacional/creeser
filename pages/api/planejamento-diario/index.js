import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter, hasPerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'professor', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    if (hasPerfil(authUser, ['professor'])) {
      const emailLogado = authUser.email;
      if (!emailLogado) return res.status(200).json([]);

      // Obter professor_id
      const { data: prof, error: profError } = await supabase
        .from('professores')
        .select('id')
        .eq('email', emailLogado)
        .eq('instituicao_id', instituicaoId)
        .maybeSingle();

      if (profError || !prof) return res.status(200).json([]);

      // Obter os vínculos de turmas e disciplinas
      const { data: vts, error: vtsError } = await supabase
        .from('professor_turma_disciplinas')
        .select('turma_id, disciplina_id')
        .eq('professor_id', prof.id)
        .eq('ativo', true);

      if (vtsError || !vts || vts.length === 0) return res.status(200).json([]);

      // O diário de classe salva relações. Filtramos pelos IDs das turmas/disciplinas às quais tem vínculo ativo.
      const conds = vts.map(v => `(turma.eq.${v.turma_id},disciplina.eq.${v.disciplina_id})`).join(',');
      
      let query = supabase.from('planejamento_diario').select('*').or(conds).order('data', { ascending: false });
      query = applyInstituicaoFilter(query, instituicaoId);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data || []);
    }

    let query = supabase.from('planejamento_diario').select('*').order('data', { ascending: false });
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);

    if (hasPerfil(authUser, ['professor'])) {
      const emailLogado = authUser.email;
      if (!emailLogado) return res.status(403).json({ error: 'Acesso negado: professor não identificado.' });

      const { data: prof, error: profError } = await supabase
        .from('professores')
        .select('id')
        .eq('email', emailLogado)
        .eq('instituicao_id', instId)
        .maybeSingle();

      if (profError || !prof) return res.status(403).json({ error: 'Acesso negado: professor não localizado.' });

      const turmaReq = body.turma;
      const disciplinaReq = body.disciplina;

      if (!turmaReq || !disciplinaReq) {
        return res.status(400).json({ error: 'Turma e Disciplina são obrigatórias para lançar planejamento diário.' });
      }

      // Validar vínculo
      const { data: vinculo, error: vinError } = await supabase
        .from('professor_turma_disciplinas')
        .select('id')
        .eq('professor_id', prof.id)
        .eq('turma_id', parseInt(turmaReq, 10))
        .eq('disciplina_id', parseInt(disciplinaReq, 10))
        .eq('ativo', true)
        .maybeSingle();

      if (vinError || !vinculo) {
        return res.status(403).json({ error: 'Acesso negado: você não possui vínculo ativo com esta turma/disciplina.' });
      }
    }

    const { data, error } = await supabase.from('planejamento_diario').insert({
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
      instituicao_id:      instId                    || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
