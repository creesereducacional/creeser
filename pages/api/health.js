/**
 * pages/api/health.js
 * Endpoint de health check para monitoramento de produção.
 * GET /api/health → JSON com status de todas as dependências.
 */

import { supabaseAdmin } from '../../lib/supabase';

const START_TIME = Date.now();

const REQUIRED_ENVS = [
  'AUTH_JWT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const OPTIONAL_ENVS = {
  efi:      ['EFI_CLIENT_ID', 'EFI_CLIENT_SECRET'],
  assinafy: ['ASSINAFY_API_KEY'],
  email:    ['EMAIL_HOST', 'EMAIL_USER'],
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks = {};

  // ── Banco de dados ────────────────────────────────────────────────────────
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('instituicoes')
        .select('id')
        .limit(1);
      checks.banco = error
        ? { status: 'degraded', detail: 'Query falhou' }
        : { status: 'ok' };
    } catch {
      checks.banco = { status: 'error', detail: 'Conexão falhou' };
    }
  } else {
    checks.banco = { status: 'unconfigured', detail: 'SUPABASE_SERVICE_ROLE_KEY ausente' };
  }

  // ── Variáveis de ambiente obrigatórias ────────────────────────────────────
  const envMissing = REQUIRED_ENVS.filter((e) => !process.env[e]);
  checks.envs = envMissing.length === 0
    ? { status: 'ok' }
    : { status: 'error', missing: envMissing };

  // ── Integrações opcionais ─────────────────────────────────────────────────
  checks.integracoes = {};
  for (const [name, keys] of Object.entries(OPTIONAL_ENVS)) {
    const missing = keys.filter((k) => !process.env[k]);
    checks.integracoes[name] = missing.length === 0
      ? { status: 'configured' }
      : { status: 'not_configured', missing };
  }

  // ── Resultado global ──────────────────────────────────────────────────────
  const isOk =
    checks.banco?.status === 'ok' &&
    checks.envs?.status === 'ok';

  const uptime = Math.floor((Date.now() - START_TIME) / 1000);

  return res.status(isOk ? 200 : 503).json({
    status: isOk ? 'ok' : 'degraded',
    uptime_seconds: uptime,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '—',
    env: process.env.NODE_ENV || 'development',
    checks,
  });
}
