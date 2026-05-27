import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';
import DashboardCard from '@/components/recepcao/DashboardCard';

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

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      const response = await fetch('/api/admin-financeiro/dashboard');
      if (response.ok) { const data = await response.json(); setDados(data); }
    } catch (error) { console.error('Erro ao carregar dados:', error); }
    finally { setLoading(false); }
  };

  const fmtValor = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6">

        {/* ── Cabeçalho ─────────────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h2>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{hoje}</p>
          </div>
          <button onClick={carregarDados}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition">
            🔄 Atualizar
          </button>
        </div>

        {/* ── Alertas de ação ─────────────────────────────────────── */}
        {!loading && dados.boletosVencidos > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm">
            <span className="text-lg">🚨</span>
            <span className="text-red-700 font-semibold">
              {dados.boletosVencidos} parcela{dados.boletosVencidos !== 1 ? 's' : ''} vencida{dados.boletosVencidos !== 1 ? 's' : ''}
              — {fmtValor(dados.valorVencido)} em aberto.
            </span>
            <Link href="/admin-financeiro/carnes" className="ml-auto text-red-700 underline font-medium text-xs">Ver carnês →</Link>
          </div>
        )}

        {/* ── Cards operacionais ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <DashboardCard icon="✅" label="Total Recebido"    valor={fmtValor(dados.totalRecebido)}    cor="border-green-500"  bgIcon="bg-green-50"  loading={loading} />
          <DashboardCard icon="📈" label="A Receber"         valor={fmtValor(dados.totalAReceber)}    cor="border-cyan-500"   bgIcon="bg-cyan-50"   loading={loading} href="/admin-financeiro/carnes" />
          <DashboardCard icon="🚨" label="Parcelas Vencidas" valor={dados.boletosVencidos}            cor="border-red-500"    bgIcon="bg-red-50"    loading={loading} href="/admin-financeiro/carnes" />
          <DashboardCard icon="💵" label="Valor em Atraso"   valor={fmtValor(dados.valorVencido)}     cor="border-orange-500" bgIcon="bg-orange-50" loading={loading} />
          <DashboardCard icon="📋" label="Carnês Ativos"     valor={dados.totalCarnes}                cor="border-blue-500"   bgIcon="bg-blue-50"   loading={loading} href="/admin-financeiro/carnes" />
          <DashboardCard icon="📊" label="Taxa Recebimento"  valor={`${dados.taxaRecebimento || 0}%`} cor="border-purple-500" bgIcon="bg-purple-50" loading={loading} />
        </div>

        {/* ── Atalhos rápidos ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: '/admin-financeiro/alunos',    icon: '🧾', label: 'Nova Ordem',      sub: 'Cobrança simples' },
            { href: '/admin-financeiro/alunos',    icon: '📋', label: 'Novo Carnê',      sub: 'Parcelamento' },
            { href: '/admin-financeiro/carnes',    icon: '✅', label: 'Baixa Manual',    sub: 'Registrar pagamento' },
            { href: '/admin-financeiro/comissoes', icon: '💰', label: 'Comissões',       sub: 'Repasses pendentes' },
            { href: '/admin-financeiro/ordens',    icon: '📉', label: 'Inadimplência',   sub: `${dados.totalAlunosComPendencias} pendentes` },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all border border-gray-100 hover:border-teal-200 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Resumo de documentos ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">🧾 Ordens</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-gray-800">{loading ? '…' : dados.totalOrdens}</span>
              <span className="text-sm text-gray-500 mb-1">{loading ? '' : fmtValor(dados.valorTotalOrdens)}</span>
            </div>
            <Link href="/admin-financeiro/ordens" className="mt-3 inline-flex text-xs text-teal-600 hover:underline">Ver todas →</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">📋 Carnês</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-gray-800">{loading ? '…' : dados.totalCarnes}</span>
              <span className="text-sm text-gray-500 mb-1">{loading ? '' : fmtValor(dados.valorTotalCarnes)}</span>
            </div>
            <Link href="/admin-financeiro/carnes" className="mt-3 inline-flex text-xs text-teal-600 hover:underline">Ver todos →</Link>
          </div>
        </div>

      </div>
    </AdminFinanceiroLayout>
  );
}
