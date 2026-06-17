import { createClient } from '@supabase/supabase-js';
import { applyInstituicaoFilter, hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

    if (!isGroupAdmin && !instituicaoId) {
      return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
    }

    let ordem = null;
    let parcela = null;

    if (parcelaId) {
      // 1. Buscar a parcela diretamente
      const { data: parcData, error: parcErr } = await supabase
        .from('financeiro_parcelas')
        .select('id, ordem_pagamento_id, valor, valor_pago, data_vencimento, status, boleto_numero, updated_at, metodo_pagamento, detalhes_baixa_multipla, instituicao_id')
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

      queryOrdem = applyInstituicaoFilter(queryOrdem, instituicaoId);
      const { data: ordData, error: ordErr } = await queryOrdem.single();

      if (ordErr || !ordData) {
        return res.status(404).json({ message: 'Ordem vinculada à parcela não encontrada' });
      }
      ordem = ordData;

    } else {
      // Fluxo antigo com ordemId
      let ordemQuery = supabase
        .from('financeiro_ordens_pagamento')
        .select('id, instituicao_id, descricao, referencia, valor_total, aluno_id, financeiro_parcelas(id, numero_parcela, valor, valor_pago, data_vencimento, status, boleto_numero, updated_at, metodo_pagamento, detalhes_baixa_multipla)')
        .eq('id', ordemId);

      ordemQuery = applyInstituicaoFilter(ordemQuery, instituicaoId);
      const { data: ordData, error: ordErr } = await ordemQuery.single();

      if (ordErr || !ordData) return res.status(404).json({ message: 'Ordem não encontrada' });
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

    const { data: aluno } = await supabase
      .from('alunos')
      .select('nome, cpf, turmaid, cursoid')
      .eq('id', ordem.aluno_id)
      .single();

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
