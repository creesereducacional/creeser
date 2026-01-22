import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function CadastroFuncionario() {
  const router = useRouter();
  const { id } = router.query;
  const isEditando = id && id !== 'novo';

  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    email: '',
    cpf: '',
    funcao: '',
    rg: '',
    telefoneCelular: '',
    whatsapp: '',
    cep: '',
    endereco: '',
    numero: '',
    grupo: '',
    
    // Endereço
    cidade: '',
    bairro: '',
    uf: '',
    
    // Datas
    dtNascimento: '',
    dtAdmissao: '',
    
    // Status
    status: 'ATIVO',
    
    // Dados Financeiros
    banco: '',
    agencia: '',
    contaCorrente: '',
    pix: '',
    obs: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para Grupos
  const [grupos, setGrupos] = useState(['ADMINISTRATIVO', 'PEDAGOGICO', 'OPERACIONAL']);
  const [novoGrupo, setNovoGrupo] = useState('');
  const [showModalGrupo, setShowModalGrupo] = useState(false);
  
  // Estados para Funções
  const [funcoes, setFuncoes] = useState([
    'AGENTE ADMINISTRATIVO',
    'AUXILIAR ADMINISTRATIVO',
    'PROFESSOR',
    'COORDENADOR',
    'DIRETOR'
  ]);
  const [novaFuncao, setNovaFuncao] = useState('');
  const [showModalFuncao, setShowModalFuncao] = useState(false);

  useEffect(() => {
    if (isEditando) {
      carregarFuncionario();
    }
  }, [isEditando]);

  const carregarFuncionario = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/funcionarios/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar funcionário' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-preenchimento de endereço ao inserir CEP
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

  // Handle para CEP com limpeza e formatação
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove não-dígitos
    if (value.length > 8) value = value.slice(0, 8);
    
    setFormData(prev => ({
      ...prev,
      cep: value
    }));

    // Buscar endereço quando CEP estiver completo
    if (value.length === 8) {
      buscarEnderecoPorCEP(value);
    }
  };

  const adicionarGrupo = () => {
    if (novoGrupo.trim() && !grupos.includes(novoGrupo.toUpperCase())) {
      const grupoMaiusculo = novoGrupo.toUpperCase();
      setGrupos([...grupos, grupoMaiusculo]);
      setFormData(prev => ({ ...prev, grupo: grupoMaiusculo }));
      setNovoGrupo('');
      setShowModalGrupo(false);
      setMessage({ type: 'success', text: 'Grupo adicionado com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  };

  const adicionarFuncao = () => {
    if (novaFuncao.trim() && !funcoes.includes(novaFuncao.toUpperCase())) {
      const funcaoMaiuscula = novaFuncao.toUpperCase();
      setFuncoes([...funcoes, funcaoMaiuscula]);
      setFormData(prev => ({ ...prev, funcao: funcaoMaiuscula }));
      setNovaFuncao('');
      setShowModalFuncao(false);
      setMessage({ type: 'success', text: 'Função adicionada com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const method = isEditando ? 'PUT' : 'POST';
      const url = isEditando ? `/api/funcionarios/${id}` : '/api/funcionarios';

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
            ? 'Funcionário atualizado com sucesso!' 
            : 'Funcionário cadastrado com sucesso!' 
        });
        
        setTimeout(() => {
          router.push('/admin/funcionarios');
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao salvar funcionário' });
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
          <Link href="/admin/funcionarios">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base">
              ← Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span>👤</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {isEditando ? 'Editar Funcionário' : 'Novo Funcionário'}
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

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <Link href="/admin/funcionarios">
            <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
            ➕ Inserir
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>👤</span>
              <h2 className="text-lg font-bold">Dados Pessoais</h2>
            </div>

            <div className="space-y-4">
              {/* Linha 1: Nome e Grupo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome do Funcionário"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Grupo
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="grupo"
                      value={formData.grupo || ''}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    >
                      <option value="">Escolha um Grupo</option>
                      {grupos.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowModalGrupo(true)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition shadow-md"
                      title="Adicionar novo grupo"
                    >
                      ➕
                    </button>
                  </div>
                </div>
              </div>

              {/* Linha 2: Email, CPF e Função */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="Somente Números"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Função <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="funcao"
                      value={formData.funcao}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      required
                    >
                      <option value="">Escolha uma Função</option>
                      {funcoes.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowModalFuncao(true)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition shadow-md"
                      title="Adicionar nova função"
                    >
                      ➕
                    </button>
                  </div>
                </div>
              </div>

              {/* Linha 3: RG, Telefone Celular e Whatsapp */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    RG
                  </label>
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
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Telefone Celular
                  </label>
                  <input
                    type="tel"
                    name="telefoneCelular"
                    value={formData.telefoneCelular}
                    onChange={handleInputChange}
                    placeholder="(XX) XXXX-XXXX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Whatsapp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>
              </div>

              {/* Linha 4: CEP, Endereço e Número */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    CEP
                  </label>
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
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleInputChange}
                    placeholder="Rua, Avenida, etc"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Número
                  </label>
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

              {/* Linha 5: Cidade, Bairro e UF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Cidade
                  </label>
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
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Bairro
                  </label>
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
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    UF
                  </label>
                  <input
                    type="text"
                    name="uf"
                    value={formData.uf}
                    onChange={handleInputChange}
                    placeholder="UF"
                    maxLength="2"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 6: Datas e Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Dt. Nascimento
                  </label>
                  <input
                    type="date"
                    name="dtNascimento"
                    value={formData.dtNascimento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Dt. Admissão
                  </label>
                  <input
                    type="date"
                    name="dtAdmissao"
                    value={formData.dtAdmissao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    STATUS
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Dados Financeiros */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>💰</span>
              <h2 className="text-lg font-bold">Dados Financeiros</h2>
            </div>

            <div className="space-y-4">
              {/* Linha 1: Banco, Agência e Conta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Banco
                  </label>
                  <select
                    name="banco"
                    value={formData.banco}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">Escolha um Banco</option>
                    <option value="BB">Banco do Brasil</option>
                    <option value="CEF">Caixa Econômica</option>
                    <option value="BRADESCO">Bradesco</option>
                    <option value="ITAU">Itaú</option>
                    <option value="SANTANDER">Santander</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Agência
                  </label>
                  <input
                    type="text"
                    name="agencia"
                    value={formData.agencia}
                    onChange={handleInputChange}
                    placeholder="Agência"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Conta Corrente
                  </label>
                  <input
                    type="text"
                    name="contaCorrente"
                    value={formData.contaCorrente}
                    onChange={handleInputChange}
                    placeholder="Conta Corrente"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 2: PIX e OBS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    PIX
                  </label>
                  <input
                    type="text"
                    name="pix"
                    value={formData.pix}
                    onChange={handleInputChange}
                    placeholder="PIX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    OBS.
                  </label>
                  <input
                    type="text"
                    name="obs"
                    value={formData.obs}
                    onChange={handleInputChange}
                    placeholder="Observações"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Cadastrar */}
          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : (isEditando ? 'Atualizar' : 'Criar')}
            </button>
            <Link href="/admin/funcionarios">
              <button
                type="button"
                className="px-12 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all"
              >
                Cancelar
              </button>
            </Link>
          </div>
        </form>

        {/* Modal para Adicionar Grupo */}
        {showModalGrupo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header com Logo */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center justify-center" style={{ width: '250px', height: '70px' }}>
                    <img src="/images/logo_creeser.png" alt="CREESER" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white text-center">Adicionar Novo Grupo</h2>
              </div>
              
              {/* Conteúdo */}
              <div className="p-6">
                <input
                  type="text"
                  value={novoGrupo}
                  onChange={(e) => setNovoGrupo(e.target.value)}
                  placeholder="Digite o nome do grupo"
                  className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 mb-6 bg-teal-50"
                  onKeyPress={(e) => e.key === 'Enter' && adicionarGrupo()}
                  autoFocus
                />
                
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModalGrupo(false);
                      setNovoGrupo('');
                    }}
                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={adicionarGrupo}
                    className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:shadow-lg text-slate-900 rounded-lg transition font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Adicionar Função */}
        {showModalFuncao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header com Logo */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center justify-center" style={{ width: '250px', height: '70px' }}>
                    <img src="/images/logo_creeser.png" alt="CREESER" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white text-center">Adicionar Nova Função</h2>
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                <input
                  type="text"
                  value={novaFuncao}
                  onChange={(e) => setNovaFuncao(e.target.value)}
                  placeholder="Digite o nome da função"
                  className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 mb-6 bg-teal-50"
                  onKeyPress={(e) => e.key === 'Enter' && adicionarFuncao()}
                  autoFocus
                />
                
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModalFuncao(false);
                      setNovaFuncao('');
                    }}
                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={adicionarFuncao}
                    className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:shadow-lg text-slate-900 rounded-lg transition font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
