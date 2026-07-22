import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
} from '../../../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // 1. Buscar a parcela
    const { data: parcela, error: parcelaError } = await supabase
      .from('financeiro_parcelas')
      .select('id, numero_parcela, valor, data_vencimento, status, boleto_url, efi_charge_id, ordem_pagamento_id, instituicao_id')
      .eq('id', id)
      .maybeSingle();

    if (parcelaError || !parcela) {
      return res.status(404).json({ message: 'Parcela não encontrada' });
    }

    let finalPaymentUrl = parcela.boleto_url || null;

    // Se a URL do boleto estiver vazia e houver um efi_charge_id, tentamos a recuperação inteligente
    if (!finalPaymentUrl && parcela.efi_charge_id) {
      console.log(`[RECOVERY REQUEST] Timestamp: ${new Date().toISOString()} | Parcela ID: ${parcela.id} | EFI Charge ID: ${parcela.efi_charge_id}`);
      try {
        const efi = require('../../../../../lib/efi-client').default;
        const efiData = await efi.getCharge(Number(parcela.efi_charge_id));
        
        // A EFI retorna dados da transação. Buscamos o link/pdf do boleto.
        const billet = efiData?.data?.payment || efiData?.data || {};
        const recoveredUrl = billet.link || billet.pdf?.charge || billet.billet_link || null;
        const barcode = billet.barcode || billet.identifications?.barcode || null;

        if (recoveredUrl) {
          finalPaymentUrl = recoveredUrl;
          
          // Atualiza automaticamente o campo boleto_url na tabela financeiro_parcelas
          await supabase
            .from('financeiro_parcelas')
            .update({ 
              boleto_url: recoveredUrl,
              boleto_barcode: barcode || parcela.boleto_barcode
            })
            .eq('id', parcela.id);

          // Atualiza também a tabela financeiro_boletos
          await supabase
            .from('financeiro_boletos')
            .update({ 
              boleto_url: recoveredUrl,
              boleto_numero: barcode,
              boleto_barcode: barcode
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

    // 2. Buscar a ordem de pagamento
    const { data: ordem, error: ordemError } = await supabase
      .from('financeiro_ordens_pagamento')
      .select('aluno_id')
      .eq('id', parcela.ordem_pagamento_id)
      .maybeSingle();

    if (ordemError || !ordem) {
      return res.status(404).json({ message: 'Ordem de pagamento não encontrada' });
    }

    // 3. Buscar o aluno
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('id, nome, telefone_celular')
      .eq('id', ordem.aluno_id)
      .maybeSingle();

    if (alunoError || !aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }

    // 4. Buscar os responsáveis vinculados
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
      payment_url: finalPaymentUrl
    });

  } catch (error) {
    console.error('Erro em whatsapp-info:', error);
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}
