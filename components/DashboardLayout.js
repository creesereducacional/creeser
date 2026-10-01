import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { filtrarMenuPorContexto } from '../utils/menu-permissoes';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSubmenus, setExpandedSubmenus] = useState({});
  const [user, setUser] = useState(null);

  // Auto-collapse sidebar em telas menores que 1024px
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let active = true;
    setMounted(true);
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const usuarioLogado = data?.usuario;
        if (!usuarioLogado) {
          router.push('/login');
          return;
        }

        const rawPerfil = String(usuarioLogado.perfil || usuarioLogado.tipo || '').toLowerCase();
        
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
          setUser(usuarioLogado);
          setVerificando(false);
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
          const moduloUsuarios = ['instituicao_admin']; // grupo_admin é liberado na linha 44
          if (!moduloUsuarios.includes(perfil)) {
            router.replace('/admin/dashboard');
            return;
          }
        }

        setUser(usuarioLogado);
        setVerificando(false);
      })
      .catch(() => {
        if (active) router.push('/login');
      });

    return () => { active = false; };
  }, [router]);

  if (!mounted || verificando || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm font-semibold text-gray-500 animate-pulse">Verificando permissões...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    router.push('/login');
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
        } bg-[#0B2545] text-[#E2E8F0] shadow-2xl transition-all duration-300 fixed h-full left-0 top-0 z-50 flex flex-col border-r border-[#153a66] select-none`}
      >
        
        {/* 1. Topo / Logo */}
        <div className="p-4 pt-5 pb-4 flex items-center justify-between min-h-[72px] border-b border-[#153a66]/70 bg-[#081d38]/40">
          {sidebarOpen ? (
            <div className="flex items-center justify-center w-full px-2">
              <img
                src="/images/logo_creeser.png"
                alt="CREESER"
                className="h-8 xl:h-9 w-auto object-contain brightness-110 drop-shadow-sm"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] text-teal-300 font-black text-lg flex items-center justify-center mx-auto shadow-inner">
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

        {/* 2. Card de Contexto Institucional */}
        {sidebarOpen ? (
          <div className="mx-3 mt-3.5 mb-2 p-2.5 rounded-2xl bg-[#0f2d52]/70 border border-[#1E3A5F] flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A5F] text-teal-300 font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#E2E8F0] truncate leading-tight">Creeser Educacional</p>
              <p className="text-[10px] text-[#94A3B8] font-medium truncate mt-0.5">Sistema de Gestão</p>
            </div>
          </div>
        ) : (
          <div className="my-2 flex justify-center">
            <div className="w-7 h-7 rounded-lg bg-[#0f2d52] text-teal-300 text-[11px] font-black flex items-center justify-center">
              ▼
            </div>
          </div>
        )}

        {/* 3. Navegação de Menus */}
        <nav className="py-2 px-3 space-y-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          
          {/* Item Início em Destaque */}
          {inicioItem && (
            <div className="mb-2">
              {(() => {
                const isActive = router.pathname === inicioItem.url;
                return (
                  <Link href={inicioItem.url}>
                    <div
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500 text-white font-bold shadow-md shadow-teal-950/40'
                          : 'text-[#E2E8F0] hover:bg-[#1E3A5F]/70 hover:text-white font-medium'
                      } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                    >
                      <span className="text-base flex-shrink-0">{inicioItem.icon}</span>
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
                  <div className="px-3 pt-2 pb-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                    {secao}
                  </div>
                ) : (
                  <div className="h-px bg-slate-700/40 my-2 mx-2" />
                )}

                {/* Itens da Seção */}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isAnySubActive = item.submenu?.some(sub => router.pathname === sub.url);
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
                              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer ${
                                isAnySubActive || expandedSubmenus[item.id]
                                  ? 'bg-[#1E3A5F] text-white font-semibold shadow-xs'
                                  : item.em_breve
                                  ? 'text-[#94A3B8]/70 hover:bg-[#1E3A5F]/40 hover:text-slate-200'
                                  : 'text-[#E2E8F0] hover:bg-[#1E3A5F]/70 hover:text-white font-medium'
                              } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-base flex-shrink-0 ${item.em_breve ? 'opacity-60' : ''}`}>
                                  {item.icon}
                                </span>
                                {sidebarOpen && <span className="truncate">{item.nome}</span>}
                              </div>
                              {sidebarOpen && (
                                <svg
                                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                                    expandedSubmenus[item.id] ? 'rotate-90 text-teal-300' : 'text-[#94A3B8]'
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
                              <div className="hidden group-hover:block absolute left-20 top-0 bg-[#0B2545] text-white px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                                {item.nome}
                              </div>
                            )}

                            {/* Submenu Aberto */}
                            {sidebarOpen && expandedSubmenus[item.id] && (
                              <div className="bg-[#081d38]/85 rounded-xl my-1 py-1.5 px-2 ml-3 border-l-2 border-[#10B981] space-y-0.5 animate-fade-in">
                                {item.submenu.map((subitem) => {
                                  const isSubActive = router.pathname === subitem.url;
                                  const isSubEmBreve = subitem.em_breve;

                                  return (
                                    <Link key={subitem.id} href={subitem.url}>
                                      <div
                                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
                                          isSubActive
                                            ? 'bg-teal-500 text-white font-bold shadow-xs'
                                            : isSubEmBreve
                                            ? 'text-[#94A3B8]/60 hover:bg-slate-800/40 hover:text-slate-200'
                                            : 'text-[#E2E8F0]/90 hover:bg-[#1E3A5F] hover:text-white font-medium'
                                        }`}
                                      >
                                        <span className={`text-[10px] flex-shrink-0 ${isSubActive ? 'text-white' : 'text-teal-400'}`}>
                                          ▪
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
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer ${
                                      isActive
                                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500 text-white font-bold shadow-md shadow-teal-950/40'
                                        : isEmBreve
                                        ? 'text-[#94A3B8]/70 hover:bg-[#1E3A5F]/40 hover:text-slate-200'
                                        : 'text-[#E2E8F0] hover:bg-[#1E3A5F]/70 hover:text-white font-medium'
                                    } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                                  >
                                    <span className={`text-base flex-shrink-0 ${isEmBreve ? 'opacity-60' : ''}`}>
                                      {item.icon}
                                    </span>
                                    {sidebarOpen && <span className="truncate">{item.nome}</span>}
                                  </div>
                                </Link>

                                {/* Tooltip quando colapsado */}
                                {!sidebarOpen && (
                                  <div className="hidden group-hover:block absolute left-20 top-0 bg-[#0B2545] text-white px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap z-50 border border-slate-700 shadow-xl">
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
        </nav>

        {/* 4. Botão Recolher menu fixado no rodapé */}
        <div className="p-3 bg-[#081d38]/90 border-t border-[#153a66] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full py-2.5 px-3 bg-[#0f325d] hover:bg-[#164177] active:bg-[#0c2748] border border-slate-700/50 rounded-xl transition-all text-xs text-[#E2E8F0] hover:text-white font-bold flex items-center justify-center gap-2 shadow-xs"
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
        <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
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
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Bem-vindo ao Grupo Educacional CREESER</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Gerencie sua instituição educacional</p>
              </div>
              <h2 className="md:hidden text-lg font-bold text-gray-800">CREESER Gestão</h2>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="text-right hidden sm:block flex-1 md:flex-none">
                <p className="text-xs text-gray-500">Conectado como</p>
                <p className="font-semibold text-gray-800 truncate text-sm">{user?.nome}</p>
                <p className="text-[10.5px] text-gray-500 uppercase tracking-wide font-medium">
                  {user?.tipo === 'admin' ? 'Admin' : 'Usuário'}
                </p>
              </div>
              <Link href="/admin/editar-perfil">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-md transition overflow-hidden border-2 border-white shadow-xs flex-shrink-0">
                  {user?.foto ? (
                    <img src={user.foto} alt={user?.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm md:text-base">{user?.nome?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </Link>
              <Link href="/admin/editar-perfil">
                <button className="hidden md:block px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition text-xs font-semibold shadow-xs">
                  Editar Perfil
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:block px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition text-xs font-semibold shadow-xs"
              >
                Sair
              </button>
              <button
                onClick={handleLogout}
                className="md:hidden px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-xs font-medium"
              >
                Sair
              </button>
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
