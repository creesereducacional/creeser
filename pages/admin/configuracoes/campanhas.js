import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';

export default function CampanhasMatriculas() {
  const router = useRouter();
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novaCampanha, setNovaCampanha] = useState({
    nome: '',
    dataInicio: '',
    dataFim: '',
    desconto: 0,
    ativa: true
  });

  useEffect(() => {
    carregarCampanhas();
  }, []);

  const carregarCampanhas = async () => {
    try {
      const res = await fetch('/api/configuracoes/campanhas');
      if (res.ok) {
        const data = await res.json();
        setCampanhas(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionar = async (e) => {
    e.preventDefault();
    
    if (!novaCampanha.nome || !novaCampanha.dataInicio || !novaCampanha.dataFim) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const res = await fetch('/api/configuracoes/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaCampanha)
      });

      if (res.ok) {
        alert('Campanha adicionada com sucesso');
        setNovaCampanha({ nome: '', dataInicio: '', dataFim: '', desconto: 0, ativa: true });
        carregarCampanhas();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar campanha');
    }
  };

  const handleDeletar = async (id) => {
    if (!confirm('Deseja deletar esta campanha?')) return;

    try {
      const res = await fetch(`/api/configuracoes/campanhas?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Campanha deletada com sucesso');
        carregarCampanhas();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar campanha');
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
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Campanhas de Matrículas</h1>

        {/* Nova Campanha */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="text-sm font-bold text-teal-600 mb-4">➕ Nova Campanha</h3>
          
          <form onSubmit={handleAdicionar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
                <input
                  type="text"
                  value={novaCampanha.nome}
                  onChange={(e) => setNovaCampanha({...novaCampanha, nome: e.target.value})}
                  placeholder="Ex: Campanha Verão"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">INÍCIO *</label>
                <input
                  type="date"
                  value={novaCampanha.dataInicio}
                  onChange={(e) => setNovaCampanha({...novaCampanha, dataInicio: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">FIM *</label>
                <input
                  type="date"
                  value={novaCampanha.dataFim}
                  onChange={(e) => setNovaCampanha({...novaCampanha, dataFim: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DESCONTO %</label>
                <input
                  type="number"
                  value={novaCampanha.desconto}
                  onChange={(e) => setNovaCampanha({...novaCampanha, desconto: Number(e.target.value)})}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div className="flex items-end">
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

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-teal-100 border-b border-teal-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Período</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Desconto</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Status</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-teal-800">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campanhas.map((c, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-teal-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-800">{c.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {new Date(c.dataInicio).toLocaleDateString('pt-BR')} a {new Date(c.dataFim).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{c.desconto}%</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      c.ativa 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {c.ativa ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeletar(c.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {campanhas.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              Nenhuma campanha registrada
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
