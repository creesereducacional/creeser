import { getAuthUser } from '../../../lib/auth-server';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  return res.status(200).json({ usuario: user });
}
