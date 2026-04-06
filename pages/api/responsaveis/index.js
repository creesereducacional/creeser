import {
  attachAlunoIdsToRows,
  filterExistingAlunoIds,
  isMissingSupabaseObjectError,
  mapBodyToPayload,
  parseAlunoIdsFromBody,
  supabase,
  syncResponsavelAlunos,
} from './_shared';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        if (isMissingSupabaseObjectError(error)) {
          return res.status(200).json([]);
        }

        console.error('Supabase GET responsaveis error:', error);
        return res.status(500).json({ message: 'Erro ao recuperar responsaveis', error: error.message });
      }

      const response = await attachAlunoIdsToRows(data || []);
      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const payload = mapBodyToPayload(body);

      if (!payload.nome) {
        return res.status(400).json({ message: 'Nome e obrigatorio' });
      }

      const alunoIds = parseAlunoIdsFromBody(body);
      const existingAlunoIds = await filterExistingAlunoIds(alunoIds);

      const { data, error } = await supabase
        .from('responsaveis')
        .insert(payload)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Supabase POST responsaveis error:', error);
        return res.status(500).json({ message: 'Erro ao cadastrar responsavel', error: error.message });
      }

      await syncResponsavelAlunos(data.id, existingAlunoIds);
      const [response] = await attachAlunoIdsToRows([data]);
      return res.status(201).json(response);
    }

    return res.status(405).json({ erro: 'Metodo nao permitido' });
  } catch (error) {
    console.error('Erro em /api/responsaveis:', error);
    return res.status(500).json({ message: 'Erro interno no servidor', error: error.message });
  }
}
