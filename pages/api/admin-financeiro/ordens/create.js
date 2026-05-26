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
      .select('id,instituicao_id')
      .eq('id', aluno_id)
      .single();

    if (alunoError || !aluno) {
      return res.status(404).json({ message: 'Aluno nao encontrado' });
    }

    const alunoInstituicaoId = aluno.instituicao_id || null;
    if (!isGroupAdmin && alunoInstituicaoId && alunoInstituicaoId !== instituicaoId) {
      return res.status(403).json({ message: 'Acesso negado para o aluno informado' });
    }

    const instituicaoFinal = alunoInstituicaoId || instituicaoId;

    if (!instituicaoFinal) {
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

    const ordem_id = ordemData.id;

    // Gerar parcelas
    const parcelas = [];
    const qtd = quantidade_parcelas || 1;
    const valorParcela = valor_total / qtd;

    let dataVencimento = new Date(data_vencimento_primeira || Date.now());
    const dias = intervalo_dias || 30;

    for (let i = 1; i <= qtd; i++) {
      parcelas.push({
        instituicao_id: instituicaoFinal,
        ordem_pagamento_id: ordem_id,
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
      await supabase
        .from('alunos')
        .update({ statusmatricula: 'AGUARDANDO_PAGAMENTO_MATRICULA' })
        .eq('id', aluno_id)
        .in('statusmatricula', ['PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO_MATRICULA']);
    }

    return res.status(201).json({
      sucesso: true,
      ordem: ordemData,
      parcelas: parcelasData,
      total_parcelas: parcelasData.length,
      mensagem: `${tipo === 'ordem_simples' ? 'Ordem' : 'Carnê'} criado com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao criar ordem:', error);
    return res.status(500).json({ 
      message: 'Erro ao criar ordem',
      error: error.message 
    });
  }
}
