import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Configuração do banco de dados ausente' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
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
    let query = supabase.from('usuarios').select('*');
    query = applyInstituicaoFilter(query, instituicaoId);
    if (tipo) query = query.eq('tipo', tipo);

    const { data, error } = await query;
    if (error) {
      console.error('[GET /api/usuarios] Erro na consulta:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar usuarios no banco' });
    }

    const lista = Array.isArray(data) ? data : [];
    // Ordenar em memória para garantir compatibilidade com nome / nomecompleto
    lista.sort((a, b) => {
      const nA = String(a.nomecompleto || a.nome || a.email || '').toLowerCase();
      const nB = String(b.nomecompleto || b.nome || b.email || '').toLowerCase();
      return nA.localeCompare(nB);
    });

    // Omitir campo senha da resposta
    return res.status(200).json(lista.map(u => { const { senha, ...rest } = u; return rest; }));
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

    let insertData = {
      email,
      senha,
      cpf:             cpf || null,
      datanascimento:  dataNascimento || null,
      whatsapp:        whatsapp || null,
      tipo,
      perfil:          perfilResolvido,
      instituicao_id:  instId || null,
      status:          status || 'ativo',
    };

    // Tentar inserir primeiro com nomecompleto
    let resInsert = await supabase.from('usuarios').insert({
      ...insertData,
      nomecompleto: nomeCompleto
    }).select('*').single();

    // Se houver erro de coluna inexistente (ex: nomecompleto vs nome), tenta com campo nome
    if (resInsert.error && resInsert.error.message && resInsert.error.message.includes('nomecompleto')) {
      resInsert = await supabase.from('usuarios').insert({
        ...insertData,
        nome: nomeCompleto
      }).select('*').single();
    }

    const { data, error } = resInsert;

    if (error) {
      console.error('[POST /api/usuarios] Erro na inserção:', error);
      if (error.code === '23505') return res.status(409).json({ error: 'CPF ou email já cadastrado' });
      return res.status(500).json({ error: error.message || 'Erro ao criar usuário' });
    }
    const { senha: _, ...userNoSenha } = data || {};
    return res.status(201).json({ message: 'Usuário criado com sucesso', usuario: userNoSenha });
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

    let resUpdate = await supabase.from('usuarios').update(updates).eq('id', id).select('*').single();
    if (resUpdate.error && resUpdate.error.message && resUpdate.error.message.includes('nomecompleto')) {
      if (updates.nomecompleto) {
        delete updates.nomecompleto;
        updates.nome = body.nomeCompleto;
      }
      resUpdate = await supabase.from('usuarios').update(updates).eq('id', id).select('*').single();
    }
    const { data, error } = resUpdate;
    if (error) return res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });
    const { senha: _, ...userNoSenha } = data || {};
    return res.status(200).json({ message: 'Usuário atualizado com sucesso', usuario: userNoSenha });
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

