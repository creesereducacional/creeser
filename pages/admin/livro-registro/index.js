import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function LivroRegistro() {
  const router = useRouter();
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    curso: '',
    turma: '',
    periodo: '',
    apenasAnoLetivo: false
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    try {
      const res = await fetch('/api/livro-registro');
      if (res.ok) {
        const data = await res.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const registrosFiltrados = registros.filter(reg => {
    if (filtros.curso && reg.curso !== filtros.curso) return false;
    if (filtros.turma && reg.turma !== filtros.turma) return false;
    if (filtros.periodo && reg.periodo !== filtros.periodo) return false;
    if (searchTerm && !reg.nomeAluno.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(registrosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRegistros = registrosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const handleLimpar = () => {
    setFiltros({
      curso: '',
      turma: '',
      periodo: '',
      apenasAnoLetivo: false
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este registro?')) {
      try {
        const res = await fetch(`/api/livro-registro/${id}`, { method: 'DELETE' });
        if (res.ok) {
          carregarRegistros();
          alert('Registro deletado com sucesso');
        }
      } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar registro');
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 text-center">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-full">
        {/* Cabeçalho */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Livro de registro</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <details open>
            <summary className="cursor-pointer text-lg font-bold text-teal-600 mb-4">▼ Filtros de Busca</summary>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO *</label>
                  <select
                    value={filtros.curso}
                    onChange={(e) => setFiltros({...filtros, curso: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- ESCOLHA UM CURSO -</option>
                    <option value="ADMINISTRAÇÃO EAD (PedagogiaEAD)">ADMINISTRAÇÃO EAD (PedagogiaEAD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA *</label>
                  <select
                    value={filtros.turma}
                    onChange={(e) => setFiltros({...filtros, turma: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- ESCOLHA UMA TURMA -</option>
                    <option value="ADM - TESTE MEC - ONLINE">ADM - TESTE MEC - ONLINE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">PERÍODO *</label>
                  <select
                    value={filtros.periodo}
                    onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- ESCOLHA UM PERÍODO -</option>
                    <option value="01º Período">01º Período</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2">
                  <label className="text-xs font-medium text-yellow-700 block">Apenas Alunos no Ano Letivo Corrente?</label>
                  <input
                    type="checkbox"
                    checked={filtros.apenasAnoLetivo}
                    onChange={(e) => setFiltros({...filtros, apenasAnoLetivo: e.target.checked})}
                    className="w-5 h-5 mt-1"
                  />
                </div>

                <button
                  onClick={handleLimpar}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
                >
                  🔍
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-lg font-bold text-teal-600 mb-4">📋 Listagem dos Alunos</h3>
          
          <div className="flex gap-2 mb-4 items-center">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span className="text-sm text-gray-600">Registros por página</span>
            <input
              type="text"
              placeholder="Pesquisar na listagem"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">🔍</button>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-teal-100 border-b border-teal-300 text-teal-800">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Nome</th>
                  <th className="px-4 py-2 text-center font-semibold">Número do registro</th>
                  <th className="px-4 py-2 text-center font-semibold">Livro</th>
                  <th className="px-4 py-2 text-center font-semibold">Folha</th>
                  <th className="px-4 py-2 text-center font-semibold">Data</th>
                  <th className="px-4 py-2 text-center font-semibold">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRegistros.length > 0 ? (
                  paginatedRegistros.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3">{reg.nomeAluno}</td>
                      <td className="px-4 py-3 text-center">{reg.numeroRegistro}</td>
                      <td className="px-4 py-3 text-center">{reg.livro}</td>
                      <td className="px-4 py-3 text-center">{reg.folha}</td>
                      <td className="px-4 py-3 text-center">{new Date(reg.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <Link href={`/admin/livro-registro/${reg.id}`}>
                          <button className="text-blue-600 hover:text-blue-800 text-lg">✏️</button>
                        </Link>
                        <button
                          onClick={() => handleDelete(reg.id)}
                          className="text-red-600 hover:text-red-800 text-lg"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, registrosFiltrados.length)} de {registrosFiltrados.length} resultados</span>
            
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? 'bg-teal-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="mt-6">
          <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm flex items-center gap-2">
            💾 Salvar
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
