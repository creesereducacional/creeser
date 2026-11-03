import { createClient } from '@supabase/supabase-js';
import {
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

// ── Função auxiliar: derivar unidade do aluno através de matrículas/turmas ──
async function resolverUnidadeAluno(alunoId, turmaidLegado) {
  let turmaIdResolvida = null;
  const { data: matriculasAluno } = await supabase
    .from('matriculas')
    .select('turma_id, is_principal, instituicao_id')
    .eq('aluno_id', alunoId);

  if (Array.isArray(matriculasAluno) && matriculasAluno.length > 0) {
    const matAlvo = matriculasAluno.find(m => m.is_principal) || matriculasAluno[0];
    turmaIdResolvida = matAlvo?.turma_id || null;
  }

  if (!turmaIdResolvida) {
    turmaIdResolvida = turmaidLegado || null;
  }

  let unidadeIdDoAluno = null;
  let turmaInstituicaoId = null;

  if (turmaIdResolvida) {
    const { data: turmaData } = await supabase
      .from('turmas')
      .select('id, unidadeid, instituicao_id')
      .eq('id', turmaIdResolvida)
      .maybeSingle();

    if (turmaData) {
      unidadeIdDoAluno = turmaData.unidadeid != null ? Number(turmaData.unidadeid) : null;
      turmaInstituicaoId = turmaData.instituicao_id || null;
    }
  }

  return { turmaIdResolvida, unidadeIdDoAluno, turmaInstituicaoId };
}

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

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'ID da parcela é obrigatório' });
    }

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

    // ── FASE 6.2.7: Resolver contexto de escopo (Instituição × Unidade) ──────────
    const ctx = await resolveContextoUsuario(req, authUser);

    if (ctx.queryError) {
      console.error('[admin-financeiro/parcelas/whatsapp-info] Falha ao resolver contexto de escopo:', ctx.queryError);
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

    // 1. Buscar a parcela
    const { data: parcela, error: parcelaError } = await supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, valor, data_vencimento, status, boleto_url, boleto_barcode, boleto_numero, efi_charge_id, ordem_pagamento_id, instituicao_id, aluno_id')
      .eq('id', id)
      .maybeSingle();

    if (parcelaError || !parcela) {
      return res.status(404).json({ message: 'Parcela não encontrada' });
    }

    // Validação institucional direta na parcela
    if (!isGroupAdmin && instituicaoId && parcela.instituicao_id && parcela.instituicao_id !== instituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: a parcela pertence a outra instituição.' });
    }

    // 2. Buscar a ordem de pagamento
    const { data: ordem, error: ordemError } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('id, instituicao_id, aluno_id')
      .eq('id', parcela.ordem_pagamento_id)
      .maybeSingle();

    if (ordemError || !ordem) {
      return res.status(404).json({ message: 'Ordem de pagamento não encontrada' });
    }

    // Validação institucional na ordem vinculada
    if (!isGroupAdmin && instituicaoId && ordem.instituicao_id && ordem.instituicao_id !== instituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: a ordem pertence a outra instituição.' });
    }

    // 3. Buscar o aluno vinculado
    const alunoId = ordem.aluno_id || parcela.aluno_id;
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('id, nome, telefone_celular, turmaid, instituicao_id')
      .eq('id', alunoId)
      .maybeSingle();

    if (alunoError || !aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }

    // Validação institucional no aluno vinculado
    if (!isGroupAdmin && instituicaoId && aluno.instituicao_id && aluno.instituicao_id !== instituicaoId) {
      return res.status(403).json({ message: 'Acesso negado: o aluno pertence a outra instituição.' });
    }

    // 4. Validação de Escopo de Unidade (para Usuário Filial)
    if (ctx.unidadesPermitidas !== null) {
      const { unidadeIdDoAluno, turmaInstituicaoId } = await resolverUnidadeAluno(aluno.id, aluno.turmaid);

      if (!isGroupAdmin && instituicaoId && turmaInstituicaoId && turmaInstituicaoId !== instituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: a turma do aluno pertence a outra instituição.' });
      }

      if (unidadeIdDoAluno !== null && !ctx.unidadesPermitidas.includes(unidadeIdDoAluno)) {
        return res.status(403).json({
          message: 'Acesso negado: a matrícula/turma do aluno pertence a uma unidade fora do seu escopo permitido.'
        });
      }
    }

    // ── Autorização concluída: efeitos externos e recuperação inteligente ─────
    let finalPaymentUrl = parcela.boleto_url || null;

    let finalBarcode = parcela.boleto_barcode || null;
    let finalPixCode = null;
    let finalPixImage = null;

    // Se houver registro existente em financeiro_boletos, recuperar dados complementares (PIX/Barcode/URL)
    const { data: boletoExistente } = await supabase
      .from('financeiro_boletos')
      .select('boleto_url, boleto_barcode, resposta_json')
      .eq('parcela_id', parcela.id)
      .maybeSingle();

    if (boletoExistente) {
      if (!finalPaymentUrl && boletoExistente.boleto_url) {
        finalPaymentUrl = boletoExistente.boleto_url;
      }
      if (!finalBarcode && boletoExistente.boleto_barcode) {
        finalBarcode = boletoExistente.boleto_barcode;
      }
      const resp = boletoExistente.resposta_json || {};
      if (resp.pix) {
        finalPixCode = resp.pix.qrcode || null;
        finalPixImage = resp.pix.qrcode_image || null;
      }
      if (!finalPaymentUrl && (resp.url || resp.parcel_link || resp.pdf?.charge)) {
        finalPaymentUrl = resp.url || resp.parcel_link || resp.pdf?.charge;
      }
      if (!finalBarcode && resp.barcode) {
        finalBarcode = resp.barcode;
      }
    }

    // Se a URL ou dados do boleto estiverem vazios e houver um efi_charge_id, recuperação via API EFI
    if ((!finalPaymentUrl || !finalBarcode) && parcela.efi_charge_id) {
      console.log(`[RECOVERY REQUEST] Timestamp: ${new Date().toISOString()} | Parcela ID: ${parcela.id} | EFI Charge ID: ${parcela.efi_charge_id}`);
      try {
        const efi = require('../../../../../lib/efi-client').default || require('../../../../../lib/efi-client');
        const efiData = await efi.getCharge(Number(parcela.efi_charge_id));
        
        // A EFI retorna dados da transação. Buscamos link/pdf/pix/barcode
        const billet = efiData?.data?.payment || efiData?.data || {};
        const recoveredUrl = billet.link || billet.url || billet.pdf?.charge || billet.billet_link || billet.parcel_link || null;
        const barcode = billet.barcode || billet.identifications?.barcode || null;
        if (billet.pix) {
          finalPixCode = billet.pix.qrcode || null;
          finalPixImage = billet.pix.qrcode_image || null;
        }

        if (barcode && !finalBarcode) {
          finalBarcode = barcode;
        }

        if (recoveredUrl) {
          finalPaymentUrl = recoveredUrl;
          
          await supabase
            .from('financeiro_parcelas')
            .update({ 
              boleto_url: recoveredUrl,
              boleto_barcode: finalBarcode
            })
            .eq('id', parcela.id);

          await supabase
            .from('financeiro_boletos')
            .update({ 
              boleto_url: recoveredUrl,
              boleto_numero: finalBarcode,
              boleto_barcode: finalBarcode,
              resposta_json: billet
            })
            .eq('parcela_id', parcela.id);

          console.log(`[RECOVERY SUCCESS] Parcela ID: ${parcela.id} | Link recuperado e persistido: ${recoveredUrl}`);
        } else {
          console.warn(`[RECOVERY FAIL] Parcela ID: ${parcela.id} | EFI Charge ID: ${parcela.efi_charge_id} | EFI respondeu mas sem links válidos:`, JSON.stringify(efiData));
        }
      } catch (efiError) {
        console.error(`[RECOVERY ERROR] Falha na consulta de cobrança à EFI para Parcela ID: ${parcela.id}:`, efiError.message);
      }
    }

    // 5. Buscar os responsáveis vinculados para obter contato
    const { data: relResp, error: relRespError } = await supabase
      .from('responsavel_aluno')
      .select(`
        responsaveis (
          id,
          nome,
          whatsapp,
          telefonecelular
        )
      `)
      .eq('aluno_id', aluno.id);

    let responsavelNome = '';
    let responsavelTelefone = '';

    if (!relRespError && relResp && relResp.length > 0) {
      // Pegar o primeiro responsável que tenha telefone/whatsapp ou o primeiro da lista
      const respValido = relResp.find(r => r.responsaveis?.whatsapp || r.responsaveis?.telefonecelular) || relResp[0];
      if (respValido && respValido.responsaveis) {
        responsavelNome = respValido.responsaveis.nome || '';
        responsavelTelefone = respValido.responsaveis.whatsapp || respValido.responsaveis.telefonecelular || '';
      }
    }

    // Se o responsável não tiver telefone, podemos tentar o do próprio aluno
    if (!responsavelTelefone) {
      responsavelTelefone = aluno.telefone_celular || '';
    }

    return res.status(200).json({
      aluno_nome: aluno.nome,
      responsavel_nome: responsavelNome,
      responsavel_telefone: responsavelTelefone,
      numero_parcela: parcela.numero_parcela,
      valor: parcela.valor,
      data_vencimento: parcela.data_vencimento,
      payment_url: finalPaymentUrl,
      barcode: finalBarcode,
      pix_code: finalPixCode,
      pix_image: finalPixImage,
      efi_charge_id: parcela.efi_charge_id || null,
      tem_cobranca: Boolean(finalPaymentUrl || parcela.efi_charge_id || finalBarcode)
    });

  } catch (error) {
    console.error('Erro em whatsapp-info:', error);
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}

