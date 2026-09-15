import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['recepcao', 'grupo_admin', 'instituicao_admin', 'admin', 'financeiro'];

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cpf } = req.query;

  if (!cpf) {
    return res.status(400).json({ error: 'CPF é obrigatório.' });
  }

  const cleanCpf = cpf.trim();

  try {
    const { data: existente, error } = await supabase
      .from('alunos')
      .select('id, nome, statusmatricula')
      .eq('cpf', cleanCpf)
      .maybeSingle();

    if (error) {
      console.error('[verificar-cpf]', error.message);
      return res.status(500).json({ error: 'Erro ao verificar CPF.' });
    }

    if (existente) {
      return res.status(200).json({
        exists: true,
        aluno: existente,
        message: 'Este CPF já possui um cadastro no sistema.'
      });
    }

    return res.status(200).json({ exists: false });
  } catch (e) {
    console.error('[verificar-cpf]', e);
    return res.status(500).json({ error: 'Erro interno ao verificar CPF.' });
  }
}
