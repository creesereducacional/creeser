import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function CadastroCurso() {
  const router = useRouter();
  const { id } = router.query;
  const isEditando = id && id !== 'novo';

  const [formData, setFormData] = useState({
    instituicaoId: '',
    nome: '',
    descricaoGeral: '',
    duracao: '',
    cargaHoraria: '',
    nivelEnsino: '',
    grauConferido: '',
    cargaHorariaEstagio: '',
    cargaHorariaAtividadesComplementares: '',
    mediaRequerida: '',
    frequenciaRequerida: '',
    idCenso: '',
    valorInscricao: '',
    valorMensalidade: '',
    layoutNotas: '',
    tituloConferido: '',
    exibirCRM: false,
    exibirBibliotecaVirtual: false,
    bibliotecaVirtual: '',
    portariaRecredenciamento: '',
    unidades: [],
  });

  const [instituicoes, setInstituicoes] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState([]);
  const [unidadeDisponivelId, setUnidadeDisponivelId] = useState('');
  const [situacao, setSituacao] = useState('ATIVO');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const carregarDados = async () => {
      await carregarInstituicoes();
      const unidades = await carregarUnidades();
      if (isEditando) {
        await carregarCurso(unidades);
      }
    };

    carregarDados();
  }, [isEditando, id]);

  const carregarInstituicoes = async () => {
    try {
      const res = await fetch('/api/instituicoes');
      if (res.ok) {
        const data = await res.json();
        setInstituicoes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
    }
  };

  const carregarUnidades = async () => {
    try {
      const res = await fetch('/api/unidades');
      if (res.ok) {
        const data = await res.json();
        setUnidadesDisponiveis(data || []);
        return data || [];
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }

    return [];
  };

  const carregarCurso = async (listaUnidades = []) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cursos/${id}`);
      if (res.ok) {
        const curso = await res.json();
        const idsDiretos = Array.isArray(curso.unidadeIds)
          ? curso.unidadeIds.map((valor) => String(valor))
          : [];

        let instituicaoId = String(curso.instituicaoId || curso.instituicaoid || curso.instituicao_id || '');

        if (!instituicaoId && idsDiretos.length > 0) {
          const unidadeCurso = listaUnidades.find((unidade) => String(unidade.id) === String(idsDiretos[0]));
          instituicaoId = String(unidadeCurso?.instituicaoId || unidadeCurso?.instituicao_id || '');
        }

        setFormData((prev) => ({
          ...prev,
          ...curso,
          instituicaoId,
        }));
        setSituacao(curso.situacao || 'ATIVO');

        if (idsDiretos.length > 0) {
          setUnidadesSelecionadas(idsDiretos);
        } else {
          const nomes = Array.isArray(curso.unidades) ? curso.unidades : [];
          const idsPorNome = nomes
            .map((nome) => {
              const encontrada = listaUnidades.find((unidade) => unidade.nome === nome);
              return encontrada?.id ? String(encontrada.id) : null;
            })
            .filter(Boolean);

          setUnidadesSelecionadas(idsPorNome);
        }
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar curso' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'instituicaoId') {
      setFormData(prev => ({
        ...prev,
        instituicaoId: value
      }));

      setUnidadeDisponivelId('');
      setUnidadesSelecionadas((prev) => prev.filter((unidadeId) => {
        const unidade = unidadesDisponiveis.find((item) => String(item.id) === String(unidadeId));
        const unidadeInstituicaoId = String(unidade?.instituicaoId || unidade?.instituicao_id || '');
        return unidadeInstituicaoId === String(value);
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const unidadesDisponiveisFiltradas = useMemo(() => {
    if (!formData.instituicaoId) return [];

    return unidadesDisponiveis.filter((u) => {
      const instituicaoId = String(u.instituicaoId || u.instituicao_id || '');
      return instituicaoId === String(formData.instituicaoId);
    });
  }, [formData.instituicaoId, unidadesDisponiveis]);

  const adicionarUnidade = () => {
    if (unidadeDisponivelId && !unidadesSelecionadas.includes(unidadeDisponivelId)) {
      const novas = [...unidadesSelecionadas, unidadeDisponivelId];
      setUnidadesSelecionadas(novas);
      setUnidadeDisponivelId('');
    }
  };

  const removerUnidade = (unidadeId) => {
    const novas = unidadesSelecionadas.filter((u) => u !== unidadeId);
    setUnidadesSelecionadas(novas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.nome) {
      setMessage({ type: 'error', text: 'O nome do curso é obrigatório' });
      setLoading(false);
      return;
    }

    if (!formData.instituicaoId) {
      setMessage({ type: 'error', text: 'A instituição do curso é obrigatória' });
      setLoading(false);
      return;
    }

    try {
      const method = isEditando ? 'PUT' : 'POST';
      const url = isEditando ? `/api/cursos/${id}` : '/api/cursos';
      
      const payload = {
        ...formData,
        situacao,
        unidadeIds: unidadesSelecionadas,
        unidades: unidadesSelecionadas
          .map((unidadeId) => {
            const encontrada = unidadesDisponiveis.find((unidade) => String(unidade.id) === String(unidadeId));
            return encontrada?.nome || null;
          })
          .filter(Boolean),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: isEditando 
            ? 'Curso atualizado com sucesso!' 
            : 'Curso cadastrado com sucesso!' 
        });
        
        setTimeout(() => {
          router.push('/admin/cursos');
        }, 1500);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao salvar curso' });
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
          <Link href="/admin/cursos">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base">
              ← Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span>📖</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {isEditando ? 'Editar Curso' : 'Inserir Curso'}
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
          <Link href="/admin/cursos">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
            ➕ Inserir
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados do Curso */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Dados do Curso</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">INSTITUIÇÃO *</label>
                <select
                  name="instituicaoId"
                  value={formData.instituicaoId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione a instituição</option>
                  {instituicoes.map((instituicao) => (
                    <option key={instituicao.id} value={instituicao.id}>{instituicao.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome do curso"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DESCRIÇÃO GERAL</label>
                <textarea
                  name="descricaoGeral"
                  placeholder="Descrição do curso"
                  value={formData.descricaoGeral}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50 h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">DURAÇÃO *</label>
                  <input
                    type="text"
                    name="duracao"
                    placeholder="Ex: 4"
                    value={formData.duracao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">CARGA HORÁRIA *</label>
                  <input
                    type="text"
                    name="cargaHoraria"
                    placeholder="Ex: 3200"
                    value={formData.cargaHoraria}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">NÍVEL DE ENSINO *</label>
                  <select
                    name="nivelEnsino"
                    value={formData.nivelEnsino}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">Selecione</option>
                    <option value="Fundamental">Ensino Fundamental</option>
                    <option value="Médio">Ensino Médio</option>
                    <option value="Superior">Ensino Superior</option>
                    <option value="Pós-Graduação">Pós-Graduação</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">MÉDIA REQUERIDA *</label>
                  <input
                    type="text"
                    name="mediaRequerida"
                    placeholder="Ex: 6"
                    value={formData.mediaRequerida}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">FREQUÊNCIA REQUERIDA</label>
                  <input
                    type="text"
                    name="frequenciaRequerida"
                    placeholder="Ex: 75"
                    value={formData.frequenciaRequerida}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">GRAU CONFERIDO *</label>
                  <select
                    name="grauConferido"
                    value={formData.grauConferido}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">Selecione</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certificado">Certificado</option>
                    <option value="Atestado">Atestado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Configurações Acadêmicas */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Configurações Acadêmicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CARGA HORÁRIA ESTÁGIO</label>
                <input
                  type="text"
                  name="cargaHorariaEstagio"
                  placeholder="Ex: 400"
                  value={formData.cargaHorariaEstagio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">ATIVIDADES COMPLEMENTARES</label>
                <input
                  type="text"
                  name="cargaHorariaAtividadesComplementares"
                  placeholder="Ex: 200"
                  value={formData.cargaHorariaAtividadesComplementares}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">LAYOUT NOTAS *</label>
                <select
                  name="layoutNotas"
                  value={formData.layoutNotas}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="Layout1">Layout 1</option>
                  <option value="Layout2">Layout 2</option>
                  <option value="Layout3">Layout 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 3: Valores */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Valores</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">VALOR INSCRIÇÃO</label>
                <input
                  type="text"
                  name="valorInscricao"
                  placeholder="Ex: 500"
                  value={formData.valorInscricao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">VALOR MENSALIDADE</label>
                <input
                  type="text"
                  name="valorMensalidade"
                  placeholder="Ex: 1200"
                  value={formData.valorMensalidade}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Configurações Adicionais */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Configurações Adicionais</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TÍTULO CONFERIDO</label>
                <select
                  name="tituloConferido"
                  value={formData.tituloConferido}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="Bacharel">Bacharel</option>
                  <option value="Licenciado">Licenciado</option>
                  <option value="Tecnólogo">Tecnólogo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">BIBLIOTECA VIRTUAL</label>
                <select
                  name="bibliotecaVirtual"
                  value={formData.bibliotecaVirtual}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="BV1">Biblioteca Virtual 1</option>
                  <option value="BV2">Biblioteca Virtual 2</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">ID INEP CENSO</label>
                <input
                  type="text"
                  name="idCenso"
                  placeholder="ID"
                  value={formData.idCenso}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PORTARIA RECREDENCIAMENTO</label>
                <input
                  type="text"
                  name="portariaRecredenciamento"
                  placeholder="Ex: Portaria 123/2024"
                  value={formData.portariaRecredenciamento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border border-teal-300 rounded-lg bg-teal-50">
                <input
                  type="checkbox"
                  name="exibirCRM"
                  checked={formData.exibirCRM}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-teal-600 rounded cursor-pointer"
                />
                <label className="text-sm font-medium text-teal-600 cursor-pointer">Exibir no CRM</label>
              </div>

              <div className="flex items-center gap-3 p-3 border border-teal-300 rounded-lg bg-teal-50">
                <input
                  type="checkbox"
                  name="exibirBibliotecaVirtual"
                  checked={formData.exibirBibliotecaVirtual}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-teal-600 rounded cursor-pointer"
                />
                <label className="text-sm font-medium text-teal-600 cursor-pointer">Exibir Biblioteca Virtual</label>
              </div>
            </div>
          </div>

          {/* Seção 5: Unidades Associadas */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Unidades Associadas</h2>
            
            {/* DICA de Unidades */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-yellow-700 mb-2">DICA</h3>
                  <p className="text-sm text-yellow-700">
                    Para adicionar unidades no curso, basta selecioná-las em <strong>Unidades Disponíveis</strong> e clicar em <strong>Adicionar</strong>.
                  </p>
                  <p className="text-sm text-yellow-700">
                    Para remover unidades, basta selecioná-las em <strong>Unidades do Curso</strong> e clicar em <strong>Remover</strong>.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UNIDADES DISPONÍVEIS</label>
                <select
                  id="unidadeDisponivel"
                  value={unidadeDisponivelId}
                  onChange={(e) => setUnidadeDisponivelId(e.target.value)}
                  disabled={!formData.instituicaoId}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">{formData.instituicaoId ? 'Selecione' : 'Selecione a instituição primeiro'}</option>
                  {unidadesDisponiveisFiltradas.map((u) => (
                    <option key={u.id} value={String(u.id)}>{u.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <button
                  type="button"
                  onClick={adicionarUnidade}
                  disabled={!formData.instituicaoId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                >
                  ➕ Adicionar
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UNIDADES DO CURSO</label>
                <div className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-white h-24 overflow-y-auto">
                  {unidadesSelecionadas.length > 0 ? (
                    unidadesSelecionadas.map((unidadeId) => {
                      const unidade = unidadesDisponiveis.find((item) => String(item.id) === String(unidadeId));
                      const nome = unidade?.nome || `Unidade #${unidadeId}`;

                      return (
                        <div key={unidadeId} className="px-2 py-1 bg-teal-100 text-teal-600 rounded mb-1 flex justify-between items-center text-sm">
                          <span>{nome}</span>
                        <button
                          type="button"
                          onClick={() => removerUnidade(unidadeId)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ✕
                        </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 text-sm">Nenhuma unidade</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 6: Situação */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">Situação</h2>
            
            <div className="max-w-md">
              <label className="text-xs font-medium text-teal-600 mb-1 block">SITUAÇÃO</label>
              <select
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              >
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Salvando...' : isEditando ? 'Atualizar' : 'Cadastrar'}
            </button>
            <Link href="/admin/cursos">
              <button type="button" className="px-8 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition text-sm">
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
