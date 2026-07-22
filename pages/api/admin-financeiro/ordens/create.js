import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId } from '../../../../lib/auth-server';

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

    if (!instituicaoId && !isGroupAdmin) {
      return res.status(400).json({ message: 'Instituicao obrigatoria para criar ordem' });
    }

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
      intervalo_dias
    } = req.body;

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('id,instituicao_id,cpf,nome')
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

    const alunoInstituicaoId = aluno.instituicao_id || null;
    if (!isGroupAdmin && alunoInstituicaoId && alunoInstituicaoId !== instituicaoId) {
      console.error('[SECURITY VIOLATION] Tentativa de acesso negado a aluno de outro tenant:', { authUser: authUser.email, aluno_id });
      return res.status(403).json({ message: 'Acesso negado para o aluno informado' });
    }

    const instituicaoFinal = alunoInstituicaoId || instituicaoId;

    if (!instituicaoFinal) {
      console.error('[CRITICAL] Instituição ausente no processamento de ordem:', { aluno_id, authUser: authUser.email });
      return res.status(400).json({ message: 'Instituicao obrigatoria para criar ordem' });
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
      const valorParcela = valor_total / qtd;

      let dataVencimento = new Date(data_vencimento_primeira || Date.now());
      const dias = intervalo_dias || 30;

      for (let i = 1; i <= qtd; i++) {
        parcelas.push({
          instituicao_id: instituicaoFinal,
          ordem_pagamento_id: criadaOrdemId,
          aluno_id,
          numero_parcela: i,
          valor: Number(valorParcela.toFixed(2)),
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

      return res.status(201).json({
        sucesso: true,
        ordem: ordemData,
        parcelas: parcelasData,
        total_parcelas: parcelasData.length,
        mensagem: `${tipo === 'ordem_simples' ? 'Ordem' : 'Carnê'} criado com sucesso!`
      });

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
    return res.status(500).json({ 
      message: 'Erro ao criar ordem',
      error: error.message 
    });
  }
}
