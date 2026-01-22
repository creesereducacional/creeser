import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DashboardLayout from '@/components/DashboardLayout';
import CustomModal from '@/components/CustomModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function AnosLetivos() {
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('ATIVO');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const [formData, setFormData] = useState({
    nome: '',
    dataInicio: '',
    dataFim: '',
    anoVigente: false
  });

  useEffect(() => {
    carregarAnosLetivos();
  }, []);

  const carregarAnosLetivos = async () => {
    try {
      const response = await fetch('/api/configuracoes/anos-letivos');
      if (response.ok) {
        const data = await response.json();
        setAnosLetivos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar anos letivos:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao carregar anos letivos. Tente novamente.',
        type: 'error'
      });
    }
  };

  const filtrarAnosLetivos = () => {
    return anosLetivos.filter(ano => {
      const matchNome = ano.nome.toLowerCase().includes(searchNome.toLowerCase());
      const matchSituacao = searchSituacao === '' || ano.status === searchSituacao;
      return matchNome && matchSituacao;
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.dataInicio || !formData.dataFim) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Preencha todos os campos obrigatórios',
        type: 'warning'
      });
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, ...formData, status: 'ATIVO' }
        : { ...formData, status: 'ATIVO' };

      const response = await fetch('/api/configuracoes/anos-letivos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await carregarAnosLetivos();
        setShowForm(false);
        setFormData({ nome: '', dataInicio: '', dataFim: '', anoVigente: false });
        setEditingId(null);
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: editingId ? 'Ano letivo atualizado com sucesso!' : 'Ano letivo criado com sucesso!',
          type: 'success'
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Erro!',
          message: 'Erro ao salvar ano letivo. Tente novamente.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao salvar ano letivo. Tente novamente.',
        type: 'error'
      });
    }
  };

  const handleEdit = (ano) => {
    setEditingId(ano.id);
    setFormData({
      nome: ano.nome,
      dataInicio: ano.dataInicio,
      dataFim: ano.dataFim,
      anoVigente: ano.anoVigente || false
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });

    try {
      const response = await fetch('/api/configuracoes/anos-letivos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        await carregarAnosLetivos();
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Ano letivo deletado com sucesso!',
          type: 'success'
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Erro!',
          message: 'Erro ao deletar ano letivo. Tente novamente.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao deletar ano letivo. Tente novamente.',
        type: 'error'
      });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nome: '', dataInicio: '', dataFim: '', anoVigente: false });
  };

  const handleChangeRecordsPerPage = (value) => {
    setRecordsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleChangePage = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const filteredAnosLetivos = filtrarAnosLetivos();
  const totalPages = Math.ceil(filteredAnosLetivos.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedAnosLetivos = filteredAnosLetivos.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Anos Letivos</h1>

        {!showForm && (
          <>
            {/* Botões de ação */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg text-teal-600 font-semibold transition"
              >
                <span className="text-lg">📋</span> Listar
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
              >
                <span className="text-lg">➕</span> Inserir
              </button>
            </div>

            {/* Filtros */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6 mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-teal-600 text-lg">🔍</span> Filtros de Busca
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">NOME</label>
                  <input
                    type="text"
                    placeholder="Nome do ano letivo"
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
                    <option value="">- Todos -</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchNome('');
                      setSearchSituacao('ATIVO');
                    }}
                    className="w-full px-3 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                  >
                    LIMPAR
                  </button>
                </div>
              </div>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span>📋</span> Listagem de Anos Letivos
                </h2>
                <div className="flex items-center gap-4">
                  <select
                    value={recordsPerPage}
                    onChange={(e) => handleChangeRecordsPerPage(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">Registros por página</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-teal-100 border-b border-teal-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-teal-800 border-r border-teal-300 text-xs">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-teal-800 border-r border-teal-300 text-xs">NOME</th>
                      <th className="px-4 py-3 text-center font-semibold text-teal-800 border-r border-teal-300 text-xs">DT. INICIAL</th>
                      <th className="px-4 py-3 text-center font-semibold text-teal-800 border-r border-teal-300 text-xs">DT. FINAL</th>
                      <th className="px-4 py-3 text-center font-semibold text-teal-800 text-xs">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAnosLetivos.length > 0 ? (
                      paginatedAnosLetivos.map((ano) => (
                        <tr key={ano.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                          <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{ano.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 font-medium">{ano.nome}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-200">{new Date(ano.dataInicio).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-200">{new Date(ano.dataFim).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              {ano.anoVigente && (
                                <button
                                  disabled
                                  className="p-2 text-green-600 cursor-default"
                                  title="Ano vigente"
                                >
                                  ✅
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(ano)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded transition"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(ano.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                title="Deletar"
                              >
                                ❌
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          Nenhum ano letivo encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                <button
                  onClick={() => handleChangePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  Anterior
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  return page <= totalPages ? (
                    <button
                      key={page}
                      onClick={() => handleChangePage(page)}
                      className={`px-4 py-2 text-sm rounded transition font-medium ${
                        currentPage === page
                          ? 'bg-teal-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ) : null;
                })}

                <button
                  onClick={() => handleChangePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  Próximo
                </button>
              </div>
            </div>
          </>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6">
              {editingId ? '✏️ Editar Ano Letivo' : '➕ Inserir Ano Letivo'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: 2025"
                  required
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* Data Início e Data Fim */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Início *</label>
                  <input
                    type="date"
                    name="dataInicio"
                    value={formData.dataInicio}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim *</label>
                  <input
                    type="date"
                    name="dataFim"
                    value={formData.dataFim}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              {/* Ano Vigente */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anoVigente"
                  name="anoVigente"
                  checked={formData.anoVigente}
                  onChange={handleInputChange}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <label htmlFor="anoVigente" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Ano Letivo Vigente?
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                >
                  💾 Salvar
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ isOpen: false, title: '', message: '', type: 'success' })}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja deletar este ano letivo? Esta ação não pode ser desfeita."
        type="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </DashboardLayout>
  );
}
