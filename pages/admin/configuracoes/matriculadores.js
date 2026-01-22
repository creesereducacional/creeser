import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';

export default function GerenciarMatriculadores() {
  const router = useRouter();
  const [matriculadores, setMatriculadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [novoMatriculador, setNovoMatriculador] = useState({
    nome: '',
    email: '',
    telefone: '',
    ativo: true
  });

  useEffect(() => {
    carregarMatriculadores();
  }, []);

  const carregarMatriculadores = async () => {
    try {
      const res = await fetch('/api/configuracoes/matriculadores');
      if (res.ok) {
        const data = await res.json();
        setMatriculadores(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionar = async (e) => {
    e.preventDefault();
    
    if (!novoMatriculador.nome || !novoMatriculador.email) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const res = await fetch('/api/configuracoes/matriculadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoMatriculador)
      });

      if (res.ok) {
        alert('Matriculador adicionado com sucesso');
        setNovoMatriculador({ nome: '', email: '', telefone: '', ativo: true });
        carregarMatriculadores();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar');
    }
  };

  const handleDeletar = async (email) => {
    if (!confirm(`Deseja deletar o matriculador ${email}?`)) return;

    try {
      const res = await fetch(`/api/configuracoes/matriculadores?email=${email}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Matriculador deletado com sucesso');
        carregarMatriculadores();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar');
    }
  };

  const matriculadorsFiltrados = matriculadores.filter(m => 
    m.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    m.email.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 text-center">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Gerenciar Matriculadores</h1>

        {/* Novo Matriculador */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="text-sm font-bold text-teal-600 mb-4">➕ Novo Matriculador</h3>
          
          <form onSubmit={handleAdicionar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
                <input
                  type="text"
                  value={novoMatriculador.nome}
                  onChange={(e) => setNovoMatriculador({...novoMatriculador, nome: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-teal-600 mb-1 block">EMAIL *</label>
                <input
                  type="email"
                  value={novoMatriculador.email}
                  onChange={(e) => setNovoMatriculador({...novoMatriculador, email: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">&nbsp;</label>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                >
                  ➕
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
          />
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-teal-100 border-b border-teal-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Email</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Status</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-teal-800">Ações</th>
              </tr>
            </thead>
            <tbody>
              {matriculadorsFiltrados.map((m, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-teal-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-800">{m.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{m.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      m.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {m.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeletar(m.email)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {matriculadorsFiltrados.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              Nenhum matriculador encontrado
            </div>
          )}
        </div>

        {/* Voltar */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/admin/configuracoes')}
            className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
