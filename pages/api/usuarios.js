import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const isWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin && !isWrite });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
  }

  if (req.method === 'GET') {
    const { tipo } = req.query;
    let query = supabase.from('usuarios').select('*').order('nome_completo');
    query = applyInstituicaoFilter(query, instituicaoId);
    if (tipo) query = query.eq('tipo', tipo);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    // Omitir campo senha da resposta
    return res.status(200).json(data.map(u => { const { senha, ...rest } = u; return rest; }));
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const { nomeCompleto, email, senha, cpf, dataNascimento, whatsapp, tipo, perfil } = body;
    if (!nomeCompleto || !email || !senha || !cpf || !dataNascimento || !whatsapp || !tipo) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    const { data, error } = await supabase.from('usuarios').insert({
      nome_completo:   nomeCompleto,
      email,
      senha,
      cpf,
      data_nascimento: dataNascimento,
      whatsapp,
      tipo,
      perfil:          perfil || (tipo === 'admin' ? 'instituicao_admin' : tipo),
      instituicao_id:  instId || null,
      status:          'ativo',
    }).select('id, nome_completo, email, cpf, tipo, perfil, status, instituicao_id').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'CPF ou email já cadastrado' });
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ message: 'Usuário criado com sucesso', usuario: data });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const body = req.body || {};
    const updates = {};
    if (body.nomeCompleto)   updates.nome_completo   = body.nomeCompleto;
    if (body.email)          updates.email           = body.email;
    if (body.cpf)            updates.cpf             = body.cpf;
    if (body.dataNascimento) updates.data_nascimento = body.dataNascimento;
    if (body.whatsapp)       updates.whatsapp        = body.whatsapp;
    if (body.tipo)           updates.tipo            = body.tipo;
    if (body.perfil)         updates.perfil          = body.perfil;
    if (body.status)         updates.status          = body.status;
    const { data, error } = await supabase.from('usuarios').update(updates).eq('id', id).select('id, nome_completo, email, cpf, tipo, perfil, status').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Usuário atualizado com sucesso', usuario: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Usuário deletado com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}

