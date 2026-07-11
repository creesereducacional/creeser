import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin', 'coordenador', 'secretaria'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const isWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin && !isWrite });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
  }

  // Normalização do perfil do operador logado
  const rawP = String(authUser.perfil || authUser.tipo || '').toLowerCase();
  const mapearPerfil = (p) => {
    if (p === 'admin') return 'instituicao_admin';
    if (p === 'financeiro_admin') return 'financeiro';
    if (p === 'comercial_master') return 'comercial';
    return p;
  };
  const operadorPerfil = mapearPerfil(rawP);

  // Helper para validar se o operador logado pode gerenciar/atribuir o perfil solicitado
  const validarPerfilAlvo = (perfilAlvo) => {
    const alvo = mapearPerfil(String(perfilAlvo || '').toLowerCase());
    
    if (operadorPerfil === 'grupo_admin') {
      return true;
    }
    if (operadorPerfil === 'instituicao_admin') {
      // instituicao_admin pode criar todos exceto grupo_admin e instituicao_admin
      return alvo !== 'grupo_admin' && alvo !== 'instituicao_admin';
    }
    if (operadorPerfil === 'coordenador') {
      // coordenador pode criar apenas professor e aluno
      return alvo === 'professor' || alvo === 'aluno';
    }
    if (operadorPerfil === 'secretaria') {
      // secretaria pode criar apenas aluno
      return alvo === 'aluno';
    }
    return false;
  };

  if (req.method === 'GET') {
    const { tipo } = req.query;
    let query = supabase.from('usuarios').select('*').order('nomecompleto');
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
    const { nomeCompleto, email, senha, cpf, dataNascimento, whatsapp, tipo, perfil, status } = body;
    if (!nomeCompleto || !email || !senha || !tipo) {
      return res.status(400).json({ error: 'Nome, email, senha e tipo são obrigatórios' });
    }
    const perfilResolvido = perfil || (tipo === 'admin' ? 'instituicao_admin' : tipo);

    // Validação de coerência entre Tipo e Perfil
    if (tipo === 'aluno' && perfilResolvido !== 'aluno') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo aluno exige Perfil aluno.' });
    }
    if (tipo === 'professor' && perfilResolvido !== 'professor') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo professor exige Perfil professor.' });
    }
    if (tipo === 'funcionario' && (perfilResolvido === 'aluno' || perfilResolvido === 'professor')) {
      return res.status(400).json({ error: 'Coerência inválida: Tipo funcionário não pode receber Perfil aluno ou professor.' });
    }

    // Validar se o operador logado pode atribuir o perfil de destino
    if (!validarPerfilAlvo(perfilResolvido)) {
      return res.status(403).json({ error: 'Acesso negado: Perfil de acesso não permitido para o seu cargo.' });
    }

    const { data, error } = await supabase.from('usuarios').insert({
      nomecompleto:    nomeCompleto,
      email,
      senha,
      cpf:             cpf || null,
      datanascimento:  dataNascimento || null,
      whatsapp:        whatsapp || null,
      tipo,
      perfil:          perfilResolvido,
      instituicao_id:  instId || null,
      status:          status || 'ativo',
    }).select('id, nomecompleto, email, cpf, tipo, perfil, status, instituicao_id').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'CPF ou email já cadastrado' });
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ message: 'Usuário criado com sucesso', usuario: data });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const body = req.body || {};

    // 1. Impedir autoelevação de perfil e autodesativação/inativação
    if (String(id) === String(authUser.id)) {
      if (body.perfil && body.perfil !== authUser.perfil) {
        return res.status(403).json({ error: 'Acesso negado: você não pode alterar seu próprio perfil.' });
      }
      if (body.tipo && body.tipo !== authUser.tipo) {
        return res.status(403).json({ error: 'Acesso negado: você não pode alterar seu próprio tipo.' });
      }
      if (body.status && body.status === 'inativo') {
        return res.status(403).json({ error: 'Acesso negado: você não pode desativar sua própria conta.' });
      }
    }

    // Carregar o registro existente para validar que o operador não está alterando um usuário de perfil superior
    const { data: originalUser, error: checkError } = await supabase
      .from('usuarios')
      .select('perfil, tipo')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !originalUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const originalPerfil = originalUser.perfil || originalUser.tipo;
    if (!validarPerfilAlvo(originalPerfil)) {
      return res.status(403).json({ error: 'Acesso negado: Você não possui privilégios para alterar este usuário.' });
    }

    // Se estiver atualizando tipo e/ou perfil, validar a coerência combinatória
    const tipoAlvo = body.tipo || originalUser.tipo;
    const perfilAlvo = body.perfil || originalUser.perfil;

    if (tipoAlvo === 'aluno' && perfilAlvo !== 'aluno') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo aluno exige Perfil aluno.' });
    }
    if (tipoAlvo === 'professor' && perfilAlvo !== 'professor') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo professor exige Perfil professor.' });
    }
    if (tipoAlvo === 'funcionario' && (perfilAlvo === 'aluno' || perfilAlvo === 'professor')) {
      return res.status(400).json({ error: 'Coerência inválida: Tipo funcionário não pode receber Perfil aluno ou professor.' });
    }

    // Se estiver atualizando o perfil, validar se o operador possui permissão
    if (body.perfil && !validarPerfilAlvo(body.perfil)) {
      return res.status(403).json({ error: 'Acesso negado: Perfil de acesso não permitido para o seu cargo.' });
    }

    const updates = {};
    if (body.nomeCompleto)   updates.nomecompleto    = body.nomeCompleto;
    if (body.email)          updates.email           = body.email;
    if (body.cpf)            updates.cpf             = body.cpf;
    if (body.dataNascimento) updates.datanascimento  = body.dataNascimento;
    if (body.whatsapp)       updates.whatsapp        = body.whatsapp;
    if (body.tipo)           updates.tipo            = body.tipo;
    if (body.perfil)         updates.perfil          = body.perfil;
    if (body.status)         updates.status          = body.status;
    const { data, error } = await supabase.from('usuarios').update(updates).eq('id', id).select('id, nomecompleto, email, cpf, tipo, perfil, status').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Usuário atualizado com sucesso', usuario: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    // 2. Impedir autoexclusão
    if (String(id) === String(authUser.id)) {
      return res.status(403).json({ error: 'Acesso negado: você não pode excluir a sua própria conta.' });
    }

    const { data: originalUser, error: checkError } = await supabase
      .from('usuarios')
      .select('perfil, tipo')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !originalUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const originalPerfil = originalUser.perfil || originalUser.tipo;
    if (!validarPerfilAlvo(originalPerfil)) {
      return res.status(403).json({ error: 'Acesso negado: Você não possui privilégios para excluir este usuário.' });
    }

    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Usuário deletado com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}

