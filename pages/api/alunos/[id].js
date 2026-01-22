import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      // Recuperar um aluno específico
      // ⚠️ PostgreSQL converte para lowercase automaticamente
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Aluno não encontrado' });
      }

      res.status(200).json(data);
    } 
    else if (req.method === 'PUT') {
      // ========================================
      // ATUALIZAR ALUNO - MAPEAMENTO COMPLETO
      // ========================================
      const formData = req.body;

      // ✅ Função helper para converter para UPPERCASE (exceto campos específicos)
      const toUppercase = (value) => {
        if (!value) return value;
        return typeof value === 'string' ? value.toUpperCase() : value;
      };

      // ✅ MAPEAMENTO COMPLETO E DEFINITIVO (42 CAMPOS)
      // Referência: MAPEAMENTO_COMPLETO_ALUNOS.md
      const alunoData = {
        // ===== IDENTIFICAÇÃO =====
        nome: toUppercase(formData.nome) || '',
        instituicao: toUppercase(formData.instituicao) || 'CREESER',
        statusmatricula: toUppercase(formData.status) || 'ATIVO',
        turmaid: formData.turma ? parseInt(formData.turma) : null,
        ano_letivo: formData.anoLetivo ? parseInt(formData.anoLetivo) : null,
        turno_integral: Boolean(formData.turnoIntegral),
        semestre: formData.semestre || null,

        // ===== DADOS PESSOAIS =====
        cpf: formData.cpf || null,
        estadocivil: toUppercase(formData.estadoCivil) || null,
        sexo: toUppercase(formData.sexo) || null,
        data_nascimento: formData.dtNascimento || null,
        rg: toUppercase(formData.rg) || null,
        data_expedicao_rg: formData.dataExpedicaoRG || null,
        orgao_expedidor_rg: toUppercase(formData.orgaoExpedidorRG) || null,
        telefone_celular: formData.telefoneCelular || null,
        email: formData.email ? formData.email.toLowerCase() : null,  // Email sempre lowercase

        // ===== FILIAÇÃO =====
        pai: toUppercase(formData.pai) || null,
        mae: toUppercase(formData.mae) || null,

        // ===== ENDEREÇO =====
        endereco: toUppercase(formData.endereco) || null,
        numeroendereco: toUppercase(formData.numero) || null,
        bairro: toUppercase(formData.bairro) || null,
        cidade: toUppercase(formData.cidade) || null,
        estado: toUppercase(formData.uf) || null,
        cep: formData.cep || null,
        complemento: toUppercase(formData.complemento) || null,
        naturalidade: toUppercase(formData.naturalidade) || null,
        uf_naturalidade: toUppercase(formData.ufNaturalidade) || null,

        // ===== REGISTRO DE NASCIMENTO =====
        termo: toUppercase(formData.termo) || null,
        folha: toUppercase(formData.folha) || null,
        livro: toUppercase(formData.livro) || null,
        nome_cartorio: toUppercase(formData.nomeCartorio) || null,

        // ===== INEP / CENSO =====
        tipo_escola_anterior: toUppercase(formData.tipoEscolaAnterior) || null,
        pais_origem: toUppercase(formData.paisOrigem) || 'BRA - BRASIL',

        // ===== ENSINO MÉDIO =====
        estabelecimento: toUppercase(formData.estabelecimento) || null,
        ano_conclusao: formData.anoConclusao ? parseInt(formData.anoConclusao) : null,
        endereco_dem: toUppercase(formData.enderecoDEM) || null,
        municipio_dem: toUppercase(formData.municipioDEM) || null,
        uf_dem: toUppercase(formData.ufDEM) || null,

        // ===== DEFICIÊNCIA =====
        pessoa_com_deficiencia: Boolean(formData.pessoaComDeficiencia),
        tipo_deficiencia: toUppercase(formData.tipoDeficiencia) || null,

        // ===== OUTROS =====
        nome_social: Boolean(formData.nomeSocial),
        foto: formData.foto || null
      };

      try {
        const { data, error } = await supabase
          .from('alunos')
          .update(alunoData)
          .eq('id', parseInt(id))
          .select();

        if (error) {
          console.error('❌ ERRO AO ATUALIZAR:', error.message);
          throw error;
        }

        console.log('✅ ALUNO ATUALIZADO COM ID:', id);
        res.status(200).json(data[0]);
      } catch (error) {
        console.error('❌ ERRO NA ATUALIZAÇÃO:', error);
        return res.status(500).json({ 
          message: 'Erro ao atualizar aluno', 
          error: error.message 
        });
      }
    } 
    else if (req.method === 'DELETE') {
      // Deletar aluno
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      res.status(200).json({ message: 'Aluno deletado com sucesso' });
    } 
    else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API alunos:', error);
    res.status(500).json({ 
      message: 'Erro ao processar requisição', 
      error: error.message 
    });
  }
}