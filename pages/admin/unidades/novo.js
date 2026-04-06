import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { formatarCNPJ, formatarCEP, formatarTelefone } from '@/utils/formatadores';

export default function NovaUnidade() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
  const [cursosSelecionados, setCursosSelecionados] = useState([]);
  const [instituicoes, setInstituicoes] = useState([]);
  const [carregandoInstituicoes, setCarregandoInstituicoes] = useState(true);

  const [formData, setFormData] = useState({
    // Seção Unidade
    instituicaoId: '',
    instituicaoNome: '',
    nome: '',
    cnpj: '',
    cep: '',
    cidade: '',
    endereco: '',
    numero: '',
    bairro: '',
    local: '',
    email: '',
    telefone: '',
    codigoPoloRecenseamento: '',
    instituicaoEnsinoSuperior: false,
    situacao: 'ATIVO',

    // Seção Mantenedora
    codMecMantenedora: '',
    cnpjMantenedora: '',
    razaoSocial: '',
    cepMantenedora: '',
    logradouroMantenedora: '',
    numeroMantenedora: '',
    complementoMantenedora: '',
    bairroMantenedora: '',
    ufMantenedora: '',

    // Seção Credenciamento
    tipoCredenciamento: '',
    numeroCredenciamento: '',
    dataCredenciamento: '',
    veiculoPublicacao: '',
    dataPublicacao: '',
    secaoPublicacao: '',
    paginaPublicacao: '',
    numeroDOU: '',

    // Recredenciamento
    temRecredenciamento: false,
    tipoRecredenciamento: '',
    numeroRecredenciamento: '',
    dataRecredenciamento: '',
    veiculoRecredenciamento: '',
    dataPublicacaoRecredenciamento: '',
    secaoRecredenciamento: '',
    paginaRecredenciamento: '',
    numeroDOURecredenciamento: '',
    numeroProcessoRecredenciamento: '',
    tipoProcessoRecredenciamento: '',
    dataCadastroRecredenciamento: '',
    dataProtocoloRecredenciamento: '',

    // Renovação
    temRenovacao: false,
    tipoRenovacao: '',
    numeroRenovacao: '',
    dataRenovacao: '',
    veiculoRenovacao: '',
    dataPublicacaoRenovacao: '',
    secaoRenovacao: '',
    paginaRenovacao: '',
    numeroDOURenovacao: '',
    numeroProcessoRenovacao: '',
    tipoProcessoRenovacao: '',
    dataCadastroRenovacao: '',
    dataProtocoloRenovacao: '',
  });

  useEffect(() => {
    carregarCursos();
    carregarInstituicoes();
  }, []);

  const carregarCursos = async () => {
    try {
      const response = await fetch('/api/cursos');
      if (response.ok) {
        const data = await response.json();
        setCursosDisponiveis(data);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const sanitizeNumber = (valor, maxLength) => {
    if (!valor) return '';
    return valor.replace(/\D/g, '').slice(0, maxLength);
  };

  const handleMaskedChange = (name, maxLength) => (e) => {
    const value = sanitizeNumber(e.target.value, maxLength);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const carregarInstituicoes = async () => {
    try {
      setCarregandoInstituicoes(true);
      const response = await fetch('/api/instituicoes');

      if (response.ok) {
        const data = await response.json();
        setInstituicoes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
    } finally {
      setCarregandoInstituicoes(false);
    }
  };

  const preencherDadosMantenedora = (instituicao) => {
    if (!instituicao) {
      setFormData((prev) => ({
        ...prev,
        codMecMantenedora: '',
        cnpjMantenedora: '',
        razaoSocial: '',
        cepMantenedora: '',
        logradouroMantenedora: '',
        numeroMantenedora: '',
        complementoMantenedora: '',
        bairroMantenedora: '',
        ufMantenedora: '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      codMecMantenedora: instituicao.codMec || instituicao.cod_mec || prev.codMecMantenedora || '',
      cnpjMantenedora: instituicao.cnpj || '',
      razaoSocial: instituicao.nome || '',
      cepMantenedora: instituicao.cep || '',
      logradouroMantenedora: instituicao.endereco || '',
      numeroMantenedora: prev.numeroMantenedora || '',
      complementoMantenedora: prev.complementoMantenedora || '',
      bairroMantenedora: prev.bairroMantenedora || '',
      ufMantenedora: instituicao.estado || '',
    }));
  };

  const handleInstituicaoChange = (e) => {
    const instituicaoId = e.target.value;
    const instituicaoSelecionada = instituicoes.find((inst) => inst.id?.toString() === instituicaoId);

    setFormData((prev) => ({
      ...prev,
      instituicaoId,
      instituicaoNome: instituicaoSelecionada?.nome || '',
    }));

    preencherDadosMantenedora(instituicaoSelecionada);
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
      }));

      setMessage({ type: 'success', text: 'Endereço preenchido automaticamente!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao buscar CEP: ' + error.message });
    }
  };

  // Handle para CEP com limpeza e formatação
  const handleCepChange = (e) => {
    const value = sanitizeNumber(e.target.value, 8);
    
    setFormData(prev => ({
      ...prev,
      cep: value
    }));

    // Buscar endereço quando CEP estiver completo
    if (value.length === 8) {
      buscarEnderecoPorCEP(value);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const adicionarCurso = (cursoId) => {
    const curso = cursosDisponiveis.find(c => c.id == cursoId);
    if (curso && !cursoDuplicado(cursoId)) {
      setCursosSelecionados([...cursosSelecionados, curso]);
    }
  };

  const removerCurso = (cursoId) => {
    setCursosSelecionados(cursosSelecionados.filter(c => c.id !== cursoId));
  };

  const cursoDuplicado = (cursoId) => {
    return cursosSelecionados.some(c => c.id == cursoId);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const dataToSave = {
        ...formData,
        cnpj: sanitizeNumber(formData.cnpj, 14),
        telefone: sanitizeNumber(formData.telefone, 11),
        cep: sanitizeNumber(formData.cep, 8),
        cnpjMantenedora: sanitizeNumber(formData.cnpjMantenedora, 14),
        cepMantenedora: sanitizeNumber(formData.cepMantenedora, 8),
        cursos: cursosSelecionados.map(c => c.id),
      };

      const response = await fetch('/api/unidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Unidade criada com sucesso!' });
        setTimeout(() => router.push('/admin/unidades'), 1500);
      } else {
        const payload = await response.json().catch(() => null);
        const detalhe = payload?.error || payload?.message || 'Erro ao criar unidade';
        console.error('Erro ao criar unidade:', payload || response.statusText);
        setMessage({ type: 'error', text: detalhe });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar unidade: ' + error.message });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link href="/admin/unidades">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base">
              ← Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span>🏢</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Nova Unidade
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
          <Link href="/admin/unidades">
            <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
            ➕ Inserir
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="space-y-6">
          {/* Seção: Dados da Unidade */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>🏢</span>
              <h2 className="text-lg font-bold">Dados da Unidade</h2>
            </div>

            <div className="space-y-4">
              {/* Linha 1: Nome */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Nome da Unidade"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  required
                />
              </div>

              {/* Linha 2: CNPJ e Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formatarCNPJ(formData.cnpj || '')}
                    onChange={handleMaskedChange('cnpj', 14)}
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>
              </div>

              {/* Linha 3: CEP */}
              <div className="max-w-xs">
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  CEP
                </label>
                <div>
                  <input
                    type="text"
                    name="cep"
                    value={formatarCEP(formData.cep || '')}
                    onChange={handleCepChange}
                    placeholder="CEP"
                    maxLength="8"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                  <p className="text-xs text-teal-600 mt-1">📍 Preencha automaticamente</p>
                </div>
              </div>

              {/* Linha 4: Endereço, Número e Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    placeholder="Rua, Avenida, etc"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Nº
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    placeholder="Nº"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 5: Cidade, Bairro e Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    placeholder="Bairro"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formatarTelefone(formData.telefone || '')}
                    onChange={handleMaskedChange('telefone', 11)}
                    placeholder="(XX) XXXX-XXXX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>
              </div>

              {/* Linha 6: Local e Código do Polo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Local
                  </label>
                  <input
                    type="text"
                    name="local"
                    value={formData.local}
                    onChange={handleChange}
                    placeholder="Sala, Bloco, etc"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Código do Polo no Recenseamento
                  </label>
                  <input
                    type="text"
                    name="codigoPoloRecenseamento"
                    value={formData.codigoPoloRecenseamento}
                    onChange={handleChange}
                    placeholder="Código"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 7: Instituição e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-teal-600 mt-4">
                    <input
                      type="checkbox"
                      name="instituicaoEnsinoSuperior"
                      checked={formData.instituicaoEnsinoSuperior}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-teal-300 text-teal-600"
                    />
                    Instituição de Ensino Superior?
                  </label>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    STATUS <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="situacao"
                    value={formData.situacao}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Dados da Mantenedora */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>🏛️</span>
              <h2 className="text-lg font-bold">Dados da Mantenedora</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  Instituição <span className="text-red-500">*</span>
                </label>
                <select
                  name="instituicaoId"
                  value={formData.instituicaoId}
                  onChange={handleInstituicaoChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  required
                >
                  <option value="">Selecione a instituição</option>
                  {carregandoInstituicoes ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    instituicoes.map((inst) => (
                      <option key={inst.id || inst.nome} value={inst.id}>
                        {inst.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Linha 1: Cód. MEC e CNPJ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Cód. MEC Mantenedora
                  </label>
                  <input
                    type="text"
                    name="codMecMantenedora"
                    value={formData.codMecMantenedora}
                    onChange={handleChange}
                    placeholder="Código MEC"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    CNPJ da Mantenedora
                  </label>
                  <input
                    type="text"
                    name="cnpjMantenedora"
                    value={formatarCNPJ(formData.cnpjMantenedora || '')}
                    onChange={handleMaskedChange('cnpjMantenedora', 14)}
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 2: Razão Social */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  Razão Social
                </label>
                <input
                  type="text"
                  name="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={handleChange}
                  placeholder="Razão Social da Mantenedora"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              {/* Linha 3: CEP e Logradouro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cepMantenedora"
                    value={formatarCEP(formData.cepMantenedora || '')}
                    onChange={handleMaskedChange('cepMantenedora', 8)}
                    placeholder="CEP"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    name="logradouroMantenedora"
                    value={formData.logradouroMantenedora}
                    onChange={handleChange}
                    placeholder="Logradouro"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 4: Nº, Complemento e Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Nº
                  </label>
                  <input
                    type="text"
                    name="numeroMantenedora"
                    value={formData.numeroMantenedora}
                    onChange={handleChange}
                    placeholder="Nº"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complementoMantenedora"
                    value={formData.complementoMantenedora}
                    onChange={handleChange}
                    placeholder="Complemento"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairroMantenedora"
                    value={formData.bairroMantenedora}
                    onChange={handleChange}
                    placeholder="Bairro"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 5: UF */}
              <div className="max-w-xs">
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  UF
                </label>
                <input
                  type="text"
                  name="ufMantenedora"
                  value={formData.ufMantenedora}
                  onChange={handleChange}
                  placeholder="UF"
                  maxLength="2"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Credenciamento */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>📜</span>
              <h2 className="text-lg font-bold">Credenciamento</h2>
            </div>

            <div className="space-y-4">
              {/* Linha 1: Tipo, Número e Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Tipo
                  </label>
                  <select
                    name="tipoCredenciamento"
                    value={formData.tipoCredenciamento}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">Selecione</option>
                    <option value="CREDENCIAMENTO">Credenciamento</option>
                    <option value="RECREDENCIAMENTO">Recredenciamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    name="numeroCredenciamento"
                    value={formData.numeroCredenciamento}
                    onChange={handleChange}
                    placeholder="Número"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    name="dataCredenciamento"
                    value={formData.dataCredenciamento}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 2: Veículo, Data Publicação e Seção */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Veículo de Publicação
                  </label>
                  <input
                    type="text"
                    name="veiculoPublicacao"
                    value={formData.veiculoPublicacao}
                    onChange={handleChange}
                    placeholder="Veículo"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Data de Publicação
                  </label>
                  <input
                    type="date"
                    name="dataPublicacao"
                    value={formData.dataPublicacao}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Seção
                  </label>
                  <input
                    type="text"
                    name="secaoPublicacao"
                    value={formData.secaoPublicacao}
                    onChange={handleChange}
                    placeholder="Seção"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 3: Página e Nº DOU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Página
                  </label>
                  <input
                    type="text"
                    name="paginaPublicacao"
                    value={formData.paginaPublicacao}
                    onChange={handleChange}
                    placeholder="Página"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Número DOU
                  </label>
                  <input
                    type="text"
                    name="numeroDOU"
                    value={formData.numeroDOU}
                    onChange={handleChange}
                    placeholder="Nº DOU"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Toggle: Recredenciamento */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="temRecredenciamento"
                checked={formData.temRecredenciamento}
                onChange={handleChange}
                className="w-4 h-4 rounded border-blue-300 text-blue-600"
              />
              <span className="text-sm font-medium text-blue-700">
                Inserir Informações de Recredenciamento
              </span>
            </label>
          </div>

          {/* Seção: Recredenciamento (Condicional) */}
          {formData.temRecredenciamento && (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex items-center gap-2 mb-6 text-teal-600">
                <span>🔄</span>
                <h2 className="text-lg font-bold">Recredenciamento</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Tipo</label>
                    <input type="text" name="tipoRecredenciamento" value={formData.tipoRecredenciamento} onChange={handleChange} placeholder="Tipo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Nº</label>
                    <input type="text" name="numeroRecredenciamento" value={formData.numeroRecredenciamento} onChange={handleChange} placeholder="Nº" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data</label>
                    <input type="date" name="dataRecredenciamento" value={formData.dataRecredenciamento} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Veículo de Publicação</label>
                  <input type="text" name="veiculoRecredenciamento" value={formData.veiculoRecredenciamento || ''} onChange={handleChange} placeholder="Veículo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data de Publicação</label>
                    <input type="date" name="dataPublicacaoRecredenciamento" value={formData.dataPublicacaoRecredenciamento || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Seção de Publicação</label>
                    <input type="text" name="secaoRecredenciamento" value={formData.secaoRecredenciamento || ''} onChange={handleChange} placeholder="Seção" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Página</label>
                    <input type="text" name="paginaRecredenciamento" value={formData.paginaRecredenciamento || ''} onChange={handleChange} placeholder="Página" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                </div>

                <div className="max-w-xs">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Número DOU</label>
                  <input type="text" name="numeroDOURecredenciamento" value={formData.numeroDOURecredenciamento || ''} onChange={handleChange} placeholder="Nº DOU" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <div className="flex items-center gap-2 mb-4 text-teal-600">
                  <span>📋</span>
                  <h3 className="text-base font-bold">Tramitação de Recredenciamento</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Número do Processo</label>
                      <input type="text" name="numeroProcessoRecredenciamento" value={formData.numeroProcessoRecredenciamento || ''} onChange={handleChange} placeholder="Nº Processo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Tipo do Processo</label>
                      <input type="text" name="tipoProcessoRecredenciamento" value={formData.tipoProcessoRecredenciamento || ''} onChange={handleChange} placeholder="Tipo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data de Cadastro</label>
                      <input type="date" name="dataCadastroRecredenciamento" value={formData.dataCadastroRecredenciamento || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data do Protocolo</label>
                      <input type="date" name="dataProtocoloRecredenciamento" value={formData.dataProtocoloRecredenciamento || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle: Renovação */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="temRenovacao"
                checked={formData.temRenovacao}
                onChange={handleChange}
                className="w-4 h-4 rounded border-green-300 text-green-600"
              />
              <span className="text-sm font-medium text-green-700">
                Inserir Informações de Renovação de Recredenciamento
              </span>
            </label>
          </div>

          {/* Seção: Renovação (Condicional) */}
          {formData.temRenovacao && (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex items-center gap-2 mb-6 text-teal-600">
                <span>♻️</span>
                <h2 className="text-lg font-bold">Renovação de Recredenciamento</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                      Tipo
                    </label>
                    <input
                      type="text"
                      name="tipoRenovacao"
                      value={formData.tipoRenovacao}
                      onChange={handleChange}
                      placeholder="Tipo"
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                      Nº
                    </label>
                    <input
                      type="text"
                      name="numeroRenovacao"
                      value={formData.numeroRenovacao}
                      onChange={handleChange}
                      placeholder="Número"
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      name="dataRenovacao"
                      value={formData.dataRenovacao}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Veículo de Publicação
                  </label>
                  <input
                    type="text"
                    name="veiculoRenovacao"
                    value={formData.veiculoRenovacao}
                    onChange={handleChange}
                    placeholder="Veículo de Publicação"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                      Data de Publicação
                    </label>
                    <input
                      type="date"
                      name="dataPublicacaoRenovacao"
                      value={formData.dataPublicacaoRenovacao}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                      Seção de Publicação
                    </label>
                    <input
                      type="text"
                      name="secaoRenovacao"
                      value={formData.secaoRenovacao}
                      onChange={handleChange}
                      placeholder="Seção"
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                      Página de Publicação
                    </label>
                    <input
                      type="text"
                      name="paginaRenovacao"
                      value={formData.paginaRenovacao}
                      onChange={handleChange}
                      placeholder="Página"
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>
                </div>
                <div className="max-w-xs">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Número DOU
                  </label>
                  <input
                    type="text"
                    name="numeroDOURenovacao"
                    value={formData.numeroDOURenovacao}
                    onChange={handleChange}
                    placeholder="Número DOU"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <div className="flex items-center gap-2 mb-4 text-teal-600">
                  <span>📋</span>
                  <h3 className="text-base font-bold">Tramitação de Renovação de Recredenciamento</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                        Número do Processo
                      </label>
                      <input
                        type="text"
                        name="numeroProcessoRenovacao"
                        value={formData.numeroProcessoRenovacao}
                        onChange={handleChange}
                        placeholder="Número do Processo"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                        Tipo do Processo
                      </label>
                      <input
                        type="text"
                        name="tipoProcessoRenovacao"
                        value={formData.tipoProcessoRenovacao}
                        onChange={handleChange}
                        placeholder="Tipo do Processo"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                        Data de Cadastro
                      </label>
                      <input
                        type="date"
                        name="dataCadastroRenovacao"
                        value={formData.dataCadastroRenovacao}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                        Data do Protocolo
                      </label>
                      <input
                        type="date"
                        name="dataProtocoloRenovacao"
                        value={formData.dataProtocoloRenovacao}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DICA */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div className="flex items-start gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-yellow-700 mb-2">DICA</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  Para adicionar cursos na unidade, basta selecioná-los em <strong>Cursos Disponíveis</strong> e clicar em <strong>Adicionar</strong>.
                </p>
                <p className="text-sm text-yellow-700">
                  Para remover cursos, basta selecioná-los em <strong>Cursos da Unidade</strong> e clicar em <strong>Remover</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Seção: Cursos */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>📚</span>
              <h2 className="text-lg font-bold">Cursos da Unidade</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cursos Disponíveis */}
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-600 bg-blue-100 px-3 py-2 rounded mb-3">
                  Cursos Disponíveis
                </p>
                <div className="border border-gray-300 rounded-lg p-3 h-48 overflow-y-auto bg-gray-50">
                  {cursosDisponiveis.length > 0 ? (
                    cursosDisponiveis
                      .filter(c => !cursoDuplicado(c.id))
                      .map(curso => (
                        <div
                          key={curso.id}
                          className="flex justify-between items-center p-2 hover:bg-blue-100 rounded text-sm"
                        >
                          <span className="text-gray-700">{curso.nome}</span>
                          <button
                            type="button"
                            onClick={() => adicionarCurso(curso.id)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold transition"
                          >
                            ➕
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-xs">Nenhum curso disponível</p>
                  )}
                </div>
              </div>

              {/* Cursos Selecionados */}
              <div>
                <p className="text-xs md:text-sm font-medium text-green-600 bg-green-100 px-3 py-2 rounded mb-3">
                  Cursos da Unidade
                </p>
                <div className="border border-gray-300 rounded-lg p-3 h-48 overflow-y-auto bg-gray-50">
                  {cursosSelecionados.length > 0 ? (
                    cursosSelecionados.map(curso => (
                      <div
                        key={curso.id}
                        className="flex justify-between items-center p-2 hover:bg-red-100 rounded text-sm"
                      >
                        <span className="text-gray-700">{curso.nome}</span>
                        <button
                          type="button"
                          onClick={() => removerCurso(curso.id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
                        >
                          ➖
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs">Nenhum curso selecionado</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link href="/admin/unidades">
              <button
                type="button"
                className="px-6 py-2 text-center text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {salvando ? '⏳ Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
