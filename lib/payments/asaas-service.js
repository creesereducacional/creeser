// Cliente REST para a API do ASAAS
// Local: c:\PROJETOS\creeser\lib\payments\asaas-service.js

export async function validarConexao(apiKey, ambiente = 'sandbox') {
  const baseUrl = ambiente === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3';

  try {
    const res = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      return { success: false, error: `Falha na conexão (${res.status}): ${txt}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erro de conexão de rede.' };
  }
}

export async function criarCliente(apiKey, ambiente, clienteData) {
  const baseUrl = ambiente === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3';

  const res = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clienteData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
  }
  return data;
}

export async function criarCobranca(apiKey, ambiente, cobrancaData) {
  const baseUrl = ambiente === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3';

  const res = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cobrancaData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas');
  }
  return data;
}
