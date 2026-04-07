import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function CarnesPage() {
  const [carnes, setCarnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');
  const [expandidoId, setExpandidoId] = useState(null);
  const [gerandoId, setGerandoId] = useState(null);

  useEffect(() => {
    carregarCarnes();
  }, []);

  const carregarCarnes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-financeiro/carnes');
      if (response.ok) {
        const data = await response.json();
        setCarnes(Array.isArray(data.carnes) ? data.carnes : []);
      }
    } catch (error) {
      console.error('Erro ao carregar carnês:', error);
    } finally {
      setLoading(false);
    }
  };

  const carnesFiltrados = useMemo(() => {
    let resultado = carnes;

    if (filtroStatus) {
      resultado = resultado.filter(c => c.status === filtroStatus);
    }

    if (filtroAluno) {
      const termo = filtroAluno.toLowerCase();
      resultado = resultado.filter(c =>
        (c.aluno_nome || '').toLowerCase().includes(termo) ||
        (c.aluno_cpf || '').includes(termo)
      );
    }

    return resultado;
  }, [carnes, filtroStatus, filtroAluno]);

  const resumo = useMemo(() => {
    return {
      total: carnesFiltrados.length,
      ativas: carnesFiltrados.filter(c => c.status === 'ativo').length,
      canceladas: carnesFiltrados.filter(c => c.status === 'cancelado').length,
      valor_total: carnesFiltrados.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0)
    };
  }, [carnesFiltrados]);

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
      'ativo': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
      'encerrado': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${cores[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const StatusParcelaBadge = ({ status }) => {
    const cores = {
      'pendente': 'bg-amber-100 text-amber-800',
      'pago': 'bg-green-100 text-green-800',
      'vencido': 'bg-red-100 text-red-800',
      'cancelado': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cores[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handleGerarBoletos = async (carne) => {
    setGerandoId(carne.id);
    try {
      if (!carne.efi_carnet_id) {
        // Carnê ainda não gerado na EFI — criar agora
        const res = await fetch('/api/admin-financeiro/efi/carne', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id: carne.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao gerar carnê');
        if (data.link) window.open(data.link, '_blank');
        await carregarCarnes();
      } else {
        // Já gerado — buscar link atual na EFI
        const res = await fetch(`/api/admin-financeiro/efi/carne?ordem_id=${carne.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao buscar carnê');
        if (data.link) {
          window.open(data.link, '_blank');
        } else {
          alert('Link do carnê não disponível na EFI.');
        }
      }
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setGerandoId(null);
    }
  };

  if (loading) {
    return (
      <AdminFinanceiroLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-600">Carregando carnês...</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Carnês de Pagamento</h2>
            <p className="text-gray-600">Gestão de múltiplas parcelas por aluno</p>
          </div>
          <Link
            href="/admin-financeiro/alunos"
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
          >
            ➕ Novo Carnê
          </Link>
        </div>

        {/* RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-semibold">Total de Carnês</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{resumo.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-semibold">Ativos</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{resumo.ativas}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-700 font-semibold">Valor Total</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{formataValor(resumo.valor_total)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-semibold">Cancelados</p>
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="encerrado">Encerrado</option>
            </select>
            <button
              onClick={carregarCarnes}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {carnesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nenhum carnê encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {carnesFiltrados.map((carne) => (
                <div key={carne.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* CABEÇALHO DO CARNÊ */}
                  <button
                    onClick={() => setExpandidoId(expandidoId === carne.id ? null : carne.id)}
                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition text-left flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{carne.aluno_nome}</p>
                      <p className="text-sm text-gray-600">{carne.descricao}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formataValor(carne.valor_total)}</p>
                        <p className="text-xs text-gray-600">{carne.quantidade_parcelas}x</p>
                      </div>
                      <StatusBadge status={carne.status} />
                      <span className="text-xl text-gray-400">
                        {expandidoId === carne.id ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>

                  {/* DETALHES EXPANDIDOS */}
                  {expandidoId === carne.id && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">CPF</p>
                          <p className="font-semibold text-gray-900">{carne.aluno_cpf}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Descrição</p>
                          <p className="font-semibold text-gray-900">{carne.descricao || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Data Criação</p>
                          <p className="font-semibold text-gray-900">{formataData(carne.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Valor/Parcela</p>
                          <p className="font-semibold text-gray-900">
                            {formataValor(carne.valor_total / carne.quantidade_parcelas)}
                          </p>
                        </div>
                      </div>

                      {/* TABELA DE PARCELAS */}
                      {carne.parcelas && carne.parcelas.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Parcelas:</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left px-2 py-2 text-gray-700">Parcela</th>
                                  <th className="text-left px-2 py-2 text-gray-700">Vencimento</th>
                                  <th className="text-right px-2 py-2 text-gray-700">Valor</th>
                                  <th className="text-left px-2 py-2 text-gray-700">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {carne.parcelas.map((parcela) => (
                                  <tr key={parcela.id} className="border-b border-gray-100">
                                    <td className="px-2 py-2 text-gray-900 font-semibold">
                                      {parcela.numero_parcela}
                                    </td>
                                    <td className="px-2 py-2 text-gray-600">
                                      {formataData(parcela.data_vencimento)}
                                    </td>
                                    <td className="px-2 py-2 text-gray-900 font-semibold text-right">
                                      {formataValor(parcela.valor)}
                                    </td>
                                    <td className="px-2 py-2">
                                      <StatusParcelaBadge status={parcela.status} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* BOTÕES */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <Link
                          href={`/admin-financeiro/carne/${carne.id}`}
                          className="flex-1 px-3 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 font-semibold text-center transition text-sm"
                        >
                          Detalhes
                        </Link>
                        <button
                          onClick={() => handleGerarBoletos(carne)}
                          disabled={gerandoId === carne.id}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold transition text-sm disabled:opacity-50"
                        >
                          {gerandoId === carne.id
                            ? '⏳ Aguarde...'
                            : carne.efi_carnet_id ? '📄 Abrir Carnê PDF' : '📄 Gerar Boletos'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminFinanceiroLayout>
  );
}
