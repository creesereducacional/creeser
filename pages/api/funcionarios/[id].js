import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Funcionário não encontrado' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const { data, error } = await supabase
      .from('funcionarios')
      .update({
        nome:             body.nome,
        email:            body.email            || null,
        cpf:              body.cpf              || null,
        rg:               body.rg               || null,
        funcao:           body.funcao           || null,
        telefone_celular: body.telefoneCelular  || body.telefone_celular || null,
        whatsapp:         body.whatsapp         || null,
        cep:              body.cep              || null,
        endereco:         body.endereco         || null,
        numero:           body.numero           || null,
        cidade:           body.cidade           || null,
        bairro:           body.bairro           || null,
        uf:               body.uf               || null,
        dt_nascimento:    body.dtNascimento     || body.dt_nascimento    || null,
        dt_admissao:      body.dtAdmissao       || body.dt_admissao      || null,
        status:           body.status           || 'ATIVO',
        banco:            body.banco            || null,
        agencia:          body.agencia          || null,
        conta_corrente:   body.contaCorrente    || body.conta_corrente   || null,
        pix:              body.pix              || null,
        obs:              body.obs              || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Funcionário removido com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
