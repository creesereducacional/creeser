import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('funcionarios').select('*').order('nome');
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const { data, error } = await supabase.from('funcionarios').insert({
      nome:            body.nome,
      email:           body.email           || null,
      cpf:             body.cpf             || null,
      rg:              body.rg              || null,
      funcao:          body.funcao          || null,
      telefone_celular: body.telefoneCelular || body.telefone_celular || null,
      whatsapp:        body.whatsapp        || null,
      cep:             body.cep             || null,
      endereco:        body.endereco        || null,
      numero:          body.numero          || null,
      cidade:          body.cidade          || null,
      bairro:          body.bairro          || null,
      uf:              body.uf              || null,
      dt_nascimento:   body.dtNascimento    || body.dt_nascimento    || null,
      dt_admissao:     body.dtAdmissao      || body.dt_admissao      || null,
      status:          body.status          || 'ATIVO',
      banco:           body.banco           || null,
      agencia:         body.agencia         || null,
      conta_corrente:  body.contaCorrente   || body.conta_corrente   || null,
      pix:             body.pix             || null,
      obs:             body.obs             || null,
      instituicao_id:  instId               || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
