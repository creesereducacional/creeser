import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function ListagemCursos() {
  const [cursos, setCursos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('');

  useEffect(() => {
    carregarCursos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [cursos, searchNome, searchSituacao]);

  const carregarCursos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cursos');
      if (res.ok) {
        const data = await res.json();
        setCursos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = cursos;

    if (searchNome) {
      resultado = resultado.filter(curso =>
        curso.nome.toLowerCase().includes(searchNome.toLowerCase())
      );
    }

    if (searchSituacao) {
      resultado = resultado.filter(curso => curso.situacao === searchSituacao);
    }

    setFiltrados(resultado);
  };

  const limparFiltros = () => {
    setSearchNome('');
    setSearchSituacao('');
  };

  const deletarCurso = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este curso?')) {
      try {
        const res = await fetch(`/api/cursos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          carregarCursos();
        }
      } catch (error) {
        console.error('Erro ao deletar:', error);
      }
    }
  };

  const imprimirCursos = () => {
    const printContent = document.getElementById('tabela-cursos');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📖</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Cursos</h1>
          </div>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold flex items-center gap-2">
            📋 Listar
          </button>
          <Link href="/admin/cursos/novo">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Curso</label>
              <input
                type="text"
                placeholder="Buscar por nome"
                value={searchNome}
                onChange={(e) => setSearchNome(e.target.value)}
                className="w-full px-4 py-2 border border-teal-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Situação</label>
              <select
                value={searchSituacao}
                onChange={(e) => setSearchSituacao(e.target.value)}
                className="w-full px-4 py-2 border border-teal-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Todas</option>
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>
          </div>

          <button
            onClick={limparFiltros}
            className="px-6 py-2 bg-gray-400 text-white rounded font-semibold hover:bg-gray-500 transition"
          >
            Limpar Filtros
          </button>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              📚 Listagem de Cursos
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Quantidade de Cursos: <strong>{filtrados.length}</strong>
              </span>
              <button
                onClick={imprimirCursos}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition text-sm"
              >
                IMPRIMIR
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum curso encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-teal-100 border-b border-teal-300">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Duração</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Nível Ensino</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Carga Horária</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Situação</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((curso) => (
                    <tr key={curso.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{curso.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{curso.duracao} período(s)</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{curso.nivelEnsino}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{curso.cargaHoraria}h</td>
                      <td className="px-4 py-3 text-sm border-r border-gray-200">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          curso.situacao === 'ATIVO' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {curso.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/cursos/${curso.id}`}>
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          </Link>
                          <button
                            onClick={() => deletarCurso(curso.id)}
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
