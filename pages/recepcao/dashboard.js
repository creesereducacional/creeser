import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import Link from 'next/link';
import StatusBadge from '@/components/recepcao/StatusBadge';
import DashboardCard from '@/components/recepcao/DashboardCard';
import EmptyState from '@/components/recepcao/EmptyState';

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

function iniciais(nome) {
  if (!nome) return '?';
  const p = nome.trim().split(' ').filter(Boolean);
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

function avatarCor(nome) {
  const cores = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500'];
  if (!nome) return cores[0];
  return cores[nome.charCodeAt(0) % cores.length];
}

export default function RecepcaoDashboard() {
  const router  = useRouter();
  const [lista, setLista]       = useState([]);
  const [turmas, setTurmas]     = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]       = useState('');
  const buscaRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/recepcao/pre-cadastros', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/formacao-turmas', { credentials: 'include' }).then(r => r.json()).catch(() => []),
    ]).then(([alunos, t]) => {
      setLista(Array.isArray(alunos) ? alunos : []);
      setTurmas(Array.isArray(t) ? t : []);
    }).catch(() => {}).finally(() => setCarregando(false));
  }, []);

  const hoje       = lista.filter(a => isHoje(a.datacriacao)).length;
  const mes        = lista.filter(a => isMes(a.datacriacao)).length;
  const pgto       = lista.filter(a => a.statusmatricula === 'AGUARDANDO_PAGAMENTO_MATRICULA').length;
  const forTurma   = lista.filter(a => a.statusmatricula === 'AGUARDANDO_FORMACAO_TURMA').length;
  const prontas    = turmas.filter(t => t.status_formacao === 'PRONTA_PARA_ABRIR').length;
  const ativHoje   = lista.filter(a => a.statusmatricula === 'ATIVO' && isHoje(a.data_ativacao)).length;
  const ultimos    = lista.slice(0, 8);

  function handleBusca(e) {
    e.preventDefault();
    if (busca.trim()) router.push(`/recepcao/pre-cadastros?busca=${encodeURIComponent(busca.trim())}`);
  }

  return (
    <RecepcaoLayout titulo="Dashboard — Recepção">
      <div className="space-y-6">

        {/* ── CTA + Busca ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <Link
            href="/recepcao/pre-cadastros/novo"
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-150 flex-shrink-0"
          >
            <span className="text-xl">➕</span>
            Novo Pré-Cadastro
          </Link>

          <form onSubmit={handleBusca} className="flex-1 flex gap-2">
            <input
              ref={buscaRef}
              type="text"
              placeholder="Buscar por nome, CPF ou telefone…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white shadow-sm"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition-colors font-medium"
            >
              🔍
            </button>
          </form>
        </div>

        {/* ── Cards de métricas ───────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <DashboardCard
            icon="📅" label="Pré-Cadastros Hoje"
            valor={hoje} cor="border-blue-500" bgIcon="bg-blue-50"
            loading={carregando}
            href="/recepcao/pre-cadastros?filtro=PRE_CADASTRO"
          />
          <DashboardCard
            icon="📆" label="Pré-Cadastros no Mês"
            valor={mes} cor="border-teal-500" bgIcon="bg-teal-50"
            loading={carregando}
            href="/recepcao/pre-cadastros"
          />
          <DashboardCard
            icon="💳" label="Aguardando Pagamento"
            valor={pgto} cor="border-yellow-400" bgIcon="bg-yellow-50"
            loading={carregando}
            href="/recepcao/pre-cadastros?filtro=AGUARDANDO_PAGAMENTO_MATRICULA"
          />
          <DashboardCard
            icon="🏫" label="Aguardando Formação"
            valor={forTurma} cor="border-blue-400" bgIcon="bg-blue-50"
            loading={carregando}
            href="/recepcao/pre-cadastros?filtro=AGUARDANDO_FORMACAO_TURMA"
          />
          <DashboardCard
            icon="🚀" label="Turmas Prontas"
            valor={prontas} cor="border-green-500" bgIcon="bg-green-50"
            loading={carregando}
          />
          <DashboardCard
            icon="🎓" label="Ativados Hoje"
            valor={ativHoje} cor="border-purple-500" bgIcon="bg-purple-50"
            loading={carregando}
            href="/recepcao/pre-cadastros?filtro=ATIVO"
          />
        </div>

        {/* ── Atalhos rápidos ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/recepcao/pre-cadastros', icon: '📋', label: 'Todos os Pré-Cadastros', sub: `${lista.length} registros` },
            { href: '/recepcao/pre-cadastros?filtro=AGUARDANDO_PAGAMENTO_MATRICULA', icon: '💳', label: 'Aguardando Pagamento', sub: pgto > 0 ? `${pgto} pendente${pgto > 1 ? 's' : ''}` : 'Nenhum' },
            { href: '/recepcao/pre-cadastros?filtro=AGUARDANDO_FORMACAO_TURMA',      icon: '🏫', label: 'Aguardando Turma',    sub: forTurma > 0 ? `${forTurma} aluno${forTurma > 1 ? 's' : ''}` : 'Nenhum' },
            { href: '/recepcao/pre-cadastros/novo',                                  icon: '➕', label: 'Novo Pré-Cadastro',  sub: 'Atendimento agora' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all duration-150 flex items-center gap-3 border border-gray-100 hover:border-blue-200"
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Últimos atendimentos ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Últimos Atendimentos</h2>
            <Link href="/recepcao/pre-cadastros" className="text-xs text-blue-600 hover:underline font-medium">
              Ver todos →
            </Link>
          </div>

          {carregando ? (
            <div className="py-12 text-center text-gray-400 text-sm">Carregando…</div>
          ) : ultimos.length === 0 ? (
            <EmptyState
              icon="📭"
              title="Nenhum pré-cadastro ainda"
              message="Cadastre o primeiro aluno para começar o atendimento."
              action={
                <Link href="/recepcao/pre-cadastros/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                  ➕ Novo Pré-Cadastro
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {ultimos.map(a => (
                <Link
                  key={a.id}
                  href={`/recepcao/pre-cadastros/${a.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full ${avatarCor(a.nome)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {iniciais(a.nome)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.nome}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {a.cpf || a.telefone_celular || 'Sem contato'}
                      {a.datacriacao && ` · ${new Date(a.datacriacao).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>

                  {/* Status */}
                  <StatusBadge status={a.statusmatricula} size="sm" />

                  {/* Seta */}
                  <span className="text-gray-300 group-hover:text-blue-400 text-lg flex-shrink-0">›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </RecepcaoLayout>
  );
}

