import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { formatarCNPJ, formatarCEP, formatarTelefone } from '@/utils/formatadores';

export default function EditarUnidade() {
  const router = useRouter();
  const { id } = router.query;
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
  const [cursosSelecionados, setCursosSelecionados] = useState([]);
  const [instituicoes, setInstituicoes] = useState([]);
  const [carregandoInstituicoes, setCarregandoInstituicoes] = useState(true);

  const [formData, setFormData] = useState({
    instituicaoId: '', instituicaoNome: '',
    nome: '', cnpj: '', cep: '', cidade: '', endereco: '', numero: '', bairro: '', local: '', email: '', telefone: '', codigoPoloRecenseamento: '', instituicaoEnsinoSuperior: false, situacao: 'ATIVO',
    codMecMantenedora: '', cnpjMantenedora: '', razaoSocial: '', cepMantenedora: '', logradouroMantenedora: '', numeroMantenedora: '', complementoMantenedora: '', bairroMantenedora: '', ufMantenedora: '',
    tipoCredenciamento: '', numeroCredenciamento: '', dataCredenciamento: '', veiculoPublicacao: '', dataPublicacao: '', secaoPublicacao: '', paginaPublicacao: '', numeroDOU: '',
    temRecredenciamento: false, tipoRecredenciamento: '', numeroRecredenciamento: '', dataRecredenciamento: '', veiculoRecredenciamento: '', dataPublicacaoRecredenciamento: '', secaoRecredenciamento: '', paginaRecredenciamento: '', numeroDOURecredenciamento: '', numeroProcessoRecredenciamento: '', tipoProcessoRecredenciamento: '', dataCadastroRecredenciamento: '', dataProtocoloRecredenciamento: '',
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
    if (id) {
      carregarUnidade();
      carregarCursos();
      carregarInstituicoes();
    }
  }, [id]);

  useEffect(() => {
    if (instituicoes.length === 0) return;

    if (!formData.instituicaoId && formData.instituicaoNome) {
      const instituicaoPorNome = instituicoes.find(
        (inst) => inst.nome?.toString() === formData.instituicaoNome.toString()
      );
      if (instituicaoPorNome) {
        setFormData((prev) => ({
          ...prev,
          instituicaoId: instituicaoPorNome.id?.toString() || '',
          instituicaoNome: instituicaoPorNome.nome || prev.instituicaoNome,
        }));
      }
      return;
    }

    if (!formData.instituicaoId) return;

    const instituicaoSelecionada = instituicoes.find(
      (inst) => inst.id?.toString() === formData.instituicaoId.toString()
    );
    if (instituicaoSelecionada) {
      preencherDadosMantenedora(instituicaoSelecionada);
    }
  }, [formData.instituicaoId, formData.instituicaoNome, instituicoes]);

  const carregarUnidade = async () => {
    try {
      const response = await fetch(`/api/unidades/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          instituicaoId: data.instituicaoId || '',
          instituicaoNome: data.instituicaoNome || data.instituicao || '',
        });
        if (data.cursos) {
          const cursosData = await Promise.all(
            data.cursos.map(cursoId =>
              fetch(`/api/cursos/${cursoId}`).then(r => r.json())
            )
          );
          setCursosSelecionados(cursosData);
        }
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar unidade' });
      }
    } catch (error) {
      console.error('Erro ao carregar unidade:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar unidade: ' + error.message });
    } finally {
      setCarregando(false);
    }
  };

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

  const handleCepChange = (e) => {
    const value = sanitizeNumber(e.target.value, 8);
    
    setFormData(prev => ({
      ...prev,
      cep: value
    }));

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

      const response = await fetch(`/api/unidades/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Unidade atualizada com sucesso!' });
        setTimeout(() => router.push('/admin/unidades'), 1500);
      } else {
        const payload = await response.json().catch(() => null);
        const detalhe = payload?.error || payload?.message || 'Erro ao atualizar unidade';
        console.error('Erro ao atualizar unidade:', payload || response.statusText);
        setMessage({ type: 'error', text: detalhe });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar unidade: ' + error.message });
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <p className="text-lg text-gray-600">⏳ Carregando dados...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link href="/admin/unidades">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base">
              ← Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span>🏢</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Editar Unidade
            </h1>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <Link href="/admin/unidades">
            <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
            ✏️ Editar
          </button>
        </div>

        <form onSubmit={handleSalvar} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>🏢</span>
              <h2 className="text-lg font-bold">Dados da Unidade</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Nome <span className="text-red-500">*</span></label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome da Unidade" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">CNPJ</label>
                  <input type="text" name="cnpj" value={formatarCNPJ(formData.cnpj || '')} onChange={handleMaskedChange('cnpj', 14)} placeholder="XX.XXX.XXX/XXXX-XX" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" required />
                </div>
              </div>
              <div className="max-w-xs">
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">CEP</label>
                <input type="text" name="cep" value={formatarCEP(formData.cep || '')} onChange={handleCepChange} placeholder="CEP" maxLength="8" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                <p className="text-xs text-teal-600 mt-1">📍 Preencha automaticamente</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Endereço</label>
                  <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Rua, Avenida, etc" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Nº</label>
                  <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Nº" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Cidade</label>
                  <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Cidade" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Bairro</label>
                  <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Bairro" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Telefone <span className="text-red-500">*</span></label>
                  <input type="tel" name="telefone" value={formatarTelefone(formData.telefone || '')} onChange={handleMaskedChange('telefone', 11)} placeholder="(XX) XXXX-XXXX" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Local</label>
                  <input type="text" name="local" value={formData.local} onChange={handleChange} placeholder="Sala, Bloco, etc" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Código do Polo</label>
                  <input type="text" name="codigoPoloRecenseamento" value={formData.codigoPoloRecenseamento} onChange={handleChange} placeholder="Código" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-teal-600 mt-4">
                    <input type="checkbox" name="instituicaoEnsinoSuperior" checked={formData.instituicaoEnsinoSuperior} onChange={handleChange} className="w-4 h-4 rounded border-teal-300 text-teal-600" />
                    Instituição de Ensino Superior?
                  </label>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">STATUS <span className="text-red-500">*</span></label>
                  <select name="situacao" value={formData.situacao} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" required>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>🏛️</span>
              <h2 className="text-lg font-bold">Dados da Mantenedora</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Instituição <span className="text-red-500">*</span></label>
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
                    instituicoes.map((inst, index) => (
                      <option key={`${inst.id || inst.nome || 'instituicao'}-${index}`} value={inst.id}>
                        {inst.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Cód. MEC</label>
                  <input type="text" name="codMecMantenedora" value={formData.codMecMantenedora} onChange={handleChange} placeholder="Código MEC" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">CNPJ da Mantenedora</label>
                  <input type="text" name="cnpjMantenedora" value={formatarCNPJ(formData.cnpjMantenedora || '')} onChange={handleMaskedChange('cnpjMantenedora', 14)} placeholder="XX.XXX.XXX/XXXX-XX" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Razão Social</label>
                <input type="text" name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} placeholder="Razão Social da Mantenedora" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">CEP</label>
                  <input type="text" name="cepMantenedora" value={formatarCEP(formData.cepMantenedora || '')} onChange={handleMaskedChange('cepMantenedora', 8)} placeholder="CEP" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Logradouro</label>
                  <input type="text" name="logradouroMantenedora" value={formData.logradouroMantenedora} onChange={handleChange} placeholder="Logradouro" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Nº</label>
                  <input type="text" name="numeroMantenedora" value={formData.numeroMantenedora} onChange={handleChange} placeholder="Nº" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Complemento</label>
                  <input type="text" name="complementoMantenedora" value={formData.complementoMantenedora} onChange={handleChange} placeholder="Complemento" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Bairro</label>
                  <input type="text" name="bairroMantenedora" value={formData.bairroMantenedora} onChange={handleChange} placeholder="Bairro" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
              <div className="max-w-xs">
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">UF</label>
                <input type="text" name="ufMantenedora" value={formData.ufMantenedora} onChange={handleChange} placeholder="UF" maxLength="2" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>📜</span>
              <h2 className="text-lg font-bold">Credenciamento</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Tipo</label>
                  <select name="tipoCredenciamento" value={formData.tipoCredenciamento} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
                    <option value="">Selecione</option>
                    <option value="CREDENCIAMENTO">Credenciamento</option>
                    <option value="RECREDENCIAMENTO">Recredenciamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Número</label>
                  <input type="text" name="numeroCredenciamento" value={formData.numeroCredenciamento} onChange={handleChange} placeholder="Número" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data</label>
                  <input type="date" name="dataCredenciamento" value={formData.dataCredenciamento} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Veículo</label>
                  <input type="text" name="veiculoPublicacao" value={formData.veiculoPublicacao} onChange={handleChange} placeholder="Veículo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data Publicação</label>
                  <input type="date" name="dataPublicacao" value={formData.dataPublicacao} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Seção</label>
                  <input type="text" name="secaoPublicacao" value={formData.secaoPublicacao} onChange={handleChange} placeholder="Seção" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Página</label>
                  <input type="text" name="paginaPublicacao" value={formData.paginaPublicacao} onChange={handleChange} placeholder="Página" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Número DOU</label>
                  <input type="text" name="numeroDOU" value={formData.numeroDOU} onChange={handleChange} placeholder="Nº DOU" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="temRecredenciamento" checked={formData.temRecredenciamento} onChange={handleChange} className="w-4 h-4 rounded border-blue-300 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Inserir Informações de Recredenciamento</span>
            </label>
          </div>

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

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="temRenovacao" checked={formData.temRenovacao} onChange={handleChange} className="w-4 h-4 rounded border-green-300 text-green-600" />
              <span className="text-sm font-medium text-green-700">Inserir Informações de Renovação de Recredenciamento</span>
            </label>
          </div>

          {formData.temRenovacao && (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex items-center gap-2 mb-6 text-teal-600">
                <span>♻️</span>
                <h2 className="text-lg font-bold">Renovação de Recredenciamento</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Tipo</label>
                    <input type="text" name="tipoRenovacao" value={formData.tipoRenovacao || ''} onChange={handleChange} placeholder="Tipo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Nº</label>
                    <input type="text" name="numeroRenovacao" value={formData.numeroRenovacao || ''} onChange={handleChange} placeholder="Número" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data</label>
                    <input type="date" name="dataRenovacao" value={formData.dataRenovacao || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Veículo de Publicação</label>
                  <input type="text" name="veiculoRenovacao" value={formData.veiculoRenovacao || ''} onChange={handleChange} placeholder="Veículo de Publicação" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data de Publicação</label>
                    <input type="date" name="dataPublicacaoRenovacao" value={formData.dataPublicacaoRenovacao || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Seção de Publicação</label>
                    <input type="text" name="secaoRenovacao" value={formData.secaoRenovacao || ''} onChange={handleChange} placeholder="Seção" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Página de Publicação</label>
                    <input type="text" name="paginaRenovacao" value={formData.paginaRenovacao || ''} onChange={handleChange} placeholder="Página" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                  </div>
                </div>
                <div className="max-w-xs">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Número DOU</label>
                  <input type="text" name="numeroDOURenovacao" value={formData.numeroDOURenovacao || ''} onChange={handleChange} placeholder="Número DOU" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
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
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Número do Processo</label>
                      <input type="text" name="numeroProcessoRenovacao" value={formData.numeroProcessoRenovacao || ''} onChange={handleChange} placeholder="Número do Processo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Tipo do Processo</label>
                      <input type="text" name="tipoProcessoRenovacao" value={formData.tipoProcessoRenovacao || ''} onChange={handleChange} placeholder="Tipo do Processo" className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data de Cadastro</label>
                      <input type="date" name="dataCadastroRenovacao" value={formData.dataCadastroRenovacao || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">Data do Protocolo</label>
                      <input type="date" name="dataProtocoloRenovacao" value={formData.dataProtocoloRenovacao || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>📚</span>
              <h2 className="text-lg font-bold">Cursos da Unidade</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-600 bg-blue-100 px-3 py-2 rounded mb-3">Cursos Disponíveis</p>
                <div className="border border-gray-300 rounded-lg p-3 h-48 overflow-y-auto bg-gray-50">
                  {cursosDisponiveis.length > 0 ? (
                    cursosDisponiveis
                      .filter(c => !cursoDuplicado(c.id))
                      .map((curso, index) => (
                        <div key={`${curso.id || curso.nome || 'curso'}-${index}`} className="flex justify-between items-center p-2 hover:bg-blue-100 rounded text-sm">
                          <span className="text-gray-700">{curso.nome}</span>
                          <button type="button" onClick={() => adicionarCurso(curso.id)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold transition">➕</button>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-xs">Nenhum curso disponível</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-green-600 bg-green-100 px-3 py-2 rounded mb-3">Cursos da Unidade</p>
                <div className="border border-gray-300 rounded-lg p-3 h-48 overflow-y-auto bg-gray-50">
                  {cursosSelecionados.length > 0 ? (
                    cursosSelecionados.map((curso, index) => (
                      <div key={`${curso.id || curso.nome || 'curso-selecionado'}-${index}`} className="flex justify-between items-center p-2 hover:bg-red-100 rounded text-sm">
                        <span className="text-gray-700">{curso.nome}</span>
                        <button type="button" onClick={() => removerCurso(curso.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition">➖</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs">Nenhum curso selecionado</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link href="/admin/unidades">
              <button type="button" className="px-6 py-2 text-center text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition">
                Cancelar
              </button>
            </Link>
            <button type="submit" disabled={salvando} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
              {salvando ? '⏳ Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
