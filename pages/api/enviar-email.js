import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';
import { enviarEmailPersonalizado } from '../../lib/emailService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

  if (req.method === 'GET') {
    let query = supabase.from('emails_enviados').select('*').order('created_at', { ascending: false }).limit(100);
    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { destinatarios, assunto, mensagem, tipoDestinatarios } = req.body;

    if (!assunto || !mensagem) {
      return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios' });
    }

    // Buscar alunos do Supabase
    let alunosQuery = supabase.from('alunos').select('email, nome_completo, nome, status, ativo');
    alunosQuery = applyInstituicaoFilter(alunosQuery, resolveInstituicaoId(req, authUser));
    const { data: alunos = [] } = await alunosQuery;

    const getNome = (a) => a.nome_completo || a.nome || 'Aluno';

    let listaDestinatarios = [];
    switch (tipoDestinatarios) {
      case 'todos':
        listaDestinatarios = alunos.filter(a => a.status === 'aprovado' && a.ativo).map(a => ({ email: a.email, nome: getNome(a) }));
        break;
      case 'ativos':
        listaDestinatarios = alunos.filter(a => a.status === 'aprovado' && a.ativo === true).map(a => ({ email: a.email, nome: getNome(a) }));
        break;
      case 'inativos':
        listaDestinatarios = alunos.filter(a => a.status === 'aprovado' && a.ativo === false).map(a => ({ email: a.email, nome: getNome(a) }));
        break;
      case 'selecionados':
        listaDestinatarios = (destinatarios || []).map(email => {
          const aluno = alunos.find(a => a.email === email);
          return { email, nome: aluno ? getNome(aluno) : 'Aluno' };
        });
        break;
      default:
        return res.status(400).json({ error: 'Tipo de destinatários inválido' });
    }

    if (listaDestinatarios.length === 0) {
      return res.status(400).json({ error: 'Nenhum destinatário encontrado' });
    }

    const instIdEnvio = resolveInstituicaoId(req, authUser);
    const resultados = { total: listaDestinatarios.length, sucesso: 0, falhas: 0, erros: [] };

    for (const dest of listaDestinatarios) {
      try {
        await enviarEmailPersonalizado(dest.email, dest.nome, assunto, mensagem);
        await supabase.from('emails_enviados').insert({
          instituicao_id: instIdEnvio || null,
          destinatario: dest.email,
          assunto,
          corpo: mensagem,
          status: 'ENVIADO',
        });
        resultados.sucesso++;
      } catch (err) {
        resultados.falhas++;
        resultados.erros.push({ email: dest.email, erro: err.message });
        await supabase.from('emails_enviados').insert({
          instituicao_id: instIdEnvio || null,
          destinatario: dest.email,
          assunto,
          corpo: mensagem,
          status: 'FALHA',
          erro: err.message,
        });
      }
    }

    return res.status(200).json({ success: true, resultados });
  }

  if (req.method === 'DELETE') {
    let query = supabase.from('emails_enviados').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (instituicaoId) query = supabase.from('emails_enviados').delete().eq('instituicao_id', instituicaoId);
    const { error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Histórico limpo' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
