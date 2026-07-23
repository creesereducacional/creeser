import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId, resolveInstitutionContext } from '../../../../lib/auth-server';
import { emitirBoletoEfi } from '../../../../lib/efi/EfiBillingService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
      return;
    }

    const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
    const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: false });

    const {
      aluno_id,
      tipo,
      descricao,
      referencia,
      valor_total,
      percentual_desconto,
      valor_desconto,
      quantidade_parcelas,
      observacoes,
      criado_por,
      data_vencimento_primeira,
      intervalo_dias,
      // Emissão imediata no gateway (somente para tipo === 'ordem_simples')
      emitir_imediatamente = false,
      descricao_boleto,
    } = req.body;

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('id,instituicao_id,cpf,nome,turmaid,cursoid')
      .eq('id', aluno_id)
      .single();

    if (alunoError || !aluno) {
      console.error('[CRITICAL] Aluno não encontrado para criação de ordem:', { aluno_id, error: alunoError });
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }

    // Validar CPF preventivo no Backend
    const cpfLimpo = (aluno.cpf || '').replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      console.error('[CRITICAL] CPF inválido para faturamento:', { aluno_id, nome: aluno.nome, cpf: aluno.cpf });
      return res.status(400).json({ message: 'O aluno informado não possui um CPF válido com 11 dígitos cadastrado.' });
    }

    // Tentar resolver a unidade/turma se o aluno não possuir instituicao_id diretamente
    let unidadeInstituicaoId = null;
    if (!aluno.instituicao_id && aluno.turmaid) {
      const { data: turmaData } = await supabase
        .from('turmas')
        .select('unidade_id, unidades(instituicao_id)')
        .eq('id', aluno.turmaid)
        .maybeSingle();
      if (turmaData?.unidades?.instituicao_id) {
        unidadeInstituicaoId = turmaData.unidades.instituicao_id;
      }
    }

    const instituicaoFinal = resolveInstitutionContext({
      aluno: {
        instituicao_id: aluno.instituicao_id,
        unidade_instituicao_id: unidadeInstituicaoId
      },
      user: authUser,
      requestedId: req.body.instituicao_id || instituicaoId
    });

    if (!isGroupAdmin && aluno.instituicao_id && aluno.instituicao_id !== instituicaoId && instituicaoFinal !== instituicaoId) {
      console.error('[SECURITY VIOLATION] Tentativa de acesso negado a aluno de outro tenant:', { authUser: authUser.email, aluno_id });
      return res.status(403).json({ message: 'Acesso negado para o aluno informado' });
    }

    if (!instituicaoFinal) {
      console.error('[CRITICAL] Instituição ausente no processamento de ordem:', { aluno_id, authUser: authUser.email });
      return res.status(400).json({ message: 'O aluno não possui vínculo com uma instituição cadastrada no sistema.' });
    }

    // Validações
    if (!aluno_id || !tipo || !descricao || !valor_total || valor_total <= 0) {
      return res.status(400).json({ 
        message: 'Dados obrigatórios faltando: aluno_id, tipo, descricao, valor_total' 
      });
    }

    // Validar tipo
    if (!['ordem_simples', 'carne', 'matricula'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido. Use: ordem_simples, carne ou matricula' });
    }

    // Transação controlada com tratamento manual de rollback
    let criadaOrdemId = null;
    try {
      // Criar ordem principal
      const { data: ordemData, error: ordemError } = await supabase
        .from('financeiro_ordens_pagamento')
        .insert([{
          instituicao_id: instituicaoFinal,
          aluno_id,
          tipo,
          descricao,
          referencia: referencia || null,
          valor_total,
          percentual_desconto: percentual_desconto || 0,
          valor_desconto: valor_desconto || 0,
          quantidade_parcelas: quantidade_parcelas || 1,
          observacoes: observacoes || null,
          status: 'ativo',
          criado_por: criado_por || authUser.email || authUser.id || 'financeiro'
        }])
        .select()
        .single();

      if (ordemError) throw ordemError;

      criadaOrdemId = ordemData.id;

      // Gerar parcelas
      const parcelas = [];
      const qtd = quantidade_parcelas || 1;
      
      // A API existente recebe 'valor_total' como o valor Nominal total que será parcelado,
      // e o 'valor_desconto' como o desconto total a ser fracionado.
      const totalDesconto = Number(valor_desconto) || 0;
      const valorParcelaNominal = valor_total / qtd;
      const valorParcelaDesconto = totalDesconto / qtd;
      const valorParcelaFinal = valorParcelaNominal - valorParcelaDesconto;

      let dataVencimento = new Date(data_vencimento_primeira || Date.now());
      const dias = intervalo_dias || 30;

      for (let i = 1; i <= qtd; i++) {
        parcelas.push({
          instituicao_id: instituicaoFinal,
          ordem_pagamento_id: criadaOrdemId,
          aluno_id,
          numero_parcela: i,
          valor: Number(valorParcelaNominal.toFixed(2)), // padronizado: valor = valor_nominal para compatibilidade
          valor_nominal: Number(valorParcelaNominal.toFixed(2)),
          valor_desconto: Number(valorParcelaDesconto.toFixed(2)),
          valor_final: Number(valorParcelaFinal.toFixed(2)),
          data_limite_desconto: dataVencimento.toISOString().split('T')[0],
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'pendente'
        });

        // Próximo vencimento (incremente os dias)
        dataVencimento.setDate(dataVencimento.getDate() + dias);
      }

      // Inserir todas as parcelas
      const { data: parcelasData, error: parcelasError } = await supabase
        .from('financeiro_parcelas')
        .insert(parcelas)
        .select();

      if (parcelasError) throw parcelasError;

      // Se for matrícula, avançar status do aluno para AGUARDANDO_PAGAMENTO_MATRICULA
      if (tipo === 'matricula') {
        const { error: matriculaError } = await supabase
          .from('alunos')
          .update({ statusmatricula: 'AGUARDANDO_PAGAMENTO_MATRICULA' })
          .eq('id', aluno_id)
          .in('statusmatricula', ['PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO_MATRICULA']);
        
        if (matriculaError) throw matriculaError;
      }

      // ── Emissão imediata no gateway (somente para ordem_simples) ──────────────────
      let gatewayResult = null;

      if (tipo === 'ordem_simples' && emitir_imediatamente) {
        const primeiraParcela = parcelasData[0];

        if (!primeiraParcela) {
          throw new Error('Parcela não encontrada após inserção. Não é possível emitir boleto.');
        }

        // Buscar configurações financeiras da instituição
        const { data: configEmpresa } = await supabase
          .from('configuracoes_empresa')
          .select('financeiro')
          .eq('instituicao_id', instituicaoFinal)
          .maybeSingle();

        const configFinanceiro = configEmpresa?.financeiro || {};
        const notificationUrl =
          process.env.EFI_WEBHOOK_URL ||
          `${process.env.NEXT_PUBLIC_URL}/api/admin-financeiro/efi/webhook`;

        // emitirBoletoEfi lança erro se falhar — o catch externo fará rollback
        const efiData = await emitirBoletoEfi({
          parcela: {
            ...primeiraParcela,
            ordem_pagamento_id: criadaOrdemId,
          },
          aluno,
          descricao: descricao_boleto || descricao,
          configFinanceiro,
          supabase,
          instituicaoId: instituicaoFinal,
          notificationUrl,
        });

        gatewayResult = {
          provider: 'EFI',
          charge_id: efiData.charge_id,
          boleto_url: efiData.boleto_url,
          barcode: efiData.barcode,
          status: 'EMITIDO',
        };
      }

      // ── Resposta padronizada ────────────────────────────────────────────────────
      const responseBody = {
        sucesso: true,
        ordem: ordemData,
        parcelas: parcelasData,
        total_parcelas: parcelasData.length,
        mensagem: `${tipo === 'ordem_simples' ? 'Ordem' : 'Carnê'} criado com sucesso!`,
      };

      if (gatewayResult) {
        responseBody.gateway = gatewayResult;
      }

      return res.status(201).json(responseBody);

    } catch (dbError) {
      // Rollback se algo falhar na persistência das parcelas ou status
      if (criadaOrdemId) {
        console.error('[ROLLBACK EXECUTED] Removendo ordem órfã criada devido a erro subsequente:', criadaOrdemId, dbError);
        await supabase.from('financeiro_parcelas').delete().eq('ordem_pagamento_id', criadaOrdemId);
        await supabase.from('financeiro_ordens_pagamento').delete().eq('id', criadaOrdemId);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('[CRITICAL] Erro ao criar ordem financeira:', error);
    // Propagar o status code do erro EFI quando disponível
    const status = error.statusCode === 401 ? 502
      : error.statusCode >= 400 && error.statusCode < 500 ? 422
      : 500;
    return res.status(status).json({ 
      message: error.message || 'Erro ao criar ordem',
      error: error.message,
      efi: error.efiResponse || null,
    });
  }
}
