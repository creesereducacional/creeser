import { useState, useEffect } from 'react';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';
import {
  ExecutiveMetricCard,
  DashboardContainer,
  DashboardHeader,
  SkeletonCard
} from '@/components/ui';

const fmtMoeda = (v) =>
  v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

export default function ComercialDashboard() {
  const [data, setData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Listas para os filtros
  const [instituicoes, setInstituicoes] = useState([]);
  const [captadores, setCaptadores] = useState([]);
  const [cursos, setCursos] = useState([]);

  // Estados dos filtros
  const [filtroInst, setFiltroInst] = useState('');
  const [filtroCaptador, setFiltroCaptador] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // 1. Carregar listas de filtros
  useEffect(() => {
    fetch('/api/comercial/instituicoes', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setInstituicoes(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/comercial/equipe', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setCaptadores(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/comercial/cursos', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setCursos(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // 2. Carregar dados reais do dashboard
  const carregarDashboard = () => {
    setCarregando(true);
    setErro(null);

    const queryParams = new URLSearchParams();
    if (filtroInst) queryParams.append('instituicao_id', filtroInst);
    if (filtroCaptador) queryParams.append('captador_id', filtroCaptador);
    if (filtroCurso) queryParams.append('curso_id', filtroCurso);
    if (filtroDataInicio) queryParams.append('data_inicio', filtroDataInicio);
    if (filtroDataFim) queryParams.append('data_fim', filtroDataFim);

    fetch(`/api/comercial/dashboard?${queryParams.toString()}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Falha ao obter dados.');
        return r.json();
      })
      .then(resData => {
        setData(resData);
      })
      .catch(err => {
        setErro(err.message || 'Erro ao carregar dados.');
      })
      .finally(() => {
        setCarregando(false);
      });
  };

  useEffect(() => {
    carregarDashboard();
  }, [filtroInst, filtroCaptador, filtroCurso, filtroDataInicio, filtroDataFim]);

  const limparFiltros = () => {
    setFiltroInst('');
    setFiltroCaptador('');
    setFiltroCurso('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  return (
    <ComercialLayout titulo="Dashboard Executivo Comercial">
      <DashboardContainer>
        
        {/* Cabeçalho */}
        <DashboardHeader
          title="Dashboard Executivo Comercial"
          subtitle="Visão gerencial de matrículas, faturamento, comissões e performance do funil"
          icon="📊"
          actions={
            <div className="flex gap-2">
              <button
                onClick={carregarDashboard}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition"
              >
                🔄 Atualizar
              </button>
              <Link href="/comercial/leads/novo">
                <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                  + Nova Ficha de Matrícula
                </button>
              </Link>
            </div>
          }
        />

        {/* Filtros Globais */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instituição</label>
            <select
              value={filtroInst}
              onChange={e => setFiltroInst(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <option value="">Todas</option>
              {instituicoes.map(i => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Captador / Vendedor</label>
            <select
              value={filtroCaptador}
              onChange={e => setFiltroCaptador(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <option value="">Todos</option>
              {captadores.map(c => (
                <option key={c.id} value={c.id}>{c.nomecompleto}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
            <select
              value={filtroCurso}
              onChange={e => setFiltroCurso(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <option value="">Todos</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Início</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={e => setFiltroDataInicio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fim</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={e => setFiltroDataFim(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={limparFiltros}
              className="w-full bg-gray-50 hover:bg-gray-100 border text-gray-600 font-semibold py-2 rounded-lg text-sm transition"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm shadow-xs">
            ⚠️ {erro}
          </div>
        )}

        {carregando ? (
          <div className="space-y-6">
            <SkeletonCard count={3} cols="grid-cols-1 md:grid-cols-3" />
            <SkeletonCard count={2} cols="grid-cols-1 lg:grid-cols-2" />
          </div>
        ) : (
          data && (
            <>
              {/* KPIs Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                <ExecutiveMetricCard
                  title="Leads Novos"
                  value={data.kpis.leadsNovos}
                  icon="🆕"
                  color="bg-blue-500"
                />
                <ExecutiveMetricCard
                  title="Em Negociação"
                  value={data.kpis.leadsNegociacao}
                  icon="💬"
                  color="bg-yellow-500"
                />
                <ExecutiveMetricCard
                  title="Cobranças Pendentes"
                  value={data.kpis.cobrancasPendentes}
                  icon="💳"
                  color="bg-purple-500"
                />
                <ExecutiveMetricCard
                  title="Pagamentos Confirmados"
                  value={data.kpis.pagamentosConfirmados}
                  icon="💰"
                  color="bg-green-500"
                />
                <ExecutiveMetricCard
                  title="Vendas Convertidas"
                  value={data.kpis.vendasConvertidas}
                  icon="🎓"
                  color="bg-teal-500"
                  trend={`Taxa: ${data.kpis.taxaConversao}%`}
                  trendColor="text-teal-600"
                />
                
                {/* Outra fileira de KPIs para Financeiro/Comissão */}
                <ExecutiveMetricCard
                  title="Receita do Período"
                  value={fmtMoeda(data.kpis.receitaComercial)}
                  icon="💵"
                  color="bg-emerald-500"
                />
                <ExecutiveMetricCard
                  title="Comissão Pendente"
                  value={fmtMoeda(data.kpis.comissaoPendente)}
                  icon="⏳"
                  color="bg-amber-500"
                />
                <ExecutiveMetricCard
                  title="Comissão Liberada"
                  value={fmtMoeda(data.kpis.comissaoLiberada)}
                  icon="💸"
                  color="bg-cyan-500"
                />
              </div>

              {/* Seção de Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Evolução de Leads por Mês */}
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[320px] flex flex-col">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">1. Evolução de Leads por Mês</h3>
                  <p className="text-xs text-gray-400 mb-4">Volume mensal de novos registros de leads</p>
                  <div className="flex-1 flex items-end justify-between gap-2 px-2 pt-4 h-full">
                    {data.graficos.evolucaoLeads.length === 0 ? (
                      <div className="w-full text-center text-xs text-gray-400 py-12">Nenhum dado de evolução no período.</div>
                    ) : (
                      data.graficos.evolucaoLeads.map((item, idx) => {
                        const maxVal = Math.max(...data.graficos.evolucaoLeads.map(m => m.total), 1);
                        const pct = (item.total / maxVal) * 80;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[9px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 font-bold shadow-sm">
                              {item.total} leads
                            </div>
                            <div className="w-full bg-teal-500 hover:bg-teal-600 rounded-t transition-all cursor-pointer" style={{ height: `${Math.max(pct, 6)}%` }}></div>
                            <span className="text-[9px] text-gray-500 mt-2 font-medium truncate w-full text-center">{item.rotulo}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Funil Comercial */}
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[320px] flex flex-col">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">2. Funil Comercial</h3>
                  <p className="text-xs text-gray-400 mb-4">Etapas de conversão de leads a matriculados</p>
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                    {[
                      { key: 'lead', label: 'Leads Totais', color: 'bg-blue-500' },
                      { key: 'negociacao', label: 'Em Negociação', color: 'bg-yellow-500' },
                      { key: 'cobranca', label: 'Cobrança Gerada', color: 'bg-purple-500' },
                      { key: 'pago', label: 'Pagos', color: 'bg-emerald-500' },
                      { key: 'matriculado', label: 'Matriculados', color: 'bg-teal-600' }
                    ].map((step) => {
                      const value = data.graficos.funil[step.key] || 0;
                      const maxVal = data.graficos.funil.lead || 1;
                      const widthPct = (value / maxVal) * 100;
                      return (
                        <div key={step.key} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-700">
                            <span>{step.label}</span>
                            <span>{value} ({maxVal > 0 ? ((value / maxVal) * 100).toFixed(0) : 0}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${widthPct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Receita Comercial por Instituição */}
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[320px] flex flex-col">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">3. Receita por Instituição</h3>
                  <p className="text-xs text-gray-400 mb-4">Faturamento bruto gerado em cada unidade</p>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {data.graficos.receitaPorInstituicao.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-12">Nenhuma receita computada no período.</div>
                    ) : (
                      data.graficos.receitaPorInstituicao.map((item, idx) => {
                        const totalReceitas = data.graficos.receitaPorInstituicao.reduce((s, r) => s + r.total, 0) || 1;
                        const pct = (item.total / totalReceitas) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                              <span className="truncate">{item.instituicao}</span>
                              <span>{fmtMoeda(item.total)} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. Conversões por Captador */}
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[320px] flex flex-col">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">4. Conversões por Captador</h3>
                  <p className="text-xs text-gray-400 mb-4">Matrículas efetivadas por operador de vendas</p>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {data.graficos.conversõesPorCaptador.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-12">Nenhuma conversão registrada no período.</div>
                    ) : (
                      data.graficos.conversõesPorCaptador.map((item, idx) => {
                        const totalConversões = data.graficos.conversõesPorCaptador.reduce((s, c) => s + c.total, 0) || 1;
                        const pct = (item.total / totalConversões) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                              <span>{item.captador}</span>
                              <span className="font-bold text-teal-600">{item.total} matrícula{item.total !== 1 ? 's' : ''} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Tabela de Últimas Conversões */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Últimas Conversões Efetivadas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead>
                      <tr className="border-b text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Aluno</th>
                        <th className="pb-3">Instituição</th>
                        <th className="pb-3">Curso</th>
                        <th className="pb-3">Captador</th>
                        <th className="pb-3 text-right">Valor</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ultimasConversoes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400 text-xs">
                            Nenhuma conversão registrada ainda.
                          </td>
                        </tr>
                      ) : (
                        data.ultimasConversoes.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-gray-50/50">
                            <td className="py-3 font-semibold text-gray-800">{item.aluno}</td>
                            <td className="py-3 text-xs">{item.instituicao}</td>
                            <td className="py-3 text-xs">{item.curso}</td>
                            <td className="py-3 text-xs">{item.captador}</td>
                            <td className="py-3 text-right font-bold text-gray-900">{fmtMoeda(item.valor)}</td>
                            <td className="py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-700">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 text-right text-xs text-gray-400">
                              {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}

      </DashboardContainer>
    </ComercialLayout>
  );
}
