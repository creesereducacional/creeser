import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const HIDDEN_SECTIONS_BY_INSTITUTION = {
  'INOVE TECNICO': ['registroNascimento'],
  'FACULDADE FAETE': ['registroNascimento'],
  'COLEGIO INOVE': ['ensinoMedio'],
};

const normalizeInstitutionName = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

export default function CadastroAluno() {
  const router = useRouter();
  const { id } = router.query;
  const isEditando = id && id !== 'novo';

  const [instituicoes, setInstituicoes] = useState([]);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [loadingAnosLetivos, setLoadingAnosLetivos] = useState(true);

  const [formData, setFormData] = useState({
    // Identificação
    instituicao: '',
    curso: '',
    turma: '',
    anoLetivo: new Date().getFullYear().toString(),
    turnoIntegral: false,
    semestre: '',
    
    // Dados Pessoais
    nome: '',
    nomeSocial: false,
    apelido: '',
    cpf: '',
    estadoCivil: '',
    sexo: '',
    dtNascimento: '',
    rg: '',
    dataExpedicaoRG: '',
    orgaoExpedidorRG: '',
    ufRG: '',
    telefoneCelular: '',
    
    // Filiação
    pai: '',
    mae: '',
    
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    complemento: '',
    naturalidade: '',
    ufNaturalidade: '',
    email: '',
    
    // Registro de Nascimento
    termo: '',
    folha: '',
    livro: '',
    nomeCartorio: '',
    
    // Informações para Censo INEP
    tipoEscolaAnterior: '',
    paisOrigem: 'BRA - Brasil',
    
    // Informações do Ensino Médio
    estabelecimento: '',
    anoConclusao: '',
    enderecoDEM: '',
    municipioDEM: '',
    ufDEM: '',
    
    // Deficiências
    pessoaComDeficiencia: false,
    tipoDeficiencia: '',

    // Dados Financeiros
    planoFinanceiro: '',
    valorMatricula: '',
    valorMensalidade: '',
    percentualDesconto: '',
    quantidadeParcelas: '',
    diaPagamento: '',
    quantidadeMesesContrato: '',
    cnpjBoleto: '',
    razaoSocialBoleto: '',
    alunoBolsista: '',
    percentualBolsaEstudo: '',
    financiamentoEstudantil: '',
    percentualFinanciamento: '',

    // Informações Adicionais
    tituloEleitoral: '',
    zonaEleitoral: '',
    secaoEleitoral: '',
    carteiraReservista: '',
    numeroRegistroConselho: '',
    religiao: '',
    laudoCid: '',
    observacoesAdicionais: '',
    indicacaoQuem: '',
    
    // Status
    status: 'ATIVO'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fotoAluno, setFotoAluno] = useState(null);

  const instituicaoAtual = normalizeInstitutionName(formData.instituicao);
  const hiddenSections = HIDDEN_SECTIONS_BY_INSTITUTION[instituicaoAtual] || [];
  const shouldShowSection = (sectionId) => !hiddenSections.includes(sectionId);

  const instituicaoSelecionada = instituicoes.find(
    (inst) => normalizeInstitutionName(inst.nome) === instituicaoAtual
  );
  const instituicaoSelecionadaId = String(instituicaoSelecionada?.id || '');

  const cursosVinculadosInstituicao = cursos.filter((curso) => {
    const cursoInstituicaoId = String(curso.instituicaoId || curso.instituicao_id || curso.instituicaoid || '');
    if (instituicaoSelecionadaId && cursoInstituicaoId) {
      return cursoInstituicaoId === instituicaoSelecionadaId;
    }

    const cursoInstituicaoNome = normalizeInstitutionName(curso.instituicaoNome || curso.instituicao_nome || '');
    return Boolean(instituicaoAtual && cursoInstituicaoNome && cursoInstituicaoNome === instituicaoAtual);
  });

  const cursoSelecionado = cursosVinculadosInstituicao.find(
    (curso) => String(curso.id) === String(formData.curso)
  );
  const cursoSelecionadoNome = normalizeInstitutionName(cursoSelecionado?.nome || '');

  const turmasFiltradas = turmas.filter((turma) => {
    const turmaInstituicaoId = String(turma.instituicaoId || turma.instituicao_id || '');
    const turmaInstituicaoNome = normalizeInstitutionName(turma.instituicao || turma.instituicaoNome || turma.instituicao_nome || '');

    const turmaVinculadaInstituicao = !formData.instituicao
      ? true
      : instituicaoSelecionadaId && turmaInstituicaoId
        ? turmaInstituicaoId === instituicaoSelecionadaId
        : turmaInstituicaoNome === instituicaoAtual;

    if (!turmaVinculadaInstituicao) {
      return false;
    }

    if (!formData.curso) {
      return true;
    }

    const turmaCursoId = String(turma.cursoId || turma.cursoid || '');
    const turmaCursoNome = normalizeInstitutionName(turma.curso || '');

    return turmaCursoId
      ? turmaCursoId === String(formData.curso)
      : Boolean(cursoSelecionadoNome && turmaCursoNome === cursoSelecionadoNome);
  });

  useEffect(() => {
    carregarInstituicoes();
    carregarCursos();
    carregarTurmas();
    carregarAnosLetivos();
    if (isEditando) {
      carregarAluno();
    }
  }, [isEditando]);

  useEffect(() => {
    if (!formData.turma || formData.curso) return;

    const turmaSelecionada = turmas.find((turma) => String(turma.id) === String(formData.turma));
    const cursoDaTurma = turmaSelecionada?.cursoId || turmaSelecionada?.cursoid || '';

    if (!cursoDaTurma) return;

    setFormData((prev) => ({
      ...prev,
      curso: String(cursoDaTurma),
    }));
  }, [formData.turma, formData.curso, turmas]);

  const carregarInstituicoes = async () => {
    try {
      setLoadingInstituicoes(true);
      const response = await fetch('/api/instituicoes');
      if (response.ok) {
        const data = await response.json();
        setInstituicoes(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
    } finally {
      setLoadingInstituicoes(false);
    }
  };

  const carregarTurmas = async () => {
    try {
      setLoadingTurmas(true);
      const response = await fetch('/api/turmas');
      if (response.ok) {
        const data = await response.json();
        setTurmas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setLoadingTurmas(false);
    }
  };

  const carregarCursos = async () => {
    try {
      setLoadingCursos(true);
      const response = await fetch('/api/cursos');
      if (response.ok) {
        const data = await response.json();
        setCursos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoadingCursos(false);
    }
  };

  const carregarAnosLetivos = async () => {
    try {
      setLoadingAnosLetivos(true);
      const response = await fetch('/api/configuracoes/anos-letivos');
      if (response.ok) {
        const data = await response.json();
        setAnosLetivos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar anos letivos:', error);
    } finally {
      setLoadingAnosLetivos(false);
    }
  };

  const carregarAluno = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alunos/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // ✅ MAPEAMENTO INVERSO: lowercase (banco) → camelCase (formulário)
        const alunoMapeado = {
          // IDENTIFICAÇÃO
          instituicao: data.instituicao || 'CREESER',
          curso: data.cursoid ? data.cursoid.toString() : '',
          turma: data.turmaid ? data.turmaid.toString() : '',
          anoLetivo: data.ano_letivo ? data.ano_letivo.toString() : new Date().getFullYear().toString(),
          turnoIntegral: data.turno_integral || false,
          semestre: data.semestre || '',
          
          // DADOS PESSOAIS
          nome: data.nome || '',
          nomeSocial: data.nome_social || false,
          apelido: data.apelido || '',
          cpf: data.cpf || '',
          estadoCivil: data.estadocivil || '',
          sexo: data.sexo || '',
          dtNascimento: data.data_nascimento || '',
          rg: data.rg || '',
          dataExpedicaoRG: data.data_expedicao_rg || '',
          orgaoExpedidorRG: data.orgao_expedidor_rg || '',
          ufRG: data.uf_rg || '',
          telefoneCelular: data.telefone_celular || '',
          
          // FILIAÇÃO
          pai: data.pai || '',
          mae: data.mae || '',
          
          // ENDEREÇO
          cep: data.cep || '',
          endereco: data.endereco || '',
          numero: data.numeroendereco || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.estado || '',
          complemento: data.complemento || '',
          naturalidade: data.naturalidade || '',
          ufNaturalidade: data.uf_naturalidade || '',
          email: data.email || '',
          
          // REGISTRO DE NASCIMENTO
          termo: data.termo || '',
          folha: data.folha || '',
          livro: data.livro || '',
          nomeCartorio: data.nome_cartorio || '',
          
          // INEP/CENSO
          tipoEscolaAnterior: data.tipo_escola_anterior || '',
          paisOrigem: data.pais_origem || 'BRA - Brasil',
          
          // ENSINO MÉDIO
          estabelecimento: data.estabelecimento || '',
          anoConclusao: data.ano_conclusao ? data.ano_conclusao.toString() : '',
          enderecoDEM: data.endereco_dem || '',
          municipioDEM: data.municipio_dem || '',
          ufDEM: data.uf_dem || '',
          
          // DEFICIÊNCIA
          pessoaComDeficiencia: data.pessoa_com_deficiencia || false,
          tipoDeficiencia: data.tipo_deficiencia || '',

          // DADOS FINANCEIROS
          planoFinanceiro: data.plano_financeiro || '',
          valorMatricula: data.valor_matricula ?? '',
          valorMensalidade: data.valor_mensalidade ?? '',
          percentualDesconto: data.percentual_desconto ?? '',
          quantidadeParcelas: data.qtd_parcelas ?? '',
          diaPagamento: data.dia_pagamento ?? '',
          quantidadeMesesContrato: data.qtd_meses_contrato ?? '',
          cnpjBoleto: data.cnpj_boleto || '',
          razaoSocialBoleto: data.razao_social_boleto || '',
          alunoBolsista:
            data.aluno_bolsista === true
              ? 'SIM'
              : data.aluno_bolsista === false
                ? 'NAO'
                : '',
          percentualBolsaEstudo: data.percentual_bolsa ?? '',
          financiamentoEstudantil: data.financiamento_estudantil || '',
          percentualFinanciamento: data.percentual_financiamento ?? '',

          // INFORMAÇÕES ADICIONAIS
          tituloEleitoral: data.titulo_eleitoral || '',
          zonaEleitoral: data.zona_eleitoral ?? '',
          secaoEleitoral: data.secao_eleitoral ?? '',
          carteiraReservista: data.carteira_reservista || '',
          numeroRegistroConselho: data.registro_conselho || '',
          religiao: data.religiao || '',
          laudoCid: data.laudo_cid || '',
          observacoesAdicionais: data.observacoes_adicionais || '',
          indicacaoQuem: data.indicacao_quem || '',
          
          // STATUS
          status: data.statusmatricula || 'ATIVO',
          
          // FOTO
          foto: data.foto || null
        };
        
        // ✅ Se tiver foto, carregar também em fotoAluno para preview
        if (data.foto) {
          setFotoAluno(data.foto);
        }
        
        setFormData(alunoMapeado);
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar aluno' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const parsedValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue,
      ...(name === 'instituicao' ? { curso: '', turma: '' } : {}),
      ...(name === 'curso' ? { turma: '' } : {}),
      ...(name === 'nomeSocial' && !checked ? { apelido: '' } : {})
    }));
  };

  const buscarEnderecoPorCEP = async (cepValue) => {
    if (!cepValue || cepValue.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await response.json();

      if (data.erro) {
        setMessage({ type: 'error', text: 'CEP não encontrado' });
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || ''
      }));

      setMessage({ type: 'success', text: 'Endereço preenchido automaticamente!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao buscar CEP: ' + error.message });
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    setFormData(prev => ({
      ...prev,
      cep: value
    }));

    if (value.length === 8) {
      buscarEnderecoPorCEP(value);
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoAluno(reader.result);
        // ✅ Guardar foto em base64 no formData também
        setFormData(prev => ({
          ...prev,
          foto: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const method = isEditando ? 'PUT' : 'POST';
      const url = isEditando ? `/api/alunos/${id}` : '/api/alunos';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: isEditando 
            ? 'Aluno atualizado com sucesso!' 
            : 'Aluno cadastrado com sucesso!' 
        });
        
        setTimeout(() => {
          router.push('/admin/alunos');
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao salvar aluno' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link href="/admin/alunos">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base">
              ← Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span>👨‍🎓</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {isEditando ? 'Editar Aluno' : 'Inserir Aluno'}
            </h1>
          </div>
        </div>

        {/* Mensagem */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Abas */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <Link href="/admin/alunos">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
            ➕ Inserir
          </button>
          <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold">
            📥 Importação
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Identificação */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Identificação</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">INSTITUIÇÃO</label>
                <select
                  name="instituicao"
                  value={formData.instituicao}
                  onChange={handleInputChange}
                  disabled={loadingInstituicoes}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50 disabled:opacity-50"
                >
                  <option value="">- Selecione uma Instituição -</option>
                  {!loadingInstituicoes && instituicoes && instituicoes.length > 0 ? (
                    instituicoes.map((inst) => (
                      <option key={inst.id || inst.nome} value={inst.nome}>
                        {inst.nome}
                      </option>
                    ))
                  ) : loadingInstituicoes ? (
                    <option disabled>Carregando instituições...</option>
                  ) : (
                    <option disabled>Nenhuma instituição cadastrada</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO</label>
                <select
                  name="curso"
                  value={formData.curso}
                  onChange={handleInputChange}
                  disabled={!formData.instituicao || loadingCursos}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50 disabled:opacity-50"
                >
                  <option value="">{formData.instituicao ? 'Selecione um Curso' : 'Selecione a instituição primeiro'}</option>
                  {!loadingCursos && cursosVinculadosInstituicao.length > 0 ? (
                    cursosVinculadosInstituicao.map((curso) => (
                      <option key={curso.id} value={String(curso.id)}>
                        {curso.nome}
                      </option>
                    ))
                  ) : loadingCursos ? (
                    <option disabled>Carregando cursos...</option>
                  ) : (
                    <option disabled>Nenhum curso vinculado à instituição</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA</label>
                <select
                  name="turma"
                  value={formData.turma}
                  onChange={handleInputChange}
                  disabled={!formData.instituicao || loadingTurmas}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50 disabled:opacity-50"
                >
                  <option value="">{formData.instituicao ? 'Selecione uma Turma' : 'Selecione a instituição primeiro'}</option>
                  {!loadingTurmas && turmasFiltradas.length > 0 ? (
                    turmasFiltradas.map((turma) => (
                      <option key={turma.id} value={String(turma.id)}>
                        {turma.nome}
                        {turma.curso ? ` - ${turma.curso}` : ''}
                        {turma.turno ? ` (${turma.turno})` : ''}
                      </option>
                    ))
                  ) : loadingTurmas ? (
                    <option disabled>Carregando turmas...</option>
                  ) : (
                    <option disabled>Nenhuma turma vinculada aos filtros</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">ANO LETIVO</label>
                <select
                  name="anoLetivo"
                  value={formData.anoLetivo}
                  onChange={handleInputChange}
                  disabled={loadingAnosLetivos}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50 disabled:opacity-50"
                >
                  <option value="">Selecione o Ano Letivo</option>
                  {!loadingAnosLetivos && anosLetivos.length > 0 ? (
                    anosLetivos.map((ano) => {
                      const valorAno = (ano.nome ?? ano.ano ?? '').toString();
                      if (!valorAno) return null;
                      return (
                        <option key={ano.id || valorAno} value={valorAno}>
                          {valorAno}
                        </option>
                      );
                    })
                  ) : loadingAnosLetivos ? (
                    <option disabled>Carregando anos letivos...</option>
                  ) : (
                    <option value={new Date().getFullYear().toString()}>
                      {new Date().getFullYear()}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Turno Integral?</label>
                <input
                  type="checkbox"
                  name="turnoIntegral"
                  checked={formData.turnoIntegral}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-teal-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Semestre</label>
                <input
                  type="text"
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleInputChange}
                  placeholder="Semestre"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Dados Pessoais</h2>
            
            <div
              className={`grid grid-cols-1 gap-4 mb-4 ${
                formData.nomeSocial ? 'md:grid-cols-[1fr_180px_1fr]' : 'md:grid-cols-[1fr_180px]'
              }`}
            >
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Nome <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Nome do aluno"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Nome social?</label>
                <label htmlFor="nomeSocial" className="inline-flex items-center gap-2 h-[42px]">
                  <input
                    id="nomeSocial"
                    type="checkbox"
                    name="nomeSocial"
                    checked={formData.nomeSocial}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-teal-600 rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-700">Possui nome social</span>
                </label>
              </div>

              {formData.nomeSocial && (
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">Apelido (Nome Social)</label>
                  <input
                    type="text"
                    name="apelido"
                    value={formData.apelido}
                    onChange={handleInputChange}
                    placeholder="Informe o nome social"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="Somente Números"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Estado Civil</label>
                <select
                  name="estadoCivil"
                  value={formData.estadoCivil}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="SOLTEIRO">Solteiro</option>
                  <option value="CASADO">Casado</option>
                  <option value="DIVORCIADO">Divorciado</option>
                  <option value="VIÚVO">Viúvo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Sexo</label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Data de Nascimento <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="dtNascimento"
                  value={formData.dtNascimento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">RG</label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleInputChange}
                  placeholder="RG"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Órgão Expedidor (RG)</label>
                <select
                  name="orgaoExpedidorRG"
                  value={formData.orgaoExpedidorRG}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="SSP">SSP</option>
                  <option value="PC">PC</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Data de Expedição (RG)</label>
                <input
                  type="date"
                  name="dataExpedicaoRG"
                  value={formData.dataExpedicaoRG}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UF (RG)</label>
                <select
                  name="ufRG"
                  value={formData.ufRG || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map((ufOption) => (
                    <option key={ufOption} value={ufOption}>{ufOption}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Telefone Celular</label>
                <input
                  type="tel"
                  name="telefoneCelular"
                  value={formData.telefoneCelular}
                  onChange={handleInputChange}
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-teal-100">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Naturalidade</label>
                <input
                  type="text"
                  name="naturalidade"
                  value={formData.naturalidade}
                  onChange={handleInputChange}
                  placeholder="Ex: São Paulo-SP"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Nacionalidade</label>
                <input
                  type="text"
                  name="nacionalidade"
                  value={formData.nacionalidade}
                  onChange={handleInputChange}
                  placeholder="Ex: Brasileiro"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Filiação */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Filiação</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PAI</label>
                <input
                  type="text"
                  name="pai"
                  value={formData.pai}
                  onChange={handleInputChange}
                  placeholder="Nome do pai"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MÃE</label>
                <input
                  type="text"
                  name="mae"
                  value={formData.mae}
                  onChange={handleInputChange}
                  placeholder="Nome da mãe"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

          </div>

          {/* Seção: Endereço */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Endereço</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CEP</label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleCepChange}
                  placeholder="CEP"
                  maxLength="8"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Preencha automaticamente</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-teal-600 mb-1 block">Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, Avenida, etc"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Número</label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  placeholder="Nº"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  placeholder="Bairro"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UF</label>
                <select
                  name="uf"
                  value={formData.uf}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map((ufOption) => (
                    <option key={ufOption} value={ufOption}>{ufOption}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Complemento</label>
                <input
                  type="text"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  placeholder="Apto, bloco, referência"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>


          </div>

          {/* Seção: Registro de Nascimento */}
          {shouldShowSection('registroNascimento') && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Registro de Nascimento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Termo</label>
                <input
                  type="text"
                  name="termo"
                  value={formData.termo}
                  onChange={handleInputChange}
                  placeholder="Termo"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Folha</label>
                <input
                  type="text"
                  name="folha"
                  value={formData.folha}
                  onChange={handleInputChange}
                  placeholder="Folha"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Livro</label>
                <input
                  type="text"
                  name="livro"
                  value={formData.livro}
                  onChange={handleInputChange}
                  placeholder="Livro"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Nome do Cartório</label>
              <input
                type="text"
                name="nomeCartorio"
                value={formData.nomeCartorio}
                onChange={handleInputChange}
                placeholder="Nome do Cartório"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </div>
          </div>
          )}

          {/* Seção: Informações para Censo INEP */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Informações para Censo INEP</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Tipo de Escola que Concluiu o Ensino Médio</label>
                <select
                  name="tipoEscolaAnterior"
                  value={formData.tipoEscolaAnterior}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="PUBLICA">Escola Pública</option>
                  <option value="PRIVADA">Escola Privada</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">País de Origem</label>
                <select
                  name="paisOrigem"
                  value={formData.paisOrigem}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="BRA - Brasil">BRA - Brasil</option>
                  <option value="USA - Estados Unidos">USA - Estados Unidos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Informações do Ensino Médio */}
          {shouldShowSection('ensinoMedio') && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Informações do Ensino Médio</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Estabelecimento</label>
                <input
                  type="text"
                  name="estabelecimento"
                  value={formData.estabelecimento}
                  onChange={handleInputChange}
                  placeholder="Estabelecimento"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Ano de conclusão</label>
                <input
                  type="number"
                  name="anoConclusao"
                  value={formData.anoConclusao}
                  onChange={handleInputChange}
                  placeholder="Ano"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-teal-600 mb-1 block">Endereço</label>
                <input
                  type="text"
                  name="enderecoDEM"
                  value={formData.enderecoDEM}
                  onChange={handleInputChange}
                  placeholder="Endereço"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Município</label>
                <input
                  type="text"
                  name="municipioDEM"
                  value={formData.municipioDEM}
                  onChange={handleInputChange}
                  placeholder="Município"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">UF</label>
              <select
                name="ufDEM"
                value={formData.ufDEM}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              >
                <option value="">Selecione</option>
                {UF_OPTIONS.map((ufOption) => (
                  <option key={ufOption} value={ufOption}>{ufOption}</option>
                ))}
              </select>
            </div>
          </div>
          )}

          {/* Seção: Dados Financeiros */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Dados Financeiros</h2>

            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">Planos Financeiros</label>
              <select
                name="planoFinanceiro"
                value={formData.planoFinanceiro}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              >
                <option value="">Selecione</option>
                <option value="PADRAO">Plano Padrão</option>
                <option value="PROMOCIONAL">Plano Promocional</option>
                <option value="BOLSA">Plano com Bolsa</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">R$ Matrícula</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="valorMatricula"
                  value={formData.valorMatricula}
                  onChange={handleInputChange}
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">R$ Mensalidade</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="valorMensalidade"
                  value={formData.valorMensalidade}
                  onChange={handleInputChange}
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Desconto (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="percentualDesconto"
                  value={formData.percentualDesconto}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Qtd. de Parcelas</label>
                <input
                  type="number"
                  min="0"
                  name="quantidadeParcelas"
                  value={formData.quantidadeParcelas}
                  onChange={handleInputChange}
                  placeholder="Quantidade de parcelas"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Dia de Pagamento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="diaPagamento"
                  value={formData.diaPagamento}
                  onChange={handleInputChange}
                  placeholder="Dia de pagamento escolhido pelo aluno"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Qtd. Meses Contrato</label>
                <input
                  type="number"
                  min="0"
                  name="quantidadeMesesContrato"
                  value={formData.quantidadeMesesContrato}
                  onChange={handleInputChange}
                  placeholder="Qtd. período contratual"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CNPJ no Boleto</label>
                <input
                  type="text"
                  name="cnpjBoleto"
                  value={formData.cnpjBoleto}
                  onChange={handleInputChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Razão Social</label>
                <input
                  type="text"
                  name="razaoSocialBoleto"
                  value={formData.razaoSocialBoleto}
                  onChange={handleInputChange}
                  placeholder="Razão social para emissão"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Aluno Bolsista?</label>
                <select
                  name="alunoBolsista"
                  value={formData.alunoBolsista}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- Escolha uma opção -</option>
                  <option value="SIM">Sim</option>
                  <option value="NAO">Não</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">(%) Bolsa de Estudo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="percentualBolsaEstudo"
                  value={formData.percentualBolsaEstudo}
                  onChange={handleInputChange}
                  placeholder="Percentual da bolsa"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Financiamento Estudantil</label>
                <select
                  name="financiamentoEstudantil"
                  value={formData.financiamentoEstudantil}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- Escolha uma opção -</option>
                  <option value="NAO">Não</option>
                  <option value="FIES">FIES</option>
                  <option value="PRAVALER">PRAVALER</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">(%) Financiamento</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="percentualFinanciamento"
                  value={formData.percentualFinanciamento}
                  onChange={handleInputChange}
                  placeholder="Percentual do financiamento"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Informações Adicionais */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Informações Adicionais</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Título Eleitoral</label>
                <input
                  type="text"
                  name="tituloEleitoral"
                  value={formData.tituloEleitoral}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Zona Eleitoral</label>
                <input
                  type="number"
                  min="0"
                  name="zonaEleitoral"
                  value={formData.zonaEleitoral}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Seção Eleitoral</label>
                <input
                  type="number"
                  min="0"
                  name="secaoEleitoral"
                  value={formData.secaoEleitoral}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Carteira Reservista</label>
                <input
                  type="text"
                  name="carteiraReservista"
                  value={formData.carteiraReservista}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Nº de Registro no Conselho</label>
                <input
                  type="text"
                  name="numeroRegistroConselho"
                  value={formData.numeroRegistroConselho}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Religião</label>
                <input
                  type="text"
                  name="religiao"
                  value={formData.religiao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">Laudo - CID</label>
              <input
                type="text"
                name="laudoCid"
                value={formData.laudoCid}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">Observações</label>
              <textarea
                name="observacoesAdicionais"
                value={formData.observacoesAdicionais}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Houve indicação? Quem?</label>
              <select
                name="indicacaoQuem"
                value={formData.indicacaoQuem}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              >
                <option value="">Escolha uma opção</option>
                <option value="NAO">Não houve indicação</option>
                <option value="AMIGO">Amigo(a)</option>
                <option value="ALUNO">Aluno(a)</option>
                <option value="PROFESSOR">Professor(a)</option>
                <option value="REDES_SOCIAIS">Redes Sociais</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          {/* Seção: Deficiências */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Deficiências</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Pessoa com deficiência (Pcd)?</label>
                <input
                  type="checkbox"
                  name="pessoaComDeficiencia"
                  checked={formData.pessoaComDeficiencia}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-teal-600 rounded cursor-pointer"
                />
              </div>

              {formData.pessoaComDeficiencia && (
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">Tipo de Deficiência</label>
                  <select
                    name="tipoDeficiencia"
                    value={formData.tipoDeficiencia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- Selecione uma opção -</option>
                    <option value="AUDITIVA">Auditiva</option>
                    <option value="VISUAL">Visual</option>
                    <option value="MOTORA">Motora</option>
                    <option value="INTELECTUAL">Intelectual</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Seção: Foto */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Foto</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-2 block">Adicionar Foto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg"
                />
              </div>

              {fotoAluno && (
                <div className="flex justify-center">
                  <div className="w-32 h-40 border-2 border-gray-300 rounded overflow-hidden">
                    <img src={fotoAluno} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Cadastrar'}
            </button>
            <Link href="/admin/alunos">
              <button
                type="button"
                className="px-12 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all"
              >
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
