import { useState, useEffect } from 'react';
import ComercialLayout from '@/components/ComercialLayout';

function CardStat({ label, valor, cor = 'bg-white', icone, destaque = false }) {
  return (
    <div className={`${cor} rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-2 ${destaque ? 'ring-2 ring-teal-400' : ''}`}>
      <div className="text-3xl">{icone}</div>
      <div className="text-3xl font-bold text-gray-800">{valor}</div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
    </div>
  );
}

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <CardStat icone="🎯" label={isMaster ? 'Leads da Equipe' : 'Total de Leads'} valor={stats.totalLeads} />
            <CardStat icone="📞" label="Interessados" valor={stats.interessado} />
            <CardStat icone="🎓" label={isMaster ? 'Matrículas da Equipe' : 'Matriculados'} valor={stats.matriculado} />
            <CardStat icone="📈" label="Taxa de Conversão" valor={`${stats.taxaConversao}%`} cor="bg-teal-50" destaque />
          </div>

          {/* Cards extras para master: meus números */}
          {isMaster && stats.meus && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-600 text-sm mb-3">📌 Meus Números (Pessoal)</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.meus.totalLeads}</div>
                  <div className="text-xs text-gray-500 mt-1">Meus Leads</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{stats.meus.matriculado}</div>
                  <div className="text-xs text-gray-500 mt-1">Minhas Matrículas</div>
                </div>
                <div className="bg-teal-50 rounded-xl border border-teal-100 shadow-sm p-4 text-center">
                  <div className="text-2xl font-bold text-teal-700">{stats.meus.taxaConversao}%</div>
                  <div className="text-xs text-gray-500 mt-1">Minha Conversão</div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline de leads */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">Pipeline de Leads</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Novos', key: 'novo', cor: 'bg-blue-500' },
                { label: 'Contatados', key: 'contatado', cor: 'bg-yellow-500' },
                { label: 'Interessados', key: 'interessado', cor: 'bg-orange-500' },
                { label: 'Matriculados', key: 'matriculado', cor: 'bg-green-500' },
                { label: 'Perdidos', key: 'perdido', cor: 'bg-red-400' },
              ].map(({ label, key, cor }) => (
                <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 min-w-[110px]">
                  <div className={`w-3 h-3 rounded-full ${cor}`} />
                  <div>
                    <div className="text-lg font-bold text-gray-800">{stats[key]}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking da equipe — apenas para master */}
          {isMaster && stats.ranking && stats.ranking.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700">🏆 Ranking da Equipe</h2>
                <a href="/comercial/equipe" className="text-sm text-teal-600 hover:text-teal-800 font-medium hover:underline">
                  Gerenciar Equipe →
                </a>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Últimas matrículas captadas */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Últimas Matrículas Captadas</h2>
              <a href="/comercial/matriculas" className="text-sm text-teal-600 hover:text-teal-800 font-medium hover:underline">
                Ver todas →
              </a>
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

