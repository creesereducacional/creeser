import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../../lib/auth-server';
import { validarEmailUnico, normalizeEmail } from '../../../../lib/api-helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Perfis que operam cadastro de alunos e pré-cadastros
const PERFIS_PERMITIDOS = [
  'recepcao',
  'grupo_admin',
  'instituicao_admin',
  'admin',
  'financeiro',
  'secretaria',
  'coordenador',
  'comercial',
  'comercial_master',
  'comercial_operador'
];

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, aluno_id, usuario_id } = req.query;

  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: 'E-mail é obrigatório para verificação.' });
  }

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return res.status(400).json({ error: 'E-mail inválido ou vazio.' });
  }

  const parsedAlunoId = aluno_id && aluno_id !== 'novo' && aluno_id !== 'undefined'
    ? Number(aluno_id) || null
    : null;

  const parsedUsuarioId = usuario_id && usuario_id !== 'undefined'
    ? Number(usuario_id) || null
    : null;

  try {
    const result = await validarEmailUnico({
      email: cleanEmail,
      currentAlunoId: parsedAlunoId,
      currentUsuarioId: parsedUsuarioId,
      supabaseClient: supabase
    });

    if (!result.valid) {
      return res.status(200).json({
        exists: true,
        available: false,
        normalizedEmail: cleanEmail,
        message: 'Este e-mail já está cadastrado. Informe outro e-mail.'
      });
    }

    return res.status(200).json({
      exists: false,
      available: true,
      normalizedEmail: cleanEmail,
      message: 'E-mail disponível para cadastro.'
    });
  } catch (err) {
    console.error('[verificar-email]', err);
    return res.status(500).json({
      error: 'Não foi possível verificar o e-mail no momento. Tente novamente.',
      available: false
    });
  }
}
