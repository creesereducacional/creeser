import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function AdminUnidades() {
  const [unidades, setUnidades] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('ATIVO');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarUnidades();
  }, []);

  const carregarUnidades = async () => {
    try {
      const response = await fetch('/api/unidades');
      if (response.ok) {
        const data = await response.json();
        setUnidades(data);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    } finally {
      setCarregando(false);
    }
  };

  const filtrarUnidades = () => {
    return unidades.filter(unidade => {
      const nomeMatch = unidade.nome.toLowerCase().includes(filtroNome.toLowerCase());
      const situacaoMatch = filtroSituacao === '' || unidade.situacao === filtroSituacao;
      return nomeMatch && situacaoMatch;
    });
  };

  const unidadesFiltradas = filtrarUnidades();

  const handleExcluir = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta unidade?')) {
      try {
        const response = await fetch(`/api/unidades/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setUnidades(unidades.filter(u => u.id !== id));
          alert('Unidade excluída com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao excluir unidade:', error);
        alert('Erro ao excluir unidade');
      }
    }
  };

  const handleLimpar = () => {
    setFiltroNome('');
    setFiltroSituacao('ATIVO');
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Unidades</h1>

        {/* Botões de Ação */}
        <div className="flex gap-4 mb-6">
          <Link href="/admin/unidades/novo">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
              <span className="text-xl">+</span> Inserir
            </button>
          </Link>
          <button className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium transition">
            <span className="text-xl">📋</span> Listar
          </button>
        </div>

        {/* Filtro de Busca */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
            <span>🔍</span> Filtro de Busca
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 bg-blue-200 px-3 py-1 rounded mb-2">
                NOME
              </label>
              <input
                type="text"
                placeholder="Nome da Unidade"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 bg-blue-200 px-3 py-1 rounded mb-2">
                SITUAÇÃO
              </label>
              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
                <option value="">TODOS</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleLimpar}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                LIMPAR
              </button>
            </div>
          </div>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow">
          <div className="bg-teal-100 border-b-2 border-teal-500 px-6 py-3 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span> Listagem das Unidades
            </h2>
            <span className="bg-yellow-400 text-gray-800 font-bold px-4 py-1 rounded">
              Quantidade de Unidades: {unidadesFiltradas.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-100 border-b">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">Cidade</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">Endereço</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">Situação</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {unidadesFiltradas.length > 0 ? (
                  unidadesFiltradas.map((unidade, index) => (
                    <tr key={unidade.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="px-6 py-3 text-sm text-gray-900">{unidade.id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">{unidade.nome}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{unidade.cidade}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{unidade.endereco}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{unidade.telefone}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          unidade.situacao === 'ATIVO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {unidade.situacao}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Link href={`/admin/unidades/${unidade.id}`}>
                            <button className="p-2 text-yellow-600 hover:bg-yellow-100 rounded transition" title="Editar">
                              ✏️
                            </button>
                          </Link>
                          <button
                            onClick={() => handleExcluir(unidade.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                            title="Excluir"
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      Nenhuma unidade encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-6 py-4 text-right">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-6 py-2 rounded-lg font-bold transition">
              🖨️ IMPRIMIR
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
