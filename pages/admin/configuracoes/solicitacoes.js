import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';
import CustomModal from '../../../components/CustomModal';
import ConfirmModal from '../../../components/ConfirmModal';
import { v4 as uuidv4 } from 'uuid';

export default function Solicitacoes() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('ATIVO');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const [formData, setFormData] = useState({
    nome: '',
    diasEntrega: '',
    tolerancia: '',
    observacoes: '',
    paga: false,
    valorSolicitacao: 0,
    diasVencimento: '',
    solicitacaoNegociacao: false,
    solicitacaoContestacao: false,
    situacao: 'ATIVO'
  });

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const carregarSolicitacoes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/configuracoes/solicitacoes');
      if (res.ok) {
        const data = await res.json();
        setSolicitacoes(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name.includes('dias') || name.includes('Vencimento') || name.includes('Entrega') ? parseInt(value) || '' : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/configuracoes/solicitacoes/${editingId}` : '/api/configuracoes/solicitacoes';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingId || uuidv4()
        })
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        carregarSolicitacoes();
      }
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
    }
  };

  const handleEdit = (solicitacao) => {
    setFormData(solicitacao);
    setEditingId(solicitacao.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });
    try {
      const res = await fetch(`/api/configuracoes/solicitacoes/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        carregarSolicitacoes();
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Solicitação deletada com sucesso!',
          type: 'success'
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Erro!',
          message: 'Erro ao deletar solicitação. Tente novamente.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao deletar solicitação. Tente novamente.',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      diasEntrega: '',
      tolerancia: '',
      observacoes: '',
      paga: false,
      valorSolicitacao: 0,
      diasVencimento: '',
      solicitacaoNegociacao: false,
      solicitacaoContestacao: false,
      situacao: 'ATIVO'
    });
    setEditingId(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  const filteredSolicitacoes = solicitacoes.filter(s => {
    const nomeMatch = s.nome.toLowerCase().includes(searchNome.toLowerCase());
    const situacaoMatch = s.situacao === searchSituacao;
    return nomeMatch && situacaoMatch;
  });

  const totalPages = Math.ceil(filteredSolicitacoes.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedSolicitacoes = filteredSolicitacoes.slice(startIndex, endIndex);

  const handleChangePage = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleChangeRecordsPerPage = (value) => {
    setRecordsPerPage(parseInt(value));
    setCurrentPage(1); // Voltar para página 1 ao mudar registros por página
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurar Solicitações</h1>

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
                    placeholder="Nome da solicitação"
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
                  <span>📋</span> Listagem das Solicitações
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
                      <th className="px-4 py-3 text-center font-semibold text-teal-800 border-r border-teal-300 text-xs">PAGA?</th>
                      <th className="px-4 py-3 text-center font-semibold text-teal-800 border-r border-teal-300 text-xs">NEGOCIAÇÃO</th>
                      <th className="px-4 py-3 text-center font-semibold text-teal-800 border-r border-teal-300 text-xs">CONTESTAÇÃO</th>
                      <th className="px-4 py-3 text-center font-semibold text-teal-800 text-xs">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSolicitacoes.length > 0 ? (
                      paginatedSolicitacoes.map((sol, idx) => (
                        <tr key={sol.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                          <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{sol.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 font-medium">{sol.nome}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-200">{sol.paga ? 'SIM' : 'Não'}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-200">{sol.solicitacaoNegociacao ? 'SIM' : 'Não'}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-200">{sol.solicitacaoContestacao ? 'SIM' : 'Não'}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(sol)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded transition"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {}}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                                title="Detalhes"
                              >
                                📋
                              </button>
                              <button
                                onClick={() => handleDelete(sol.id)}
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
                        <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                          Nenhuma solicitação encontrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação simplificada */}
              <div className="mt-4 flex items-center justify-end gap-1 flex-wrap">
                <button
                  onClick={() => handleChangePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  Anterior
                </button>

                {/* Botões de páginas */}
                {totalPages <= 7 ? (
                  // Se há 7 páginas ou menos, mostrar todas
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handleChangePage(page)}
                      className={`px-4 py-2 text-sm rounded transition font-medium ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  // Se há mais de 7 páginas, mostrar com inteligência
                  <>
                    {/* Primeira página */}
                    {currentPage > 4 && (
                      <>
                        <button
                          onClick={() => handleChangePage(1)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 transition font-medium"
                        >
                          1
                        </button>
                        {currentPage > 5 && <span className="px-2 text-gray-500">...</span>}
                      </>
                    )}

                    {/* Páginas ao redor da página atual */}
                    {Array.from(
                      { length: 3 },
                      (_, i) => currentPage - 1 + i
                    )
                      .filter(page => page > 0 && page <= totalPages)
                      .map(page => (
                        <button
                          key={page}
                          onClick={() => handleChangePage(page)}
                          className={`px-4 py-2 text-sm rounded transition font-medium ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                    {/* Última página */}
                    {currentPage < totalPages - 3 && (
                      <>
                        {currentPage < totalPages - 4 && <span className="px-2 text-gray-500">...</span>}
                        <button
                          onClick={() => handleChangePage(totalPages)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 transition font-medium"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                )}

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
              {editingId ? '✏️ Editar Solicitação' : '➕ Inserir Solicitação'}
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
                  placeholder="Nome da solicitação"
                  required
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* Qtd. de dias para entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qtd. de dias para entrega</label>
                <input
                  type="number"
                  name="diasEntrega"
                  value={formData.diasEntrega}
                  onChange={handleInputChange}
                  placeholder="Qtd. de dias para entrega da solicitação."
                  min="0"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* Tolerância de solicitações por mês */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tolerância de solicitações por mês</label>
                <input
                  type="text"
                  name="tolerancia"
                  value={formData.tolerancia}
                  onChange={handleInputChange}
                  placeholder="Tolerância máxima de solicitações por mês."
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Observações gerais sobre esta solicitação"
                  rows="4"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white resize-none"
                />
              </div>

              {/* Solicitação é paga? */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="paga"
                  name="paga"
                  checked={formData.paga}
                  onChange={handleInputChange}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <label htmlFor="paga" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Solicitação é paga?
                </label>
              </div>

              {/* Valor da solicitação e dias de vencimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Solicitação (R$)</label>
                  <input
                    type="number"
                    name="valorSolicitacao"
                    value={formData.valorSolicitacao}
                    onChange={handleInputChange}
                    placeholder="Valor em reais"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qtd. de dias para vencimento</label>
                  <input
                    type="number"
                    name="diasVencimento"
                    value={formData.diasVencimento}
                    onChange={handleInputChange}
                    placeholder="Dias até vencimento"
                    min="0"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              {/* DICA - Negociação */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <h4 className="text-sm font-bold text-yellow-800 mb-2">💡 DICA</h4>
                <p className="text-xs text-yellow-700 mb-2">
                  Com o sistema <strong>Sistema educacional CREESER</strong>, você pode permitir que os alunos realizem <strong>NEGOCIAÇÕES FINANCEIRAS</strong> das faturas em atraso, direto do <strong>PORTAL DO ALUNO</strong>.
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Para habilitar esta função, é necessário que exista uma <strong>SOLICITAÇÃO</strong> direcionada a receber estas negociações.
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Para criar esta solicitação, basta marcar o campo <strong>Solicitação de Negociação Financeira?</strong>, assim o sistema irá armazenar todas as <strong>SOLICITAÇÕES DE NEGOCIAÇÕES</strong>, nesta.
                </p>
                <p className="text-xs text-yellow-700">
                  <strong>ATENÇÃO!</strong> Só é permitido existir 1(UMA) solicitação marcada como <strong>Solicitação de Negociação Financeira</strong>.
                </p>
              </div>

              {/* Solicitação de Negociação Financeira? */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="solicitacaoNegociacao"
                  name="solicitacaoNegociacao"
                  checked={formData.solicitacaoNegociacao}
                  onChange={handleInputChange}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <label htmlFor="solicitacaoNegociacao" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Solicitação de Negociação Financeira?
                </label>
              </div>

              {/* DICA - Contestação */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <h4 className="text-sm font-bold text-yellow-800 mb-2">💡 DICA</h4>
                <p className="text-xs text-yellow-700 mb-2">
                  Com o sistema <strong>Sistema educacional CREESER</strong>, você pode permitir que os alunos realizem <strong>CONTESTAÇÕES FINANCEIRAS</strong> das faturas em aberto, direto do <strong>PORTAL DO ALUNO</strong>. Dessa forma eles poderão através do sistema, enviar a comprovação de pagamento, para que seja realizada a baixa da fatura em questão.
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Para habilitar esta função, é necessário que exista uma <strong>SOLICITAÇÃO</strong> direcionada a receber estas <strong>CONTESTAÇÕES</strong>.
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Para criar esta solicitação, basta marcar o campo <strong>Solicitação de Contestação Financeira?</strong>, assim o sistema irá armazenar todas as <strong>SOLICITAÇÕES DE CONTESTAÇÃO</strong>, nesta.
                </p>
                <p className="text-xs text-yellow-700">
                  <strong>ATENÇÃO!</strong> Só é permitido existir 1(UMA) solicitação marcada como <strong>Solicitação de Contestação Financeira</strong>.
                </p>
              </div>

              {/* Solicitação de Contestação Financeira? */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="solicitacaoContestacao"
                  name="solicitacaoContestacao"
                  checked={formData.solicitacaoContestacao}
                  onChange={handleInputChange}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <label htmlFor="solicitacaoContestacao" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Solicitação de Contestação Financeira?
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
        message="Tem certeza que deseja deletar esta solicitação? Esta ação não pode ser desfeita."
        type="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </DashboardLayout>
  );
}
