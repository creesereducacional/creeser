import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const { email, senhaAtual, novaSenha } = req.body || {};

  if (!email || !senhaAtual || !novaSenha) {
    return res.status(400).json({ message: 'Dados incompletos' });
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, senha')
    .ilike('email', email.trim())
    .single();

  if (error || !usuario) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  if (String(usuario.senha) !== String(senhaAtual)) {
    return res.status(401).json({ message: 'Senha atual incorreta' });
  }

  const { error: updateError } = await supabase
    .from('usuarios')
    .update({ senha: novaSenha })
    .eq('id', usuario.id);

  if (updateError) return res.status(500).json({ message: updateError.message });

  return res.status(200).json({ message: 'Senha alterada com sucesso' });
}
