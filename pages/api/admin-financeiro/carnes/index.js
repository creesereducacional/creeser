import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

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

    // Buscar apenas carnês (tipo = 'carne')
    let query = supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id,
        aluno_id,
        tipo,
        descricao,
        referencia,
        valor_total,
        percentual_desconto,
        valor_desconto,
        quantidade_parcelas,
        status,
        efi_carnet_id,
        efi_status,
        criado_por,
        created_at,
        updated_at,
        alunos(nome, cpf, email, turmaid, cursoid, ano_letivo)
      `)
      .eq('tipo', 'carne')
      .order('created_at', { ascending: false });

    query = applyInstituicaoFilter(query, instituicaoId);

    const { data: carnes, error: carnesError } = await query;

    if (carnesError) throw carnesError;

    // Buscar parcelas para cada carnê
    const carnesComParcelas = [];
    for (const carne of (carnes || [])) {
      const { data: parcelas, error: parcelasError } = await supabase
        .from('financeiro_parcelas')
        .select('id, numero_parcela, valor, data_vencimento, status, boleto_numero, boleto_url, efi_charge_id, metodo_pagamento, baixado_em, observacao_baixa')
        .eq('ordem_pagamento_id', carne.id)
        .order('numero_parcela', { ascending: true });

      if (!parcelasError) {
        carnesComParcelas.push({
          ...carne,
          aluno_nome: carne.alunos?.nome || 'N/A',
          aluno_cpf: carne.alunos?.cpf || 'N/A',
          aluno_email: carne.alunos?.email || 'N/A',
          aluno_turma_id: carne.alunos?.turmaid || null,
          aluno_curso_id: carne.alunos?.cursoid || null,
          aluno_ano_letivo: carne.alunos?.ano_letivo || null,
          parcelas: parcelas || []
        });
      }
    }

    return res.status(200).json({
      carnes: carnesComParcelas,
      total: carnesComParcelas.length
    });
  } catch (error) {
    console.error('Erro ao listar carnês:', error);
    return res.status(500).json({
      message: 'Erro ao listar carnês',
      error: error.message
    });
  }
}
