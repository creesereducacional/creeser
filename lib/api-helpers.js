/**
 * lib/api-helpers.js
 * Utilitários centrais para handlers de API Next.js.
 */

/**
 * Retorna uma mensagem de erro segura (sem SQL bruto, sem stack traces).
 * Loga o erro real no servidor para diagnóstico.
 *
 * @param {Error|object} err       - Erro original (Supabase, JS, etc.)
 * @param {string}       defaultMsg - Mensagem amigável para o cliente
 * @param {string}       [context]  - Identificador para o log (ex: 'alunos/GET')
 * @returns {string} Mensagem segura para enviar ao cliente
 */
export function safeError(err, defaultMsg = 'Erro interno do servidor', context = '') {
  const msg = err?.message || String(err || '');
  const tag = context ? `[${context}]` : '[api]';
  console.error(`${tag}`, msg);
  return defaultMsg;
}

/**
 * Responde com erro interno sem expor detalhes ao cliente.
 * Use como substituto direto de:
 *   return res.status(500).json({ error: error.message });
 *
 * @param {object} res         - Next.js response
 * @param {Error}  err         - Erro original
 * @param {string} defaultMsg  - Mensagem amigável
 * @param {string} [context]   - Tag para o log
 * @param {number} [status]    - HTTP status (padrão 500)
 */
export function respondError(res, err, defaultMsg = 'Erro interno do servidor', context = '', status = 500) {
  const msg = safeError(err, defaultMsg, context);
  return res.status(status).json({ error: msg });
}

/**
 * Guard para verificar método HTTP.
 * Retorna true se o método é permitido, responde 405 caso contrário.
 */
export function allowMethods(req, res, methods = ['GET']) {
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    res.status(405).json({ error: `Método ${req.method} não permitido` });
    return false;
  }
  return true;
}
