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

export const MSG_EMAIL_DUPLICADO = 'Este e-mail já está cadastrado no sistema. Utilize outro e-mail ou acesse a recuperação de senha.';

export function normalizeEmail(email) {
  if (email === null || email === undefined) return null;
  const str = String(email).trim().toLowerCase();
  return str === '' ? null : str;
}

export function isDuplicateEmailError(error) {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();
  const code = String(error.code || '');
  return (
    (code === '23505' || msg.includes('duplicate key') || msg.includes('23505')) &&
    (msg.includes('email') || details.includes('email') || msg.includes('idx_alunos_unique') || msg.includes('idx_usuarios_unique'))
  );
}

/**
 * Valida se um e-mail é único no sistema entre alunos e usuários.
 * Permite a coexistência se o aluno e o usuário compartilharem o mesmo vínculo (aluno.usuarioid === usuario.id).
 *
 * @param {object} params
 * @param {string|null} params.email - E-mail para validação
 * @param {number|string|null} [params.currentAlunoId] - ID do aluno que está sendo editado
 * @param {number|string|null} [params.currentUsuarioId] - ID do usuário que está sendo editado
 * @param {object} params.supabaseClient - Cliente Supabase com permissões de leitura
 * @returns {Promise<{ valid: boolean, normalizedEmail: string|null, error?: string }>}
 */
export async function validarEmailUnico({ email, currentAlunoId = null, currentUsuarioId = null, supabaseClient }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return { valid: true, normalizedEmail: null };
  }

  if (!supabaseClient) {
    return { valid: true, normalizedEmail: cleanEmail };
  }

  const numAlunoId = currentAlunoId != null ? Number(currentAlunoId) : null;
  const numUsuarioId = currentUsuarioId != null ? Number(currentUsuarioId) : null;

  // 1. Resolver vinculo cruzado caso seja edicao de aluno
  let linkedUsuarioId = numUsuarioId;
  if (numAlunoId && !linkedUsuarioId) {
    const { data: alunoAtual } = await supabaseClient
      .from('alunos')
      .select('usuarioid')
      .eq('id', numAlunoId)
      .maybeSingle();
    if (alunoAtual?.usuarioid) {
      linkedUsuarioId = Number(alunoAtual.usuarioid);
    }
  }

  // 2. Resolver vinculo cruzado caso seja edicao de usuario
  let linkedAlunoId = numAlunoId;
  if (numUsuarioId && !linkedAlunoId) {
    const { data: alunoVinculado } = await supabaseClient
      .from('alunos')
      .select('id')
      .eq('usuarioid', numUsuarioId)
      .maybeSingle();
    if (alunoVinculado?.id) {
      linkedAlunoId = Number(alunoVinculado.id);
    }
  }

  // 3. Verificar em ALUNOS (usando ilike para garantir case-insensitivity)
  let queryAlunos = supabaseClient
    .from('alunos')
    .select('id, email, usuarioid')
    .ilike('email', cleanEmail);

  if (numAlunoId) {
    queryAlunos = queryAlunos.neq('id', numAlunoId);
  } else if (linkedAlunoId) {
    queryAlunos = queryAlunos.neq('id', linkedAlunoId);
  }

  const { data: matchAlunos, error: errAlunos } = await queryAlunos.limit(1);
  if (errAlunos) {
    console.error('[validarEmailUnico] Erro ao consultar tabela alunos:', errAlunos.message);
  } else if (matchAlunos && matchAlunos.length > 0) {
    return { valid: false, normalizedEmail: cleanEmail, error: MSG_EMAIL_DUPLICADO };
  }

  // 4. Verificar em USUARIOS (usando ilike)
  let queryUsuarios = supabaseClient
    .from('usuarios')
    .select('id, email')
    .ilike('email', cleanEmail);

  if (numUsuarioId) {
    queryUsuarios = queryUsuarios.neq('id', numUsuarioId);
  } else if (linkedUsuarioId) {
    queryUsuarios = queryUsuarios.neq('id', linkedUsuarioId);
  }

  const { data: matchUsuarios, error: errUsuarios } = await queryUsuarios.limit(1);
  if (errUsuarios) {
    console.error('[validarEmailUnico] Erro ao consultar tabela usuarios:', errUsuarios.message);
  } else if (matchUsuarios && matchUsuarios.length > 0) {
    return { valid: false, normalizedEmail: cleanEmail, error: MSG_EMAIL_DUPLICADO };
  }

  return { valid: true, normalizedEmail: cleanEmail };
}
