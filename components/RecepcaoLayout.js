import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PERFIS_RECEPCAO = ['recepcao', 'grupo_admin', 'instituicao_admin', 'admin'];

function iniciais(nome) {
  if (!nome) return 'RF';
  const p = nome.trim().split(' ').filter(Boolean);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

export default function RecepcaoLayout({ children, titulo, badgeCount }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [totalPreCadastros, setTotalPreCadastros] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Auto-collapse sidebar em telas menores
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fechar mobile menu ao mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.usuario) { router.replace('/login'); return; }
        const perfil = String(data.usuario.perfil || data.usuario.tipo || '').toLowerCase();
        if (!PERFIS_RECEPCAO.includes(perfil)) { router.replace('/login'); return; }
        setUser(data.usuario);
      })
      .catch(() => router.replace('/login'));

    // Carregar contagem para o badge de pré-cadastros
    fetch('/api/recepcao/pre-cadastros', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : []))
      .then(lista => {
        if (Array.isArray(lista)) {
          const pendentes = lista.filter(a => a.statusmatricula === 'PRE_CADASTRO' || a.statusmatricula === 'AGUARDANDO_PAGAMENTO_MATRICULA');
          setTotalPreCadastros(pendentes.length > 0 ? pendentes.length : lista.length);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    router.push('/login');
  };

  const toggleDropdown = (key) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuPrincipal = [
    {
      href: '/recepcao/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/recepcao/pre-cadastros',
      label: 'Pré-Cadastros',
      badge: badgeCount ?? totalPreCadastros ?? 7,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: '/recepcao/alunos',
      label: 'Alunos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: '/recepcao/cursos',
      label: 'Cursos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: '/recepcao/turmas',
      label: 'Turmas',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  const menuSecundario = [
    {
      id: 'atendimentos',
      label: 'Atendimentos',
      href: '/recepcao/pre-cadastros',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      href: '/recepcao/pre-cadastros',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      href: '/admin/configuracoes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f4f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const userInitials = iniciais(user?.nome || 'Recepção');
  const userFirstName = user?.nome?.split(' ')[0] || 'Recepção';

  const sidebarContent = (
    <div
      className="flex flex-col h-full relative overflow-hidden bg-[#094ebb] text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/creeser_menu.png')" }}
    >
      {/* ── Top Logo & Toggle ────────────────────────────────────────── */}
      <div className="px-3 py-4 flex items-center justify-center border-b border-white/10 relative min-h-[78px] bg-black/5 backdrop-blur-[1px]">
        {sidebarOpen ? (
          <>
            <Link
              href="/recepcao/dashboard"
              className="flex-1 flex items-center justify-center min-w-0 pr-7 group"
            >
              <img
                src="/images/logo_creeser2.fw.png"
                alt="CREESER"
                className="h-12 w-auto max-w-[170px] object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors flex-shrink-0"
              title="Recolher menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shadow-sm group"
            title="Expandir menu"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Navigation Menu ────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 relative z-10">
        {menuPrincipal.map(item => {
          const ativo =
            item.href === '/recepcao/dashboard'
              ? router.pathname === item.href
              : router.pathname === item.href || router.pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                ativo
                  ? 'bg-white/25 text-white shadow-md font-semibold backdrop-blur-sm'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${ativo ? 'text-white' : 'text-blue-100'}`}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="truncate flex-1 text-[13.5px] drop-shadow-sm">{item.label}</span>
              )}
              {sidebarOpen && item.badge !== undefined && Number(item.badge) > 0 && (
                <span className="bg-[#ef4444] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer Logout ────────────────────────────────────────── */}
      <div className="p-3.5 border-t border-white/15 z-10 bg-black/10 backdrop-blur-sm">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md hover:shadow-lg shadow-red-950/20 active:scale-[0.98] transition-all duration-200 group ${
            !sidebarOpen ? 'px-2' : ''
          }`}
          title="Sair do sistema"
        >
          <svg className="w-4 h-4 flex-shrink-0 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {sidebarOpen && <span className="tracking-wide">Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f4f7fb] overflow-hidden print:h-auto print:overflow-visible print:bg-white font-sans text-gray-800">
      {/* ── Sidebar Desktop ────────────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? 'w-60 xl:w-64' : 'w-20'
        } hidden md:flex flex-col flex-shrink-0 transition-all duration-300 shadow-xl z-30 print:hidden`}
      >
        {sidebarContent}
      </aside>

      {/* ── Sidebar Mobile (Drawer com Overlay) ────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden print:hidden">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── Main Layout Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto">
        {/* ── Top Bar Moderno ──────────────────────────────────────── */}
        <header className="h-16 bg-white border-b border-gray-200/80 px-4 md:px-8 flex items-center justify-between flex-shrink-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.03)] print:hidden">
          {/* Lado Esquerdo: Botão Mobile + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 md:hidden transition-colors"
              aria-label="Abrir Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-sm">
              <Link href="/recepcao/dashboard" className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded-lg hover:bg-blue-50 flex items-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="font-bold text-gray-900 text-sm md:text-base tracking-tight truncate">
                {titulo || 'Dashboard — Recepção'}
              </span>
            </div>
          </div>

          {/* Lado Direito: Notificações + Saudação + Avatar */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Notificação Bell */}
            <button className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-600 hover:text-blue-600 flex items-center justify-center relative transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 bg-[#ef4444] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                1
              </span>
            </button>

            {/* Divisor vertical */}
            <div className="hidden sm:block h-7 w-[1px] bg-gray-200" />

            {/* Saudação e Perfil */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-gray-500 font-medium leading-none">Olá, <span className="font-bold text-gray-800">{userFirstName}</span></p>
                  <p className="text-[11px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">CREESER</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white font-black text-xs flex items-center justify-center shadow-sm border border-blue-400/30">
                  {userInitials}
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menu Dropdown do Usuário */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800 truncate">{user.nome}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email || 'recepcao@creeser.com.br'}</p>
                  </div>
                  <Link
                    href="/recepcao/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span>📊</span> Dashboard
                  </Link>
                  <Link
                    href="/recepcao/pre-cadastros/novo"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span>➕</span> Novo Pré-Cadastro
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <span>🚪</span> Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Conteúdo Principal ───────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
