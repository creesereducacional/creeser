import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

const MENU_ITEMS = [
  { href: '/comercial/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/comercial/leads',     icon: '🎯', label: 'Meus Leads' },
  { href: '/comercial/leads/novo', icon: '➕', label: 'Novo Lead' },
  { href: '/comercial/matriculas', icon: '🎓', label: 'Minhas Matrículas' },
];

// Perfis que têm acesso ao módulo comercial
const PERFIS_COMERCIAL = ['comercial', 'grupo_admin', 'instituicao_admin', 'admin'];

export default function ComercialLayout({ children, titulo }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.usuario) { router.replace('/login'); return; }
        const perfil = String(data.usuario.perfil || data.usuario.tipo || '').toLowerCase();
        if (!PERFIS_COMERCIAL.includes(perfil)) {
          router.replace('/admin/dashboard');
          return;
        }
        setUser(data.usuario);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-teal-700 to-teal-900 shadow-2xl text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        {/* Logo CREESER */}
        <div className="p-6 border-b border-teal-600 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo_creeser.png"
                alt="CREESER"
                width={36}
                height={36}
                className="rounded-lg object-contain bg-white p-0.5"
              />
              <div>
                <h2 className="text-white font-bold text-sm">CREESER</h2>
                <p className="text-teal-200 text-xs">Comercial</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <Image
                src="/images/logo_creeser.png"
                alt="CREESER"
                width={36}
                height={36}
                className="rounded-lg object-contain bg-white p-0.5"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-teal-600 rounded-lg transition-colors text-teal-100"
            title={sidebarOpen ? 'Recolher' : 'Expandir'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          {MENU_ITEMS.map(item => {
            const ativo =
              item.href === '/comercial/leads/novo'
                ? router.pathname === item.href
                : router.pathname.startsWith(item.href) && item.href !== '/comercial/leads/novo';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  ativo
                    ? 'bg-teal-600 text-white shadow-lg font-semibold'
                    : 'text-gray-300 hover:bg-teal-700/40 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="text-xl min-w-[24px] flex items-center justify-center flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer da sidebar */}
        <div className="p-4 border-t border-teal-600">
          {sidebarOpen && (
            <div className="text-xs text-teal-200 mb-3 truncate" title={user.nome}>
              {user.nome}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-teal-300 hover:text-white text-sm transition-colors w-full ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title="Sair"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Conteúdo principal ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-800">
            {titulo || 'Portal Comercial'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Olá, <span className="font-semibold text-gray-700">{user.nome?.split(' ')[0]}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
