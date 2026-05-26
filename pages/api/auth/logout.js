import { buildAuthCookie } from '../../../lib/auth-server';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  // Expirar o cookie imediatamente definindo Max-Age=0
  const expiredCookie = buildAuthCookie('', 0);
  res.setHeader('Set-Cookie', expiredCookie);

  return res.status(200).json({ message: 'Logout realizado com sucesso' });
}
