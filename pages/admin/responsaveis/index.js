import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function ListagemResponsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('');

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [responsaveis, searchNome, searchSituacao]);

  const carregarResponsaveis = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/responsaveis');
      if (res.ok) {
        const data = await res.json();
        setResponsaveis(data);
      }
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = responsaveis;

    if (searchNome) {
      resultado = resultado.filter(responsavel =>
        responsavel.nome.toLowerCase().includes(searchNome.toLowerCase())
      );
    }

    if (searchSituacao) {
      resultado = resultado.filter(responsavel => responsavel.situacao === searchSituacao);
    }

    setFiltrados(resultado);
  };

  const limparFiltros = () => {
    setSearchNome('');
    setSearchSituacao('');
  };

  const deletarResponsavel = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este responsável?')) return;

    try {
      const res = await fetch(`/api/responsaveis/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResponsaveis(responsaveis.filter(responsavel => responsavel.id !== id));
      }
    } catch (error) {
      console.error('Erro ao deletar responsável:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👥</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Responsáveis</h1>
          </div>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold flex items-center gap-2">
            📋 Listar
          </button>
          <Link href="/admin/responsaveis/novo">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME</label>
                <input
                  type="text"
                  placeholder="Nome do Responsável"
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
            </div>

            <div className="flex justify-end">
              <button
                onClick={limparFiltros}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
              >
                LIMPAR
              </button>
            </div>
          </div>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              👥 Listagem dos Responsáveis
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Quantidade de Responsáveis: <strong>{filtrados.length}</strong>
              </span>
              <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition text-sm">
                IMPRIMIR
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum responsável encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-teal-100 border-b border-teal-300">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Whatsapp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Telefone Comercial</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((responsavel) => (
                    <tr key={responsavel.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-800 font-semibold border-r border-gray-200">{responsavel.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{responsavel.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{responsavel.whatsapp}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{responsavel.telefoneComercial}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.print()}
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Imprimir"
                          >
                            🖨️
                          </button>
                          <Link href={`/admin/responsaveis/${responsavel.id}`}>
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          </Link>
                          <button
                            onClick={() => deletarResponsavel(responsavel.id)}
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
    </DashboardLayout>
  );
}
