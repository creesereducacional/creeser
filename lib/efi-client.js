/**
 * Cliente REST para a API Cobranças do EFI Bank (Efí Pay)
 * Documentação: https://dev.efipay.com.br/docs/api-cobrancas
 *
 * Autenticação: OAuth2 com client_credentials
 * Variáveis de ambiente necessárias:
 *   EFI_CLIENT_ID      — Client ID da aplicação no painel EFI
 *   EFI_CLIENT_SECRET  — Client Secret da aplicação no painel EFI
 *   EFI_SANDBOX        — "true" para homologação, "false" (ou omitir) para produção
 */

const BASE_URL = process.env.EFI_SANDBOX === 'true'
  ? 'https://cobrancas-h.api.efipay.com.br'
  : 'https://cobrancas.api.efipay.com.br';

// Cache de token em memória (válido por ~expire_in segundos)
let _tokenCache = { token: null, expiresAt: 0 };

async function _getToken() {
  if (_tokenCache.token && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('EFI_CLIENT_ID e EFI_CLIENT_SECRET devem estar definidos nas variáveis de ambiente.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${BASE_URL}/v1/authorize`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EFI Auth falhou (${res.status}): ${body}`);
  }

  const data = await res.json();
  // Expira 30s antes para evitar uso de token expirado
  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };

  return _tokenCache.token;
}

async function _request(method, path, body = null) {
  const token = await _getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.message || data.error || data.error_description || `Erro EFI ${res.status}`;
    const err = new Error(message);
    err.statusCode = res.status;
    err.efiResponse = data;
    throw err;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// COBRANÇAS (Boleto único)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria uma cobrança vazia e retorna o charge_id.
 * @param {Array} items — [{ name, value (em centavos), amount }]
 */
async function createCharge(items) {
  return _request('POST', '/v1/charge', { items });
}

/**
 * Associa a cobrança a um boleto bancário.
 * @param {number} chargeId — ID retornado por createCharge
 * @param {Object} payload   — { expire_at, customer: { name, cpf, ... } }
 */
async function associateBillet(chargeId, payload) {
  return _request('POST', `/v1/charge/${chargeId}/billet`, payload);
}

/**
 * Cancela uma cobrança pelo charge_id.
 * Só funciona para cobranças com status 'new' ou 'waiting'.
 */
async function cancelCharge(chargeId) {
  return _request('PUT', `/v1/charge/${chargeId}/cancel`);
}

/**
 * Consulta os detalhes de uma cobrança.
 */
async function getCharge(chargeId) {
  return _request('GET', `/v1/charge/${chargeId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARNÊS (Boleto parcelado)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria um carnê com todas as parcelas de uma vez.
 * @param {Object} payload:
 *   items        — [{ name, value (centavos), amount }]
 *   customer     — { name, cpf, birth, email, phone_number }
 *   expire_at    — data de vencimento da 1ª parcela (YYYY-MM-DD)
 *   repeats      — número de parcelas (máx. 120)
 *   split_items  — boolean (repartir item entre parcelas)
 *   message      — mensagem opcional no boleto
 */
async function createCarnet(payload) {
  return _request('POST', '/v1/carnet', payload);
}

/**
 * Cancela um carnê inteiro pelo carnet_id.
 */
async function cancelCarnet(carnetId) {
  return _request('PUT', `/v1/carnet/${carnetId}/cancel`);
}

/**
 * Cancela uma parcela específica de um carnê.
 * @param {number} parcel — número da parcela (ex: 3 para a 3ª parcela)
 */
async function cancelCarnetParcel(carnetId, parcel) {
  return _request('PUT', `/v1/carnet/${carnetId}/parcel/${parcel}/cancel`);
}

/**
 * Consulta os detalhes de um carnê.
 */
async function getCarnet(carnetId) {
  return _request('GET', `/v1/carnet/${carnetId}`);
}

/**
 * Define ou atualiza a notification_url de uma cobrança.
 */
async function updateChargeMetadata(chargeId, notificationUrl, customId = null) {
  const body = { notification_url: notificationUrl };
  if (customId) body.custom_id = customId;
  return _request('PUT', `/v1/charge/${chargeId}/metadata`, body);
}

/**
 * Consulta os detalhes de uma notificação pelo token recebido no POST.
 * Deve ser chamado logo após receber o POST no webhook.
 * @param {string} token — token recebido no body do POST da EFI
 */
async function getNotification(token) {
  return _request('GET', `/v1/notification/${token}`);
}

module.exports = {
  createCharge,
  associateBillet,
  cancelCharge,
  getCharge,
  updateChargeMetadata,
  createCarnet,
  cancelCarnet,
  cancelCarnetParcel,
  getCarnet,
  getNotification,
};
