import { useEffect, useState } from 'react';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import Link from 'next/link';

const STATUS_CONFIG = {
  PRE_CADASTRO:                   { label: 'Pre-Cadastro',                 cor: 'bg-gray-100 text-gray-700' },
  AGUARDANDO_PAGAMENTO_MATRICULA: { label: 'Aguardando Pagamento',         cor: 'bg-purple-100 text-purple-800' },
  AGUARDANDO_FORMACAO_TURMA:      { label: 'Aguardando Formacao de Turma', cor: 'bg-indigo-100 text-indigo-800' },
  ATIVO:                          { label: 'Ativo',                        cor: 'bg-green-100 text-green-800' },
  DESISTENTE:                     { label: 'Desistente',                   cor: 'bg-orange-100 text-orange-800' },
  CANCELADO:                      { label: 'Cancelado',                    cor: 'bg-red-100 text-red-700' },
};

function isHoje(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function isMes(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

const s = (status) => STATUS_CONFIG[status] || { label: status || '—', cor: 'bg-gray-100 text-gray-600' };

export default function RecepcaoDashboard() {
  const [lista, setLista]         = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/recepcao/pre-cadastros', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setLista(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const hoje   = lista.filter(a => isHoje(a.datacriacao)).length;
  const mes    = lista.filter(a => isMes(a.datacriacao)).length;
  const pgto   = lista.filter(a => a.statusmatricula === 'AGUARDANDO_PAGAMENTO_MATRICULA').length;
  const turma  = lista.filter(a => a.statusmatricula === 'AGUARDANDO_FORMACAO_TURMA').length;
  const ultimos = lista.slice(0, 10);

  const cards = [
    { label: 'Pre-Cadastros Hoje',           valor: hoje,  cor: 'border-blue-500',   icon: '📅' },
    { label: 'Pre-Cadastros no Mes',         valor: mes,   cor: 'border-teal-500',   icon: '📆' },
    { label: 'Aguardando Pagamento',         valor: pgto,  cor: 'border-purple-500', icon: '💳' },
    { label: 'Aguardando Formacao de Turma', valor: turma, cor: 'border-indigo-500', icon: '🏫' },
  ];

  return (
    <RecepcaoLayout titulo="Dashboard — Recepcao">
      <div className="space-y-6">

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${c.cor}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-3xl font-bold text-gray-800">{carregando ? '…' : c.valor}</span>
              </div>
              <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Acoes rapidas */}
        <div className="flex gap-3">
          <Link href="/recepcao/pre-cadastros/novo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
            ➕ Novo Pre-Cadastro
          </Link>
          <Link href="/recepcao/pre-cadastros"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-blue-600 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm">
            📋 Ver Todos
          </Link>
        </div>

        {/* Tabela: Ultimos pre-cadastros */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800 text-sm">Ultimos Pre-Cadastros</h2>
          </div>
          {carregando ? (
            <div className="py-12 text-center text-gray-400 text-sm">Carregando...</div>
          ) : ultimos.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Nenhum pre-cadastro ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Nome</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">CPF</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Cadastrado em</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ultimos.map(a => (
                    <tr key={a.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.nome}</td>
                      <td className="px-4 py-3 text-gray-500">{a.cpf || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${s(a.statusmatricula).cor}`}>
                          {s(a.statusmatricula).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {a.datacriacao ? new Date(a.datacriacao).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/recepcao/pre-cadastros/${a.id}`}
                          className="px-2.5 py-1 rounded border border-blue-400 text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fluxo de status */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Fluxo de Matricula</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {[
              { l: 'Pre-Cadastro',             c: 'bg-gray-100' },
              { l: 'Aguardando Pgto. Matricula', c: 'bg-purple-100' },
              { l: 'Aguardando Formacao de Turma', c: 'bg-indigo-100' },
              { l: 'Matriculado',              c: 'bg-green-100' },
            ].map((item, i, arr) => (
              <span key={item.l} className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full font-medium ${item.c}`}>{item.l}</span>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            A recepcao cria pre-cadastros. O financeiro gera a cobranca da matricula.
            Apos confirmacao do pagamento, o aluno aguarda formacao da turma.
            O admin confirma a turma e ativa o aluno.
          </p>
        </div>
      </div>
    </RecepcaoLayout>
  );
}

