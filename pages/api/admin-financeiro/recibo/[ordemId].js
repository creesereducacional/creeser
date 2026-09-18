import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function getEmpresaData(instituicaoId) {
  try {
    let query = supabase
      .from('configuracoes_empresa')
      .select('nome_empresa, cnpj, razao_social, endereco, cidade, estado, telefone, logo');

    if (instituicaoId === null) {
      query = query.is('instituicao_id', null);
    } else if (instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId);
    }

    const { data } = await query.single();
    if (!data) return {};
    return {
      nomeEmpresa: data.nome_empresa || '',
      cnpj: data.cnpj || '',
      razaoSocial: data.razao_social || '',
      endereco: data.endereco || '',
      cidade: data.cidade || '',
      estado: data.estado || '',
      telefone: data.telefone || '',
      logo: data.logo || '',
    };
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método não permitido' });

  const { ordemId, parcelaId } = req.query;

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
      return;
    }

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

    // ── FASE 6.2.6: Resolver contexto de escopo (Instituição × Unidade) ──────────
    const ctx = await resolveContextoUsuario(req, authUser);

    if (ctx.queryError) {
      console.error('[admin-financeiro/recibo] Falha ao resolver contexto de escopo:', ctx.queryError);
      return res.status(503).json({
        message: 'Serviço temporariamente indisponível para resolução de contexto do usuário',
        error: ctx.queryError.message,
      });
    }

    const instituicaoId = ctx.instituicaoId || (ctx.legacyFallback ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin }) : null);

    if (!isGroupAdmin && !instituicaoId) {
      return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
    }
    // ────────────────────────────────────────────────────────────────────────────

    let ordem = null;
    let parcela = null;

    if (parcelaId) {
      // 1. Buscar a parcela diretamente
      const { data: parcData, error: parcErr } = await supabase
        .from('financeiro_parcelas')
        .select('id, ordem_pagamento_id, valor, valor_pago, data_vencimento, status, boleto_numero, updated_at, metodo_pagamento, detalhes_baixa_multipla, instituicao_id, aluno_id')
        .eq('id', parcelaId)
        .maybeSingle();

      if (parcErr || !parcData) {
        return res.status(404).json({ message: 'Parcela não encontrada' });
      }

      // Validar multi-tenant na parcela
      if (!isGroupAdmin && instituicaoId && parcData.instituicao_id && parcData.instituicao_id !== instituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: a parcela pertence a outra instituição' });
      }

      parcela = parcData;

      // 2. Buscar a ordem correspondente
      let queryOrdem = supabase
        .from('financeiro_ordens_pagamento')
        .select('id, instituicao_id, descricao, referencia, valor_total, aluno_id')
        .eq('id', parcData.ordem_pagamento_id);

      if (!isGroupAdmin) {
        queryOrdem = applyInstituicaoFilter(queryOrdem, instituicaoId);
      }
      const { data: ordData, error: ordErr } = await queryOrdem.single();

      if (ordErr || !ordData) {
        return res.status(404).json({ message: 'Ordem vinculada à parcela não encontrada' });
      }

      if (!isGroupAdmin && instituicaoId && ordData.instituicao_id && ordData.instituicao_id !== instituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: a ordem pertence a outra instituição' });
      }

      ordem = ordData;
    } else {
      // Fluxo com ordemId
      let ordemQuery = supabase
        .from('financeiro_ordens_pagamento')
        .select('id, instituicao_id, descricao, referencia, valor_total, aluno_id, financeiro_parcelas!ordem_pagamento_id(id, numero_parcela, valor, valor_pago, data_vencimento, status, boleto_numero, updated_at, metodo_pagamento, detalhes_baixa_multipla)')
        .eq('id', ordemId);

      if (!isGroupAdmin) {
        ordemQuery = applyInstituicaoFilter(ordemQuery, instituicaoId);
      }
      const { data: ordData, error: ordErr } = await ordemQuery.single();

      if (ordErr || !ordData) return res.status(404).json({ message: 'Ordem não encontrada' });

      if (!isGroupAdmin && instituicaoId && ordData.instituicao_id && ordData.instituicao_id !== instituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: a ordem pertence a outra instituição' });
      }

      ordem = ordData;

      const parcelas = ordem.financeiro_parcelas || [];
      // Ordenação e lógica segura:
      // 1. Filtrar as pagas e ordenar por updated_at descendente (mais recentes primeiro)
      const pagas = parcelas.filter(p => p.status === 'pago').sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      if (pagas.length > 0) {
        parcela = pagas[0];
      } else {
        // 2. Senão, pegar a primeira ordenada por numero_parcela
        const ordenadas = [...parcelas].sort((a, b) => (a.numero_parcela || 0) - (b.numero_parcela || 0));
        parcela = ordenadas[0] || {};
      }
    }

    // ── Buscar aluno vinculado para autorização de escopo e emissão ───────────
    const alunoId = ordem.aluno_id || parcela?.aluno_id || null;
    let aluno = null;

    if (alunoId) {
      const { data: alunoData, error: alunoErr } = await supabase
        .from('alunos')
        .select('id, nome, cpf, turmaid, cursoid, instituicao_id')
        .eq('id', alunoId)
        .maybeSingle();

      if (alunoErr) {
        return res.status(500).json({ message: 'Erro ao validar aluno da ordem: ' + alunoErr.message });
      }

      aluno = alunoData;

      if (aluno) {
        // Validação institucional do aluno
        if (!isGroupAdmin && instituicaoId && aluno.instituicao_id && aluno.instituicao_id !== instituicaoId) {
          return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
        }

        // Validação de escopo de unidade para Filial
        if (ctx.unidadesPermitidas !== null) {
          const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(aluno.id, aluno.turmaid);

          if (!isGroupAdmin && instituicaoId && turmaInstituicaoId && turmaInstituicaoId !== instituicaoId) {
            return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
          }

          if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
            return res.status(403).json({
              message: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
            });
          }
        }
      }
    }

    // ── Buscar turma e curso para compor recibo (após autorização prévia) ──────
    const [{ data: turma }, { data: curso }] = await Promise.all([
      aluno?.turmaid ? supabase.from('turmas').select('nome').eq('id', aluno.turmaid).single() : Promise.resolve({ data: null }),
      aluno?.cursoid ? supabase.from('cursos').select('nome').eq('id', aluno.cursoid).single() : Promise.resolve({ data: null }),
    ]);

    const empresa = await getEmpresaData(ordem?.instituicao_id || instituicaoId || null);

    return res.status(200).json({
      ordem_id: ordem.id,
      descricao: ordem.descricao,
      referencia: ordem.referencia,
      valor: Number(parcela.valor_pago || parcela.valor || ordem.valor_total),
      data_vencimento: parcela.data_vencimento,
      data_pagamento: parcela.updated_at,
      boleto_numero: parcela.boleto_numero,
      metodo_pagamento: parcela.metodo_pagamento,
      detalhes_baixa_multipla: parcela.detalhes_baixa_multipla,
      aluno: { nome: aluno?.nome || '-', cpf: aluno?.cpf || '-' },
      turma: { nome: turma?.nome || '-' },
      curso: { nome: curso?.nome || '-' },
      instituicao: {
        nome: empresa.nomeEmpresa || empresa.nomeempresa || 'Instituição',
        cnpj: empresa.cnpj || '',
        razaoSocial: empresa.razaoSocial || empresa.razaosocial || '',
        endereco: empresa.endereco || '',
        cidade: empresa.cidade || '',
        estado: empresa.estado || '',
        telefone: empresa.telefone || '',
        logo: empresa.logo || '',
      },
    });
  } catch (error) {
    console.error('[recibo]', error);
    return res.status(500).json({ message: error.message });
  }
}

