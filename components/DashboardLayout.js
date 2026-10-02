import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { filtrarMenuPorContexto } from '../utils/menu-permissoes';
import { useAuthContext } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { usuario, carregando: authCarregando, logout } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSubmenus, setExpandedSubmenus] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-collapse sidebar em telas menores que 1024px
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Fechar gaveta no mobile ao navegar
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  // Auto-expandir grupo do item ativo
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.submenu?.some(sub => router.pathname === sub.url || (sub.url !== '#' && router.pathname.startsWith(sub.url)))) {
        setExpandedSubmenus(prev => ({ ...prev, [item.id]: true }));
      }
    });
  }, [router.pathname]);

  const user = usuario;

  // Verificação de permissões e redirecionamento de rotas administrativas
  useEffect(() => {
    if (authCarregando) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const rawPerfil = String(user.perfil || user.tipo || '').toLowerCase();
    
    // Normalização de aliases e equivalências
    const mapearPerfil = (p) => {
      if (p === 'admin') return 'instituicao_admin';
      if (p === 'financeiro_admin') return 'financeiro';
      if (p === 'comercial_master') return 'comercial';
      return p;
    };
    const perfil = mapearPerfil(rawPerfil);

    // Se for grupo_admin, tem acesso total a qualquer rota
    if (perfil === 'grupo_admin') {
      return;
    }

    const path = router.pathname;

    // Matriz de Acesso de Módulos (bloqueio de URLs)
    const moduloFinanceiro = ['instituicao_admin', 'financeiro'];
    const moduloSecretaria = ['instituicao_admin', 'secretaria', 'coordenador'];
    const moduloComercial = ['instituicao_admin', 'comercial'];
    const moduloAcademico = ['instituicao_admin', 'coordenador', 'secretaria', 'professor'];
    const moduloRecepcao = ['instituicao_admin', 'recepcao'];

    // 1. Validar Módulo Financeiro (/admin-financeiro e /api/admin-financeiro)
    if (path.startsWith('/admin-financeiro') || path.startsWith('/api/admin-financeiro')) {
      if (!moduloFinanceiro.includes(perfil)) {
        router.replace('/admin/dashboard');
        return;
      }
    }

    // 2. Validar Módulo Comercial (/comercial e /api/comercial)
    if (path.startsWith('/comercial') || path.startsWith('/api/comercial')) {
      if (!moduloComercial.includes(perfil)) {
        router.replace('/admin/dashboard');
        return;
      }
    }

    // 3. Validar Módulo Recepção (/recepcao e /api/recepcao)
    if (path.startsWith('/recepcao') || path.startsWith('/api/recepcao')) {
      if (!moduloRecepcao.includes(perfil)) {
        router.replace('/admin/dashboard');
        return;
      }
    }

    // 4. Validar Módulo Acadêmico / Secretaria Geral (/admin/alunos, /admin/cursos, /admin/professores, etc.)
    const rotasAcademicas = [
      '/admin/alunos',
      '/admin/cursos',
      '/admin/professores',
      '/admin/disciplinas',
      '/admin/turmas',
      '/admin/notas-faltas',
      '/admin/planejamento-diario',
      '/admin/livro-registro',
      '/admin/atividades-complementares'
    ];
    if (rotasAcademicas.some(rota => path.startsWith(rota))) {
      if (!moduloAcademico.includes(perfil)) {
        router.replace('/admin/dashboard');
        return;
      }
    }

    // 5. Validar Módulo de Usuários (/admin/usuarios)
    if (path.startsWith('/admin/usuarios')) {
      const moduloUsuarios = ['instituicao_admin'];
      if (!moduloUsuarios.includes(perfil)) {
        router.replace('/admin/dashboard');
        return;
      }
    }
  }, [user, authCarregando, router]);



  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      router.push('/login');
    }
  };

  const menuItems = [
    // Menu Principal (Início)
    { id: 'dashboard', nome: 'Início', icon: '🏠', url: '/admin/dashboard', em_breve: false, completed: true, secao: 'Menu Principal' },

    // Gestão Acadêmica
    {
      id: 'coordenacao',
      nome: 'Coordenação',
      icon: '👔',
      em_breve: false,
      secao: 'Gestão Acadêmica',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      submenu: [
        { id: 'solicitacoes', nome: 'Solicitações', icon: '▪', url: '/admin/configuracoes/solicitacoes', em_breve: false, completed: true },
        { id: 'unidades', nome: 'Unidades', icon: '▪', url: '/admin/unidades', em_breve: false, completed: true },
        { id: 'anos-letivos', nome: 'Anos Letivos', icon: '▪', url: '/admin/anos-letivos', em_breve: false, completed: true },
        { id: 'calendario-aulas', nome: 'Calendário de Aulas', icon: '▪', url: '#', em_breve: true },
        { id: 'contas-bancarias', nome: 'Contas Bancárias', icon: '▪', url: '#', em_breve: true },
      ]
    },

    { id: 'comunicados', nome: 'Comunicados', icon: '✉️', url: '#', em_breve: true, secao: 'Gestão Acadêmica' },
    
    // NPJ
    {
      id: 'npj',
      nome: 'NPJ',
      icon: '⚖️',
      em_breve: true,
      secao: 'Gestão Acadêmica',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      tiposInstituicao: ['faculdade'],
      submenu: [
        { id: 'gerenciar', nome: 'Gerenciar', icon: '▪', url: '#', em_breve: true },
        { id: 'atividades', nome: 'Atividades', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Pedagógico
    {
      id: 'pedagogico',
      nome: 'Pedagógico',
      icon: '📚',
      em_breve: false,
      secao: 'Gestão Acadêmica',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'],
      submenu: [
        { id: 'ped-cursos', nome: 'Cursos', icon: '▪', url: '/admin/cursos', em_breve: false, completed: true },
        { id: 'ped-turmas', nome: 'Turmas', icon: '▪', url: '/admin/turmas', em_breve: false, completed: true },
        { id: 'ped-alunos', nome: 'Alunos', icon: '▪', url: '/admin/alunos', em_breve: false, completed: true },
        { id: 'ped-responsaveis', nome: 'Responsáveis', icon: '▪', url: '/admin/responsaveis', em_breve: false, completed: true },
        { id: 'ped-componente-curricular', nome: 'Componente Curricular', icon: '▪', url: '/admin/disciplinas/grades', em_breve: false, completed: true },
        { id: 'ped-disciplinas', nome: 'Disciplinas', icon: '▪', url: '/admin/disciplinas', em_breve: false, completed: true },
        { id: 'ped-professores', nome: 'Professores', icon: '▪', url: '/admin/professores', em_breve: false, completed: true },
        { id: 'ped-notas', nome: 'Notas e Faltas', icon: '▪', url: '/admin/notas-faltas', em_breve: false, completed: true },
        { id: 'ped-planejamento', nome: 'Planejamento Diário', icon: '▪', url: '/admin/planejamento-diario', em_breve: false, completed: true },
        { id: 'ped-livro-registro', nome: 'Livro de Registros', icon: '▪', url: '/admin/livro-registro', em_breve: false, completed: true },
        { id: 'ped-atividades', nome: 'Atividades Complementares', icon: '▪', url: '/admin/atividades-complementares', em_breve: false, completed: true },
      ]
    },

    // Módulo EAD
    {
      id: 'modulo-ead',
      nome: 'Módulo EAD',
      icon: '💻',
      em_breve: false,
      secao: 'Gestão Acadêmica',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      submenu: [
        { id: 'ead-forum', nome: 'Fórum', icon: '▪', url: '/admin/forum', em_breve: false, completed: true },
        { id: 'ead-emails', nome: 'E-mails', icon: '▪', url: '/admin/emails', em_breve: false, completed: true },
        { id: 'ead-avaliacoes', nome: 'Avaliações', icon: '▪', url: '/admin/avaliacoes', em_breve: false, completed: true },
        { id: 'ead-documentos', nome: 'Documentos', icon: '▪', url: '/admin/documentos', em_breve: false, completed: true },
      ]
    },

    // Gestão Administrativa
    {
      id: 'financeiro',
      nome: 'Financeiro',
      icon: '💵',
      url: '/admin-financeiro',
      em_breve: false,
      completed: true,
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro'],
      secao: 'Gestão Administrativa'
    },

    // Processo Seletivo
    { 
      id: 'processo', 
      nome: 'Processo Seletivo', 
      icon: '📋', 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      tiposInstituicao: ['faculdade', 'tecnico'],
      secao: 'Gestão Administrativa',
      submenu: [
        { id: 'locais-prova', nome: 'Locais de Prova', icon: '▪', url: '#', em_breve: true },
        { id: 'formas-ingresso', nome: 'Formas de Ingresso', icon: '▪', url: '#', em_breve: true },
        { id: 'processos-seletivos', nome: 'Processos Seletivos', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // CPA
    { 
      id: 'cpa', 
      nome: 'CPA', 
      perfis: ['grupo_admin', 'instituicao_admin'],
      tiposInstituicao: ['faculdade'],
      icon: '📊', 
      em_breve: true, 
      secao: 'Gestão Administrativa',
      submenu: [
        { id: 'gerenciar-cpa', nome: 'Gerenciar CPAs', icon: '▪', url: '#', em_breve: true },
        { id: 'responder-cpa', nome: 'Responder CPAs', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Estágio
    { 
      id: 'estagio',
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin'],
      tiposInstituicao: ['faculdade'],
      nome: 'Estágio', 
      icon: '🎓', 
      secao: 'Gestão Administrativa',
      submenu: [
        { id: 'gerenciar-empresas', nome: 'Gerenciar empresas', icon: '▪', url: '#', em_breve: true },
        { id: 'gerenciar-estagio', nome: 'Gerenciar Estágio', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Contábil
    { 
      id: 'contabil',
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      tiposInstituicao: ['faculdade'],
      nome: 'Contábil', 
      icon: '📈', 
      secao: 'Gestão Administrativa',
      submenu: [
        { id: 'fornecedores', nome: 'Fornecedores', icon: '▪', url: '#', em_breve: true },
        { id: 'movimentacoes', nome: 'Movimentações', icon: '▪', url: '#', em_breve: true },
        { id: 'plano-contas', nome: 'Plano de Contas', icon: '▪', url: '#', em_breve: true },
        { id: 'contas-financeiras', nome: 'Contas Financeiras', icon: '▪', url: '#', em_breve: true },
        { id: 'centros-custo', nome: 'Centros de Custo', icon: '▪', url: '#', em_breve: true },
        { id: 'lancamentos', nome: 'Lançamentos', icon: '▪', url: '#', em_breve: true },
        { id: 'fluxo-caixa', nome: 'Fluxo Caixa', icon: '▪', url: '#', em_breve: true },
        { id: 'importar-ofx', nome: 'Importar OFX', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Documentação
    { 
      id: 'documentos',
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro'],
      nome: 'Documentos', 
      icon: '📁', 
      secao: 'Documentação',
      submenu: [
        { id: 'atas', nome: 'Atas', icon: '▪', url: '#', em_breve: true },
        { id: 'certificados', nome: 'Certificados', icon: '▪', url: '#', em_breve: true },
        { id: 'circulares', nome: 'Circulares', icon: '▪', url: '#', em_breve: true },
        { id: 'gabaritos', nome: 'Gabaritos', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Relatórios
    { 
      id: 'relatorios',
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      nome: 'Relatórios', 
      icon: '📄', 
      secao: 'Documentação',
      submenu: [
        { id: 'rel-pedagogicos', nome: 'Pedagógicos', icon: '▪', url: '#', em_breve: true },
        { id: 'rel-financeiros', nome: 'Financeiros', icon: '▪', url: '#', em_breve: true },
        { id: 'rel-biblioteca', nome: 'Biblioteca', icon: '▪', url: '#', em_breve: true },
        { id: 'rel-matriculadores', nome: 'Matriculadores', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Gráficos
    { 
      id: 'graficos',
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro', 'coordenador'],
      nome: 'Gráficos', 
      icon: '📊', 
      secao: 'Documentação',
      submenu: [
        { id: 'graf-pedagogicos', nome: 'Pedagógicos', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Outros Módulos
    { 
      id: 'eventos',
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro', 'coordenador'],
      nome: 'Eventos', 
      icon: '📅', 
      secao: 'Outros Módulos',
      submenu: [
        { id: 'gerenciar-eventos', nome: 'Gerenciar', icon: '▪', url: '#', em_breve: true },
        { id: 'credenciais', nome: 'Credenciais', icon: '▪', url: '#', em_breve: true },
        { id: 'entrada-saida', nome: 'Entrada / Saída', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Diploma Digital
    { 
      id: 'diploma', 
      nome: 'Diploma Digital', 
      icon: '🎓', 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin'],
      tiposInstituicao: ['faculdade'],
      secao: 'Outros Módulos',
      submenu: [
        { id: 'diploma-lote', nome: 'Lote', icon: '▪', url: '#', em_breve: true },
        { id: 'diploma-assinar', nome: 'Assinar', icon: '▪', url: '#', em_breve: true },
        { id: 'diploma-convenios', nome: 'Convênios', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Solicitações
    { id: 'solicitacoes-geral', nome: 'Solicitações', icon: '✋', url: '#', em_breve: true, secao: 'Outros Módulos' },

    // Ocorrências
    { id: 'ocorrencias', nome: 'Ocorrências', icon: '⚠️', url: '#', em_breve: true, secao: 'Outros Módulos' },

    // Sistema
    { 
      id: 'biblioteca', 
      nome: 'Biblioteca', 
      icon: '📚', 
      em_breve: true, 
      secao: 'Sistema',
      submenu: [
        { id: 'biblioteca-virtual', nome: 'Biblioteca Virtual', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Integrações
    { id: 'integracao', nome: 'Integrações', icon: '🔗', url: '#', em_breve: true, secao: 'Sistema' },

    // Usuários
    { id: 'usuarios', nome: 'Usuários', icon: '👥', url: '/admin/usuarios', em_breve: false, secao: 'Sistema', completed: true, perfis: ['grupo_admin', 'instituicao_admin'] },

    // Configurações
    {
      id: 'configuracoes-gerais',
      nome: 'Configurações',
      icon: '⚙️',
      em_breve: false,
      secao: 'Sistema',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      submenu: [
        { id: 'config-operacionais', nome: 'Configurações Operacionais', icon: '▪', url: '/admin/configuracoes', em_breve: false, completed: true },
        { id: 'config-tecnica', nome: 'Configuração Técnica', icon: '▪', url: '/admin/configuracoes/empresa', em_breve: false, completed: true }
      ]
    },

    // Funcionários
    { id: 'funcionarios', nome: 'Funcionários', icon: '👤', url: '/admin/funcionarios', em_breve: false, secao: 'Sistema', completed: true, perfis: ['grupo_admin', 'instituicao_admin'] },
  ];

  const menuFiltrado = filtrarMenuPorContexto(menuItems, user);

  // Separa o item Início dos grupos por seção
  const inicioItem = menuFiltrado.find(i => i.id === 'dashboard');
  const outrosItens = menuFiltrado.filter(i => i.id !== 'dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Backdrop para Gaveta Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#021B33] text-[#E2E8F0] shadow-2xl transition-all duration-300 fixed h-full left-0 top-0 z-50 flex flex-col border-r border-[#0B2E54] select-none`}
      >
        
        {/* 1. Topo / Logo */}
        <div className="p-3.5 pt-4 pb-3.5 flex items-center justify-between min-h-[76px] border-b border-[#0B2E54] bg-[#021B33]">
          {sidebarOpen ? (
            <div className="flex items-center justify-center w-full px-1">
              <img
                src="/images/logo_creeser03.png"
                alt="CREESER"
                className="h-10 xl:h-11 w-auto max-w-[200px] object-contain brightness-110 drop-shadow-sm"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#0D3B66] text-white font-black text-lg flex items-center justify-center mx-auto shadow-inner">
              C
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* 2. Navegação de Menus */}
        <nav className="py-2 px-3 space-y-0.5 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar font-sans">
          {!mounted ? (
            <div className="py-2 space-y-2 opacity-20">
              <div className="h-9 bg-white/10 rounded-lg w-full" />
              <div className="h-3 bg-white/10 rounded w-20 my-3" />
              <div className="h-9 bg-white/10 rounded-lg w-full" />
              <div className="h-9 bg-white/10 rounded-lg w-full" />
              <div className="h-9 bg-white/10 rounded-lg w-full" />
              <div className="h-3 bg-white/10 rounded w-24 my-3" />
              <div className="h-9 bg-white/10 rounded-lg w-full" />
            </div>
          ) : (
            <>
              {/* Item Início em Destaque */}
              {inicioItem && (
                <div className="mb-1">
                  {(() => {
                    const isActive = router.pathname === inicioItem.url;
                    return (
                      <Link href={inicioItem.url}>
                        <div
                          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors duration-150 text-[13.5px] cursor-pointer min-h-[38px] ${
                            isActive
                              ? 'bg-[#0D3B66] text-white font-semibold shadow-xs'
                              : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white font-medium'
                          } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                        >
                          <span className={`text-base flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {inicioItem.icon}
                          </span>
                          {sidebarOpen && <span className="truncate">{inicioItem.nome}</span>}
                        </div>
                      </Link>
                    );
                  })()}
                </div>
              )}

              {/* Seções de Módulos */}
              {(() => {
                const secoes = {};
                outrosItens.forEach(item => {
                  const secao = item.secao || 'Outros';
                  if (!secoes[secao]) secoes[secao] = [];
                  secoes[secao].push(item);
                });

                return Object.entries(secoes).map(([secao, items]) => (
                  <div key={secao} className="pt-2">
                    
                    {/* Título da Seção */}
                    {sidebarOpen ? (
                      <div className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#5A82A6]">
                        {secao}
                      </div>
                    ) : (
                      <div className="h-px bg-white/10 my-1.5 mx-2" />
                    )}

                    {/* Itens da Seção */}
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const isAnySubActive = item.submenu?.some(sub => router.pathname === sub.url || (sub.url !== '#' && router.pathname.startsWith(sub.url)));
                        const isExpanded = expandedSubmenus[item.id];
                        const isActive = router.pathname === item.url || isAnySubActive;

                        return (
                          <div key={item.id}>
                            {/* Item com Submenu */}
                            {item.submenu ? (
                              <div className="relative group">
                                <button
                                  onClick={() => setExpandedSubmenus(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }))}
                                  className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-colors duration-150 text-[13.5px] cursor-pointer min-h-[38px] ${
                                    isExpanded || isAnySubActive
                                      ? 'bg-[#0D3B66] text-white font-semibold shadow-xs'
                                      : item.em_breve
                                      ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                                      : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white font-medium'
                                  } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`text-base flex-shrink-0 ${isExpanded || isAnySubActive ? 'text-white' : 'text-slate-300'} ${item.em_breve ? 'opacity-50' : ''}`}>
                                      {item.icon}
                                    </span>
                                    {sidebarOpen && <span className="truncate">{item.nome}</span>}
                                  </div>
                                  {sidebarOpen && (
                                    <svg
                                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-90 text-white' : 'text-[#648BAF]'
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </button>

                                {/* Tooltip quando colapsado */}
                                {!sidebarOpen && (
                                  <div className="hidden group-hover:block absolute left-20 top-0 bg-[#021B33] text-white px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap z-50 border border-[#0B2E54] shadow-xl">
                                    {item.nome}
                                  </div>
                                )}

                                {/* Submenu Aberto */}
                                {sidebarOpen && isExpanded && (
                                  <div className="relative ml-3 pl-3.5 my-1 space-y-0.5">
                                    {/* Linha vertical contínua da árvore */}
                                    <div className="absolute left-1.5 top-1.5 bottom-1.5 w-[1.5px] bg-white/20 rounded-full pointer-events-none" />

                                    {item.submenu.map((subitem) => {
                                      const isSubActive = router.pathname === subitem.url;
                                      const isSubEmBreve = subitem.em_breve;

                                      return (
                                        <Link key={subitem.id} href={subitem.url}>
                                          <div
                                            className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors text-[13px] cursor-pointer min-h-[30px] ${
                                              isSubActive
                                                ? 'bg-[#0D3B66] text-white font-semibold shadow-xs'
                                                : isSubEmBreve
                                                ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300 font-normal'
                                                : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white font-normal'
                                            }`}
                                          >
                                            <span className={`text-[8px] flex-shrink-0 ${isSubActive ? 'text-white' : 'text-[#94A3B8]'}`}>
                                              ●
                                            </span>
                                            <span className="truncate">{subitem.nome}</span>
                                          </div>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Item sem Submenu */
                              (() => {
                                const isEmBreve = item.em_breve;

                                return (
                                  <div className="relative group">
                                    <Link href={item.url}>
                                      <div
                                        className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors duration-150 text-[13.5px] cursor-pointer min-h-[38px] ${
                                          isActive
                                            ? 'bg-[#0D3B66] text-white font-semibold shadow-xs'
                                            : isEmBreve
                                            ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300 font-normal'
                                            : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white font-medium'
                                        } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                                      >
                                        <span className={`text-base flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-300'} ${isEmBreve ? 'opacity-50' : ''}`}>
                                          {item.icon}
                                        </span>
                                        {sidebarOpen && <span className="truncate">{item.nome}</span>}
                                      </div>
                                    </Link>

                                    {/* Tooltip quando colapsado */}
                                    {!sidebarOpen && (
                                      <div className="hidden group-hover:block absolute left-20 top-0 bg-[#021B33] text-white px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap z-50 border border-[#0B2E54] shadow-xl">
                                        {item.nome}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </>
          )}
        </nav>

        {/* 4. Botão Recolher menu fixado no rodapé */}
        <div className="p-3 bg-[#021B33] border-t border-[#0B2E54] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full py-2.5 px-3 bg-[#0B2B4D] hover:bg-[#0F3864] active:bg-[#08223E] border border-white/10 rounded-xl transition-all text-xs text-[#CBD5E1] hover:text-white font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {sidebarOpen && <span>Recolher menu</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} flex-1 transition-all duration-300 flex flex-col relative z-10 min-w-0`}>
        
        {/* Top Header */}
        <header className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] border-b border-gray-200/80 sticky top-0 z-40">
          <div className="px-4 md:px-8 py-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div className="flex items-center gap-3">
              {/* Botão Hambúrguer Mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition border border-slate-200"
                aria-label="Abrir menu lateral"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="hidden md:block">
                <h2 className="text-base lg:text-lg font-bold text-slate-900 leading-tight">Bem-vindo ao Grupo Educacional CREESER</h2>
                <p className="text-xs text-slate-500 mt-0.5">Gerencie sua instituição educacional de forma integrada e eficiente</p>
              </div>
              <h2 className="md:hidden text-base font-bold text-slate-900">CREESER Gestão</h2>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3 md:gap-5">
              {/* Barra de Pesquisa Rápida */}
              <div className="relative hidden xl:block w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar alunos, turmas, cursos..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                  readOnly
                  onClick={() => router.push('/admin/alunos')}
                />
              </div>

              {/* Botão de Notificação */}
              <div className="relative">
                <button
                  onClick={() => router.push('/admin/solicitacoes')}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition relative"
                  title="Notificações"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                </button>
              </div>

              {/* Perfil do Usuário */}
              <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 md:pl-5">
                <Link href="/admin/editar-perfil">
                  <div className="w-9 h-9 rounded-full bg-[#0B2545] text-teal-300 flex items-center justify-center font-bold text-xs cursor-pointer hover:ring-2 hover:ring-teal-500 transition overflow-hidden shadow-xs flex-shrink-0">
                    {mounted && user?.foto ? (
                      <img src={user.foto} alt={user?.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span>{((mounted && user?.nome) || 'A').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                </Link>
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-slate-800 truncate text-xs leading-tight max-w-[140px]">
                    {mounted && user?.nome ? user.nome : 'Administrador'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                    {mounted && user?.tipo === 'admin' ? 'Administrador' : ((mounted && user?.perfil) || 'Usuário')}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sair do sistema"
                  className="ml-1 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
