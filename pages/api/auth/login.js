export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, senha } = req.body;

  // Validação básica
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  // Dados de usuários padrão (em produção seria do Supabase)
  const usuarios = [
    { 
      id: 1, 
      nome: 'Admin Sistema', 
      email: 'admin@creeser.com', 
      senha: 'admin123', 
      tipo: 'admin' 
    },
    { 
      id: 2, 
      nome: 'João Silva', 
      email: 'professor@creeser.com', 
      senha: 'prof123', 
      tipo: 'professor' 
    },
    { 
      id: 3, 
      nome: 'Maria Santos', 
      email: 'aluno@creeser.com', 
      senha: 'aluno123', 
      tipo: 'aluno' 
    }
  ];

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  }

  const token = Buffer.from(JSON.stringify({ 
    id: usuario.id, 
    email: usuario.email, 
    tipo: usuario.tipo 
  })).toString('base64');

  return res.status(200).json({
    message: 'Login realizado com sucesso',
    token,
    usuario: { 
      id: usuario.id, 
      nome: usuario.nome, 
      email: usuario.email, 
      tipo: usuario.tipo 
    }
  });
}
