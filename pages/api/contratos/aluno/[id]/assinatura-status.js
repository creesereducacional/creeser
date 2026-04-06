import { supabase } from '../../_shared';

const ASSINAFY_BASE_URL = process.env.ASSINAFY_BASE_URL || 'https://api.assinafy.com.br/v1';

const asText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const parseId = (value) => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('could not find the table')
  );
};

const normalizeStatus = (value, fallback = '') => {
  const status = asText(value).toLowerCase();
  return status || fallback;
};

const parseAssinafyPayload = (payload) => payload?.data || payload || {};

const callAssinafyGetDocument = async (documentId, apiKey) => {
  const response = await fetch(`${ASSINAFY_BASE_URL}/documents/${documentId}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey
    }
  });

  const raw = await response.text();
  let parsed = null;

  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message = parsed?.message || parsed?.error || raw || `Erro na API Assinafy (${response.status})`;
    throw new Error(message);
  }

  return parsed || {};
};

const mapResponse = (row, extra = {}) => ({
  id: row.id,
  alunoId: row.aluno_id,
  instituicaoId: row.instituicao_id,
  contratoId: row.contrato_id,
  provider: row.provider,
  status: row.status,
  providerDocumentId: row.provider_document_id,
  providerAssignmentId: row.provider_assignment_id,
  signers: Array.isArray(row.signers) ? row.signers : [],
  signingUrls: Array.isArray(row.signing_urls) ? row.signing_urls : [],
  errorMessage: row.error_message || '',
  requestedAt: row.requested_at,
  lastSyncedAt: row.last_synced_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...extra
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const alunoId = parseId(req.query?.id);
    if (!alunoId) {
      return res.status(400).json({ error: 'ID do aluno inválido' });
    }

    const { data, error } = await supabase
      .from('contratos_assinaturas')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      if (isMissingTableError(error)) {
        return res.status(503).json({
          error: 'Estrutura de acompanhamento de assinatura digital não aplicada no banco. Execute a migration de contratos_assinaturas.'
        });
      }

      throw error;
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) {
      return res.status(404).json({
        error: 'Nenhum processo de assinatura digital encontrado para este aluno.'
      });
    }

    const apiKey = process.env.ASSINAFY_API_KEY;
    const canSyncWithProvider = Boolean(apiKey && row.provider === 'assinafy' && asText(row.provider_document_id));

    if (!canSyncWithProvider) {
      return res.status(200).json(mapResponse(row));
    }

    try {
      const providerResponse = await callAssinafyGetDocument(asText(row.provider_document_id), apiKey);
      const providerData = parseAssinafyPayload(providerResponse);
      const providerStatus = normalizeStatus(providerData?.status, row.status || '');
      const providerAssignment = providerData?.assignment || {};
      const signingUrls = Array.isArray(providerAssignment?.signing_urls)
        ? providerAssignment.signing_urls
        : (Array.isArray(row.signing_urls) ? row.signing_urls : []);

      const patch = {
        status: providerStatus || row.status,
        provider_assignment_id: asText(providerAssignment?.id) || row.provider_assignment_id,
        signing_urls: signingUrls,
        provider_payload: providerData,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: updated, error: updateError } = await supabase
        .from('contratos_assinaturas')
        .update(patch)
        .eq('id', row.id)
        .select('*')
        .single();

      if (updateError) {
        throw updateError;
      }

      return res.status(200).json(mapResponse(updated, { providerLiveStatus: providerStatus }));
    } catch (syncError) {
      return res.status(200).json(
        mapResponse(row, {
          syncWarning: syncError.message || 'Não foi possível sincronizar status no provedor no momento.'
        })
      );
    }
  } catch (error) {
    console.error('Erro ao consultar status de assinatura digital:', error);
    return res.status(500).json({ error: error.message || 'Erro interno ao consultar assinatura digital' });
  }
}
