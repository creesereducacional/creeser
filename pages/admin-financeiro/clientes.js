import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function GestaoClientes() {
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-financeiro/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    c.cnpj.includes(filtro) ||
    c.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const StatusBadge = ({ status }) => {
    const cores = {
      'ativa': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800',
      'suspensa': 'bg-yellow-100 text-yellow-800',
      'vencida': 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cores[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <AdminFinanceiroLayout>
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">👥 Gestão de Clientes</h2>
            <p className="text-slate-400">Controle todas as empresas cadastradas</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            ➕ Novo Cliente
          </button>
        </div>

        {/* FILTRO */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar por nome, CNPJ ou email..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* TABELA */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-200">Empresa</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-200">CNPJ</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-200">Plano</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-200">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-200">Próx. Vencimento</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-200">MRR</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-200">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-slate-400">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-slate-700 hover:bg-slate-700 transition">
                    <td className="px-6 py-4 text-sm text-white font-semibold">{cliente.nome}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{cliente.cnpj}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{cliente.plano || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={cliente.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {new Date(cliente.dataProximoVencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-400">
                      R$ {cliente.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin-financeiro/clientes/${cliente.id}`}>
                          <button className="p-2 hover:bg-blue-600 rounded-lg transition text-slate-300 hover:text-white">
                            ✏️
                          </button>
                        </Link>
                        <button className="p-2 hover:bg-red-600 rounded-lg transition text-slate-300 hover:text-white">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Total de Clientes</p>
            <p className="text-2xl font-bold text-white mt-2">{clientes.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Clientes Ativos</p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              {clientes.filter(c => c.status === 'ativa').length}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">MRR Total</p>
            <p className="text-2xl font-bold text-emerald-400 mt-2">
              R$ {clientes.reduce((sum, c) => sum + (c.mrr || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </AdminFinanceiroLayout>
  );
}
