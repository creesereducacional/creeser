import { supabaseAdmin } from '../../../lib/supabase';
import { buildAuthCookie, sanitizeUserForToken, signAuthToken } from '../../../lib/auth-server';
import { rateLimit, getClientIp } from '../../../lib/rate-limit';
import { writeAuditLog } from '../../../lib/audit-log';

const resolveInstituicao = async (usuario, requestInstituicaoId) => {
  const userInstituicao = usuario?.instituicao_id || usuario?.instituicaoId || null;
  const fallbackId = process.env.DEFAULT_INSTITUICAO_ID || null;
  let instituicaoId = requestInstituicaoId || userInstituicao || fallbackId;
  let tipoInstituicao = usuario?.tipo_instituicao || usuario?.tipoInstituicao || null;

  if (!supabaseAdmin) {
    return { instituicaoId, tipoInstituicao };
  }

  if (instituicaoId) {
    const { data, error } = await supabaseAdmin
      .from('instituicoes')
      .select('id,tipo_instituicao')
      .eq('id', instituicaoId)
      .single();

    if (!error && data) {
      return {
        instituicaoId: data.id,
        tipoInstituicao: tipoInstituicao || data.tipo_instituicao || null,
      };
    }
  }

  const { data } = await supabaseAdmin
    .from('instituicoes')
    .select('id,tipo_instituicao,ativa')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data) {
    instituicaoId = data.id;
    tipoInstituicao = tipoInstituicao || data.tipo_instituicao || null;
  }

  return { instituicaoId, tipoInstituicao };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  // ── Rate limit: 10 tentativas por IP a cada 15 minutos ──────────────────
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `login:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Muitas tentativas de login. Aguarde ${rl.retryAfter} segundo(s) e tente novamente.`,
    });
  }

  const { email, senha, instituicaoId, instituicao_id } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
  }

  const emailNormalizado = String(email || '').trim().toLowerCase();

  // Buscar usuário no Supabase
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Serviço indisponível' });
  }

  // ── Credencial Mestre de Emergência / Recuperação de Acesso ───────────────
  const eMaster = emailNormalizado === 'admin@creeser.com.br' || emailNormalizado === 'admin@creeser.com';
  if (eMaster && String(senha) === 'admin123') {
    // Buscar usuário mestre no banco ou criar objeto sintético com privilégios grupo_admin
    const { data: usuarioDb } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .ilike('email', emailNormalizado)
      .maybeSingle();

    // Se existir no banco, sincroniza a senha no registro
    if (usuarioDb) {
      if (usuarioDb.senha !== 'admin123' || usuarioDb.status !== 'ativo') {
        await supabaseAdmin
          .from('usuarios')
          .update({ senha: 'admin123', status: 'ativo', perfil: 'grupo_admin' })
          .eq('id', usuarioDb.id);
      }
    } else {
      // Se não existir na tabela usuarios, cria a conta administrador máster
      await supabaseAdmin.from('usuarios').insert([{
        nome: 'Administrador CREESER',
        email: emailNormalizado,
        senha: 'admin123',
        perfil: 'grupo_admin',
        tipo: 'admin',
        status: 'ativo'
      }]);
    }

    const { data: usuarioFinal } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .ilike('email', emailNormalizado)
      .maybeSingle();

    const masterUser = usuarioFinal || {
      id: usuarioDb?.id || 1,
      nome: usuarioDb?.nome || 'Administrador CREESER',
      email: emailNormalizado,
      perfil: 'grupo_admin',
      tipo: 'admin',
      status: 'ativo'
    };

    const requestedInstId = instituicaoId || instituicao_id || null;
    const { instituicaoId: resInstId, tipoInstituicao: resTipoInst } = await resolveInstituicao(
      masterUser,
      requestedInstId
    );

    const tokenPayload = sanitizeUserForToken({
      ...masterUser,
      perfil: 'grupo_admin',
      instituicao_id: resInstId,
      tipo_instituicao: resTipoInst,
    });

    const token = signAuthToken(tokenPayload);
    res.setHeader('Set-Cookie', buildAuthCookie(token));

    writeAuditLog({
      usuario_id: tokenPayload.id,
      usuario_email: tokenPayload.email,
      perfil: tokenPayload.perfil,
      acao: 'LOGIN_MESTRE_RECUPERACAO',
      modulo: 'auth',
      ip,
      instituicao_id: resInstId,
    });

    return res.status(200).json({
      message: 'Login realizado com sucesso (Recuperação Mestre)',
      usuario: tokenPayload,
    });
  }

  const { data: usuario, error: dbError } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .ilike('email', emailNormalizado)
    .single();

  if (dbError || !usuario) {
    writeAuditLog({ acao: 'LOGIN_FALHA', modulo: 'auth', ip, detalhes: { email: emailNormalizado, motivo: 'usuario_nao_encontrado' } });
    return res.status(401).json({ error: 'Email ou senha invalidos' });
  }

  // Verificar senha — campo `senha` em texto plano (sistema legado)
  if (String(usuario.senha) !== String(senha)) {
    writeAuditLog({ usuario_id: usuario.id, usuario_email: emailNormalizado, acao: 'LOGIN_FALHA', modulo: 'auth', ip, detalhes: { motivo: 'senha_incorreta' } });
    return res.status(401).json({ error: 'Email ou senha invalidos' });
  }

  const statusNormalizado = String(usuario.status || 'ativo').toLowerCase();
  if (statusNormalizado === 'inativo' || statusNormalizado === 'bloqueado' || statusNormalizado === 'suspenso') {
    writeAuditLog({ usuario_id: usuario.id, usuario_email: emailNormalizado, acao: 'LOGIN_BLOQUEADO', modulo: 'auth', ip, detalhes: { status: statusNormalizado } });
    return res.status(403).json({ error: 'Conta inativa ou bloqueada' });
  }

  const requestedInstituicaoId = instituicaoId || instituicao_id || null;
  const perfil = usuario.perfil || (usuario.tipo === 'admin' ? 'instituicao_admin' : usuario.tipo);
  const isGroupAdmin = perfil === 'grupo_admin';

  const { instituicaoId: resolvedInstituicaoId, tipoInstituicao } = await resolveInstituicao(
    usuario,
    requestedInstituicaoId
  );

  if (!isGroupAdmin && !resolvedInstituicaoId) {
    return res.status(400).json({ error: 'Instituicao nao definida para o usuario' });
  }

  const tokenPayload = sanitizeUserForToken({
    ...usuario,
    perfil,
    instituicao_id: resolvedInstituicaoId,
    tipo_instituicao: tipoInstituicao,
  });

  const token = signAuthToken(tokenPayload);
  res.setHeader('Set-Cookie', buildAuthCookie(token));

  // Auditoria de login bem-sucedido
  writeAuditLog({
    usuario_id: tokenPayload.id,
    usuario_email: tokenPayload.email,
    perfil: tokenPayload.perfil,
    acao: 'LOGIN',
    modulo: 'auth',
    ip,
    instituicao_id: resolvedInstituicaoId,
  });

  return res.status(200).json({
    message: 'Login realizado com sucesso',
    usuario: tokenPayload,
  });
}
