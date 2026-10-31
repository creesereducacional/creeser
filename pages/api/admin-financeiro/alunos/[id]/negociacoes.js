// pages/api/admin-financeiro/alunos/[id]/negociacoes.js
// GET — Obter Histórico Estruturado de Negociações/Acordos do Aluno
// Retorna a lista de negociações consolidadas com snapshots das parcelas originais,
// parcelas geradas, vínculos bancários EFI e trilha de eventos cronológicos.

import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // Contexto de escopo
  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'ID do aluno é obrigatório' });
  }

  try {
    // 1. Validar aluno
    let alunoQuery = supabase
      .from('alunos')
      .select('id, nome, cpf, instituicao_id')
      .eq('id', Number(id));

    if (!isGroupAdmin && userInstituicaoId) {
      alunoQuery = applyInstituicaoFilter(alunoQuery, userInstituicaoId);
    }

    const { data: aluno, error: alunoErr } = await alunoQuery.maybeSingle();
    if (alunoErr || !aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado ou acesso não permitido.' });
    }

    // 2. Buscar negociações estruturadas na tabela dedicada
    let negociacoes = [];
    try {
      let query = supabase
        .from('financeiro_negociacoes')
        .select('*')
        .eq('aluno_id', aluno.id)
        .order('created_at', { ascending: false });

      if (!isGroupAdmin && userInstituicaoId) {
        query = applyInstituicaoFilter(query, userInstituicaoId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        negociacoes = data;
      }
    } catch (_) {}

    // 3. Fallback: Se a migration ainda não foi aplicada e não há registros em financeiro_negociacoes,
    // extrai acordos diretamente de financeiro_ordens_pagamento (tipo = 'acordo')
    if (negociacoes.length === 0) {
      let ordensQuery = supabase
        .from('financeiro_ordens_pagamento')
        .select(`
          id,
          descricao,
          referencia,
          valor_total,
          valor_desconto,
          quantidade_parcelas,
          status,
          observacoes,
          parcelas_origem_acordo,
          entrada_parcela_id,
          criado_por,
          created_at,
          financeiro_parcelas!ordem_pagamento_id (
            id,
            numero_parcela,
            valor,
            valor_pago,
            data_vencimento,
            data_pagamento,
            status,
            metodo_pagamento,
            boleto_numero,
            efi_charge_id
          )
        `)
        .eq('aluno_id', aluno.id)
        .eq('tipo', 'acordo')
        .order('created_at', { ascending: false });

      if (!isGroupAdmin && userInstituicaoId) {
        ordensQuery = applyInstituicaoFilter(ordensQuery, userInstituicaoId);
      }

      const { data: ordensAcordo } = await ordensQuery;

      if (Array.isArray(ordensAcordo)) {
        negociacoes = ordensAcordo.map(o => {
          const parcelas = o.financeiro_parcelas || [];
          const entradaParc = parcelas.find(p => p.id === o.entrada_parcela_id || p.numero_parcela === 1);
          const possuiEntrada = Boolean(entradaParc);
          const entradaPaga = entradaParc?.status === 'pago';

          return {
            id: o.id,
            ordem_id: o.id,
            aluno_id: aluno.id,
            valor_total_negociado: Number(o.valor_total) || 0,
            valor_desconto: Number(o.valor_desconto) || 0,
            possui_entrada: possuiEntrada,
            valor_entrada: entradaParc ? Number(entradaParc.valor) : 0,
            tipo_entrada: entradaParc?.metodo_pagamento === 'dinheiro' ? 'especie' : (possuiEntrada ? 'efi' : 'sem_entrada'),
            entrada_paga: entradaPaga,
            status: entradaPaga || !possuiEntrada ? 'concluido' : 'pendente_entrada',
            observacao_operador: o.observacoes || o.descricao || '',
            operador_email: o.criado_por || 'financeiro',
            parcelas_originais: o.parcelas_origem_acordo || [],
            parcelas_geradas: parcelas.map(p => ({
              id: p.id,
              numero_parcela: p.numero_parcela,
              valor: p.valor,
              data_vencimento: p.data_vencimento,
              status: p.status,
              eh_entrada: p.id === o.entrada_parcela_id || p.numero_parcela === 1
            })),
            eventos_historico: [
              {
                tipo: 'criacao_acordo',
                timestamp: o.created_at,
                operador: o.criado_por || 'financeiro',
                detalhes: { valor_total: o.valor_total, status: o.status }
              }
            ],
            created_at: o.created_at
          };
        });
      }
    }

    // 4. Enriquecer negociações com parcelas em tempo real da tabela financeiro_parcelas
    const ordensIds = negociacoes.map(n => n.ordem_id).filter(Boolean);
    let parcelasReaisPorOrdem = {};

    if (ordensIds.length > 0) {
      const { data: todasParcelas } = await supabase
        .from('financeiro_parcelas')
        .select(`
          id,
          ordem_pagamento_id,
          numero_parcela,
          valor,
          valor_nominal,
          valor_pago,
          data_vencimento,
          data_pagamento,
          status,
          metodo_pagamento,
          boleto_numero,
          boleto_url,
          boleto_barcode,
          efi_charge_id,
          observacoes,
          observacao_baixa
        `)
        .in('ordem_pagamento_id', ordensIds)
        .order('numero_parcela', { ascending: true });

      if (Array.isArray(todasParcelas)) {
        todasParcelas.forEach(p => {
          if (!parcelasReaisPorOrdem[p.ordem_pagamento_id]) {
            parcelasReaisPorOrdem[p.ordem_pagamento_id] = [];
          }
          parcelasReaisPorOrdem[p.ordem_pagamento_id].push(p);
        });
      }
    }

    const negociacoesEnriquecidas = negociacoes.map(neg => {
      const parcelasReais = parcelasReaisPorOrdem[neg.ordem_id] || [];
      
      // Avaliar pendências de cancelamento bancário nas parcelas originais
      const syncList = Array.isArray(neg.sincronizacao_efi) ? neg.sincronizacao_efi : [];
      const falhasEfi = syncList.filter(s => s.status === 'falha_cancelamento_efi' || s.sucesso === false);
      const temCancelamentoPendente = falhasEfi.length > 0;
      const motivoBloqueioDuplicidade = temCancelamentoPendente
        ? `Existem ${falhasEfi.length} cobrança(s) original(is) com falha de cancelamento na EFI Bank. Emissão de novas cobranças suspensa para evitar duplicidade de boletos contra o aluno.`
        : null;

      // Montar parcelas geradas atualizadas em tempo real
      const parcelasGeradas = parcelasReais.map(p => {
        const ehEntrada = p.id === neg.entrada_parcela_id || p.numero_parcela === 1;
        const isPago = p.status === 'pago';
        const isCancelado = p.status === 'cancelado';
        const temCobrancaEfi = Boolean(p.efi_charge_id);

        let situacaoCobranca = 'pendente_emissao';
        if (isPago) {
          situacaoCobranca = (ehEntrada && p.metodo_pagamento === 'dinheiro') ? 'entrada_paga_especie' : 'paga';
        } else if (isCancelado) {
          situacaoCobranca = 'cancelada';
        } else if (temCobrancaEfi) {
          situacaoCobranca = 'cobranca_emitida';
        }

        return {
          id: p.id,
          ordem_id: neg.ordem_id,
          numero_parcela: p.numero_parcela,
          valor: Number(p.valor || 0),
          valor_pago: p.valor_pago ? Number(p.valor_pago) : null,
          data_vencimento: p.data_vencimento,
          data_pagamento: p.data_pagamento,
          status: p.status,
          metodo_pagamento: p.metodo_pagamento,
          eh_entrada: ehEntrada,
          efi_charge_id: p.efi_charge_id,
          boleto_url: p.boleto_url,
          boleto_barcode: p.boleto_barcode,
          boleto_numero: p.boleto_numero,
          observacoes: p.observacoes,
          situacao_cobranca: situacaoCobranca,
          pode_emitir: !isPago && !isCancelado && !temCobrancaEfi && !temCancelamentoPendente,
          pode_visualizar: Boolean(p.boleto_url),
          pode_consultar: temCobrancaEfi,
          tem_comprovante: isPago,
          motivo_bloqueio: (!temCobrancaEfi && !isPago && temCancelamentoPendente) ? motivoBloqueioDuplicidade : null
        };
      });

      // Status detalhado da negociação
      const todasPagas = parcelasGeradas.length > 0 && parcelasGeradas.every(p => p.status === 'pago');
      const algumaEmitida = parcelasGeradas.some(p => p.efi_charge_id);
      
      let statusDetalhado = 'aguardando_emissao';
      if (temCancelamentoPendente) {
        statusDetalhado = 'cancelamento_efi_pendente';
      } else if (todasPagas) {
        statusDetalhado = 'acordo_quitado';
      } else if (algumaEmitida) {
        statusDetalhado = 'cobrancas_emitidas';
      }

      return {
        ...neg,
        parcelas_geradas: parcelasGeradas,
        tem_cancelamento_pendente: temCancelamentoPendente,
        bloqueio_duplicidade: temCancelamentoPendente,
        motivo_bloqueio: motivoBloqueioDuplicidade,
        status_detalhado: statusDetalhado,
        total_parcelas_saldo: parcelasGeradas.filter(p => !p.eh_entrada).length,
        parcelas_saldo_emitidas: parcelasGeradas.filter(p => !p.eh_entrada && p.efi_charge_id).length,
        parcelas_saldo_pagas: parcelasGeradas.filter(p => !p.eh_entrada && p.status === 'pago').length
      };
    });

    return res.status(200).json({
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf
      },
      negociacoes: negociacoesEnriquecidas
    });
  } catch (err) {
    console.error('[aluno/negociacoes] Erro:', err);
    return res.status(500).json({ message: 'Erro ao carregar histórico de negociações', erro: err.message });
  }
}
