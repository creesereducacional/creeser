import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function OrdensPage() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');

  useEffect(() => {
    carregarOrdens();
  }, []);

  const carregarOrdens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-financeiro/ordens');
      if (response.ok) {
        const data = await response.json();
        setOrdens(Array.isArray(data.ordens) ? data.ordens : []);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
    } finally {
      setLoading(false);
    }
  };

  const ordensFiltradas = useMemo(() => {
    let resultado = ordens;

    if (filtroStatus) {
      resultado = resultado.filter(o => o.status === filtroStatus);
    }

    if (filtroAluno) {
      const termo = filtroAluno.toLowerCase();
      resultado = resultado.filter(o =>
        (o.aluno_nome || '').toLowerCase().includes(termo) ||
        (o.aluno_cpf || '').includes(termo)
      );
    }

    return resultado;
  }, [ordens, filtroStatus, filtroAluno]);

  const resumo = useMemo(() => {
    return {
      total: ordensFiltradas.length,
      ativas: ordensFiltradas.filter(o => o.status === 'ativo').length,
      canceladas: ordensFiltradas.filter(o => o.status === 'cancelado').length,
      valor_total: ordensFiltradas.reduce((acc, o) => acc + (Number(o.valor_total) || 0), 0)
    };
  }, [ordensFiltradas]);

  const formataValor = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formataData = (data) => {
    if (!data) return '-';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const StatusBadge = ({ status }) => {
    const cores = {
      'ativo':      'bg-blue-100 text-blue-800',
      'pendente':   'bg-yellow-100 text-yellow-800',
      'pago':       'bg-green-100 text-green-800',
      'vencido':    'bg-orange-100 text-orange-800',
      'cancelado':  'bg-red-100 text-red-800',
      'encerrado':  'bg-gray-100 text-gray-800'
    };
    const labels = {
      'ativo': 'Ativo', 'pendente': 'Pendente', 'pago': 'Pago',
      'vencido': 'Vencido', 'cancelado': 'Cancelado', 'encerrado': 'Encerrado'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cores[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminFinanceiroLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-600">Carregando ordens...</p>
        </div>
      </AdminFinanceiroLayout>
    );
  }

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Ordens de Pagamento</h2>
            <p className="text-gray-600">Gestão de pagamentos simples e únicos</p>
          </div>
          <Link
            href="/admin-financeiro/alunos"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
          >
            ➕ Nova Ordem
          </Link>
        </div>

        {/* RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-semibold">Total de Ordens</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{resumo.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-semibold">Ativas</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{resumo.ativas}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-700 font-semibold">Valor Total</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{formataValor(resumo.valor_total)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-semibold">Canceladas</p>
            <p className="text-3xl font-bold text-red-900 mt-1">{resumo.canceladas}</p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="🔍 Nome ou CPF do aluno..."
              value={filtroAluno}
              onChange={(e) => setFiltroAluno(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            >
              <option value="">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="encerrado">Encerrado</option>
            </select>
            <button
              onClick={carregarOrdens}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {ordensFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nenhuma ordem encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Aluno</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Emissão</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Cobrança</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ordensFiltradas.map(ordem => (
                    <tr key={ordem.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {ordem.aluno_nome}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <StatusBadge status={ordem.status_parcela || ordem.status} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formataData(ordem.data_vencimento)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formataData(ordem.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                        {formataValor(ordem.valor_total)}
                      </td>
                      <td className="px-4 py-4 text-sm text-blue-600 font-mono">
                        {ordem.cobranca}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Link
                          href={`/admin-financeiro/ordem/${ordem.id}`}
                          className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition text-xs font-semibold"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminFinanceiroLayout>
  );
}
