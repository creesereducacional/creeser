import {
  contratoSchemaErrorMessage,
  isMissingContratoSchemaError,
  mapContratoRow,
  parseContratoPayload,
  supabase,
  toBoolean,
  unsetDefaultFromInstitution
} from './_shared';

const fetchContrato = async (id) => {
  const { data, error } = await supabase
    .from('contratos_instituicao')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID não informado' });
  }

  try {
    const contrato = await fetchContrato(id);
    if (!contrato) {
      return res.status(404).json({ error: 'Modelo de contrato não encontrado' });
    }

    if (method === 'GET') {
      return res.status(200).json(mapContratoRow(contrato));
    }

    if (method === 'PUT') {
      const body = req.body || {};
      const payload = parseContratoPayload(body, contrato);

      if (Object.prototype.hasOwnProperty.call(body, 'padrao')) {
        const querPadrao = toBoolean(body.padrao, false);
        payload.padrao = querPadrao;

        if (querPadrao) {
          await unsetDefaultFromInstitution(contrato.instituicao_id, id);
        }
      }

      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('contratos_instituicao')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return res.status(200).json(mapContratoRow(data));
    }

    if (method === 'DELETE') {
      const { error } = await supabase
        .from('contratos_instituicao')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ message: 'Modelo de contrato removido com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de contrato:', error);

    if (isMissingContratoSchemaError(error)) {
      return res.status(503).json({ error: contratoSchemaErrorMessage });
    }

    return res.status(500).json({ error: error.message || 'Erro interno ao processar contrato' });
  }
}
