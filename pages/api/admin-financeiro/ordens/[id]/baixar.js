import { createClient } from '@supabase/supabase-js';
import {
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
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

async function registrarLog(payload) {
  try {
    await supabase.from('financeiro_logs').insert(payload);
  } catch (_) {
    // auditoria silenciosa
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // Contexto de escopo (Instituição x Unidade)
  const ctx = await resolveContextoUsuario(req, authUser);
  if (ctx.queryError) {
    console.error('[ordens/baixar] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser)
    : ctx.instituicaoId;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'ID da ordem não informado' });
  }

  const { metodo_pagamento, data_pagamento, observacao } = req.body || {};

  const dataPagamentoStr = parseDate(data_pagamento) || new Date().toISOString().split('T')[0];
  const metodoFinal = metodo_pagamento && METODOS_VALIDOS.includes(String(metodo_pagamento).toLowerCase())
    ? String(metodo_pagamento).toLowerCase()
    : 'outro';

  // 1. Buscar ordem no banco de dados
  const { data: ordem, error: findError } = await supabase
    .from('financeiro_ordens_pagamento')
    .select(`
      id,
      aluno_id,
      tipo,
      descricao,
      valor_total,
      valor_desconto,
      status,
      instituicao_id,
      efi_charge_id
    `)
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    return res.status(500).json({ message: 'Erro ao buscar ordem: ' + findError.message });
  }

  if (!ordem) {
    return res.status(404).json({ message: 'Ordem de pagamento não encontrada' });
  }

  // Isolamento institucional
  if (!isGroupAdmin) {
    const ordemInst = ordem.instituicao_id || null;
    if (userInstituicaoId && ordemInst && userInstituicaoId !== ordemInst) {
      return res.status(403).json({ message: 'Acesso negado: a ordem pertence a outra instituição' });
    }
  }

  // 2. Validações de estado (impede baixa duplicada e de ordem cancelada)
  if (ordem.status === 'pago') {
    return res.status(422).json({ message: 'Esta ordem já foi baixada anteriormente.' });
  }

  if (ordem.status === 'cancelado') {
    return res.status(422).json({ message: 'Não é possível dar baixa em uma ordem cancelada.' });
  }

  // 3. Obter o valor real devido no backend (nunca confiar em valores do frontend nem assumir 0)
  const valorDevido = Number(ordem.valor_total);
  if (!Number.isFinite(valorDevido) || valorDevido <= 0) {
    return res.status(400).json({
      message: 'Não foi possível recuperar o valor devido válido desta fatura. Baixa bloqueada.',
    });
  }

  const usuarioId = authUser.id ? Number(authUser.id) : null;
  const agora = new Date().toISOString();

  // 4. Atualizar a ordem de pagamento
  const { error: errOrdem } = await supabase
    .from('financeiro_ordens_pagamento')
    .update({
      status: 'pago',
      updated_at: agora,
    })
    .eq('id', id);

  if (errOrdem) {
    return res.status(500).json({ message: 'Erro ao atualizar ordem: ' + errOrdem.message });
  }

  // 5. Atualizar as parcelas vinculadas a esta ordem
  const { data: parcelas, error: errBuscaParcelas } = await supabase
    .from('financeiro_parcelas')
    .select('id, valor, valor_final, status')
    .eq('ordem_pagamento_id', id);

  if (!errBuscaParcelas && Array.isArray(parcelas) && parcelas.length > 0) {
    const parcelasAtivas = parcelas.filter(p => p.status !== 'cancelado');
    const qtdParcelas = parcelasAtivas.length || 1;
    const valorPorParcela = Number((valorDevido / qtdParcelas).toFixed(2));

    for (const parcela of parcelasAtivas) {
      const valorParcelaPago = Number(parcela.valor_final ?? parcela.valor ?? valorPorParcela);
      await supabase
        .from('financeiro_parcelas')
        .update({
          status: 'pago',
          data_pagamento: dataPagamentoStr,
          valor_pago: valorParcelaPago,
          metodo_pagamento: metodoFinal,
          baixado_por_id: usuarioId,
          baixado_em: agora,
          observacao_baixa: observacao ? String(observacao).trim().slice(0, 500) : 'Baixa integral da ordem',
          updated_at: agora,
        })
        .eq('id', parcela.id);
    }
  }

  // 6. Transição de matrícula (se aplicável)
  if (ordem.tipo === 'matricula' && ordem.aluno_id) {
    try {
      await supabase
        .from('alunos')
        .update({
          statusmatricula: 'AGUARDANDO_FORMACAO_TURMA',
          data_pagamento_matricula: dataPagamentoStr,
        })
        .eq('id', ordem.aluno_id)
        .eq('statusmatricula', 'AGUARDANDO_PAGAMENTO_MATRICULA');

      await tentarCriarComissao(supabase, {
        ordemId:       ordem.id,
        alunoId:       ordem.aluno_id,
        instituicaoId: ordem.instituicao_id || null,
        dataPagamento: dataPagamentoStr,
      });
    } catch (_) {}
  }

  // 7. Registro de auditoria
  await registrarLog({
    aluno_id: ordem.aluno_id || null,
    instituicao_id: ordem.instituicao_id || null,
    usuario_id: usuarioId,
    acao: 'baixa_manual_ordem',
    valor_pago: valorDevido,
    metodo_pagamento: metodoFinal,
    data_pagamento: dataPagamentoStr,
    observacao: observacao ? String(observacao).trim().slice(0, 500) : null,
    dados_extras: {
      ordem_id: ordem.id,
      valor_total: valorDevido,
      efi_charge_id: ordem.efi_charge_id || null,
    },
  });

  try {
    await supabase.from('audit_logs').insert([{
      usuario_id: usuarioId,
      usuario_email: authUser.email || null,
      perfil: authUser.perfil || authUser.tipo || null,
      acao: 'BAIXA_MANUAL_ORDEM',
      modulo: 'financeiro',
      entidade: 'ordem_pagamento',
      id_entidade: String(id),
      detalhes: {
        valor_fatura: valorDevido,
        metodo_pagamento: metodoFinal,
        data_pagamento: dataPagamentoStr,
        observacao: observacao || null,
      }
    }]);
  } catch (_) {}

  const aviso = ordem.efi_charge_id
    ? 'Esta baixa não cancela automaticamente cobranças ou boletos EFI existentes.'
    : null;

  return res.status(200).json({
    message: 'Baixa manual da ordem registrada com sucesso',
    valor_fatura: valorDevido,
    ...(aviso ? { aviso } : {}),
  });
}
