import { createClient } from '@supabase/supabase-js';
import { applyInstituicaoFilter, hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Buscar aluno específico
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

      let query = supabase
        .from('alunos')
        .select(
          `id,
          nome,
          cpf,
          email,
          turmaid,
          cursoid,
          statusmatricula,
          valor_matricula,
          valor_mensalidade,
          percentual_desconto,
          qtd_parcelas,
          dia_pagamento,
          telefone_celular,
          endereco`
        )
        .eq('id', Number(id));

      query = applyInstituicaoFilter(query, instituicaoId);

      const { data, error } = await query.single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao buscar aluno:', error);
      return res.status(500).json({ message: 'Erro ao buscar aluno' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
