import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import Link from 'next/link';
import StatusBadge, { STATUS_CONFIG } from '@/components/recepcao/StatusBadge';
import EmptyState from '@/components/recepcao/EmptyState';
import PageHeader from '@/components/ui/PageHeader';

const STATUS_FILTROS = [
  { key: '',                               label: 'Todos' },
  { key: 'PRE_CADASTRO',                   label: 'Pré-Cadastro' },
  { key: 'AGUARDANDO_PAGAMENTO_MATRICULA', label: 'Ag. Pagamento' },
  { key: 'AGUARDANDO_FORMACAO_TURMA',      label: 'Ag. Turma' },
  { key: 'ATIVO',                          label: 'Ativo' },
  { key: 'DESISTENTE',                     label: 'Desistente' },
];

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

export default function PreCadastrosIndex() {
  const router = useRouter();
  const [lista, setLista]           = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]           = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Lê query params ao montar
  useEffect(() => {
    const { busca: b, filtro: f } = router.query;
    if (b) setBusca(b);
    if (f) setFiltroStatus(f);
  }, [router.query]);

  useEffect(() => {
    fetch('/api/recepcao/pre-cadastros', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setLista(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = lista.filter(a => {
    const q = busca.toLowerCase();
    const matchBusca = !busca ||
      (a.nome || '').toLowerCase().includes(q) ||
      (a.cpf || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (a.telefone_celular || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (a.email || '').toLowerCase().includes(q);
    const matchStatus = !filtroStatus || a.statusmatricula === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Contagem por status para os tabs
  const contagem = {};
  lista.forEach(a => { contagem[a.statusmatricula] = (contagem[a.statusmatricula] || 0) + 1; });

  return (
    <RecepcaoLayout titulo="Pré-Cadastros">
      <div className="space-y-4">
        {/* ── Header ────────────────────────────────────────────────── */}
        <PageHeader
          icon="📋"
          title="Pré-Cadastros"
          subtitle={`${filtrados.length} de ${lista.length} registro${lista.length !== 1 ? 's' : ''}`}
          actions={
            <Link href="/recepcao/pre-cadastros/novo">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                + Novo Pré-Cadastro
              </button>
            </Link>
          }
        />
        {/* ── Barra superior ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou telefone…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <Link
            href="/recepcao/pre-cadastros/novo"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-2xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            ➕ Novo Pré-Cadastro
          </Link>
        </div>

        {/* ── Filtros rápidos (tabs) ─────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_FILTROS.map(f => {
            const ativo = filtroStatus === f.key;
            const cnt   = f.key ? (contagem[f.key] || 0) : lista.length;
            return (
              <button
                key={f.key}
                onClick={() => setFiltroStatus(f.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${ativo
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
              >
                {f.label}
                {!carregando && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${ativo ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Lista ─────────────────────────────────────────────── */}
        {carregando ? (
          <div className="bg-white rounded-2xl shadow-sm divide-y">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-24" />
              </div>
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={busca || filtroStatus ? 'Nenhum resultado encontrado' : 'Nenhum pré-cadastro ainda'}
            message={
              busca || filtroStatus
                ? 'Tente ajustar a busca ou o filtro de status.'
                : 'Cadastre o primeiro aluno para começar.'
            }
            action={
              !busca && !filtroStatus ? (
                <Link href="/recepcao/pre-cadastros/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                  ➕ Novo Pré-Cadastro
                </Link>
              ) : (
                <button onClick={() => { setBusca(''); setFiltroStatus(''); }}
                  className="text-sm text-blue-600 hover:underline">
                  Limpar filtros
                </button>
              )
            }
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtrados.map(a => {
                const tel = (a.telefone_celular || '').replace(/\D/g, '');
                const wppLink = tel ? `https://wa.me/55${tel}` : null;

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full ${avatarCor(a.nome)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                      {iniciais(a.nome)}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.nome}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        {a.cpf && <span>CPF {a.cpf}</span>}
                        {a.telefone_celular && <span>📱 {a.telefone_celular}</span>}
                        {a.datacriacao && (
                          <span className="hidden sm:inline">
                            {new Date(a.datacriacao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="hidden sm:block flex-shrink-0">
                      <StatusBadge status={a.statusmatricula} size="md" />
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {wppLink && (
                        <a
                          href={wppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir WhatsApp"
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 border border-green-200 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors text-sm"
                          onClick={e => e.stopPropagation()}
                        >
                          💬
                        </a>
                      )}
                      <Link
                        href={`/recepcao/pre-cadastros/${a.id}`}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs font-medium transition-colors"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/recepcao/pre-cadastros/${a.id}?editar=1`}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs font-medium transition-colors"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-2.5 border-t bg-gray-50 text-xs text-gray-400 flex items-center justify-between">
              <span>
                {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
                {(busca || filtroStatus) && ` · filtrando de ${lista.length} total`}
              </span>
              {(busca || filtroStatus) && (
                <button
                  onClick={() => { setBusca(''); setFiltroStatus(''); }}
                  className="text-blue-500 hover:underline font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </RecepcaoLayout>
  );
}
