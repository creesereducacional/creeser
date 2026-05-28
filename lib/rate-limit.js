/**
 * lib/rate-limit.js
 * Rate limiter em memória (sem dependência de Redis).
 * Adequado para instância única (Vercel Serverless = stateless por função).
 * Para produção multi-instância, substituir por Upstash Redis.
 */

const store = new Map(); // chave -> { count, resetAt }

// Limpeza periódica de entradas expiradas (evita vazamento de memória)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k);
    }
  }, 60_000);
}

/**
 * Verifica e incrementa o contador de rate limit para uma chave.
 *
 * @param {object} opts
 * @param {string}  opts.key       - Chave única (ex: "login:127.0.0.1")
 * @param {number}  opts.limit     - Máximo de requisições no período
 * @param {number}  opts.windowMs  - Janela em milissegundos
 * @returns {{ allowed: boolean, count: number, remaining: number, retryAfter: number }}
 */
export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, limit - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > limit) {
    return { allowed: false, count: entry.count, remaining: 0, retryAfter };
  }

  return { allowed: true, count: entry.count, remaining, retryAfter: 0 };
}

/**
 * Extrai IP real do request, respeitando proxies (Vercel, Cloudflare).
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || '—';
}
