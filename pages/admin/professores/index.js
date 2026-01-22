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

  useEffect(() => {
    carregarProfessores();
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
    </DashboardLayout>
  );
}
