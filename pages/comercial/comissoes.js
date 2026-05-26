import { useState, useEffect } from 'react';
import ComercialLayout from '@/components/ComercialLayout';

const BADGES_STATUS = {
  pendente:               'bg-yellow-100 text-yellow-700',
  pendente_configuracao:  'bg-gray-100 text-gray-500',
  liberada:               'bg-blue-100 text-blue-700',
  repassada:              'bg-green-100 text-green-700',
  cancelada:              'bg-red-100 text-red-700',
};

const LABELS_STATUS = {
  pendente:               'Pendente',
  pendente_configuracao:  'Aguard. Configuração',
  liberada:               'Liberada',
  repassada:              'Repassada',
  cancelada:              'Cancelada',
};

const fmtMoeda = (v) =>
  v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

export default function Comissoes() {
  const [comissoes, setComissoes] = useState([]);
  const [aviso, setAviso]         = useState(null);
  const [carregando, setCarregando] = useState(true);
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

  const totalComissoes = comissoes
    .filter(c => c.valor_comissao && c.status !== 'cancelada')
    .reduce((s, c) => s + Number(c.valor_comissao), 0);

  return (
    <ComercialLayout titulo="Comissões">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Minhas Comissões</h2>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total acumulado</p>
          <p className="text-lg font-bold text-teal-700">{fmtMoeda(totalComissoes)}</p>
        </div>
      </div>

      {aviso && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 mb-4">
          ⚠️ {aviso}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { status: 'pendente',  label: 'Pendentes',  color: 'text-yellow-600' },
          { status: 'liberada',  label: 'Liberadas',  color: 'text-blue-600'   },
          { status: 'repassada', label: 'Repassadas', color: 'text-green-600'  },
          { status: 'cancelada', label: 'Canceladas', color: 'text-red-500'    },
        ].map(({ status, label, color }) => {
          const qtd = comissoes.filter(c => c.status === status).length;
          const valor = comissoes
            .filter(c => c.status === status && c.valor_comissao)
            .reduce((s, c) => s + Number(c.valor_comissao), 0);
          return (
            <button
              key={status}
              onClick={() => setFiltroStatus(filtroStatus === status ? '' : status)}
              className={`bg-white rounded-xl shadow-sm p-4 text-left border-2 transition-colors ${filtroStatus === status ? 'border-teal-400' : 'border-transparent'}`}
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
              ? 'Nenhuma comissão registrada. As comissões aparecem após confirmação de pagamento.'
              : 'Nenhuma comissão neste status.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Aluno</th>
                <th className="px-4 py-3 text-left">Curso Interesse</th>
                <th className="px-4 py-3 text-right">Valor Base</th>
                <th className="px-4 py-3 text-right">Comissão</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{c.alunos?.nome || c.leads?.nome || '—'}</div>
                    <div className="text-xs text-gray-400">{c.alunos?.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.leads?.curso_interesse || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{fmtMoeda(c.valor_base)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-teal-700">
                    {c.valor_comissao != null ? fmtMoeda(c.valor_comissao) : (
                      <span className="text-gray-400 text-xs">A definir</span>
                    )}
                    {c.percentual_comissao && (
                      <div className="text-xs text-gray-400">{c.percentual_comissao}%</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGES_STATUS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {LABELS_STATUS[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                    {c.data_liberacao && (
                      <div className="text-green-600">Liberada: {new Date(c.data_liberacao).toLocaleDateString('pt-BR')}</div>
                    )}
                    {c.data_repasse && (
                      <div className="text-blue-600">Repassada: {new Date(c.data_repasse).toLocaleDateString('pt-BR')}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Informativo */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        💡 Comissões são geradas automaticamente após confirmação de pagamento. O repasse é realizado pelo setor financeiro.
      </div>
    </ComercialLayout>
  );
}
