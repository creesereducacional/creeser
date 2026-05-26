import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial'];

const isComercialPuro = (user) =>
  hasPerfil(user, ['comercial']) && !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro']);

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  // ── GET: listar ordens de matrícula ────────────────────────────
  if (req.method === 'GET') {
    const comercial = isComercialPuro(authUser);
    let query = supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id, aluno_id, tipo, descricao, referencia, valor_total,
        quantidade_parcelas, status, criado_por, created_at,
        observacoes,
        alunos(nome, cpf, email, telefone_celular, captado_por_id),
        financeiro_parcelas(id, numero_parcela, valor, data_vencimento, status)
      `)
      .eq('referencia', 'MATRICULA')
      .order('created_at', { ascending: false });

    if (comercial) {
      // Filtrar somente ordens captadas pelo comercial logado
      // via JOIN com alunos.captado_por_id
      const { data: meus, error: meusErr } = await supabase
        .from('alunos')
        .select('id')
        .eq('captado_por_id', authUser.id);
      if (meusErr) return res.status(500).json({ error: meusErr.message });
      const ids = (meus || []).map(a => a.id);
      if (ids.length === 0) return res.status(200).json([]);
      query = query.in('aluno_id', ids);
    }

    const instituicaoId = resolveInstituicaoId(req, authUser);
    if (instituicaoId) query = query.eq('instituicao_id', instituicaoId);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const resultado = (data || []).map(o => ({
      ...o,
      aluno_nome: o.alunos?.nome || '—',
      aluno_cpf: o.alunos?.cpf || '—',
      aluno_email: o.alunos?.email || '—',
      aluno_telefone: o.alunos?.telefone_celular || '—',
      parcela: (o.financeiro_parcelas || [])[0] || null,
    }));

    return res.status(200).json(resultado);
  }

  // ── POST: criar ordem de matrícula ─────────────────────────────
  if (req.method === 'POST') {
    const {
      aluno_id,
      valor_total,
      quantidade_parcelas = 1,
      data_vencimento,
      descricao,
      curso_nome,
    } = req.body;

    if (!aluno_id || !valor_total || valor_total <= 0) {
      return res.status(400).json({ error: 'aluno_id e valor_total são obrigatórios' });
    }

    // Buscar aluno
    const { data: aluno, error: alunoErr } = await supabase
      .from('alunos')
      .select('id, nome, instituicao_id, captado_por_id, email, telefone_celular')
      .eq('id', aluno_id)
      .single();

    if (alunoErr || !aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    // Comercial puro só pode gerar cobrança de alunos que captou
    if (isComercialPuro(authUser) && aluno.captado_por_id !== authUser.id) {
      return res.status(403).json({ error: 'Acesso negado: aluno não captado por você' });
    }

    const instituicaoId = aluno.instituicao_id || resolveInstituicaoId(req, authUser);

    // Criar ordem
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .insert({
        instituicao_id: instituicaoId,
        aluno_id,
        tipo: 'ordem_simples',
        descricao: descricao || `Matrícula${curso_nome ? ` — ${curso_nome}` : ''}`,
        referencia: 'MATRICULA',
        valor_total: Number(valor_total),
        percentual_desconto: 0,
        valor_desconto: 0,
        quantidade_parcelas: Number(quantidade_parcelas),
        observacoes: JSON.stringify({
          origem: 'comercial',
          captado_por_id: authUser.id,
          captado_por_email: authUser.email || '',
        }),
        status: 'ativo',
        criado_por: authUser.email || authUser.id || 'comercial',
      })
      .select()
      .single();

    if (ordemErr) return res.status(500).json({ error: ordemErr.message });

    // Criar parcela(s)
    const qtd = Number(quantidade_parcelas) || 1;
    const valorParcela = Number((valor_total / qtd).toFixed(2));
    const venc = data_vencimento ? new Date(data_vencimento) : new Date();
    if (!data_vencimento) venc.setDate(venc.getDate() + 5); // padrão: 5 dias

    const parcelas = Array.from({ length: qtd }, (_, i) => {
      const d = new Date(venc);
      d.setMonth(d.getMonth() + i);
      return {
        instituicao_id: instituicaoId,
        ordem_pagamento_id: ordem.id,
        aluno_id,
        numero_parcela: i + 1,
        valor: valorParcela,
        data_vencimento: d.toISOString().split('T')[0],
        status: 'pendente',
      };
    });

    const { data: parcelasData, error: parcelasErr } = await supabase
      .from('financeiro_parcelas')
      .insert(parcelas)
      .select();

    if (parcelasErr) return res.status(500).json({ error: parcelasErr.message });

    // Gerar link WhatsApp
    const telefone = (aluno.telefone_celular || '').replace(/\D/g, '');
    const mensagemWA = encodeURIComponent(
      `Olá, ${aluno.nome}. Sua pré-matrícula${curso_nome ? ` no ${curso_nome}` : ''} foi registrada pelo Inove Técnico. ` +
      `Para confirmar sua matrícula, realize o pagamento conforme instrução da instituição. ` +
      `Qualquer dúvida, entre em contato conosco.`
    );
    const whatsappLink = telefone
      ? `https://wa.me/55${telefone}?text=${mensagemWA}`
      : null;

    return res.status(201).json({
      ordem,
      parcelas: parcelasData,
      whatsapp_link: whatsappLink,
      mensagem: 'Ordem de matrícula gerada com sucesso.',
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
