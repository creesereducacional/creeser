// pages/api/admin-financeiro/acordos/create.js
// POST — Criar Acordo Financeiro renegociando débitos em aberto

import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoFinal = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  if (!isGroupAdmin && !instituicaoFinal) {
    return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
  }

  try {
    const {
      aluno_id,
      descricao,
      parcelas_originais,
      valor_entrada,
      data_vencimento_entrada,
      quantidade_parcelas,
      dia_vencimento_parcelas,
    } = req.body || {};

    // ── Validações básicas ────────────────────────────────────────────────────
    if (!aluno_id) return res.status(400).json({ message: 'aluno_id é obrigatório.' });
    if (!descricao || !descricao.trim()) return res.status(400).json({ message: 'Descrição do acordo é obrigatória.' });
    if (!Array.isArray(parcelas_originais) || parcelas_originais.length === 0) {
      return res.status(400).json({ message: 'Selecione ao menos uma parcela original.' });
    }

    const entradaNum = Number(valor_entrada) || 0;
    if (entradaNum <= 0) {
      return res.status(400).json({ message: 'Valor de entrada deve ser maior que zero.' });
    }

    if (!data_vencimento_entrada) {
      return res.status(400).json({ message: 'Data de vencimento da entrada é obrigatória.' });
    }

    const qtdParcelasNum = Math.floor(Number(quantidade_parcelas)) || 0;
    if (qtdParcelasNum <= 0) {
      return res.status(400).json({ message: 'Quantidade de parcelas deve ser maior que zero.' });
    }

    const diaVencNum = Math.floor(Number(dia_vencimento_parcelas)) || 10;
    if (diaVencNum < 1 || diaVencNum > 31) {
      return res.status(400).json({ message: 'Dia de vencimento das parcelas deve ser entre 1 e 31.' });
    }

    // ── Carregar aluno ────────────────────────────────────────────────────────
    let alunoQuery = supabase
      .from('alunos')
      .select('id, nome, cpf, instituicao_id')
      .eq('id', Number(aluno_id));
    alunoQuery = applyInstituicaoFilter(alunoQuery, instituicaoFinal);
    const { data: aluno } = await alunoQuery.maybeSingle();

    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    // ── Carregar e validar parcelas originais ──────────────────────────────────
    let parcelasQuery = supabase
      .from('financeiro_parcelas')
      .select('id, status, valor, numero_parcela, data_vencimento')
      .eq('aluno_id', aluno.id)
      .in('id', parcelas_originais);
    const { data: parcelasOriginais, error: findParcelasErr } = await parcelasQuery;

    if (findParcelasErr || !parcelasOriginais || parcelasOriginais.length !== parcelas_originais.length) {
      return res.status(422).json({ message: 'Uma ou mais parcelas originais não foram encontradas no cadastro deste aluno.' });
    }

    // Validar se todas as parcelas estão abertas
    for (const p of parcelasOriginais) {
      if (p.status === 'pago' || p.status === 'cancelado') {
        return res.status(422).json({ message: `A parcela #${p.numero_parcela} está com status ${p.status} e não pode ser renegociada.` });
      }
    }

    // Calcular débitos
    const totalDebito = parcelasOriginais.reduce((acc, curr) => acc + Number(curr.valor), 0);
    if (entradaNum > totalDebito) {
      return res.status(400).json({ message: 'O valor de entrada não pode ser maior que o débito total.' });
    }

    const saldo = totalDebito - entradaNum;
    const valorParcelaAcordo = saldo / qtdParcelasNum;

    // ── Criar Ordem do tipo ACORDO ─────────────────────────────────────────────
    const { data: ordem, error: createOrdemErr } = await supabase
      .from('financeiro_ordens_pagamento')
      .insert([{
        instituicao_id: aluno.instituicao_id || instituicaoFinal,
        aluno_id: aluno.id,
        tipo: 'acordo',
        descricao: descricao.trim(),
        referencia: 'Acordo Financeiro',
        valor_total: totalDebito,
        quantidade_parcelas: qtdParcelasNum + 1,
        observacoes: descricao.trim(),
        status: 'ativo',
        parcelas_origem_acordo: parcelas_originais,
        criado_por: authUser.email || authUser.id || 'financeiro'
      }])
      .select()
      .single();

    if (createOrdemErr || !ordem) {
      throw new Error('Erro ao criar ordem do acordo: ' + (createOrdemErr?.message || 'Erro desconhecido'));
    }

    // ── Gerar parcelas do acordo ────────────────────────────────────────────────
    const novasParcelas = [];

    // 1. Parcela de entrada
    novasParcelas.push({
      instituicao_id: aluno.instituicao_id || instituicaoFinal,
      ordem_pagamento_id: ordem.id,
      aluno_id: aluno.id,
      numero_parcela: 1,
      valor: Number(entradaNum.toFixed(2)),
      data_vencimento: data_vencimento_entrada,
      status: 'pendente'
    });

    // 2. Parcelas do saldo restante
    let currentVenc = new Date(data_vencimento_entrada + 'T12:00:00');
    for (let i = 1; i <= qtdParcelasNum; i++) {
      // Incrementar mês
      currentVenc.setMonth(currentVenc.getMonth() + 1);
      // Ajustar dia
      currentVenc.setDate(diaVencNum);

      novasParcelas.push({
        instituicao_id: aluno.instituicao_id || instituicaoFinal,
        ordem_pagamento_id: ordem.id,
        aluno_id: aluno.id,
        numero_parcela: i + 1,
        valor: Number(valorParcelaAcordo.toFixed(2)),
        data_vencimento: currentVenc.toISOString().split('T')[0],
        status: 'pendente'
      });
    }

    const { data: parcelasCriadas, error: insertParcelasErr } = await supabase
      .from('financeiro_parcelas')
      .insert(novasParcelas)
      .select();

    if (insertParcelasErr || !parcelasCriadas) {
      throw new Error('Erro ao inserir parcelas do acordo: ' + (insertParcelasErr?.message || 'Erro desconhecido'));
    }

    // Obter ID da parcela de entrada (número_parcela = 1)
    const entradaParcela = parcelasCriadas.find(p => p.numero_parcela === 1);
    if (entradaParcela) {
      await supabase
        .from('financeiro_ordens_pagamento')
        .update({ entrada_parcela_id: entradaParcela.id })
        .eq('id', ordem.id);
    }

    // ── Logs de Auditoria ──────────────────────────────────────────────────────
    const usuarioId = authUser.id ? Number(authUser.id) : null;
    try {
      await supabase.from('financeiro_logs').insert({
        aluno_id: aluno.id,
        instituicao_id: aluno.instituicao_id || null,
        usuario_id: usuarioId,
        acao: 'criar_acordo_financeiro',
        observacao: descricao.trim(),
        dados_extras: {
          ordem_id: ordem.id,
          valor_total: totalDebito,
          valor_entrada: entradaNum,
          quantidade_parcelas: qtdParcelasNum,
          parcelas_originais: parcelas_originais
        }
      });
    } catch (_) {}

    try {
      await supabase.from('audit_logs').insert({
        usuario_id: usuarioId,
        usuario_email: authUser.email || null,
        perfil: authUser.perfil || authUser.tipo || null,
        acao: 'CRIAR_ACORDO_FINANCEIRO',
        modulo: 'financeiro',
        entidade: 'aluno',
        id_entidade: String(aluno.id),
        detalhes: {
          ordem_id: ordem.id,
          valor_total: totalDebito,
          valor_entrada: entradaNum,
          quantidade_parcelas_acordo: qtdParcelasNum,
          parcelas_originais_incluidas_count: parcelas_originais.length,
          status_acordo: 'pendente_entrada',
          observacao: descricao.trim()
        },
        instituicao_id: aluno.instituicao_id || null
      });
    } catch (_) {}

    return res.status(201).json({
      sucesso: true,
      message: 'Acordo financeiro criado com sucesso.',
      ordem,
      parcelas: parcelasCriadas
    });

  } catch (err) {
    console.error('[ACORDOS CREATE]', err);
    return res.status(500).json({ message: err.message || 'Erro interno ao processar acordo' });
  }
}
