/**
 * POST /api/admin-financeiro/efi/carne
 *   Cria um carnê na EFI para uma ordem do tipo 'carne'.
 *   Body: { ordem_id — UUID da ordem em financeiro_ordens_pagamento }
 *
 * DELETE /api/admin-financeiro/efi/carne
 *   Cancela o carnê inteiro na EFI e marca no banco.
 *   Body: { ordem_id }
 */

import { createClient } from '@supabase/supabase-js';
import efi from '../../../../lib/efi-client';
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
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  req.instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });
  req.authUser = authUser;

  if (!isGroupAdmin && !req.instituicaoId) {
    return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
  }

  if (req.method === 'GET')    return buscarCarne(req, res);
  if (req.method === 'POST')   return criarCarne(req, res);
  if (req.method === 'PATCH')  return cancelarParcela(req, res);
  if (req.method === 'DELETE') return cancelarCarne(req, res);
  return res.status(405).json({ message: 'Método não permitido' });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Buscar link do carnê na EFI
// ─────────────────────────────────────────────────────────────────────────────
async function buscarCarne(req, res) {
  try {
    const { ordem_id } = req.query;
    if (!ordem_id) return res.status(400).json({ message: 'ordem_id é obrigatório.' });

    let ordemQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('efi_carnet_id, instituicao_id')
      .eq('id', ordem_id);

    ordemQuery = applyInstituicaoFilter(ordemQuery, req.instituicaoId);
    const { data: ordemData, error } = await ordemQuery.single();

    if (error || !ordemData?.efi_carnet_id) {
      return res.status(404).json({ message: 'Carnê EFI não encontrado para esta ordem.' });
    }

    const data = await efi.getCarnet(Number(ordemData.efi_carnet_id));
    return res.status(200).json({
      carnet_id: ordemData.efi_carnet_id,
      link: data?.data?.carnet?.link || data?.data?.link || null,
      status: data?.data?.carnet?.status || null,
    });
  } catch (err) {
    console.error('[EFI carne GET]', err);
    return res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Criar carnê
// ─────────────────────────────────────────────────────────────────────────────
async function criarCarne(req, res) {
  try {
    const { ordem_id } = req.body;

    if (!ordem_id) {
      return res.status(400).json({ message: 'ordem_id é obrigatório.' });
    }

    // 1. Buscar ordem + parcelas + aluno
    let ordemQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select(`
        id, instituicao_id, tipo, descricao, status, quantidade_parcelas, efi_carnet_id,
        aluno:alunos!inner ( id, nome, cpf, email, data_nascimento, telefone_celular, turmaid, cursoid )
      `)
      .eq('id', ordem_id);

    ordemQuery = applyInstituicaoFilter(ordemQuery, req.instituicaoId);
    const { data: ordemData, error: ordemErrFinal } = await ordemQuery.single();

    if (ordemErrFinal || !ordemData) {
      return res.status(404).json({ message: 'Ordem não encontrada.' });
    }

    const ordemSelecionada = ordemData;

    if (ordemSelecionada.tipo !== 'carne') {
      return res.status(422).json({ message: 'Use /efi/cobranca para ordens simples.' });
    }

    if (ordemSelecionada.status === 'cancelado') {
      return res.status(422).json({ message: 'Ordem já está cancelada.' });
    }

    if (ordemSelecionada.efi_carnet_id) {
      return res.status(422).json({
        message: 'Carnê EFI já criado para esta ordem.',
        efi_carnet_id: ordemSelecionada.efi_carnet_id,
      });
    }

    // 2. Buscar parcelas em ordem crescente
    let parcelasQuery = supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, valor, valor_nominal, valor_desconto, valor_final, data_limite_desconto, data_vencimento')
      .eq('ordem_pagamento_id', ordem_id)
      .order('numero_parcela', { ascending: true });

    parcelasQuery = applyInstituicaoFilter(parcelasQuery, req.instituicaoId);
    const { data: parcelas, error: parcelasErr } = await parcelasQuery;

    if (parcelasErr || !parcelas?.length) {
      return res.status(422).json({ message: 'Nenhuma parcela encontrada para esta ordem.' });
    }

    const aluno = ordemSelecionada.aluno;

    // Buscar curso e turma
    const { data: turma } = aluno.turmaid
      ? await supabase.from('turmas').select('nome').eq('id', aluno.turmaid).maybeSingle()
      : { data: null };

    const { data: curso } = aluno.cursoid
      ? await supabase.from('cursos').select('nome').eq('id', aluno.cursoid).maybeSingle()
      : { data: null };

    const turmaNome = turma?.nome || 'Não definida';
    const cursoNome = curso?.nome || 'Não definido';
    const efiDescricao = `Aluno: ${aluno.nome} | Curso: ${cursoNome} | Turma: ${turmaNome}`.slice(0, 100);

    const cpfLimpo = (aluno.cpf || '').replace(/\D/g, '');

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return res.status(422).json({ message: 'CPF do aluno inválido ou ausente.' });
    }

    // Buscar configurações da empresa para juros/multa
    const { data: configEmpresa } = await supabase
      .from('configuracoes_empresa')
      .select('financeiro')
      .eq('instituicao_id', ordemSelecionada.instituicao_id)
      .maybeSingle();

    const configFinanceiro = configEmpresa?.financeiro || {};

    // Valor da 1ª parcela em centavos (todas devem ter o mesmo valor, mas usamos a 1ª de referência)
    // Usar valor_nominal com fallback para valor (legado)
    const valorBase = parcelas[0].valor_nominal !== undefined && parcelas[0].valor_nominal !== null 
      ? Number(parcelas[0].valor_nominal) 
      : Number(parcelas[0].valor);
    const valorCentavos = Math.round(valorBase * 100);
    const primeiroVencimento = parcelas[0].data_vencimento;

    const phoneDigits = (aluno.telefone_celular || '').replace(/\D/g, '');
    const birthRaw = aluno.data_nascimento || null;
    const birth = birthRaw ? String(birthRaw).substring(0, 10) : undefined;

    const customer = {
      name: aluno.nome,
      cpf: cpfLimpo,
    };
    if (aluno.email) customer.email = aluno.email;
    if (phoneDigits.length === 10 || phoneDigits.length === 11) customer.phone_number = phoneDigits;
    if (birth && /^\d{4}-\d{2}-\d{2}$/.test(birth)) customer.birth = birth;

    // Configurações de encargos para o Carnê (Multa e Juros)
    const configurations = {};
    const multaPercentual = Number(configFinanceiro.multaGerencianet) || Number(configFinanceiro.multa) || 0;
    if (multaPercentual > 0) {
      configurations.fine = {
        value: Math.round(multaPercentual * 100), // EFI recebe percentual em centavos: ex 2% = 200
        type: 'percentage'
      };
    }

    const jurosPercentualDiario = Number(configFinanceiro.jurosGerencianet) || Number(configFinanceiro.juros) || 0;
    if (jurosPercentualDiario > 0) {
      configurations.interest = {
        value: Math.round(jurosPercentualDiario * 1000), // EFI recebe juros em milésimos de percentual: ex 0.033% = 33
        type: 'percentage'
      };
    }

    // Desconto Condicional do Carnê
    const discountValue = Number(parcelas[0].valor_desconto) || 0;
    const discount = {};
    if (discountValue > 0 && parcelas[0].data_limite_desconto) {
      discount.value = Math.round(discountValue * 100);
      discount.type = 'currency';
      discount.until_date = parcelas[0].data_limite_desconto;
    }

    // URL do webhook para receber confirmações de pagamento de cada parcela
    const notificationUrl = process.env.EFI_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_URL}/api/admin-financeiro/efi/webhook`;

    // Montar o payload final para criação do carnê
    const carnetPayload = {
      items: [{ name: efiDescricao, value: valorCentavos, amount: 1 }],
      customer,
      expire_at: primeiroVencimento,
      repeats: parcelas.length,
      split_items: false,
      metadata: notificationUrl ? { notification_url: notificationUrl } : undefined,
    };

    if (Object.keys(configurations).length > 0) {
      carnetPayload.configurations = configurations;
    }
    if (Object.keys(discount).length > 0) {
      carnetPayload.discount = discount;
    }

    // 3. Criar carnê na EFI
    const carnetData = await efi.createCarnet(carnetPayload);

    const carnet = carnetData.data;
    const carnetId = carnet.carnet_id;
    const charges = carnet.charges || []; // array com charge_id por parcela

    const instituicaoId = ordemSelecionada.instituicao_id || req.instituicaoId || null;

    // 4. Salvar cada charge_id na parcela correspondente
    for (const parcela of parcelas) {
      const chargeInfo = charges[parcela.numero_parcela - 1];
      if (!chargeInfo) continue;

      const chargeId = chargeInfo.charge_id;
      const billet = chargeInfo.parcel || {};

      // Registrar em financeiro_boletos
      await supabase.from('financeiro_boletos').insert({
        parcela_id: parcela.id,
        instituicao_id: instituicaoId,
        gateway: 'efi',
        boleto_id_gateway: String(chargeId),
        boleto_barcode: billet.barcode || null,
        boleto_url: billet.link || null,
        status_gateway: 'waiting',
        resposta_json: chargeInfo,
      });

      // Atualizar a parcela com os dados do boleto
      await supabase
        .from('financeiro_parcelas')
        .update({
          efi_charge_id: String(chargeId),
          boleto_barcode: billet.barcode || null,
          boleto_url: billet.link || null,
        })
        .eq('id', parcela.id);
    }

    // 5. Atualizar a ordem com o carnet_id
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({ efi_carnet_id: String(carnetId), efi_status: 'waiting' })
      .eq('id', ordem_id);

    return res.status(201).json({
      message: 'Carnê criado com sucesso.',
      carnet_id: carnetId,
      link: carnet.link || null,
      parcelas: charges.map(c => ({
        charge_id: c.charge_id,
        parcel: c.parcel_number,
      })),
    });
  } catch (err) {
    console.error('[EFI carne POST]', JSON.stringify(err.efiResponse || err.message));
    const status = err.statusCode === 401 ? 502 : err.statusCode >= 400 && err.statusCode < 500 ? 422 : 500;
    const efiDetail = err.efiResponse
      ? (err.efiResponse.error_description || err.efiResponse.message || JSON.stringify(err.efiResponse))
      : null;
    return res.status(status).json({
      message: efiDetail ? `${err.message}: ${efiDetail}` : err.message,
      efi: err.efiResponse || null,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Cancelar parcela individual
// ─────────────────────────────────────────────────────────────────────────────
async function cancelarParcela(req, res) {
  try {
    const { ordem_id, parcela_id, observacao } = req.body;
    if (!ordem_id || !parcela_id) {
      return res.status(400).json({ message: 'ordem_id e parcela_id são obrigatórios.' });
    }

    if (!observacao || typeof observacao !== 'string' || observacao.trim().length < 10 || observacao.trim().length > 500) {
      return res.status(400).json({ message: 'A justificativa é obrigatória e deve conter entre 10 e 500 caracteres.' });
    }

    let ordemQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('efi_carnet_id, instituicao_id')
      .eq('id', ordem_id);

    ordemQuery = applyInstituicaoFilter(ordemQuery, req.instituicaoId);
    const { data: ordem } = await ordemQuery.single();

    let parcelaQuery = supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, status')
      .eq('id', parcela_id);

    parcelaQuery = applyInstituicaoFilter(parcelaQuery, req.instituicaoId);
    const { data: parcela } = await parcelaQuery.single();

    if (!parcela) return res.status(404).json({ message: 'Parcela não encontrada.' });
    if (parcela.status === 'cancelado') return res.status(422).json({ message: 'Parcela já cancelada.' });
    if (parcela.status === 'pago') return res.status(422).json({ message: 'Parcela já paga, não pode ser cancelada.' });

    // Cancelar na EFI se houver carnet_id
    if (ordem?.efi_carnet_id) {
      try {
        await efi.cancelCarnetParcel(Number(ordem.efi_carnet_id), parcela.numero_parcela);
      } catch (efiErr) {
        const ignorable = efiErr.statusCode === 422 || efiErr.efiResponse?.error === 'invalid_operation';
        if (!ignorable) throw efiErr;
      }
    }

    await supabase
      .from('financeiro_parcelas')
      .update({ status: 'cancelado', observacao_baixa: observacao.trim() })
      .eq('id', parcela_id);

    // Gravar log centralizado em audit_logs
    try {
      const authUser = req.authUser || {};
      const usuarioId = authUser.id ? Number(authUser.id) : null;
      await supabase.from('audit_logs').insert([{
        usuario_id: usuarioId,
        usuario_email: authUser.email || null,
        perfil: authUser.perfil || authUser.tipo || null,
        acao: 'CANCELAR_PARCELA',
        modulo: 'financeiro',
        entidade: 'parcela',
        id_entidade: String(parcela_id),
        detalhes: {
          numero_parcela: parcela.numero_parcela,
          ordem_id: ordem_id,
          motivo_cancelamento: observacao.trim(),
          cancelado_em: new Date().toISOString()
        },
        instituicao_id: ordem.instituicao_id || null
      }]);
    } catch (logErr) {
      console.error('[audit-log] Falha ao gravar auditoria de cancelamento:', logErr?.message || logErr);
    }

    return res.status(200).json({ message: 'Parcela cancelada.' });
  } catch (err) {
    console.error('[EFI carne PATCH]', err);
    return res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Cancelar carnê
// ─────────────────────────────────────────────────────────────────────────────
async function cancelarCarne(req, res) {
  try {
    const { ordem_id } = req.body;

    if (!ordem_id) {
      return res.status(400).json({ message: 'ordem_id é obrigatório.' });
    }

    // 1. Buscar ordem
    let ordemQuery = supabase
      .from('financeiro_ordens_pagamento')
      .select('id, tipo, status, efi_carnet_id')
      .eq('id', ordem_id);

    ordemQuery = applyInstituicaoFilter(ordemQuery, req.instituicaoId);
    const { data: ordem, error: ordemErr } = await ordemQuery.single();

    if (ordemErr || !ordem) {
      return res.status(404).json({ message: 'Ordem não encontrada.' });
    }

    if (ordem.status === 'cancelado') {
      return res.status(422).json({ message: 'Ordem já está cancelada.' });
    }

    if (ordem.tipo !== 'carne') {
      return res.status(422).json({ message: 'Use /efi/cobranca para cancelar ordens simples.' });
    }

    // 2. Cancelar no EFI
    let efiCancelado = false;
    if (ordem.efi_carnet_id) {
      try {
        await efi.cancelCarnet(Number(ordem.efi_carnet_id));
        efiCancelado = true;
      } catch (efiErr) {
        // Ignora se já estava cancelado/encerrado na EFI
        const ignorable = efiErr.statusCode === 422 || (efiErr.efiResponse?.error === 'invalid_operation');
        if (!ignorable) throw efiErr;
      }
    }

    // 3. Atualizar banco
    await supabase
      .from('financeiro_ordens_pagamento')
      .update({ status: 'cancelado', efi_status: 'canceled' })
      .eq('id', ordem_id);

    await supabase
      .from('financeiro_parcelas')
      .update({ status: 'cancelado' })
      .eq('ordem_pagamento_id', ordem_id);

    return res.status(200).json({
      message: 'Carnê cancelado.',
      cancelado_na_efi: efiCancelado,
    });
  } catch (err) {
    console.error('[EFI carne DELETE]', err);
    const status = err.statusCode >= 400 && err.statusCode < 500 ? 422 : 500;
    return res.status(status).json({
      message: err.message,
      efi: err.efiResponse || null,
    });
  }
}
