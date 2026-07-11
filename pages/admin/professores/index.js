import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ListagemProfessores() {
  const router = useRouter();
  const [professores, setProfessores] = useState([]);
  const [filteredProfessores, setFilteredProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNome, setSearchNome] = useState('');
  const [searchNivel, setSearchNivel] = useState('');
  const [searchStatus, setSearchStatus] = useState('ATIVO');
  const [searchArea, setSearchArea] = useState('');

  // Estados do Modal de Vínculos
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [vinculos, setVinculos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedDisciplina, setSelectedDisciplina] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    carregarProfessores();
    carregarTurmasEDisciplinas();
  }, []);

  useEffect(() => {
    filtrarProfessores();
  }, [professores, searchNome, searchNivel, searchStatus, searchArea]);

  const carregarProfessores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/professores');
      if (response.ok) {
        const data = await response.json();
        setProfessores(data);
      }
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarTurmasEDisciplinas = async () => {
    try {
      const [resTurmas, resDisciplinas] = await Promise.all([
        fetch('/api/turmas'),
        fetch('/api/disciplinas')
      ]);
      if (resTurmas.ok) {
        const dataTurmas = await resTurmas.json();
        setTurmas(dataTurmas);
      }
      if (resDisciplinas.ok) {
        const dataDisciplinas = await resDisciplinas.json();
        setDisciplinas(dataDisciplinas);
      }
    } catch (error) {
      console.error('Erro ao carregar turmas ou disciplinas:', error);
    }
  };

  const abrirModalVinculos = async (professor) => {
    setSelectedProfessor(professor);
    setModalOpen(true);
    setModalError('');
    setSelectedTurma('');
    setSelectedDisciplina('');
    setVinculos([]);
    
    try {
      setModalLoading(true);
      const response = await fetch(`/api/professores/${professor.id}/vinculos`);
      if (response.ok) {
        const data = await response.json();
        setVinculos(data);
      } else {
        setModalError('Erro ao carregar vínculos existentes.');
      }
    } catch (err) {
      setModalError('Falha de rede ao buscar vínculos.');
    } finally {
      setModalLoading(false);
    }
  };

  const adicionarVinculo = async () => {
    if (!selectedTurma || !selectedDisciplina) {
      setModalError('Selecione uma Turma e uma Disciplina.');
      return;
    }
    setModalError('');

    try {
      setModalLoading(true);
      const response = await fetch(`/api/professores/${selectedProfessor.id}/vinculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turma_id: selectedTurma,
          disciplina_id: selectedDisciplina
        })
      });

      if (response.ok) {
        // Recarregar os vínculos atualizados
        const resList = await fetch(`/api/professores/${selectedProfessor.id}/vinculos`);
        if (resList.ok) {
          const data = await resList.json();
          setVinculos(data);
        }
        setSelectedTurma('');
        setSelectedDisciplina('');
      } else {
        const errData = await response.json();
        setModalError(errData.error || 'Erro ao adicionar vínculo.');
      }
    } catch (err) {
      setModalError('Falha ao salvar vínculo.');
    } finally {
      setModalLoading(false);
    }
  };

  const removerVinculo = async (vinculoId) => {
    if (!confirm('Deseja realmente remover este vínculo?')) return;
    setModalError('');

    try {
      setModalLoading(true);
      const response = await fetch(`/api/professores/${selectedProfessor.id}/vinculos/${vinculoId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVinculos(vinculos.filter(v => v.id !== vinculoId));
      } else {
        const errData = await response.json();
        setModalError(errData.error || 'Erro ao remover vínculo.');
      }
    } catch (err) {
      setModalError('Falha ao excluir vínculo.');
    } finally {
      setModalLoading(false);
    }
  };

  const filtrarProfessores = () => {
    let filtered = professores;

    if (searchNome) {
      filtered = filtered.filter(p =>
        p.nome.toLowerCase().includes(searchNome.toLowerCase())
      );
    }

    if (searchNivel) {
      filtered = filtered.filter(p => p.nivelInstrucao === searchNivel);
    }

    if (searchStatus) {
      filtered = filtered.filter(p => p.status === searchStatus);
    }

    if (searchArea) {
      filtered = filtered.filter(p =>
        p.areaAtuacao.toLowerCase().includes(searchArea.toLowerCase())
      );
    }

    setFilteredProfessores(filtered);
  };

  const deletarProfessor = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este professor?')) return;

    try {
      const response = await fetch(`/api/professores/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProfessores(professores.filter(p => p.id !== id));
        alert('Professor deletado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao deletar professor:', error);
      alert('Erro ao deletar professor');
    }
  };

  const limparFiltros = () => {
    setSearchNome('');
    setSearchNivel('');
    setSearchStatus('ATIVO');
    setSearchArea('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👨‍🏫</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Professores</h1>
          </div>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold flex items-center gap-2">
            📋 Listar
          </button>
          <Link href="/admin/professores/novo">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold flex items-center gap-2 transition">
              ➕ Inserir
            </button>
          </Link>
        </div>

        {/* Filtro de Busca */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-teal-600 text-xl">🔍</span>
            <h2 className="text-lg font-semibold text-gray-700">Filtro de Busca</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nome */}
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">NOME</label>
              <input
                type="text"
                placeholder="Nome do professor"
                value={searchNome}
                onChange={(e) => setSearchNome(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
              />
            </div>

            {/* Nível de Instrução */}
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Nível de Instrução</label>
              <select
                value={searchNivel}
                onChange={(e) => setSearchNivel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="">- Escolha um nível -</option>
                <option value="GRADUAÇÃO">Graduação</option>
                <option value="ESPECIALIZAÇÃO">Especialização</option>
                <option value="MESTRADO">Mestrado</option>
                <option value="DOUTORADO">Doutorado</option>
              </select>
            </div>

            {/* Área de Atuação */}
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Área de Atuação</label>
              <input
                type="text"
                placeholder="Área de atuação"
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">SITUAÇÃO</label>
              <select
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>
          </div>

          {/* Botão Limpar */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={limparFiltros}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
            >
              LIMPAR
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              📚 Listagem dos Professores
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Quantidade de Professores: <strong>{filteredProfessores.length}</strong>
              </span>
              <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition text-sm">
                IMPRIMIR
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Carregando...</div>
          ) : filteredProfessores.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum professor encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-teal-100 border-b border-teal-300">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Nível de Instrução</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Área de atuação</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Cidade</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">UF</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Telefone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800">Observações</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfessores.map((professor) => (
                    <tr key={professor.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{professor.id.substring(0, 8)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-semibold border-r border-gray-200">{professor.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{professor.nivelInstrucao}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{professor.areaAtuacao}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{professor.cidade}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{professor.uf}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{professor.telefoneCelular}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 truncate">{professor.obs}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.print()}
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Imprimir"
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => abrirModalVinculos(professor)}
                            className="p-2 text-teal-600 hover:text-teal-800 transition"
                            title="Vínculos (Turmas e Disciplinas)"
                          >
                            🔗
                          </button>
                          <Link href={`/admin/professores/${professor.id}`}>
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          </Link>
                          <button
                            onClick={() => deletarProfessor(professor.id)}
                            className="p-2 text-red-600 hover:text-red-800 transition"
                            title="Deletar"
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gerenciamento de Vínculos (Turmas e Disciplinas) */}
      {modalOpen && selectedProfessor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-teal-50 rounded-t-lg">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  🔗 Vincular Turmas e Disciplinas
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Professor: <strong className="text-teal-700">{selectedProfessor.nome}</strong>
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {modalError && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                  ⚠️ {modalError}
                </div>
              )}

              {/* Form de Criação de Vínculo */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-bold text-teal-800">Adicionar Novo Vínculo</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Turma */}
                  <div>
                    <label className="block text-xs font-semibold text-teal-600 mb-1">TURMA</label>
                    <select
                      value={selectedTurma}
                      onChange={(e) => setSelectedTurma(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="">- Selecione uma Turma -</option>
                      {turmas.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Disciplina */}
                  <div>
                    <label className="block text-xs font-semibold text-teal-600 mb-1">DISCIPLINA</label>
                    <select
                      value={selectedDisciplina}
                      onChange={(e) => setSelectedDisciplina(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="">- Selecione uma Disciplina -</option>
                      {disciplinas.map(d => (
                        <option key={d.id} value={d.id}>{d.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={adicionarVinculo}
                    disabled={modalLoading}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition text-sm disabled:opacity-50"
                  >
                    {modalLoading ? 'Processando...' : 'Adicionar Vínculo'}
                  </button>
                </div>
              </div>

              {/* Listagem de Vínculos Atuais */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700">Vínculos Atuais</h4>
                
                {modalLoading && vinculos.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-4">Carregando vínculos...</div>
                ) : vinculos.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-6 border border-dashed border-gray-300 rounded-lg">
                    Nenhum vínculo cadastrado.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-xs font-semibold text-gray-600 border-b border-gray-200">
                          <th className="p-3">Turma</th>
                          <th className="p-3">Disciplina</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vinculos.map(v => (
                          <tr key={v.id} className="border-b border-gray-150 hover:bg-gray-50 text-sm">
                            <td className="p-3 font-semibold text-gray-800">{v.turmas?.nome || `Turma ID ${v.turma_id}`}</td>
                            <td className="p-3 text-gray-700">{v.disciplinas?.nome || `Disciplina ID ${v.disciplina_id}`}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => removerVinculo(v.id)}
                                disabled={modalLoading}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded font-semibold text-xs transition disabled:opacity-50"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition text-sm"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
