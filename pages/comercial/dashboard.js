import { useState, useEffect } from 'react';
import ComercialLayout from '@/components/ComercialLayout';

const CORES_STATUS = {
  novo:        'bg-blue-100 text-blue-800',
  contatado:   'bg-yellow-100 text-yellow-800',
  interessado: 'bg-orange-100 text-orange-800',
  matriculado: 'bg-green-100 text-green-800',
  perdido:     'bg-red-100 text-red-800',
};

function CardStat({ label, valor, cor = 'bg-white', icone }) {
  return (
    <div className={`${cor} rounded-xl shadow-sm p-5 flex flex-col gap-1`}>
      <div className="text-2xl">{icone}</div>
      <div className="text-2xl font-bold text-gray-800">{valor}</div>
      <div className="text-sm text-gray-500">{label}</div>
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
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <CardStat icone="🎯" label="Total de Leads" valor={stats.totalLeads} />
            <CardStat icone="📞" label="Interessados" valor={stats.interessado} />
            <CardStat icone="🎓" label="Matriculados" valor={stats.matriculado} />
            <CardStat icone="📈" label="Taxa de Conversão" valor={`${stats.taxaConversao}%`} cor="bg-indigo-50" />
          </div>

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

          {/* Últimas matrículas captadas */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Últimas Matrículas Captadas</h2>
              <a href="/comercial/matriculas" className="text-sm text-indigo-600 hover:underline">
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
