import { useState, useEffect } from 'react';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function DashboardFinanceiro() {
  const [dados, setDados] = useState({
    totalClientes: 0,
    totalRecurring: 0,
    receita30dias: 0,
    receita12meses: 0,
    faturasPendentes: 0,
    taxaRetencao: 0,
    churnRate: 0,
    arpu: 0, // Average Revenue Per User
    mrr: 0   // Monthly Recurring Revenue
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const response = await fetch('/api/admin-financeiro/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDados(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const CardStat = ({ titulo, valor, subtexto, cor, icone }) => (
    <div className={`bg-gradient-to-br ${cor} rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold opacity-90">{titulo}</p>
          <p className="text-3xl font-bold mt-2">{valor}</p>
          <p className="text-xs opacity-75 mt-1">{subtexto}</p>
        </div>
        <span className="text-3xl">{icone}</span>
      </div>
    </div>
  );

  return (
    <AdminFinanceiroLayout>
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Financeiro</h2>
          <p className="text-slate-400">Visão geral do faturamento e gestão de clientes</p>
        </div>

        {/* KPIs PRINCIPAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CardStat
            titulo="Total de Clientes"
            valor={dados.totalClientes}
            subtexto="Empresas ativas"
            cor="from-blue-600 to-blue-700"
            icone="👥"
          />
          <CardStat
            titulo="MRR"
            valor={`R$ ${(dados.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtexto="Receita mensal recorrente"
            cor="from-green-600 to-green-700"
            icone="💚"
          />
          <CardStat
            titulo="Faturamento 30 dias"
            valor={`R$ ${(dados.receita30dias || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtexto="Últimos 30 dias"
            cor="from-emerald-600 to-emerald-700"
            icone="📈"
          />
          <CardStat
            titulo="Faturas Pendentes"
            valor={dados.faturasPendentes}
            subtexto="Aguardando pagamento"
            cor="from-orange-600 to-orange-700"
            icone="⏰"
          />
        </div>

        {/* METRICAS SECUNDARIAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CardStat
            titulo="Faturamento 12 meses"
            valor={`R$ ${(dados.receita12meses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtexto="Últimos 12 meses"
            cor="from-purple-600 to-purple-700"
            icone="📊"
          />
          <CardStat
            titulo="Taxa de Retenção"
            valor={`${dados.taxaRetencao || 0}%`}
            subtexto="Clientes que continuam"
            cor="from-cyan-600 to-cyan-700"
            icone="📍"
          />
          <CardStat
            titulo="Churn Rate"
            valor={`${dados.churnRate || 0}%`}
            subtexto="Clientes perdidos"
            cor="from-red-600 to-red-700"
            icone="📉"
          />
          <CardStat
            titulo="ARPU"
            valor={`R$ ${(dados.arpu || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtexto="Receita por usuário"
            cor="from-indigo-600 to-indigo-700"
            icone="💰"
          />
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">⚡ Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold">
              ➕ Novo Cliente
            </button>
            <button className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold">
              💰 Registrar Pagamento
            </button>
            <button className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold">
              📄 Gerar Fatura
            </button>
            <button className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold">
              📊 Exportar Relatório
            </button>
          </div>
        </div>

        {/* ALERTAS */}
        <div className="mt-8 bg-yellow-900 border-l-4 border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-100">
            <strong>⚠️ Atenção:</strong> Você tem 3 faturas vencidas e 5 com vencimento nos próximos 7 dias.
          </p>
        </div>
      </div>
    </AdminFinanceiroLayout>
  );
}
