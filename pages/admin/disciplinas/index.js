import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import ConfirmModal from '../../../components/ConfirmModal';
import CustomModal from '../../../components/CustomModal';

export default function ListagemDisciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCurso, setSearchCurso] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [searchPeriodo, setSearchPeriodo] = useState('');
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [disciplinas, searchCurso, searchGrade, searchPeriodo, searchNome, searchSituacao]);

  const carregarDisciplinas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/disciplinas');
      if (res.ok) {
        const data = await res.json();
        setDisciplinas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = disciplinas;

    if (searchCurso) {
      resultado = resultado.filter(disciplina =>
        disciplina.curso.toLowerCase().includes(searchCurso.toLowerCase())
      );
    }

    if (searchGrade) {
      resultado = resultado.filter(disciplina =>
        disciplina.grade.toLowerCase().includes(searchGrade.toLowerCase())
      );
    }

    if (searchPeriodo) {
      resultado = resultado.filter(disciplina =>
        disciplina.periodo.toLowerCase().includes(searchPeriodo.toLowerCase())
      );
    }

    if (searchNome) {
      resultado = resultado.filter(disciplina =>
        disciplina.nome.toLowerCase().includes(searchNome.toLowerCase())
      );
    }

    if (searchSituacao) {
      resultado = resultado.filter(disciplina => disciplina.situacao === searchSituacao);
    }

    setFiltradas(resultado);
  };

  const limparFiltros = () => {
    setSearchCurso('');
    setSearchGrade('');
    setSearchPeriodo('');
    setSearchNome('');
    setSearchSituacao('');
  };

  const solicitarExclusao = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });

    try {
      const res = await fetch(`/api/disciplinas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDisciplinas(prev => prev.filter(disciplina => disciplina.id !== id));
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Disciplina excluída com sucesso!',
          type: 'success'
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Erro!',
          message: 'Erro ao excluir disciplina.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao deletar disciplina:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao excluir disciplina.',
        type: 'error'
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📖</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Disciplinas</h1>
          </div>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold flex items-center gap-2">
            📋 Listar
          </button>
          <Link href="/admin/disciplinas/novo">
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

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO</label>
                <select
                  value={searchCurso}
                  onChange={(e) => setSearchCurso(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">- Selecione um Curso -</option>
                  <option value="ADMINISTRAÇÃO EAD">ADMINISTRAÇÃO EAD</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PERÍODO</label>
                <select
                  value={searchPeriodo}
                  onChange={(e) => setSearchPeriodo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">- Selecione um Período -</option>
                  <option value="01º Período">01º Período</option>
                  <option value="02º Período">02º Período</option>
                  <option value="03º Período">03º Período</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">GRADE</label>
                <div className="flex gap-2">
                  <select
                    value={searchGrade}
                    onChange={(e) => setSearchGrade(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="">ADM EAD</option>
                  </select>
                  <button
                    onClick={() => setSearchGrade('')}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 text-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME</label>
                <input
                  type="text"
                  placeholder="Nome da Disciplina"
                  value={searchNome}
                  onChange={(e) => setSearchNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">SITUAÇÃO</label>
                <select
                  value={searchSituacao}
                  onChange={(e) => setSearchSituacao(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">- Selecione -</option>
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={limparFiltros}
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
                >
                  LIMPAR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              📖 Listagem das disciplinas
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Quantidade de Disciplinas: <strong>{filtradas.length}</strong>
              </span>
              <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition text-sm">
                IMPRIMIR
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhuma disciplina encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-teal-100 border-b border-teal-300">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Período</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Disciplina</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Curso</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Carga horária</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Matriz?</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Grade</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((disciplina) => (
                    <tr key={disciplina.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{disciplina.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{disciplina.periodo}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-semibold border-r border-gray-200">{disciplina.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{disciplina.curso}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{disciplina.cargaHoraria}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{disciplina.matriz ? 'Sim' : 'Não'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{disciplina.grade}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.print()}
                            className="p-2 text-orange-600 hover:text-orange-800 transition"
                            title="Imprimir"
                          >
                            📝
                          </button>
                          <button
                            className="p-2 text-blue-600 hover:text-blue-800 transition"
                            title="Link"
                          >
                            🔗
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Configurar"
                          >
                            ⚙️
                          </button>
                          <button
                            className="p-2 text-purple-600 hover:text-purple-800 transition"
                            title="Cloud"
                          >
                            ☁️
                          </button>
                          <Link href={`/admin/disciplinas/${disciplina.id}`}>
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          </Link>
                          <button
                            onClick={() => solicitarExclusao(disciplina.id)}
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

      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta disciplina? Esta ação não poderá ser desfeita."
        type="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </DashboardLayout>
  );
}
