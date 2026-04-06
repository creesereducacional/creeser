import {
  contratoSchemaErrorMessage,
  isMissingContratoSchemaError,
  mapContratoRow,
  parseContratoPayload,
  supabase,
  toBoolean,
  unsetDefaultFromInstitution
} from '../../contratos/_shared';

const getBodyPadrao = (body) => {
  if (!Object.prototype.hasOwnProperty.call(body || {}, 'padrao')) return null;
  return toBoolean(body?.padrao, false);
};

const getBodyOrdem = (body) => {
  if (!Object.prototype.hasOwnProperty.call(body || {}, 'ordem')) return null;
  const parsed = Number(body?.ordem);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
};

export default async function handler(req, res) {
  const { method } = req;
  const { id: instituicaoId } = req.query;

  if (!instituicaoId) {
    return res.status(400).json({ error: 'Instituição não informada' });
  }

  try {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('contratos_instituicao')
        .select('*')
        .eq('instituicao_id', instituicaoId)
        .order('padrao', { ascending: false })
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      return res.status(200).json((data || []).map(mapContratoRow));
    }

    if (method === 'POST') {
      const body = req.body || {};

      const payload = parseContratoPayload(body);
      payload.instituicao_id = instituicaoId;
      payload.updated_at = new Date().toISOString();

      const bodyPadrao = getBodyPadrao(body);
      if (bodyPadrao !== null) {
        payload.padrao = bodyPadrao;
      } else {
        const { count, error: countError } = await supabase
          .from('contratos_instituicao')
          .select('id', { count: 'exact', head: true })
          .eq('instituicao_id', instituicaoId);

        if (countError) throw countError;
        payload.padrao = (count || 0) === 0;
      }

      const bodyOrdem = getBodyOrdem(body);
      if (bodyOrdem !== null) {
        payload.ordem = bodyOrdem;
      }

      if (payload.padrao) {
        await unsetDefaultFromInstitution(instituicaoId);
      }

      const { data, error } = await supabase
        .from('contratos_instituicao')
        .insert([payload])
        .select('*')
        .single();

      if (error) throw error;
      return res.status(201).json(mapContratoRow(data));
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de contratos por instituição:', error);

    if (isMissingContratoSchemaError(error)) {
      return res.status(503).json({ error: contratoSchemaErrorMessage });
    }

    return res.status(500).json({ error: error.message || 'Erro interno ao processar contratos' });
  }
}
