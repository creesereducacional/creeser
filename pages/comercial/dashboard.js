import { useState, useEffect } from 'react';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';
import DashboardCard from '@/components/recepcao/DashboardCard';

const fmtMoeda = (v) =>
  v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

export default function ComercialDashboard() {
  const [stats, setStats] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/comercial/dashboard', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/comercial/matriculas', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([statsData, matriculasData]) => {
        setStats(statsData);
        setMatriculas(Array.isArray(matriculasData) ? matriculasData.slice(0, 5) : []);
      })
      .catch(() => setErro('Não foi possível carregar os dados.'))
      .finally(() => setCarregando(false));
  }, []);

  const isMaster = stats?.tipo === 'master';
  const isOperador = stats?.tipo === 'operador';

  return (
    <ComercialLayout titulo="Dashboard Comercial">
      {carregando && (
        <div className="flex items-center justify-center h-48 text-gray-400">Carregando...</div>
      )}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{erro}</div>
      )}

      {stats && (
        <>
          {/* Badge de contexto */}
          {isMaster && (
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-xs font-semibold text-teal-700">
                ⭐ Visão da Equipe — {(stats.totalOperadores || 0) + 1} membro{stats.totalOperadores !== 0 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            <DashboardCard icon="🎯" label={isMaster ? 'Leads da Equipe' : 'Meus Leads'}        valor={stats.totalLeads}                        cor="border-blue-500"   bgIcon="bg-blue-50"   loading={carregando} href="/comercial/leads" />
            <DashboardCard icon="🆕" label="Novos"                                               valor={stats.novo || 0}                         cor="border-cyan-500"   bgIcon="bg-cyan-50"   loading={carregando} />
            <DashboardCard icon="📋" label="Pré-Matrículas"                                      valor={stats.pre_matricula || 0}                 cor="border-purple-500" bgIcon="bg-purple-50" loading={carregando} href="/comercial/matriculas" />
            <DashboardCard icon="🎓" label={isMaster ? 'Matrículas da Equipe' : 'Matriculados'}  valor={stats.matriculado}                        cor="border-green-500"  bgIcon="bg-green-50"  loading={carregando} />
            <DashboardCard icon="💰" label="Comissão Pendente"                                   valor={fmtMoeda(stats.comissoes?.pendente || 0)} cor="border-yellow-500" bgIcon="bg-yellow-50" loading={carregando} href="/comercial/comissoes" />
            <DashboardCard icon="📈" label="Taxa de Conversão"                                   valor={`${stats.taxaConversao || 0}%`}           cor="border-teal-500"   bgIcon="bg-teal-50"   loading={carregando} />
          </div>

          {/* Cards extras para master: meus números */}
          {isMaster && stats.meus && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-600 text-sm mb-3">📌 Meus Números (Pessoal)</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{stats.meus.totalLeads}</div>
                  <div className="text-xs text-gray-500 mt-1">Meus Leads</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.meus.matriculado}</div>
                  <div className="text-xs text-gray-500 mt-1">Minhas Matrículas</div>
                </div>
                <div className="bg-teal-50 rounded-xl border border-teal-100 shadow-sm p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-teal-700">{stats.meus.taxaConversao}%</div>
                  <div className="text-xs text-gray-500 mt-1">Minha Conversão</div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline visual de Leads */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Pipeline de Leads</h2>
              <Link href="/comercial/leads" className="text-xs text-teal-600 hover:underline">Ver todos →</Link>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="flex items-center gap-1 min-w-max">
                {[
                  { label: 'Novos',        key: 'novo',          bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
                  { label: 'Contatados',   key: 'contatado',     bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
                  { label: 'Interessados', key: 'interessado',   bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
                  { label: 'Pré-Matr.',    key: 'pre_matricula', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
                  { label: 'Matriculados', key: 'matriculado',   bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500' },
                ].map((step, idx, arr) => (
                  <div key={step.key} className="flex items-center gap-1">
                    <div className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[88px] border ${
                      (stats[step.key] || 0) > 0 ? `${step.bg} ${step.border}` : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${step.dot} mb-1`} />
                      <div className={`text-xl font-bold ${(stats[step.key] || 0) > 0 ? step.text : 'text-gray-400'}`}>
                        {stats[step.key] || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 text-center">{step.label}</div>
                    </div>
                    {idx < arr.length - 1 && <span className="text-gray-300 text-lg leading-none">›</span>}
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <span className="text-gray-200 mx-1 font-light text-lg">|</span>
                  <div className="flex flex-col items-center px-4 py-3 rounded-xl min-w-[88px] border border-red-200 bg-red-50">
                    <div className="w-2 h-2 rounded-full bg-red-400 mb-1" />
                    <div className={`text-xl font-bold ${(stats.perdido || 0) > 0 ? 'text-red-500' : 'text-gray-400'}`}>{stats.perdido || 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Desistentes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking da equipe — apenas para master */}
          {isMaster && stats.ranking && stats.ranking.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700">🏆 Ranking da Equipe</h2>
                <Link href="/comercial/equipe" className="text-sm text-teal-600 hover:text-teal-800 font-medium hover:underline">
                  Gerenciar Equipe →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Nome</th>
                      <th className="pb-2 font-medium text-right">Leads</th>
                      <th className="pb-2 font-medium text-right">Matrículas</th>
                      <th className="pb-2 font-medium text-right">Conversão</th>
                      <th className="pb-2 font-medium text-right">Comissões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ranking.map((r, idx) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 text-gray-400 font-semibold">{idx + 1}°</td>
                        <td className="py-2 font-medium text-gray-800">
                          {r.nome}
                          {r.isMaster && <span className="ml-1.5 text-xs text-teal-600 font-semibold">(você)</span>}
                        </td>
                        <td className="py-2 text-right text-gray-600">{r.totalLeads}</td>
                        <td className="py-2 text-right font-semibold text-green-700">{r.matriculados}</td>
                        <td className="py-2 text-right">
                          <span className="text-teal-700 font-semibold">{r.taxaConversao}%</span>
                        </td>
                        <td className="py-2 text-right text-xs">
                          {r.valorComissao > 0 ? (
                            <span className="font-semibold text-teal-700">
                              {Number(r.valorComissao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cards de comissões (master e operador) */}
          {stats.comissoes && (
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700">💰 {isMaster ? 'Comissões da Equipe' : 'Minhas Comissões'}</h2>
                <Link href="/comercial/comissoes" className="text-sm text-teal-600 hover:text-teal-800 font-medium hover:underline">
                  Ver detalhes →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Pendente Repasse</div>
                  <div className="text-lg font-bold text-yellow-700">
                    {Number(stats.comissoes.pendente || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Já Repassado</div>
                  <div className="text-lg font-bold text-green-700">
                    {Number(stats.comissoes.repassado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Total Acumulado</div>
                  <div className="text-lg font-bold text-teal-700">
                    {Number(stats.comissoes.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Últimas matrículas captadas */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Últimas Matrículas Captadas</h2>
              <Link href="/comercial/matriculas" className="text-sm text-teal-600 hover:text-teal-800 font-medium hover:underline">
                Ver todas →
              </Link>
            </div>
            {matriculas.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhuma matrícula captada ainda.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Nome</th>
                    <th className="pb-2">Contato</th>
                    <th className="pb-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map(a => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-800">{a.nome}</td>
                      <td className="py-2 text-gray-500">{a.email || a.telefone_celular || '—'}</td>
                      <td className="py-2 text-gray-400">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </ComercialLayout>
  );
}

