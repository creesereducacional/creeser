import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
  applyInstituicaoFilter,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'comercial'];

const isComercialPuro = (user) =>
  hasPerfil(user, ['comercial']) && !hasPerfil(user, ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro']);

// ── Função auxiliar: derivar unidade do aluno através de matrículas/turmas ──
async function resolverUnidadeAluno(alunoId, turmaidLegado) {
  let turmaIdResolvida = null;
  const { data: matriculasAluno } = await supabase
    .from('matriculas')
    .select('turma_id, is_principal, instituicao_id')
    .eq('aluno_id', alunoId);

  if (Array.isArray(matriculasAluno) && matriculasAluno.length > 0) {
    const matAlvo = matriculasAluno.find(m => m.is_principal) || matriculasAluno[0];
    turmaIdResolvida = matAlvo?.turma_id || null;
  }

  if (!turmaIdResolvida) {
    turmaIdResolvida = turmaidLegado || null;
  }

  let unidadeIdDoAluno = null;
  let turmaInstituicaoId = null;

  if (turmaIdResolvida) {
    const { data: turmaData } = await supabase
      .from('turmas')
      .select('id, unidadeid, instituicao_id')
      .eq('id', turmaIdResolvida)
      .maybeSingle();

    if (turmaData) {
      unidadeIdDoAluno = turmaData.unidadeid != null ? Number(turmaData.unidadeid) : null;
      turmaInstituicaoId = turmaData.instituicao_id || null;
    }
  }

  return { turmaIdResolvida, unidadeIdDoAluno, turmaInstituicaoId };
}

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 7.1.2: Resolver contexto de escopo (Instituição × Unidade) ──────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[comercial/ordens] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível para resolução de contexto do usuário',
      message: ctx.queryError.message,
    });
  }

  const userInstituicaoId = ctx.instituicaoId || (ctx.legacyFallback ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin }) : null);

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ error: 'Instituição não definida para o usuário atual' });
  }
  // ────────────────────────────────────────────────────────────────────────────

  // ── GET: listar ordens de matrícula ────────────────────────────
  if (req.method === 'GET') {
    const comercial = isComercialPuro(authUser);
    let query = supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id, aluno_id, tipo, descricao, referencia, valor_total,
        quantidade_parcelas, status, criado_por, created_at,
        observacoes,
        alunos(id, nome, cpf, email, telefone_celular, turmaid, captado_por_id, turmas(id, nome, unidadeid)),
        financeiro_parcelas!ordem_pagamento_id(id, numero_parcela, valor, data_vencimento, status)
      `)
      .eq('referencia', 'MATRICULA')
      .order('created_at', { ascending: false });

    if (comercial) {
      // Filtrar somente ordens captadas pelo comercial logado
      const { data: meus, error: meusErr } = await supabase
        .from('alunos')
        .select('id')
        .eq('captado_por_id', authUser.id);
      if (meusErr) return res.status(500).json({ error: meusErr.message });
      const ids = (meus || []).map(a => a.id);
      if (ids.length === 0) return res.status(200).json([]);
      query = query.in('aluno_id', ids);
    }

    if (!isGroupAdmin) {
      query = applyInstituicaoFilter(query, userInstituicaoId);
    }

    const { data: ordensData, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const ordensCarregadas = ordensData || [];

    // Resolução de Matrículas e Unidade em Lote (evita N+1)
    const alunoIdsCarregados = Array.from(
      new Set(ordensCarregadas.map(o => o.aluno_id).filter(Boolean))
    );

    const alunoUnidadeMap = new Map();

    if (ctx.unidadesPermitidas !== null && alunoIdsCarregados.length > 0) {
      const { data: matriculasData, error: matriculasError } = await supabase
        .from('matriculas')
        .select(`
          id,
          aluno_id,
          turma_id,
          is_principal,
          turmas(id, unidadeid)
        `)
        .in('aluno_id', alunoIdsCarregados);

      if (matriculasError) {
        console.error('Aviso ao consultar matriculas para ordens comerciais:', matriculasError);
      } else if (matriculasData) {
        const matriculasOrdenadas = [...matriculasData].sort((a, b) => {
          if (a.is_principal && !b.is_principal) return -1;
          if (!a.is_principal && b.is_principal) return 1;
          return 0;
        });

        for (const m of matriculasOrdenadas) {
          if (!alunoUnidadeMap.has(m.aluno_id)) {
            const uid = m.turmas?.unidadeid != null ? Number(m.turmas.unidadeid) : null;
            if (uid !== null) {
              alunoUnidadeMap.set(m.aluno_id, uid);
            }
          }
        }
      }
    }

    // Filtrar ordens por escopo de unidade (para Usuário Filial)
    const ordensFiltradas = ordensCarregadas.filter(o => {
      // Matriz / Grupo Admin tem acesso a todas as unidades da instituição
      if (ctx.unidadesPermitidas === null) {
        return true;
      }

      if (!o.aluno_id) {
        return true;
      }

      // 1. Tentar obter unidade mapeada via matrículas
      let unidadeId = alunoUnidadeMap.get(o.aluno_id) ?? null;

      // 2. Fallback legado: alunos.turmas.unidadeid ou alunos.turmaid
      if (unidadeId === null && o.alunos?.turmas?.unidadeid != null) {
        unidadeId = Number(o.alunos.turmas.unidadeid);
      }

      // Se o aluno não possui unidade identificável, preservar no escopo institucional
      if (unidadeId === null) {
        return true;
      }

      return ctx.unidadesPermitidas.includes(unidadeId);
    });

    const resultado = ordensFiltradas.map(o => ({
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
    } = req.body || {};

    if (!aluno_id || !valor_total || valor_total <= 0) {
      return res.status(400).json({ error: 'aluno_id e valor_total são obrigatórios' });
    }

    // 1. Buscar e validar o aluno no banco
    const { data: aluno, error: alunoErr } = await supabase
      .from('alunos')
      .select('id, nome, cpf, instituicao_id, turmaid, captado_por_id, email, telefone_celular')
      .eq('id', aluno_id)
      .maybeSingle();

    if (alunoErr || !aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    // Validação institucional do aluno
    if (!isGroupAdmin && aluno.instituicao_id && userInstituicaoId && aluno.instituicao_id !== userInstituicaoId) {
      return res.status(403).json({ error: 'Acesso negado: o aluno pertence a outra instituição.' });
    }

    // Comercial puro só pode gerar cobrança de alunos que captou
    if (isComercialPuro(authUser) && aluno.captado_por_id !== authUser.id) {
      return res.status(403).json({ error: 'Acesso negado: aluno não captado por você' });
    }

    // 2. Validação de Escopo de Unidade para Filial (ANTES de qualquer escrita)
    let instituicaoFinal = userInstituicaoId || aluno.instituicao_id;

    if (ctx.unidadesPermitidas !== null) {
      const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(aluno.id, aluno.turmaid);

      if (!isGroupAdmin && turmaInstituicaoId && userInstituicaoId && turmaInstituicaoId !== userInstituicaoId) {
        return res.status(403).json({ error: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
      }

      if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
        return res.status(403).json({
          error: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
        });
      }

      if (turmaInstituicaoId) {
        instituicaoFinal = turmaInstituicaoId;
      }
    }

    // 3. Criar ordem financeira
    const { data: ordem, error: ordemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .insert({
        instituicao_id: instituicaoFinal,
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

    // 4. Criar parcela(s)
    const qtd = Number(quantidade_parcelas) || 1;
    const valorParcela = Number((valor_total / qtd).toFixed(2));
    const venc = data_vencimento ? new Date(data_vencimento) : new Date();
    if (!data_vencimento) venc.setDate(venc.getDate() + 5); // padrão: 5 dias

    const parcelas = Array.from({ length: qtd }, (_, i) => {
      const d = new Date(venc);
      d.setMonth(d.getMonth() + i);
      return {
        instituicao_id: instituicaoFinal,
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

