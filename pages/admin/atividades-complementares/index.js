import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function AtividadesComplementares() {
  const router = useRouter();
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    curso: 'CURSO TESTE',
    turma: '',
    aluno: '',
    status: 'TODOS'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    try {
      const res = await fetch('/api/atividades-complementares');
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
    if (filtros.aluno && !reg.nomeAluno.toLowerCase().includes(filtros.aluno.toLowerCase())) return false;
    if (filtros.status !== 'TODOS' && reg.status !== filtros.status) return false;
    return true;
  });

  const handleLimpar = () => {
    setFiltros({
      curso: 'CURSO TESTE',
      turma: '',
      aluno: '',
      status: 'TODOS'
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este registro?')) {
      try {
        const res = await fetch(`/api/atividades-complementares/${id}`, { method: 'DELETE' });
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
        {/* Cabeçalho com Abas */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Atividades Complementares</h1>
        </div>

        {/* Botão Certificados Enviados */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 inline-block">
          <button className="flex flex-col items-center gap-2 px-6 py-4 text-teal-600 hover:text-teal-700 transition">
            <span className="text-3xl">📋</span>
            <span className="font-semibold text-sm">Certificados Enviados</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <details open>
            <summary className="cursor-pointer text-lg font-bold text-teal-600 mb-4">▼ Filtros de Busca</summary>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO</label>
                  <select
                    value={filtros.curso}
                    onChange={(e) => setFiltros({...filtros, curso: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="CURSO TESTE">CURSO TESTE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA</label>
                  <select
                    value={filtros.turma}
                    onChange={(e) => setFiltros({...filtros, turma: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- Selecione uma Turma -</option>
                    <option value="TURMA TESTE">TURMA TESTE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">ALUNO</label>
                  <select
                    value={filtros.aluno}
                    onChange={(e) => setFiltros({...filtros, aluno: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- Selecione um Aluno -</option>
                    <option value="aluno teste">aluno teste</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">STATUS</label>
                  <select
                    value={filtros.status}
                    onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="APROVADO">APROVADO</option>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="REJEITADO">REJEITADO</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
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
          <h3 className="text-lg font-bold text-teal-600 mb-4">📋 Listagem de Certificados</h3>
          
          {registrosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-teal-100 border-b border-teal-300 text-teal-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Nome</th>
                    <th className="px-4 py-2 text-left font-semibold">Tipo Atividade</th>
                    <th className="px-4 py-2 text-center font-semibold">Carga Horária</th>
                    <th className="px-4 py-2 text-center font-semibold">Status</th>
                    <th className="px-4 py-2 text-center font-semibold">AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3">{reg.nomeAluno}</td>
                      <td className="px-4 py-3">{reg.tipoAtividade}</td>
                      <td className="px-4 py-3 text-center">{reg.cargaHoraria}h</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          reg.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                          reg.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <Link href={`/admin/atividades-complementares/${reg.id}`}>
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600 font-semibold">Nenhuma informação foi localizada em nossa Base de Dados.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
