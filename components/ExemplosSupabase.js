/**
 * EXEMPLO: Componente de Dashboard de Alunos integrado com Supabase
 * 
 * Este é um exemplo prático de como integrar Supabase em um componente React
 * Use como referência para implementar em seus componentes
 */

import { useEffect, useState } from 'react';
import { buscarAlunosPorCurso, buscarTodasAsTurmas } from '@/lib/supabase-queries';

export default function DashboardAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState(1);
  const [turmaFiltrada, setTurmaFiltrada] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Buscar dados ao carregar o componente
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro(null);

        // Buscar turmas
        const { data: turmasData, error: turmasError } = await buscarTodasAsTurmas();
        if (turmasError) throw turmasError;
        setTurmas(turmasData || []);

        // Buscar alunos do curso
        const { data: alunosData, error: alunosError } = await buscarAlunosPorCurso(
          cursoSelecionado
        );
        if (alunosError) throw alunosError;
        setAlunos(alunosData || []);
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        setErro(erro.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [cursoSelecionado]);

  // Filtrar alunos por turma
  const alunosFiltrados = alunos.filter(aluno => {
    if (turmaFiltrada === 'todos') return true;
    return aluno.turmaId === parseInt(turmaFiltrada);
  });

  if (carregando) {
    return <div className="p-4">Carregando...</div>;
  }

  if (erro) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Erro ao carregar dados: {erro}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Alunos</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Curso</label>
          <select
            value={cursoSelecionado}
            onChange={e => setCursoSelecionado(parseInt(e.target.value))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Pedagogia</option>
            <option value={2}>Administração</option>
            <option value={3}>Engenharia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Turma</label>
          <select
            value={turmaFiltrada}
            onChange={e => setTurmaFiltrada(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas as turmas</option>
            {turmas.map(turma => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contador */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-lg font-semibold">
          Total de alunos: <span className="text-blue-600">{alunosFiltrados.length}</span>
        </p>
      </div>

      {/* Tabela de Alunos */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Nome</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
              <th className="border border-gray-300 px-4 py-2 text-left">CPF</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Matrícula</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  Nenhum aluno encontrado
                </td>
              </tr>
            ) : (
              alunosFiltrados.map(aluno => (
                <tr key={aluno.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex items-center">
                      {aluno.usuarios?.foto && (
                        <img
                          src={aluno.usuarios.foto}
                          alt={aluno.usuarios.nomeCompleto}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      {aluno.usuarios?.nomeCompleto || 'Sem nome'}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {aluno.usuarios?.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {aluno.usuarios?.cpf}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {aluno.matricula}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        aluno.statusMatricula === 'ativa'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {aluno.statusMatricula === 'ativa' ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => visualizarDetalhes(aluno.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver Boletim
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function visualizarDetalhes(alunoId) {
  console.log('Visualizando detalhes do aluno:', alunoId);
  // Implementar navegação para página de detalhes
}

// =====================================================
// EXEMPLO 2: Componente de Lançamento de Notas
// =====================================================

export function LancamentoNotas({ disciplinaId, turmaId }) {
  const [alunos, setAlunos] = useState([]);
  const [notas, setNotas] = useState({});
  const [faltas, setFaltas] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    async function carregarAlunos() {
      const { data, error } = await buscarAlunosPorTurma(turmaId);
      if (error) {
        setMensagem({ tipo: 'erro', texto: 'Erro ao carregar alunos' });
      } else {
        setAlunos(data || []);
        // Inicializar campos de notas
        const notasIniciais = {};
        const faltasIniciais = {};
        data?.forEach(aluno => {
          notasIniciais[aluno.id] = '';
          faltasIniciais[aluno.id] = '';
        });
        setNotas(notasIniciais);
        setFaltas(faltasIniciais);
      }
    }

    carregarAlunos();
  }, [turmaId]);

  async function salvarNotas() {
    try {
      setSalvando(true);
      // Implementar lógica de salvamento
      setMensagem({ tipo: 'sucesso', texto: 'Notas salvas com sucesso!' });
      setTimeout(() => setMensagem(null), 3000);
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar notas' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Lançamento de Notas</h2>

      {mensagem && (
        <div
          className={`p-3 rounded mb-4 ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Aluno</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Nota</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Faltas</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map(aluno => (
              <tr key={aluno.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  {aluno.usuarios?.nomeCompleto}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={notas[aluno.id] || ''}
                    onChange={e =>
                      setNotas({ ...notas, [aluno.id]: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-center"
                    placeholder="0.0"
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    value={faltas[aluno.id] || ''}
                    onChange={e =>
                      setFaltas({ ...faltas, [aluno.id]: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-center"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <button
          onClick={salvarNotas}
          disabled={salvando}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {salvando ? 'Salvando...' : 'Salvar Notas'}
        </button>
      </div>
    </div>
  );
}
