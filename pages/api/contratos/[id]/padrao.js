import {
  contratoSchemaErrorMessage,
  isMissingContratoSchemaError,
  mapContratoRow,
  supabase,
  unsetDefaultFromInstitution
} from '../_shared';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!id) {
    return res.status(400).json({ error: 'ID não informado' });
  }

  try {
    const { data: contrato, error: contratoError } = await supabase
      .from('contratos_instituicao')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (contratoError) throw contratoError;
    if (!contrato) {
      return res.status(404).json({ error: 'Modelo de contrato não encontrado' });
    }

    await unsetDefaultFromInstitution(contrato.instituicao_id, id);

    const { data, error } = await supabase
      .from('contratos_instituicao')
      .update({ padrao: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return res.status(200).json(mapContratoRow(data));
  } catch (error) {
    console.error('Erro ao definir contrato padrão:', error);

    if (isMissingContratoSchemaError(error)) {
      return res.status(503).json({ error: contratoSchemaErrorMessage });
    }

    return res.status(500).json({ error: error.message || 'Erro ao definir modelo padrão' });
  }
}
