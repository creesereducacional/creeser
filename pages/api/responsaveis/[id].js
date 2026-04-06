import {
  attachAlunoIdsToRows,
  filterExistingAlunoIds,
  mapBodyToPayload,
  parseAlunoIdsFromBody,
  parseResponsavelId,
  supabase,
  syncResponsavelAlunos,
} from './_shared';

export default async function handler(req, res) {
  const id = parseResponsavelId(req.query.id);

  if (id === null) {
    return res.status(400).json({ message: 'ID invalido' });
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Supabase GET responsavel by id error:', error);
        return res.status(500).json({ message: 'Erro ao buscar responsavel', error: error.message });
      }

      if (!data) {
        return res.status(404).json({ message: 'Responsavel nao encontrado' });
      }

      const [response] = await attachAlunoIdsToRows([data]);
      return res.status(200).json(response);
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const payload = mapBodyToPayload(body);

      if (!payload.nome) {
        return res.status(400).json({ message: 'Nome e obrigatorio' });
      }

      const alunoIds = parseAlunoIdsFromBody(body);
      const existingAlunoIds = await filterExistingAlunoIds(alunoIds);

      const { data, error } = await supabase
        .from('responsaveis')
        .update(payload)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Supabase PUT responsavel error:', error);
        return res.status(500).json({ message: 'Erro ao atualizar responsavel', error: error.message });
      }

      if (!data) {
        return res.status(404).json({ message: 'Responsavel nao encontrado' });
      }

      await syncResponsavelAlunos(id, existingAlunoIds);
      const [response] = await attachAlunoIdsToRows([data]);
      return res.status(200).json(response);
    }

    if (req.method === 'DELETE') {
      await syncResponsavelAlunos(id, []);

      const { data, error } = await supabase
        .from('responsaveis')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Supabase DELETE responsavel error:', error);
        return res.status(500).json({ message: 'Erro ao deletar responsavel', error: error.message });
      }

      if (!data) {
        return res.status(404).json({ message: 'Responsavel nao encontrado' });
      }

      return res.status(200).json({ mensagem: 'Responsavel deletado com sucesso' });
    }

    return res.status(405).json({ erro: 'Metodo nao permitido' });
  } catch (error) {
    console.error('Erro em /api/responsaveis/[id]:', error);
    return res.status(500).json({ message: 'Erro interno no servidor', error: error.message });
  }
}
