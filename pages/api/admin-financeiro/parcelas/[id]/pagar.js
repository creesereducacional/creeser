import { createClient } from '@supabase/supabase-js';
import {
  hasPerfil,
  requireAuth,
  requirePerfil,
} from '../../../../../lib/auth-server';
import { tentarCriarComissao } from '../../../../../lib/comissoes-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const METODOS_VALIDOS = ['pix', 'dinheiro', 'transferencia', 'cartao', 'cheque', 'outro'];

const parseDate = (value) => {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
};

const parsePositiveNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function registrarLog(payload) {
  try {
    await supabase.from('financeiro_logs').insert(payload);
  } catch (_) {
    // auditoria não deve bloquear a operação principal
  }
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID da parcela não informado' });
  }

  const { metodo_pagamento, valor_pago, data_pagamento, observacao, pagamentos } = req.body || {};

  // ── Validações de entrada ──────────────────────────────────────────────────
  const dataPagamentoStr = parseDate(data_pagamento);
  if (!dataPagamentoStr) {
    return res.status(400).json({ message: 'data_pagamento obrigatória no formato YYYY-MM-DD' });
  }

  const valorPagoNum = parsePositiveNumber(valor_pago);
  if (valorPagoNum === null) {
    return res.status(400).json({ message: 'valor_pago deve ser um número maior que zero' });
  }

  let metodoFinal = '';
  if (Array.isArray(pagamentos) && pagamentos.length > 0) {
    const somaValores = pagamentos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    if (Math.abs(somaValores - valorPagoNum) > 0.01) {
      return res.status(400).json({
        message: `A soma dos valores dos múltiplos pagamentos (${somaValores}) deve ser igual ao valor_pago (${valorPagoNum}).`
      });
    }

    for (const item of pagamentos) {
      if (!item.metodo || !METODOS_VALIDOS.includes(String(item.metodo).toLowerCase())) {
        return res.status(400).json({
          message: `Método de pagamento inválido encontrado na lista: ${item.metodo}. Métodos permitidos: ${METODOS_VALIDOS.join(', ')}`
        });
      }
    }
    metodoFinal = 'multiplo';
  } else {
    if (!metodo_pagamento || !METODOS_VALIDOS.includes(String(metodo_pagamento).toLowerCase())) {
      return res.status(400).json({
        message: `metodo_pagamento inválido. Use: ${METODOS_VALIDOS.join(', ')}`,
      });
    }
    metodoFinal = String(metodo_pagamento).toLowerCase();
  }

  // ── Buscar parcela ─────────────────────────────────────────────────────────
  const { data: parcela, error: findError } = await supabase
    .from('financeiro_parcelas')
    .select('id, aluno_id, ordem_pagamento_id, status, valor, efi_charge_id, instituicao_id')
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    return res.status(500).json({ message: 'Erro ao buscar parcela: ' + findError.message });
  }

  if (!parcela) {
    return res.status(404).json({ message: 'Parcela não encontrada' });
  }

  // ── Isolamento multi-tenant ────────────────────────────────────────────────
  if (!isGroupAdmin) {
    const tokenInstituicao = authUser.instituicao_id || authUser.instituicaoId || null;
    const parcelaInstituicao = parcela.instituicao_id || null;
    if (tokenInstituicao && parcelaInstituicao && tokenInstituicao !== parcelaInstituicao) {
      return res.status(403).json({ message: 'Acesso negado: parcela pertence a outra instituição' });
    }
  }

  // ── Validação de estado ────────────────────────────────────────────────────
  if (parcela.status === 'pago') {
    return res.status(422).json({ message: 'Esta parcela já está paga' });
  }

  if (parcela.status === 'cancelado') {
    return res.status(422).json({ message: 'Não é possível dar baixa em parcela cancelada' });
  }

  // ── Atualizar parcela ──────────────────────────────────────────────────────
  const usuarioId = authUser.id ? Number(authUser.id) : null;
  const agora = new Date().toISOString();

  const updatePayloadFull = {
    status: 'pago',
    data_pagamento: dataPagamentoStr,
    valor_pago: valorPagoNum,
    metodo_pagamento: metodoFinal,
    detalhes_baixa_multipla: pagamentos || null,
    baixado_por_id: usuarioId,
    baixado_em: agora,
    observacao_baixa: observacao ? String(observacao).trim().slice(0, 500) : null,
    updated_at: agora,
  };

  let parcelaAtualizada;
  const { data: resultFull, error: errFull } = await supabase
    .from('financeiro_parcelas')
    .update(updatePayloadFull)
    .eq('id', id)
    .select('id, status, data_pagamento, valor_pago, metodo_pagamento, baixado_em')
    .single();

  if (errFull) {
    // Fallback: migration ainda não aplicada — salva apenas campos base
    const isMissingCol = errFull.code === '42703' || String(errFull.message).includes('does not exist');
    if (!isMissingCol) {
      return res.status(500).json({ message: 'Erro ao atualizar parcela: ' + errFull.message });
    }
    const { data: resultBase, error: errBase } = await supabase
      .from('financeiro_parcelas')
      .update({ status: 'pago', data_pagamento: dataPagamentoStr, valor_pago: valorPagoNum, updated_at: agora })
      .eq('id', id)
      .select('id, status, data_pagamento, valor_pago')
      .single();
    if (errBase) {
      return res.status(500).json({ message: 'Erro ao atualizar parcela: ' + errBase.message });
    }
    parcelaAtualizada = resultBase;
  } else {
    parcelaAtualizada = resultFull;
  }

  // ── Transição de status de matrícula (silenciosa) ─────────────────────────
  // Se a parcela pertence a uma ordem de matrícula, avança o aluno para
  // AGUARDANDO_FORMACAO_TURMA após confirmação do pagamento.
  if (parcela.ordem_pagamento_id && parcela.aluno_id) {
    try {
      const { data: ordem } = await supabase
        .from('financeiro_ordens_pagamento')
        .select('tipo')
        .eq('id', parcela.ordem_pagamento_id)
        .maybeSingle();

      if (ordem?.tipo === 'matricula') {
        // Verifica se TODAS as parcelas da ordem estão pagas
        const { data: todasParcelas } = await supabase
          .from('financeiro_parcelas')
          .select('status')
          .eq('ordem_pagamento_id', parcela.ordem_pagamento_id);

        const todasPagas = todasParcelas?.every(p =>
          p.status === 'pago' || p.id === id
        );

        if (todasPagas) {
          await supabase
            .from('alunos')
            .update({
              statusmatricula: 'AGUARDANDO_FORMACAO_TURMA',
              data_pagamento_matricula: dataPagamentoStr,
            })
            .eq('id', parcela.aluno_id)
            .eq('statusmatricula', 'AGUARDANDO_PAGAMENTO_MATRICULA');

          // Gerar comissão automaticamente (não crítico)
          await tentarCriarComissao(supabase, {
            ordemId:       parcela.ordem_pagamento_id,
            alunoId:       parcela.aluno_id,
            instituicaoId: parcela.instituicao_id || null,
            dataPagamento: dataPagamentoStr,
            parcelaId:     id,
          });
        }
      }
    } catch (_) {
      // Não bloqueia a baixa se houver erro na transição de status
    }
  }

  // ── Auditoria (silenciosa se tabela ainda não existir) ────────────────────
  await registrarLog({
    parcela_id: id,
    aluno_id: parcela.aluno_id || null,
    instituicao_id: parcela.instituicao_id || null,
    usuario_id: usuarioId,
    acao: 'baixa_manual',
    valor_pago: valorPagoNum,
    metodo_pagamento: metodoFinal,
    data_pagamento: dataPagamentoStr,
    observacao: observacao ? String(observacao).trim().slice(0, 500) : null,
    dados_extras: {
      ordem_pagamento_id: parcela.ordem_pagamento_id,
      efi_charge_id: parcela.efi_charge_id || null,
      pagamentos_multiplos: pagamentos || null,
    },
  });

  try {
    await supabase.from('audit_logs').insert([{
      usuario_id: usuarioId,
      usuario_email: authUser.email || null,
      perfil: authUser.perfil || authUser.tipo || null,
      acao: 'BAIXA_MANUAL',
      modulo: 'financeiro',
      entidade: 'parcela',
      id_entidade: String(id),
      detalhes: {
        valor_pago: valorPagoNum,
        metodo_pagamento: metodoFinal,
        pagamentos_multiplos: pagamentos || null,
        observacao: observacao || null
      }
    }]);
  } catch (_) {}

  // ── Resposta ───────────────────────────────────────────────────────────────
  const aviso = parcela.efi_charge_id
    ? 'Esta baixa não cancela automaticamente o boleto EFI.'
    : null;

  return res.status(200).json({
    message: 'Baixa manual registrada com sucesso',
    parcela: parcelaAtualizada,
    ...(aviso ? { aviso } : {}),
  });
}
