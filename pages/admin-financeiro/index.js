import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';
import PageHeader from '@/components/ui/PageHeader';

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
    totalGerado: 0,
    carnesAVencerCount: 0,
    carnesAVencerList: [],
    alunosEmAtrasoList: []
  });

  const [modalDetalhes, setModalDetalhes] = useState(null);
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
        <div className="py-1">
          <PageHeader
            icon="💰"
            title="Dashboard Financeiro"
            subtitle={hoje}
            actions={
              <button onClick={carregarDados}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition shadow-xs">
                🔄 Atualizar
              </button>
            }
          />
        </div>

        {/* ── Banner de Alertas ─────────────────────────────────────── */}
        {!loading && dados.boletosVencidos > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔔</span>
              <span className="text-red-800 font-bold">
                {dados.boletosVencidos} parcela{dados.boletosVencidos !== 1 ? 's' : ''} vencida{dados.boletosVencidos !== 1 ? 's' : ''}
                {' '}•{' '}
                {fmtValor(dados.valorVencido)} em aberto
              </span>
            </div>
            <Link href="/admin-financeiro/carnes" className="text-red-700 hover:text-red-800 font-bold underline whitespace-nowrap">
              Ver detalhes
            </Link>
          </div>
        )}

        {/* ── KPIs Principais ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Card 1: Total Recebido */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Recebido</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-extrabold text-gray-900 leading-none">
                {loading ? '...' : fmtValor(dados.totalRecebido)}
              </span>
              <span className="text-lg flex-shrink-0">✅</span>
            </div>
          </div>

          {/* Card 2: A Receber */}
          <Link href="/admin-financeiro/carnes" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between h-32 relative overflow-hidden cursor-pointer">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">A Receber</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-extrabold text-gray-900 leading-none">
                {loading ? '...' : fmtValor(dados.totalAReceber)}
              </span>
              <span className="text-lg flex-shrink-0">📈</span>
            </div>
          </Link>

          {/* Card 3: Valor em Atraso */}
          <button 
            onClick={() => setModalDetalhes({ tipo: 'atraso', titulo: 'Alunos com Parcelas em Atraso', lista: dados.alunosEmAtrasoList || [] })}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden cursor-pointer w-full focus:outline-none"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Valor em Atraso</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-extrabold text-red-600 leading-none">
                {loading ? '...' : fmtValor(dados.valorVencido)}
              </span>
              <span className="text-lg flex-shrink-0">💵</span>
            </div>
          </button>

          {/* Card 4: Carnês Ativos */}
          <Link href="/admin-financeiro/carnes" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between h-32 relative overflow-hidden cursor-pointer">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Carnês Ativos</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-extrabold text-gray-900 leading-none">
                {loading ? '...' : dados.totalCarnes}
              </span>
              <span className="text-lg flex-shrink-0">📋</span>
            </div>
          </Link>
        </div>

        {/* ── Indicadores Secundários ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pill 1: Parcelas Vencidas */}
          <Link href="/admin-financeiro/carnes" className="bg-white border border-gray-250 rounded-xl px-4 py-2.5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm p-1 bg-red-50 rounded-lg">🚨</span>
              <span className="text-xs font-bold text-gray-500 truncate">Parcelas Vencidas</span>
            </div>
            <span className="text-xs font-bold text-red-650 leading-none">
              {loading ? '...' : dados.boletosVencidos}
            </span>
          </Link>

          {/* Pill 2: Carnês a Vencer */}
          <button 
            onClick={() => setModalDetalhes({ tipo: 'vencer', titulo: 'Carnês Próximos de Finalizar (1 Parcela Restante)', lista: dados.carnesAVencerList || [] })}
            className="bg-white border border-gray-250 rounded-xl px-4 py-2.5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between cursor-pointer text-left w-full focus:outline-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm p-1 bg-amber-50 rounded-lg">⏳</span>
              <span className="text-xs font-bold text-gray-500 truncate">Carnês a Vencer</span>
            </div>
            <span className="text-xs font-bold text-amber-700 leading-none">
              {loading ? '...' : dados.carnesAVencerCount}
            </span>
          </button>

          {/* Pill 3: Taxa de Recebimento */}
          <div className="bg-white border border-gray-250 rounded-xl px-4 py-2.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm p-1 bg-purple-50 rounded-lg">📊</span>
              <span className="text-xs font-bold text-gray-500 truncate">Taxa Recebimento</span>
            </div>
            <span className="text-xs font-bold text-purple-700 leading-none">
              {loading ? '...' : `${dados.taxaRecebimento || 0}%`}
            </span>
          </div>
        </div>

        {/* ── Ações Rápidas ─────────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { href: '/admin-financeiro/alunos',    icon: '🧾', label: 'Nova Ordem',      sub: 'Cobrança simples', color: 'hover:border-teal-300 hover:bg-teal-50/10' },
              { href: '/admin-financeiro/alunos',    icon: '📋', label: 'Novo Carnê',      sub: 'Parcelamento', color: 'hover:border-blue-300 hover:bg-blue-50/10' },
              { href: '/admin-financeiro/carnes',    icon: '✅', label: 'Baixa Manual',    sub: 'Registrar pagamento', color: 'hover:border-green-300 hover:bg-green-50/10' },
              { href: '/admin-financeiro/comissoes', icon: '💰', label: 'Comissões',       sub: 'Repasses pendentes', color: 'hover:border-purple-300 hover:bg-purple-50/10' },
              { href: '/admin-financeiro/ordens',    icon: '📉', label: 'Inadimplência',   sub: `${dados.totalAlunosComPendencias} pendentes`, color: 'hover:border-red-300 hover:bg-red-50/10' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className={`bg-white rounded-xl shadow-xs p-3 border border-gray-200 transition-all flex items-center gap-3 cursor-pointer ${item.color}`}>
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{item.label}</p>
                  <p className="text-[10px] text-gray-400 truncate">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Resumo de documentos ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-xs p-5 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">🧾 Ordens</h3>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-extrabold text-gray-800 leading-none">{loading ? '…' : dados.totalOrdens}</span>
              <span className="text-xs font-semibold text-gray-500 mb-0.5">{loading ? '' : fmtValor(dados.valorTotalOrdens)}</span>
            </div>
            <Link href="/admin-financeiro/ordens" className="mt-3 inline-flex text-xs text-teal-600 font-bold hover:underline">Ver todas →</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-xs p-5 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">📋 Carnês</h3>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-extrabold text-gray-800 leading-none">{loading ? '…' : dados.totalCarnes}</span>
              <span className="text-xs font-semibold text-gray-500 mb-0.5">{loading ? '' : fmtValor(dados.valorTotalCarnes)}</span>
            </div>
            <Link href="/admin-financeiro/carnes" className="mt-3 inline-flex text-xs text-teal-600 font-bold hover:underline">Ver todos →</Link>
          </div>
        </div>

        {/* ── Modal de Detalhes (Inadimplência ou Carnês a Vencer) ──── */}
        {modalDetalhes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-800">{modalDetalhes.titulo}</h3>
                <button onClick={() => setModalDetalhes(null)} className="text-gray-400 hover:text-gray-650 text-2xl leading-none">&times;</button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-grow">
                {modalDetalhes.lista.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-base">Nenhum registro encontrado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-xs text-gray-700 uppercase border-b border-gray-100">
                        {modalDetalhes.tipo === 'atraso' ? (
                          <tr>
                            <th className="px-6 py-3">Aluno</th>
                            <th className="px-6 py-3">Matrícula</th>
                            <th className="px-6 py-3">Curso / Turma</th>
                            <th className="px-6 py-3 text-right">Parcelas Atrasadas</th>
                            <th className="px-6 py-3 text-right text-red-600 font-semibold">Valor em Atraso</th>
                          </tr>
                        ) : (
                          <tr>
                            <th className="px-6 py-3">Aluno</th>
                            <th className="px-6 py-3">Matrícula</th>
                            <th className="px-6 py-3">Curso / Turma</th>
                            <th className="px-6 py-3">Vencimento da Última</th>
                            <th className="px-6 py-3 text-right text-amber-600 font-semibold">Valor Restante</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {modalDetalhes.tipo === 'atraso' ? (
                          modalDetalhes.lista.map(item => (
                            <tr key={item.aluno_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-800">{item.nome}</td>
                              <td className="px-6 py-4 text-gray-500">{item.matricula || '—'}</td>
                              <td className="px-6 py-4 text-gray-500">
                                <div className="font-medium text-gray-700">{item.curso || '—'}</div>
                                <div className="text-xs text-gray-400">{item.turma || '—'}</div>
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-700">{item.qtd_parcelas_atrasadas}x</td>
                              <td className="px-6 py-4 text-right font-bold text-red-600">{fmtValor(item.valor_em_atraso)}</td>
                            </tr>
                          ))
                        ) : (
                          modalDetalhes.lista.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-800">{item.aluno_nome}</td>
                              <td className="px-6 py-4 text-gray-500">{item.aluno_matricula || '—'}</td>
                              <td className="px-6 py-4 text-gray-500">
                                <div className="font-medium text-gray-700">{item.curso || '—'}</div>
                                <div className="text-xs text-gray-400">{item.turma || '—'}</div>
                              </td>
                              <td className="px-6 py-4 text-gray-500">{item.data_vencimento ? new Date(item.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                              <td className="px-6 py-4 text-right font-bold text-amber-600">{fmtValor(item.valor_restante)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                <button onClick={() => setModalDetalhes(null)}
                  className="px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminFinanceiroLayout>
  );
}
