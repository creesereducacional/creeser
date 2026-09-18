import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveContextoUsuario,
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
    const ctx = await resolveContextoUsuario(req, authUser);

    if (ctx.queryError) {
      return res.status(503).json({
        message: 'Serviço temporariamente indisponível para resolução de contexto do usuário',
        error: ctx.queryError.message,
      });
    }

    const instituicaoId = ctx.instituicaoId || (ctx.legacyFallback ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin }) : null);

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
        alunos(
          id,
          nome,
          cpf,
          email,
          turmaid,
          cursoid,
          ano_letivo,
          turmas(id, nome, unidadeid)
        )
      `)
      .eq('tipo', 'carne')
      .order('created_at', { ascending: false });

    if (!isGroupAdmin) {
      query = applyInstituicaoFilter(query, instituicaoId);
    }

    const { data: carnes, error: carnesError } = await query;

    if (carnesError) throw carnesError;

    if (!carnes || carnes.length === 0) {
      return res.status(200).json({
        carnes: [],
        total: 0,
      });
    }

    // Obter IDs únicos de alunos para resolução em lote de matrículas e turmas
    const alunoIds = Array.from(
      new Set(carnes.map(c => c.aluno_id).filter(Boolean))
    );

    // Mapeamento aluno_id -> unidade_id via matrícula ou fallback alunos.turmaid
    const alunoUnidadeMap = new Map();

    if (alunoIds.length > 0) {
      const { data: matriculasData, error: matriculasError } = await supabase
        .from('matriculas')
        .select(`
          id,
          aluno_id,
          is_principal,
          turma_id,
          turmas(id, unidadeid)
        `)
        .in('aluno_id', alunoIds);

      if (matriculasError) {
        console.error('Aviso ao consultar matriculas para carnes:', matriculasError);
      } else if (matriculasData) {
        // Priorizar matricula marcada como is_principal
        const matriculasOrdenadas = [...matriculasData].sort((a, b) => {
          if (a.is_principal && !b.is_principal) return -1;
          if (!a.is_principal && b.is_principal) return 1;
          return 0;
        });

        for (const m of matriculasOrdenadas) {
          if (!alunoUnidadeMap.has(m.aluno_id)) {
            const uid = m.turmas?.unidadeid ? String(m.turmas.unidadeid) : null;
            if (uid) {
              alunoUnidadeMap.set(m.aluno_id, uid);
            }
          }
        }
      }
    }

    // Filtrar carnês pelo escopo de unidades se usuário filial
    const unidadesPermitidasSet = ctx.unidadesPermitidas
      ? new Set(ctx.unidadesPermitidas.map(String))
      : null;

    const carnesFiltrados = carnes.filter((carne) => {
      // Se Matriz (ou grupo_admin sem restrição), tem acesso a todas as unidades da instituição
      if (!unidadesPermitidasSet) {
        return true;
      }

      // Resolver unidade do aluno do carnê
      const alunoId = carne.aluno_id;
      let unidadeId = alunoId ? alunoUnidadeMap.get(alunoId) : null;

      // Fallback para alunos.turmaid / alunos.turmas.unidadeid
      if (!unidadeId && carne.alunos?.turmas?.unidadeid) {
        unidadeId = String(carne.alunos.turmas.unidadeid);
      }

      // Preservar registros legados sem unidade para não perder dados históricos
      if (!unidadeId) {
        return true;
      }

      return unidadesPermitidasSet.has(unidadeId);
    });

    if (carnesFiltrados.length === 0) {
      return res.status(200).json({
        carnes: [],
        total: 0,
      });
    }

    // Buscar parcelas de todos os carnês filtrados em lote (evitando N+1)
    const carneIdsFiltrados = carnesFiltrados.map((c) => c.id);
    const { data: todasParcelas, error: parcelasError } = await supabase
      .from('financeiro_parcelas')
      .select('id, ordem_pagamento_id, numero_parcela, valor, data_vencimento, status, boleto_numero, boleto_url, efi_charge_id, metodo_pagamento, baixado_em, observacao_baixa')
      .in('ordem_pagamento_id', carneIdsFiltrados)
      .order('numero_parcela', { ascending: true });

    if (parcelasError) {
      throw parcelasError;
    }

    // Agrupar parcelas por ordem_pagamento_id
    const parcelasPorOrdem = new Map();
    for (const p of (todasParcelas || [])) {
      if (!parcelasPorOrdem.has(p.ordem_pagamento_id)) {
        parcelasPorOrdem.set(p.ordem_pagamento_id, []);
      }
      parcelasPorOrdem.get(p.ordem_pagamento_id).push(p);
    }

    // Montar resposta preservando estrutura original
    const carnesComParcelas = carnesFiltrados.map((carne) => ({
      ...carne,
      aluno_nome: carne.alunos?.nome || 'N/A',
      aluno_cpf: carne.alunos?.cpf || 'N/A',
      aluno_email: carne.alunos?.email || 'N/A',
      aluno_turma_id: carne.alunos?.turmaid || null,
      aluno_curso_id: carne.alunos?.cursoid || null,
      aluno_ano_letivo: carne.alunos?.ano_letivo || null,
      parcelas: parcelasPorOrdem.get(carne.id) || [],
    }));

    return res.status(200).json({
      carnes: carnesComParcelas,
      total: carnesComParcelas.length,
    });
  } catch (error) {
    console.error('Erro ao listar carnês:', error);
    return res.status(500).json({
      message: 'Erro ao listar carnês',
      error: error.message,
    });
  }
}
