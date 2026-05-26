import { useState, useEffect } from 'react';
import ComercialLayout from '@/components/ComercialLayout';

const BADGES_STATUS = {
  PENDENTE_REPASSE: 'bg-yellow-100 text-yellow-700',
  REPASSADO:        'bg-green-100 text-green-700',
  CANCELADO:        'bg-red-100 text-red-700',
};

const LABELS_STATUS = {
  PENDENTE_REPASSE: 'Pendente Repasse',
  REPASSADO:        'Repassado',
  CANCELADO:        'Cancelado',
};

const fmtMoeda = (v) =>
  v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

const fmtData = (d) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function Comissoes() {
  const [comissoes, setComissoes]     = useState([]);
  const [aviso, setAviso]             = useState(null);
  const [carregando, setCarregando]   = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    fetch('/api/comercial/comissoes', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.aviso) setAviso(data.aviso);
        setComissoes(Array.isArray(data.comissoes) ? data.comissoes : []);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const filtradas = filtroStatus
    ? comissoes.filter(c => c.status === filtroStatus)
    : comissoes;

  const totalPendente = comissoes
    .filter(c => c.status === 'PENDENTE_REPASSE')
    .reduce((s, c) => s + Number(c.valor_comissao || 0), 0);

  const totalRepassado = comissoes
    .filter(c => c.status === 'REPASSADO')
    .reduce((s, c) => s + Number(c.valor_comissao || 0), 0);

  // Verifica se exibe coluna de captador (quando há comissões de equipe)
  const temEquipe = comissoes.some(
    c => c.captado_por && comissoes.find(x => x.captado_por?.id !== c.captado_por?.id)
  );

  return (
    <ComercialLayout titulo="Comissões">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Comissões Comerciais</h2>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-gray-500">Pendente repasse</p>
            <p className="text-lg font-bold text-yellow-600">{fmtMoeda(totalPendente)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total repassado</p>
            <p className="text-lg font-bold text-green-600">{fmtMoeda(totalRepassado)}</p>
          </div>
        </div>
      </div>

      {aviso && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 mb-4">
          ⚠️ {aviso}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { status: 'PENDENTE_REPASSE', label: 'Pendentes',  color: 'text-yellow-600' },
          { status: 'REPASSADO',        label: 'Repassadas', color: 'text-green-600'  },
          { status: 'CANCELADO',        label: 'Canceladas', color: 'text-red-500'    },
        ].map(({ status, label, color }) => {
          const qtd   = comissoes.filter(c => c.status === status).length;
          const valor = comissoes
            .filter(c => c.status === status)
            .reduce((s, c) => s + Number(c.valor_comissao || 0), 0);
          return (
            <button
              key={status}
              onClick={() => setFiltroStatus(filtroStatus === status ? '' : status)}
              className={`bg-white rounded-xl shadow-sm p-4 text-left border-2 transition-colors ${
                filtroStatus === status ? 'border-teal-400' : 'border-transparent hover:border-gray-200'
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{qtd}</p>
              <p className="text-xs text-gray-400 mt-1">{fmtMoeda(valor)}</p>
            </button>
          );
        })}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {carregando ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {comissoes.length === 0
              ? 'Nenhuma comissão registrada. As comissões aparecem após confirmação de pagamento de matrícula.'
              : 'Nenhuma comissão com este status.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  {temEquipe && <th className="px-4 py-3 text-left">Captador</th>}
                  <th className="px-4 py-3 text-left">Aluno</th>
                  <th className="px-4 py-3 text-right">Valor Matr.</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Crédito</th>
                  <th className="px-4 py-3 text-left">Repasse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    {temEquipe && (
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {c.captado_por?.nomecompleto || '—'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{c.aluno?.nome || '—'}</div>
                      <div className="text-xs text-gray-400">{c.aluno?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtMoeda(c.valor_base)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-teal-700">
                      {fmtMoeda(c.valor_comissao)}
                      {c.percentual != null && (
                        <div className="text-xs text-gray-400 font-normal">{c.percentual}%</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        BADGES_STATUS[c.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {LABELS_STATUS[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtData(c.data_credito)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtData(c.data_repasse)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informativo */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        💡 Comissões são geradas automaticamente após confirmação de pagamento da matrícula.
        O repasse financeiro é realizado pelo setor de tesouraria.
      </div>
    </ComercialLayout>
  );
}

