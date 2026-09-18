import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

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

    // ── FASE 6.2.5: Resolver contexto de escopo (Instituição × Unidade) ──────────
    const ctx = await resolveContextoUsuario(req, authUser);

    if (ctx.queryError) {
      console.error('[admin-financeiro/dashboard] Falha ao resolver contexto de escopo:', ctx.queryError);
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

    // 1. Buscar todas as parcelas da instituição (tabela base de métricas de recebimento e pendência)
    let parcelasQuery = supabase
      .from('financeiro_parcelas')
      .select('id, aluno_id, ordem_pagamento_id, valor, status, data_vencimento');

    if (!isGroupAdmin) {
      parcelasQuery = applyInstituicaoFilter(parcelasQuery, instituicaoId);
    }
    const { data: todasParcelas, error: parcelasErr } = await parcelasQuery;
    if (parcelasErr) throw parcelasErr;

    // 2. Buscar ordens de pagamento da instituição (ordem_simples e carne)
    let ordensQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('id, aluno_id, tipo, status, valor_total');

    if (!isGroupAdmin) {
      ordensQuery = applyInstituicaoFilter(ordensQuery, instituicaoId);
    }
    const { data: todasOrdens, error: ordensErr } = await ordensQuery;
    if (ordensErr) throw ordensErr;

    // 3. Mapear unidade por aluno para usuários de Filial
    const unidadesPermitidasSet = ctx.unidadesPermitidas
      ? new Set(ctx.unidadesPermitidas.map(String))
      : null;

    let alunoUnidadeMap = new Map();
    let alunoDadosMap = new Map();

    // Coletar todos os aluno_ids presentes nas parcelas e ordens carregadas
    const todosAlunoIds = Array.from(
      new Set([
        ...(todasParcelas || []).map(p => p.aluno_id),
        ...(todasOrdens || []).map(o => o.aluno_id),
      ].filter(Boolean))
    );

    if (todosAlunoIds.length > 0) {
      // Buscar dados cadastrais dos alunos envolvidos
      const { data: alunosData } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          matricula,
          turmaid,
          cursos(nome),
          turmas(id, nome, unidadeid)
        `)
        .in('id', todosAlunoIds);

      if (alunosData) {
        alunosData.forEach(a => alunoDadosMap.set(a.id, a));
      }

      // Se for usuário de filial, buscar matrículas para mapear unidade precisa
      if (unidadesPermitidasSet) {
        const { data: matriculasData } = await supabase
          .from('matriculas')
          .select(`
            id,
            aluno_id,
            turma_id,
            is_principal,
            turmas(id, unidadeid)
          `)
          .in('aluno_id', todosAlunoIds);

        if (matriculasData) {
          const matsSorted = [...matriculasData].sort((a, b) => {
            if (a.is_principal && !b.is_principal) return -1;
            if (!a.is_principal && b.is_principal) return 1;
            return 0;
          });

          for (const m of matsSorted) {
            if (!alunoUnidadeMap.has(m.aluno_id)) {
              const uid = m.turmas?.unidadeid != null ? String(m.turmas.unidadeid) : null;
              if (uid) alunoUnidadeMap.set(m.aluno_id, uid);
            }
          }
        }
      }
    }

    // Função de verificação de pertinência ao escopo de filial
    const alunoPertenceAoEscopo = (alunoId) => {
      if (!unidadesPermitidasSet) return true; // Matriz ou Grupo Admin
      if (!alunoId) return true; // Preserva registros legados sem aluno

      let uid = alunoUnidadeMap.get(alunoId);
      if (!uid) {
        const aluno = alunoDadosMap.get(alunoId);
        if (aluno?.turmas?.unidadeid != null) {
          uid = String(aluno.turmas.unidadeid);
        }
      }

      if (!uid) return true; // Preserva registros legados sem unidade definida
      return unidadesPermitidasSet.has(uid);
    };

    // 4. Filtrar parcelas pelo escopo do usuário
    const parcelasFiltradas = (todasParcelas || []).filter(p => alunoPertenceAoEscopo(p.aluno_id));

    // 5. Filtrar ordens pelo escopo do usuário
    const ordensFiltradas = (todasOrdens || []).filter(o => alunoPertenceAoEscopo(o.aluno_id));

    // ── Métricas de Parcelas e Recebimento ──────────────────────────────────────
    const hojeStr = new Date().toISOString().split('T')[0];

    // Parcelas pendentes
    const parcelasPendentes = parcelasFiltradas.filter(p => p.status === 'pendente');
    const alunosComPendencias = new Set(parcelasPendentes.map(p => p.aluno_id).filter(Boolean)).size;
    const totalReceber = parcelasPendentes.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

    // Boletos vencidos (pendente e vencimento < hoje)
    const parcelasVencidas = parcelasPendentes.filter(p => p.data_vencimento && p.data_vencimento < hojeStr);
    const qtdBoletosVencidos = parcelasVencidas.length;
    const valorVencido = parcelasVencidas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

    // Parcelas pagas
    const parcelasPagas = parcelasFiltradas.filter(p => p.status === 'pago');
    const totalRecebido = parcelasPagas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

    // Total gerado (todas as parcelas no escopo)
    const totalGerado = parcelasFiltradas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const taxaRecebimento = totalGerado > 0 ? ((totalRecebido / totalGerado) * 100).toFixed(1) : 0;

    // ── Métricas de Ordens e Carnês ───────────────────────────────────────────
    const ordensSimples = ordensFiltradas.filter(o => o.tipo === 'ordem_simples');
    const carnes = ordensFiltradas.filter(o => o.tipo === 'carne');

    const totalOrdens = ordensSimples.length;
    const valorTotalOrdens = ordensSimples.reduce((acc, o) => acc + (Number(o.valor_total) || 0), 0);

    const totalCarnes = carnes.length;
    const valorTotalCarnes = carnes.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0);

    // ── Carnês a Vencer (carnês ativos com exatamente 1 parcela restante) ──────
    const carnesAtivos = carnes.filter(c => c.status === 'ativo');
    const parcelasPorOrdem = new Map();
    for (const p of parcelasFiltradas) {
      if (p.ordem_pagamento_id) {
        if (!parcelasPorOrdem.has(p.ordem_pagamento_id)) {
          parcelasPorOrdem.set(p.ordem_pagamento_id, []);
        }
        parcelasPorOrdem.get(p.ordem_pagamento_id).push(p);
      }
    }

    const carnesAVencerList = [];
    for (const c of carnesAtivos) {
      const parcs = parcelasPorOrdem.get(c.id) || [];
      const restantes = parcs.filter(p => p.status !== 'pago' && p.status !== 'cancelado');
      if (restantes.length === 1) {
        const unica = restantes[0];
        const aluno = alunoDadosMap.get(c.aluno_id);
        carnesAVencerList.push({
          carne_id: c.id,
          aluno_id: c.aluno_id,
          aluno_nome: aluno?.nome || 'Sem nome',
          aluno_matricula: aluno?.matricula || '',
          curso: aluno?.cursos?.nome || '',
          turma: aluno?.turmas?.nome || '',
          valor_restante: Number(unica.valor) || 0,
          data_vencimento: unica.data_vencimento,
        });
      }
    }

    // ── Alunos em Atraso (detalhamento de inadimplentes) ───────────────────────
    const parcelasAtrasadas = parcelasFiltradas.filter(p => {
      return p.status === 'vencido' || (p.status === 'pendente' && p.data_vencimento && p.data_vencimento < hojeStr);
    });

    const inadimplentesMap = {};
    for (const p of parcelasAtrasadas) {
      if (!p.aluno_id) continue;
      const aluno = alunoDadosMap.get(p.aluno_id);
      if (!aluno) continue;

      if (!inadimplentesMap[aluno.id]) {
        inadimplentesMap[aluno.id] = {
          aluno_id: aluno.id,
          nome: aluno.nome,
          matricula: aluno.matricula || '',
          curso: aluno.cursos?.nome || '',
          turma: aluno.turmas?.nome || '',
          valor_em_atraso: 0,
          qtd_parcelas_atrasadas: 0,
        };
      }
      inadimplentesMap[aluno.id].valor_em_atraso += Number(p.valor) || 0;
      inadimplentesMap[aluno.id].qtd_parcelas_atrasadas += 1;
    }

    const inadimplentesList = Object.values(inadimplentesMap).sort((a, b) => b.valor_em_atraso - a.valor_em_atraso);

    // ── Montar resposta mantendo estritamente o contrato atual ────────────────
    const dados = {
      // EDUCACIONAL
      totalAlunosComPendencias: alunosComPendencias,
      totalAlunosAtivos: 0, // TODO: contar alunos com statusmatricula = ATIVO
      
      // FINANCEIRO
      totalAReceber: totalReceber,
      boletosVencidos: qtdBoletosVencidos,
      valorVencido: valorVencido,
      
      // ORDENS E CARNÊS
      totalOrdens: totalOrdens,
      valorTotalOrdens: valorTotalOrdens,
      totalCarnes: totalCarnes,
      valorTotalCarnes: valorTotalCarnes,
      
      // RECEBIMENTO
      totalRecebido: totalRecebido,
      taxaRecebimento: parseFloat(taxaRecebimento),
      totalGerado: totalGerado,
      
      // NOVAS MÉTRICAS FASE 2A
      carnesAVencerCount: carnesAVencerList.length,
      carnesAVencerList: carnesAVencerList,
      alunosEmAtrasoList: inadimplentesList,
      
      // COMPATIBILIDADE COM INTERFACE ANTERIOR
      faturasPendentes: alunosComPendencias,
      receita30dias: totalReceber,
      mrr: totalReceber,
      arpu: alunosComPendencias > 0 ? (totalReceber / alunosComPendencias).toFixed(2) : 0,
    };

    return res.status(200).json(withLowercaseKeys(dados));
  } catch (error) {
    console.error('Erro ao calcular dashboard:', error);
    return res.status(500).json({ 
      message: 'Erro ao calcular dashboard',
      error: error.message,
    });
  }
}

