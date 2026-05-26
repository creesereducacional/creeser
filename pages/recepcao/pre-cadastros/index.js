import { useEffect, useState } from 'react';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import Link from 'next/link';

const STATUS_CONFIG = {
  PRE_CADASTRO:                    { label: 'Pré-Cadastro',                      cor: 'bg-gray-100 text-gray-700' },
  AGUARDANDO_PAGAMENTO_MATRICULA:  { label: 'Aguardando Pagamento da Matrícula',  cor: 'bg-purple-100 text-purple-800' },
  AGUARDANDO_FORMACAO_TURMA:       { label: 'Aguardando Formação de Turma',       cor: 'bg-indigo-100 text-indigo-800' },
  ATIVO:                           { label: 'Ativo',                             cor: 'bg-green-100 text-green-800' },
  CANCELADO:                       { label: 'Cancelado',                         cor: 'bg-red-100 text-red-700' },
  PERDIDO:                         { label: 'Perdido',                           cor: 'bg-gray-200 text-gray-600' },
};

const s = (status) => STATUS_CONFIG[status] || { label: status || '—', cor: 'bg-gray-100 text-gray-600' };

export default function PreCadastrosIndex() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    fetch('/api/recepcao/pre-cadastros', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setLista(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = lista.filter(a => {
    const matchBusca = !busca ||
      a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      (a.cpf || '').includes(busca);
    const matchStatus = !filtroStatus || a.statusmatricula === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <RecepcaoLayout titulo="Pré-Cadastros">
      <div className="space-y-4">
        {/* Barra de ações */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text" placeholder="Buscar por nome ou CPF…" value={busca}
            onChange={e => setBusca(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <Link href="/recepcao/pre-cadastros/novo"
            className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            ➕ Novo Pré-Cadastro
          </Link>
        </div>

        {/* Tabela */}
        {carregando ? (
          <div className="text-gray-400 text-sm py-12 text-center">Carregando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-gray-400 text-sm py-12 text-center">
            {lista.length === 0 ? 'Nenhum pré-cadastro cadastrado ainda.' : 'Nenhum resultado para o filtro aplicado.'}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">CPF</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Telefone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Cadastrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(a => (
                  <tr key={a.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{a.cpf || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.telefone_celular || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${s(a.statusmatricula).cor}`}>
                        {s(a.statusmatricula).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {a.datacriacao ? new Date(a.datacriacao).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t text-xs text-gray-400">
              {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </RecepcaoLayout>
  );
}
