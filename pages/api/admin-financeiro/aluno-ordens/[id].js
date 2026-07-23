import { createClient } from '@supabase/supabase-js';
import { applyInstituicaoFilter, hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { id } = req.query;

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

    if (instituicaoId) {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('id,instituicao_id')
        .eq('id', id)
        .maybeSingle();

      if (aluno?.instituicao_id && aluno.instituicao_id !== instituicaoId) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
    }

    const [{ data: ordens, error }, { data: carnesData, error: carnesError }] = await Promise.all([
      (async () => {
        let query = supabase
          .from('financeiro_ordens_pagamento')
          .select(`
            id,
            tipo,
            descricao,
            referencia,
            valor_total,
            percentual_desconto,
            valor_desconto,
            quantidade_parcelas,
            status,
            efi_charge_id,
            observacoes,
            created_at,
            updated_at,
            financeiro_parcelas(id, numero_parcela, valor, data_vencimento, status, boleto_numero, boleto_url, efi_charge_id)
          `)
          .eq('aluno_id', id)
          .eq('tipo', 'ordem_simples')
          .order('created_at', { ascending: false });

        query = applyInstituicaoFilter(query, instituicaoId);
        return query;
      })(),
      (async () => {
        let query = supabase
          .from('financeiro_ordens_pagamento')
          .select(`
            id,
            descricao,
            referencia,
            valor_total,
            quantidade_parcelas,
            status,
            efi_carnet_id,
            created_at,
            financeiro_parcelas(id, numero_parcela, valor, data_vencimento, status, boleto_numero, boleto_url, efi_charge_id)
          `)
          .eq('aluno_id', id)
          .eq('tipo', 'carne')
          .order('created_at', { ascending: false });

        query = applyInstituicaoFilter(query, instituicaoId);
        return query;
      })(),
    ]);

    if (error) throw error;
    if (carnesError) throw carnesError;

    const resultado = (ordens || []).map(o => {
      const parcela = (o.financeiro_parcelas || [])[0] || {};
      return {
        ...o,
        data_vencimento: parcela.data_vencimento || null,
        status_parcela: parcela.status || o.status,
        cobranca: parcela.boleto_numero || parcela.efi_charge_id || o.efi_charge_id || null,
        parcela_id: parcela.id || null,
        boleto_url: parcela.boleto_url || null,
        observacoes: o.observacoes || null,
        updated_at: o.updated_at || null,
      };
    });

    const carnes = (carnesData || []).map(c => {
      const parcelas = (c.financeiro_parcelas || []).sort((a, b) => a.numero_parcela - b.numero_parcela);
      const { financeiro_parcelas: _, ...carne } = c;
      return {
        ...carne,
        parcelas,
        parcelas_total: parcelas.length || c.quantidade_parcelas,
        parcelas_pagas: parcelas.filter(p => p.status === 'pago').length,
        parcelas_canceladas: parcelas.filter(p => p.status === 'cancelado').length,
      };
    });

    return res.status(200).json({ ordens: resultado, carnes });
  } catch (error) {
    console.error('Erro ao buscar ordens do aluno:', error?.message || error, error?.details || error?.hint || '');
    return res.status(500).json({ message: 'Erro ao buscar ordens', error: error?.message || String(error) });
  }
}
