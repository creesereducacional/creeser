import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
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

    // ── FASE 6.2.3: Resolver contexto de escopo (Instituição × Unidade) ──────────
    const ctx = await resolveContextoUsuario(req, authUser);

    if (ctx.queryError) {
      console.error('[admin-financeiro/ordens] Falha ao resolver contexto de escopo:', ctx.queryError);
      return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
    }

    const instituicaoId = ctx.legacyFallback
      ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
      : ctx.instituicaoId;

    if (!isGroupAdmin && !instituicaoId) {
      return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
    }
    // ────────────────────────────────────────────────────────────────────────────

    // Buscar apenas ordens simples (tipo = 'ordem_simples')
    let query = supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id,
        aluno_id,
        instituicao_id,
        tipo,
        descricao,
        referencia,
        valor_total,
        percentual_desconto,
        valor_desconto,
        quantidade_parcelas,
        status,
        efi_charge_id,
        criado_por,
        created_at,
        updated_at,
        alunos(id, nome, cpf, email, turmaid, cursoid, ano_letivo, turmas(id, nome, unidadeid)),
        financeiro_parcelas!ordem_pagamento_id(id, numero_parcela, valor, data_vencimento, status, boleto_numero, boleto_url, efi_charge_id)
      `)
      .eq('tipo', 'ordem_simples')
      .order('created_at', { ascending: false });

    if (!isGroupAdmin) {
      query = applyInstituicaoFilter(query, instituicaoId);
    } else if (req.query.instituicao_id) {
      query = query.eq('instituicao_id', req.query.instituicao_id);
    }

    const { data: ordensData, error: ordensError } = await query;

    if (ordensError) throw ordensError;

    const ordensCarregadas = ordensData || [];

    // ── Resolução de Matrículas e Unidade em Lote (evita N+1 queries) ───────────
    const alunoIdsCarregados = Array.from(
      new Set(ordensCarregadas.map(o => o.aluno_id).filter(Boolean))
    );

    let matriculasPorAluno = {};
    if (alunoIdsCarregados.length > 0) {
      const { data: matriculasData } = await supabase
        .from('matriculas')
        .select(`
          id,
          aluno_id,
          turma_id,
          is_principal,
          turmas (
            id,
            nome,
            unidadeid
          )
        `)
        .in('aluno_id', alunoIdsCarregados);

      if (Array.isArray(matriculasData)) {
        matriculasData.forEach(mat => {
          if (!matriculasPorAluno[mat.aluno_id]) {
            matriculasPorAluno[mat.aluno_id] = [];
          }
          matriculasPorAluno[mat.aluno_id].push(mat);
        });
      }
    }

    // Filtrar ordens por escopo de unidade (para Usuário Filial)
    const ordensFiltradas = ordensCarregadas.filter(o => {
      // Se for Matriz ou Grupo Admin ou Legado irrestrito (ctx.unidadesPermitidas === null)
      if (ctx.unidadesPermitidas === null) {
        return true;
      }

      // Descobrir unidade pela matrícula prioritária ou primeira matrícula
      const mats = matriculasPorAluno[o.aluno_id] || [];
      let matAlvo = mats.find(m => m.is_principal) || mats[0] || null;

      let unidadeIdDoAluno = null;
      if (matAlvo?.turmas) {
        unidadeIdDoAluno = matAlvo.turmas.unidadeid != null ? Number(matAlvo.turmas.unidadeid) : null;
      }

      // Fallback para alunos.turmaid (legado)
      if (unidadeIdDoAluno === null && o.alunos?.turmas) {
        unidadeIdDoAluno = o.alunos.turmas.unidadeid != null ? Number(o.alunos.turmas.unidadeid) : null;
      }

      // Se possui unidade resolvida, deve pertencer a unidadesPermitidas
      if (unidadeIdDoAluno !== null) {
        return ctx.unidadesPermitidas.includes(unidadeIdDoAluno);
      }

      // Se não possui nenhuma unidade associada, permitir (dados legados incompletos)
      return true;
    });

    // Normalizar resposta
    const ordensNormalizadas = ordensFiltradas.map(o => {
      const parcela = (o.financeiro_parcelas || [])[0] || {};
      return {
        ...o,
        aluno_nome: o.alunos?.nome || 'N/A',
        aluno_cpf: o.alunos?.cpf || 'N/A',
        aluno_email: o.alunos?.email || 'N/A',
        aluno_turma_id: o.alunos?.turmaid || null,
        aluno_curso_id: o.alunos?.cursoid || null,
        aluno_ano_letivo: o.alunos?.ano_letivo || null,
        data_vencimento: parcela.data_vencimento || null,
        status_parcela: parcela.status || o.status,
        cobranca: parcela.boleto_numero || parcela.efi_charge_id || o.efi_charge_id || '-',
        parcela_id: parcela.id || null,
        boleto_url: parcela.boleto_url || null,
        parcela_efi_charge_id: parcela.efi_charge_id || null
      };
    });

    return res.status(200).json({
      ordens: ordensNormalizadas,
      total: ordensNormalizadas.length
    });
  } catch (error) {
    console.error('Erro ao listar ordens:', error);
    return res.status(500).json({
      message: 'Erro ao listar ordens',
      error: error.message
    });
  }
}
