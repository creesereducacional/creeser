import { useState, useEffect } from 'react';
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
        className={`${sidebarOpen ? 'w-56' : 'w-14'} bg-indigo-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        {/* Logo/título */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-700">
          {sidebarOpen && (
            <span className="font-bold text-base tracking-wide">Comercial</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-indigo-700 transition-colors ml-auto"
            title={sidebarOpen ? 'Recolher' : 'Expandir'}
          >
            <span className="text-xs">{sidebarOpen ? '◀' : '▶'}</span>
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {MENU_ITEMS.map(item => {
            const ativo =
              item.href === '/comercial/leads/novo'
                ? router.pathname === item.href
                : router.pathname.startsWith(item.href) && item.href !== '/comercial/leads/novo';

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    ativo ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer da sidebar */}
        <div className="p-4 border-t border-indigo-700">
          {sidebarOpen && (
            <div className="text-xs text-indigo-300 mb-2 truncate" title={user.nome}>
              {user.nome}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors ${
              !sidebarOpen ? 'justify-center w-full' : ''
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
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between flex-shrink-0">
          <h1 className="text-base font-semibold text-gray-800">
            {titulo || 'Portal Comercial'}
          </h1>
          <div className="text-sm text-gray-500">
            Olá, <span className="font-medium text-gray-700">{user.nome?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
