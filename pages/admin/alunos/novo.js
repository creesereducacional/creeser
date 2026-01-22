import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function CadastroAluno() {
  const router = useRouter();
  const { id } = router.query;
  const isEditando = id && id !== 'novo';

  const [formData, setFormData] = useState({
    // Identificação
    instituicao: 'CREESER',
    turma: '',
    anoLetivo: new Date().getFullYear().toString(),
    turnoIntegral: false,
    semestre: '',
    
    // Dados Pessoais
    nome: '',
    nomeSocial: false,
    cpf: '',
    estadoCivil: '',
    sexo: '',
    dtNascimento: '',
    rg: '',
    dataExpedicaoRG: '',
    orgaoExpedidorRG: '',
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
    
    // Status
    status: 'ATIVO'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fotoAluno, setFotoAluno] = useState(null);

  useEffect(() => {
    if (isEditando) {
      carregarAluno();
    }
  }, [isEditando]);

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
          turma: data.turmaid ? data.turmaid.toString() : '',
          anoLetivo: data.ano_letivo ? data.ano_letivo.toString() : new Date().getFullYear().toString(),
          turnoIntegral: data.turno_integral || false,
          semestre: data.semestre || '',
          
          // DADOS PESSOAIS
          nome: data.nome || '',
          nomeSocial: data.nome_social || false,
          cpf: data.cpf || '',
          estadoCivil: data.estadocivil || '',
          sexo: data.sexo || '',
          dtNascimento: data.data_nascimento || '',
          rg: data.rg || '',
          dataExpedicaoRG: data.data_expedicao_rg || '',
          orgaoExpedidorRG: data.orgao_expedidor_rg || '',
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">INSTITUIÇÃO</label>
                <select
                  name="instituicao"
                  value={formData.instituicao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="CREESER">CREESER</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA</label>
                <select
                  name="turma"
                  value={formData.turma}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione uma Turma</option>
                  <option value="1A">1A</option>
                  <option value="1B">1B</option>
                  <option value="2A">2A</option>
                  <option value="2B">2B</option>
                  <option value="3A">3A</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">ANO LETIVO</label>
                <input
                  type="number"
                  name="anoLetivo"
                  value={formData.anoLetivo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <input
                  type="checkbox"
                  name="nomeSocial"
                  checked={formData.nomeSocial}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-teal-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="BA">BA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">Naturalidade</label>
                <input
                  type="text"
                  name="naturalidade"
                  value={formData.naturalidade}
                  onChange={handleInputChange}
                  placeholder="Naturalidade"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UF Naturalidade</label>
                <select
                  name="ufNaturalidade"
                  value={formData.ufNaturalidade}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
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
          </div>

          {/* Seção: Registro de Nascimento */}
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
                <option value="SP">SP</option>
                <option value="RJ">RJ</option>
                <option value="MG">MG</option>
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
