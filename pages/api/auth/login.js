import { supabaseAdmin } from '../../../lib/supabase';
import { buildAuthCookie, sanitizeUserForToken, signAuthToken } from '../../../lib/auth-server';

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

  const { email, senha, instituicaoId, instituicao_id } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
  }

  const emailNormalizado = String(email || '').trim().toLowerCase();

  // Buscar usuário no Supabase
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Serviço indisponível' });
  }

  const { data: usuario, error: dbError } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .ilike('email', emailNormalizado)
    .single();

  if (dbError || !usuario) {
    return res.status(401).json({ error: 'Email ou senha invalidos' });
  }

  // Verificar senha — campo `senha` em texto plano (sistema legado)
  if (String(usuario.senha) !== String(senha)) {
    return res.status(401).json({ error: 'Email ou senha invalidos' });
  }

  const statusNormalizado = String(usuario.status || 'ativo').toLowerCase();
  if (statusNormalizado === 'inativo' || statusNormalizado === 'bloqueado' || statusNormalizado === 'suspenso') {
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

  return res.status(200).json({
    message: 'Login realizado com sucesso',
    usuario: tokenPayload,
  });
}
