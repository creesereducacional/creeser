import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

const MENU_BASE = [
  { href: '/comercial/dashboard',  icon: '📊', label: 'Dashboard' },
  { href: '/comercial/leads',      icon: '🎯', label: 'Meus Leads' },
  { href: '/comercial/leads/novo', icon: '➕', label: 'Novo Lead' },
  { href: '/comercial/matriculas', icon: '🎓', label: 'Pré-Matrículas' },
  { href: '/comercial/comissoes',  icon: '💰', label: 'Comissões' },
];

const MENU_EQUIPE = { href: '/comercial/equipe', icon: '👥', label: 'Equipe Comercial' };

// Perfis que têm acesso ao módulo comercial
const PERFIS_COMERCIAL = ['comercial', 'comercial_master', 'comercial_operador', 'grupo_admin', 'instituicao_admin', 'admin'];

// Perfis que veem o menu Equipe
const PERFIS_EQUIPE = ['comercial', 'comercial_master', 'grupo_admin', 'instituicao_admin', 'admin'];

export default function ComercialLayout({ children, titulo }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Cache local: evita flash ao navegar entre páginas
    try {
      const cached = sessionStorage.getItem('comercial_user');
      if (cached) setUser(JSON.parse(cached));
    } catch (_) {}

    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.usuario) {
          try { sessionStorage.removeItem('comercial_user'); } catch (_) {}
          router.replace('/login');
          return;
        }
        const perfil = String(data.usuario.perfil || data.usuario.tipo || '').toLowerCase();
        if (!PERFIS_COMERCIAL.includes(perfil)) {
          router.replace('/admin/dashboard');
          return;
        }
        try { sessionStorage.setItem('comercial_user', JSON.stringify(data.usuario)); } catch (_) {}
        setUser(data.usuario);
      })
      .catch(() => router.replace('/login'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const perfilAtual = String(user.perfil || user.tipo || '').toLowerCase();
  const podeVerEquipe = PERFIS_EQUIPE.includes(perfilAtual);
  const menuItems = podeVerEquipe ? [...MENU_BASE, MENU_EQUIPE] : MENU_BASE;

  const perfilLabel = {
    comercial_master: '⭐ Master Comercial',
    comercial:        '⭐ Master Comercial',
    comercial_operador: 'Operador Comercial',
    grupo_admin:      'Grupo Admin',
    instituicao_admin: 'Admin Instituição',
    admin:            'Administrador',
  }[perfilAtual] || perfilAtual;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-teal-700 to-teal-900 shadow-2xl text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-teal-600 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div className="relative w-full max-w-[160px] h-[42px] mx-auto">
                <Image
                  src="/images/logo_creeser.png"
                  alt="CREESER"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <p className="text-teal-200 text-xs font-medium tracking-wide">Comercial</p>
            </div>
          ) : (
            <div className="relative mx-auto w-10 h-8">
              <Image
                src="/images/logo_creeser.png"
                alt="CREESER"
                fill
                className="object-contain"
                priority
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
          {menuItems.map(item => {
            const ativo = (() => {
              // /comercial/leads não deve ativar ao estar em /comercial/leads/novo
              if (item.href === '/comercial/leads') {
                return router.pathname === '/comercial/leads' ||
                  (router.pathname.startsWith('/comercial/leads/') && router.pathname !== '/comercial/leads/novo');
              }
              return router.pathname === item.href;
            })();

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
            <div className="mb-2">
              <div className="text-xs text-teal-200 truncate" title={user.nome}>{user.nome}</div>
              <div className="text-xs text-teal-400 mt-0.5">{perfilLabel}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 bg-red-600/20 hover:bg-red-600/50 text-red-300 hover:text-white text-sm font-medium transition-colors w-full px-3 py-2 rounded-lg ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title="Sair"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
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
