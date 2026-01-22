import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Buscar todos os alunos
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } 
    else if (req.method === 'POST') {
      // Criar novo aluno
      const formData = req.body;

      // Mapear campos do formulário para o schema do Supabase
      const alunoData = {
        matricula: formData.matricula || `ALU-${Date.now()}`,
        cursoId: formData.cursoId ? parseInt(formData.cursoId) : null,
        turmaId: formData.turmaId ? parseInt(formData.turmaId) : null,
        statusMatricula: formData.statusMatricula || 'ativa',
        dataMatricula: formData.dataMatricula || new Date().toISOString().split('T')[0],
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.uf || null,
        cep: formData.cep || null,
        bairro: formData.bairro || null,
        numeroEndereco: formData.numero || null,
        responsavelId: formData.responsavelId ? parseInt(formData.responsavelId) : null,
        
        // Novos campos pessoais
        cpf: formData.cpf || null,
        estadoCivil: formData.estadoCivil || null,
        sexo: formData.sexo || null,
        data_nascimento: formData.dtNascimento || null,
        rg: formData.rg || null,
        data_expedicao_rg: formData.dataExpedicaoRG || null,
        orgao_expedidor_rg: formData.orgaoExpedidorRG || null,
        telefone_celular: formData.telefoneCelular || null,
        email: formData.email || null,
        
        // Filiação
        pai: formData.pai || null,
        mae: formData.mae || null,
        
        // Administrativos
        instituicao: formData.instituicao || 'CREESER',
        ano_letivo: formData.anoLetivo ? parseInt(formData.anoLetivo) : new Date().getFullYear(),
        turno_integral: formData.turnoIntegral || false,
        semestre: formData.semestre || null,
        
        // Registro de nascimento
        termo: formData.termo || null,
        folha: formData.folha || null,
        livro: formData.livro || null,
        nome_cartorio: formData.nomeCartorio || null,
        
        // Endereço completo
        complemento: formData.complemento || null,
        naturalidade: formData.naturalidade || null,
        uf_naturalidade: formData.ufNaturalidade || null,
        
        // Ensino médio
        estabelecimento: formData.estabelecimento || null,
        ano_conclusao: formData.anoConclusao ? parseInt(formData.anoConclusao) : null,
        endereco_dem: formData.enderecoDEM || null,
        municipio_dem: formData.municipioDEM || null,
        uf_dem: formData.ufDEM || null,
        
        // Deficiência
        pessoa_com_deficiencia: formData.pessoaComDeficiencia || false,
        tipo_deficiencia: formData.tipoDeficiencia || null,
        
        // Foto
        foto: formData.fotoAluno || null,
        
        // INEP
        tipo_escola_anterior: formData.tipoEscolaAnterior || null,
        pais_origem: formData.paisOrigem || 'BRA - Brasil',
        nome_social: formData.nomeSocial || false
      };

      const { data, error } = await supabase
        .from('alunos')
        .insert([alunoData])
        .select();

      if (error) throw error;
      return res.status(201).json(data[0]);
    } 
    else {
      return res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API de alunos:', error);
    return res.status(500).json({ 
      message: 'Erro ao processar requisição', 
      error: error.message 
    });
  }
}
