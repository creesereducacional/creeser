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
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Clientes</h2>
            <p className="text-gray-600">Controle todas as empresas cadastradas</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
          >
            ➕ Novo Cliente
          </button>
        </div>

        {/* FILTRO */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <input
            type="text"
            placeholder="🔍 Buscar por nome, CNPJ ou email..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-teal-300 text-gray-800 rounded-lg placeholder-gray-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* TABELA */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-teal-50 border-b border-teal-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Empresa</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">CNPJ</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Plano</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Próx. Vencimento</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">MRR</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-teal-800">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-gray-100 hover:bg-teal-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{cliente.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{cliente.cnpj}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{cliente.plano || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={cliente.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(cliente.dataProximoVencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                      R$ {cliente.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin-financeiro/clientes/${cliente.id}`}>
                          <button className="p-2 hover:bg-teal-600 rounded-lg transition text-gray-500 hover:text-white">
                            ✏️
                          </button>
                        </Link>
                        <button className="p-2 hover:bg-red-600 rounded-lg transition text-gray-500 hover:text-white">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm">Total de Clientes</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{clientes.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm">Clientes Ativos</p>
            <p className="text-2xl font-bold text-emerald-700 mt-2">
              {clientes.filter(c => c.status === 'ativa').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm">MRR Total</p>
            <p className="text-2xl font-bold text-teal-700 mt-2">
              R$ {clientes.reduce((sum, c) => sum + (c.mrr || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </AdminFinanceiroLayout>
  );
}
