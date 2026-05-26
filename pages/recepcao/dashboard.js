import { useEffect, useState } from 'react';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import Link from 'next/link';

const CARDS = [
  { key: 'PRE_CADASTRO',                   label: 'Pré-Cadastro',                     cor: 'border-gray-400',   icon: '📝' },
  { key: 'AGUARDANDO_PAGAMENTO_MATRICULA', label: 'Aguardando Pgto. Matrícula',       cor: 'border-purple-500', icon: '💳' },
  { key: 'AGUARDANDO_FORMACAO_TURMA',      label: 'Aguardando Formação de Turma',     cor: 'border-indigo-500', icon: '🏫' },
  { key: 'ATIVO',                          label: 'Matriculados Ativos',               cor: 'border-green-500',  icon: '✅' },
];

export default function RecepcaoDashboard() {
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/recepcao/pre-cadastros', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const counts = data.reduce((acc, a) => {
          acc[a.statusmatricula] = (acc[a.statusmatricula] || 0) + 1;
          return acc;
        }, {});
        setStats(counts);
        setTotal(data.length);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  return (
    <RecepcaoLayout titulo="Dashboard — Recepção">
      <div className="space-y-6">
        {/* Totalizador */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-600 max-w-xs">
          <p className="text-3xl font-bold text-gray-800">{carregando ? '…' : (total ?? 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Total de Pré-Cadastros em aberto</p>
        </div>

        {/* Cards por status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CARDS.map(c => (
            <Link key={c.key} href="/recepcao/pre-cadastros"
              className={`block bg-white rounded-2xl shadow-sm p-5 border-l-4 ${c.cor} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-3xl font-bold text-gray-800">{carregando ? '…' : (stats[c.key] ?? 0)}</span>
              </div>
              <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
            </Link>
          ))}
        </div>

        {/* Ação rápida */}
        <div>
          <Link href="/recepcao/pre-cadastros/novo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
            ➕ Novo Pré-Cadastro
          </Link>
        </div>

        {/* Fluxo de status */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Fluxo de Matrícula</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {[
              { s: 'PRE_CADASTRO',                   l: 'Pré-Cadastro',                    c: 'bg-gray-100' },
              { s: 'AGUARDANDO_PAGAMENTO_MATRICULA', l: 'Aguardando Pgto. Matrícula',      c: 'bg-purple-100' },
              { s: 'AGUARDANDO_FORMACAO_TURMA',      l: 'Aguardando Formação de Turma',    c: 'bg-indigo-100' },
              { s: 'ATIVO',                          l: 'Matriculado',                      c: 'bg-green-100' },
            ].map((item, i, arr) => (
              <span key={item.s} className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full font-medium ${item.c}`}>{item.l}</span>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            A recepção cria pré-cadastros. O financeiro gera a cobrança da matrícula.
            Após confirmação do pagamento, o aluno aguarda formação da turma.
            O admin confirma a turma e ativa o aluno.
          </p>
        </div>
      </div>
    </RecepcaoLayout>
  );
}
