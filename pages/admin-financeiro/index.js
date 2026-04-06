import { useState, useEffect } from 'react';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function DashboardFinanceiro() {
  const [dados, setDados] = useState({
    totalAlunosComPendencias: 0,
    totalAlunosAtivos: 0,
    totalAReceber: 0,
    boletosVencidos: 0,
    valorVencido: 0,
    totalOrdens: 0,
    valorTotalOrdens: 0,
    totalCarnes: 0,
    valorTotalCarnes: 0,
    totalRecebido: 0,
    taxaRecebimento: 0,
    totalGerado: 0 
  });

  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const formataValor = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const CardStat = ({ titulo, valor, subtexto, cor, icone }) => (
    <div className={`bg-gradient-to-br ${cor} rounded-xl p-6 text-white shadow-sm hover:shadow-md transition border border-transparent`}>
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

  if (loading) {
    return (
      <AdminFinanceiroLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-600">Carregando dashboard...</p>
        </div>
      </AdminFinanceiroLayout>
    );
  }

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Financeiro</h2>
          <p className="text-gray-600">Visão geral de cobrança e pagamentos de alunos</p>
        </div>

        {/* KPIs EDUCACIONAIS */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Educacional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardStat
              titulo="Alunos com Pendências"
              valor={dados.totalAlunosComPendencias}
              subtexto="Com cobrança ativa"
              cor="from-orange-500 to-amber-600"
              icone="⚠️"
            />
            <CardStat
              titulo="Boletos Vencidos"
              valor={dados.boletosVencidos}
              subtexto="Necessita cobrança"
              cor="from-red-500 to-rose-600"
              icone="📅"
            />
            <CardStat
              titulo="Valor Vencido"
              valor={formataValor(dados.valorVencido)}
              subtexto="Com atraso"
              cor="from-red-600 to-red-700"
              icone="💰"
            />
            <CardStat
              titulo="Alunos Ativos"
              valor={dados.totalAlunosAtivos}
              subtexto="Matriculados"
              cor="from-teal-600 to-teal-700"
              icone="✅"
            />
          </div>
        </div>

        {/* KPIs COBRANÇA */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">💳 Cobrança</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardStat
              titulo="Total a Receber"
              valor={formataValor(dados.totalAReceber)}
              subtexto="Pendências ativas"
              cor="from-cyan-600 to-cyan-700"
              icone="📈"
            />
            <CardStat
              titulo="Total Gerado"
              valor={formataValor(dados.totalGerado)}
              subtexto="Todas as parcelas"
              cor="from-slate-700 to-slate-800"
              icone="📊"
            />
            <CardStat
              titulo="Total Recebido"
              valor={formataValor(dados.totalRecebido)}
              subtexto="Parcelas pagas"
              cor="from-green-600 to-emerald-700"
              icone="✅"
            />
            <CardStat
              titulo="Taxa Recebimento"
              valor={`${dados.taxaRecebimento}%`}
              subtexto="Do total gerado"
              cor="from-purple-600 to-purple-700"
              icone="📉"
            />
          </div>
        </div>

        {/* KPIs ORDENS E CARNÊS */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🧾 Ordens & Carnês</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardStat
              titulo="Ordens Simples"
              valor={dados.totalOrdens}
              subtexto={formataValor(dados.valorTotalOrdens)}
              cor="from-teal-600 to-teal-700"
              icone="🧾"
            />
            <CardStat
              titulo="Carnês"
              valor={dados.totalCarnes}
              subtexto={formataValor(dados.valorTotalCarnes)}
              cor="from-cyan-600 to-cyan-700"
              icone="📋"
            />
            <CardStat
              titulo="Total de Documentos"
              valor={dados.totalOrdens + dados.totalCarnes}
              subtexto="Ordens + Carnês"
              cor="from-blue-600 to-blue-700"
              icone="📄"
            />
            <CardStat
              titulo="Valor Total Movimentado"
              valor={formataValor(dados.valorTotalOrdens + dados.valorTotalCarnes)}
              subtexto="Em cobrança"
              cor="from-indigo-600 to-indigo-700"
              icone="💵"
            />
          </div>
        </div>

        {/* RODAPÉ COM BOTÕES DE AÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <a
            href="/admin-financeiro/alunos"
            className="block p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl hover:shadow-md transition text-center"
          >
            <p className="text-2xl mb-2">🎓</p>
            <p className="font-bold text-teal-900">Selecionar Aluno</p>
            <p className="text-sm text-teal-700 mt-1">Criar ordem ou carnê</p>
          </a>
          <a
            href="/admin-financeiro/ordens"
            className="block p-6 bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 rounded-xl hover:shadow-md transition text-center"
          >
            <p className="text-2xl mb-2">📊</p>
            <p className="font-bold text-blue-900">Ver Ordens</p>
            <p className="text-sm text-blue-700 mt-1">{dados.totalOrdens} ordens ativas</p>
          </a>
          <a
            href="/admin-financeiro/carnes"
            className="block p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl hover:shadow-md transition text-center"
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="font-bold text-cyan-900">Ver Carnês</p>
            <p className="text-sm text-cyan-700 mt-1">{dados.totalCarnes} carnês ativas</p>
          </a>
          <button
            onClick={carregarDados}
            className="block p-6 bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition text-center"
          >
            <p className="text-2xl mb-2">🔄</p>
            <p className="font-bold text-gray-900">Atualizar</p>
            <p className="text-sm text-gray-600 mt-1">Sincronizar dados</p>
          </button>
        </div>
      </div>
    </AdminFinanceiroLayout>
  );
}
