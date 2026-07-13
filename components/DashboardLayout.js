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
    // Menu Principal
    { id: 'dashboard', nome: 'Início', icon: '🏠', url: '/admin/dashboard', em_breve: false, secao: 'Menu Principal' },

    { id: 'comunicados', nome: 'Comunicados', icon: '✉️', url: '#', em_breve: true, secao: 'Administrativo' },
    
    // NPJ (com submenu)
    {
      id: 'npj',
      nome: 'NPJ',
      icon: '⚖️',
      em_breve: true,
      secao: 'Administrativo',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      tiposInstituicao: ['faculdade'],
      submenu: [
        { id: 'gerenciar', nome: 'Gerenciar', icon: '▪', url: '#', em_breve: true },
        { id: 'atividades', nome: 'Atividades', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Pedagógico (com submenu)
    {
      id: 'pedagogico',
      nome: 'Pedagógico',
      icon: '📚',
      em_breve: false,
      secao: 'Pedagógico',
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
      icon: '📚',
      em_breve: false,
      secao: 'Módulo EAD',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      submenu: [
        { id: 'ead-forum', nome: 'Fórum', icon: '▪', url: '/admin/forum', em_breve: false, completed: true },
        { id: 'ead-emails', nome: 'E-mails', icon: '▪', url: '/admin/emails', em_breve: false, completed: true },
        { id: 'ead-avaliacoes', nome: 'Avaliações', icon: '▪', url: '/admin/avaliacoes', em_breve: false, completed: true },
        { id: 'ead-documentos', nome: 'Documentos', icon: '▪', url: '/admin/documentos', em_breve: false, completed: true },
      ]
    },

    // Financeiro
    {
      id: 'financeiro',
      nome: 'Financeiro',
      icon: '💵',
      url: '/admin-financeiro',
      em_breve: false,
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro'],
      secao: 'Administração'
    },

    // Processo Seletivo
    { 
      id: 'processo', 
      nome: 'Processo Seletivo', 
      icon: '📋', 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      tiposInstituicao: ['faculdade', 'tecnico'],
      secao: 'Administração',
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
      icon: '🏠', 
      em_breve: true, 
      secao: 'Administração',
      submenu: [
        { id: 'gerenciar-cpa', nome: 'Gerenciar CPAs', icon: '▪', url: '#', em_breve: true },
        { id: 'responder-cpa', nome: 'Responder CPAs', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Estágio
    { 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin'],
      tiposInstituicao: ['faculdade'],
      nome: 'Estágio', 
      icon: '📊', 
      secao: 'Administração',
      submenu: [
        { id: 'gerenciar-empresas', nome: 'Gerenciar empresas', icon: '▪', url: '#', em_breve: true },
        { id: 'gerenciar-estagio', nome: 'Gerenciar Estágio', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Contábil
    { 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      tiposInstituicao: ['faculdade'],
      nome: 'Contábil', 
      icon: '📈', 
      secao: 'Administração',
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

    // Documentos
    { 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro'],
      nome: 'Documentos', 
      icon: '📁', 
      secao: 'Relatórios',
      submenu: [
        { id: 'atas', nome: 'Atas', icon: '▪', url: '#', em_breve: true },
        { id: 'certificados', nome: 'Certificados', icon: '▪', url: '#', em_breve: true },
        { id: 'circulares', nome: 'Circulares', icon: '▪', url: '#', em_breve: true },
        { id: 'gabaritos', nome: 'Gabaritos', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Relatórios
    { 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      nome: 'Relatórios', 
      icon: '📄', 
      secao: 'Relatórios',
      submenu: [
        { id: 'rel-pedagogicos', nome: 'Pedagógicos', icon: '▪', url: '#', em_breve: true },
        { id: 'rel-financeiros', nome: 'Financeiros', icon: '▪', url: '#', em_breve: true },
        { id: 'rel-biblioteca', nome: 'Biblioteca', icon: '▪', url: '#', em_breve: true },
        { id: 'rel-matriculadores', nome: 'Matriculadores', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Gráficos
    { 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro', 'coordenador'],
      nome: 'Gráficos', 
      icon: '📊', 
      secao: 'Relatórios',
      submenu: [
        { id: 'graf-pedagogicos', nome: 'Pedagógicos', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Eventos
    { 
      em_breve: true, 
      perfis: ['grupo_admin', 'instituicao_admin', 'financeiro', 'coordenador'],
      nome: 'Eventos', 
      icon: '💎', 
      secao: 'Outras Funcionalidades',
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
      secao: 'Outras Funcionalidades',
      submenu: [
        { id: 'diploma-lote', nome: 'Lote', icon: '▪', url: '#', em_breve: true },
        { id: 'diploma-assinar', nome: 'Assinar', icon: '▪', url: '#', em_breve: true },
        { id: 'diploma-convenios', nome: 'Convênios', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Solicitações
    { id: 'solicitacoes-geral', nome: 'Solicitações', icon: '✋', url: '#', em_breve: true, secao: 'Outras Funcionalidades' },

    // Ocorrências
    { id: 'ocorrencias', nome: 'Ocorrências', icon: '⚠️', url: '#', em_breve: true, secao: 'Outras Funcionalidades' },

    // Biblioteca
    { 
      id: 'biblioteca', 
      nome: 'Biblioteca', 
      icon: '📚', 
      em_breve: true, 
      secao: 'Outras Funcionalidades',
      submenu: [
        { id: 'biblioteca-virtual', nome: 'Biblioteca Virtual', icon: '▪', url: '#', em_breve: true },
      ]
    },

    // Integrações
    { id: 'integracao', nome: 'Integrações', icon: '🔗', url: '#', em_breve: true, secao: 'Outras Funcionalidades' },

    // Usuários
    { id: 'usuarios', nome: 'Usuários', icon: '👥', url: '/admin/usuarios', em_breve: false, secao: 'Outras Funcionalidades', completed: true, perfis: ['grupo_admin', 'instituicao_admin'] },

    // Configurações
    {
      id: 'configuracoes-gerais',
      nome: 'Configurações',
      icon: '⚙️',
      em_breve: false,
      secao: 'Outras Funcionalidades',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      submenu: [
        { id: 'config-operacionais', nome: 'Configurações Operacionais', icon: '▪', url: '/admin/configuracoes', em_breve: false, completed: true },
        { id: 'config-tecnica', nome: 'Configuração Técnica', icon: '▪', url: '/admin/configuracoes/empresa', em_breve: false, completed: true }
      ]
    },

    // Funcionários
    { id: 'funcionarios', nome: 'Funcionários', icon: '👤', url: '/admin/funcionarios', em_breve: false, secao: 'Outras Funcionalidades', completed: true, perfis: ['grupo_admin', 'instituicao_admin'] },

    // Coordenação (restaurado)
    {
      id: 'coordenacao',
      nome: 'Coordenação',
      icon: '👔',
      em_breve: false,
      secao: 'Administração',
      perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
      submenu: [
        { id: 'solicitacoes', nome: 'Solicitações', icon: '▪', url: '/admin/configuracoes/solicitacoes', em_breve: false, completed: true },
        { id: 'unidades', nome: 'Unidades', icon: '▪', url: '/admin/unidades', em_breve: false, completed: true },
        { id: 'anos-letivos', nome: 'Anos Letivos', icon: '▪', url: '/admin/anos-letivos', em_breve: false, completed: true },
        { id: 'calendario-aulas', nome: 'Calendário de Aulas', icon: '▪', url: '#', em_breve: true },
        { id: 'contas-bancarias', nome: 'Contas Bancárias', icon: '▪', url: '#', em_breve: true },
      ]
    },
  ];

  const menuFiltrado = filtrarMenuPorContexto(menuItems, user);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-teal-700 to-teal-800 text-white shadow-lg transition-all duration-300 fixed h-full left-0 top-0 overflow-hidden z-50 flex flex-col`}>
        
        {/* Logo */}
        <div className="p-4 border-b border-teal-600 flex items-center justify-center min-h-20">
          {sidebarOpen ? (
            <div className="flex items-center justify-center">
              <img src="/images/logo02.fw.png" alt="CREESER" className="h-10 object-contain" />
            </div>
          ) : (
            <div className="text-xl font-bold text-white">C</div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="py-0 px-3 space-y-0 flex-1 overflow-y-auto">
          {(() => {
            const secoes = {};
            menuFiltrado.forEach(item => {
              const secao = item.secao || 'Outros';
              if (!secoes[secao]) secoes[secao] = [];
              secoes[secao].push(item);
            });

            return Object.entries(secoes).map(([secao, items]) => (
              <div key={secao} className={secao === 'Menu Principal' ? 'mt-4' : ''}>
                {/* Separador sutil entre seções */}
                {secao !== 'Menu Principal' && <div className="h-px bg-teal-600/20 my-2 mx-3"></div>}
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id}>
                      {/* Item com Submenu */}
                      {item.submenu ? (
                        <div className="relative group">
                          <button
                            onClick={() => setExpandedSubmenus(prev => ({
                              [item.id]: !prev[item.id]
                            }))}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-1 rounded-lg transition text-sm cursor-pointer text-white ${
                              expandedSubmenus[item.id] ? 'bg-teal-600' : 'hover:bg-teal-600'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg flex-shrink-0">{item.icon}</span>
                              {sidebarOpen && <span className="truncate">{item.nome}</span>}
                            </div>
                            {sidebarOpen && (
                              <span className={`transition-transform flex-shrink-0 ${expandedSubmenus[item.id] ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            )}
                          </button>

                          {/* Tooltip quando colapsado */}
                          {!sidebarOpen && (
                            <div className="hidden group-hover:block absolute left-20 top-0 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                              {item.nome}
                            </div>
                          )}

                          {/* Submenu */}
                          {sidebarOpen && expandedSubmenus[item.id] && (
                            <div className="bg-teal-800/50 rounded-lg mt-1 space-y-1 py-2 px-2 ml-2 border-l-2 border-teal-500">
                              {item.submenu.map((subitem) => (
                                <Link key={subitem.id} href={subitem.url}>
                                  <div className={`flex items-center gap-3 px-3 py-1 rounded-lg transition text-xs cursor-pointer ${
                                    subitem.completed
                                      ? 'bg-orange-500/20 text-orange-600 font-semibold'
                                      : router.pathname === subitem.url
                                      ? 'bg-teal-500 text-white font-semibold'
                                      : 'text-gray-200 hover:bg-teal-700'
                                  }`}>
                                    <span className="text-base flex-shrink-0">{subitem.icon}</span>
                                    <span className="truncate">{subitem.nome}</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Item sem Submenu */
                        <div className="relative group">
                          <Link href={item.url}>
                            <div className={`flex items-center gap-3 px-3 py-1 rounded-lg transition text-sm cursor-pointer ${
                              item.completed
                                ? 'bg-orange-500/20 text-orange-600 font-semibold'
                                : router.pathname === item.url
                                ? 'bg-teal-600 text-white font-semibold'
                                : 'hover:bg-teal-600 text-white'
                            }`}>
                              <span className="text-lg flex-shrink-0">{item.icon}</span>
                              {sidebarOpen && <span className="truncate">{item.nome}</span>}
                            </div>
                          </Link>

                          {/* Tooltip when collapsed */}
                          {!sidebarOpen && (
                            <div className="hidden group-hover:block absolute left-20 top-0 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                              {item.nome}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </nav>

        {/* Toggle Button - Fixed to the right bottom */}
        <div className="sticky bottom-0 px-3 py-4 bg-gradient-to-t from-teal-900 to-transparent">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 rounded-lg transition text-sm text-center text-white font-medium"
          >
            {sidebarOpen ? '◀ Recolher' : '▶'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300 flex flex-col`}>
        
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
            <div className="hidden md:block">
              <h2 className="text-2xl font-bold text-gray-800">Bem-vindo ao Grupo Educacional CREESER</h2>
              <p className="text-sm text-gray-500 mt-1">Gerencie sua instituição educacional</p>
            </div>
            <h2 className="md:hidden text-xl font-bold text-gray-800">CREESER</h2>
            <div className="flex items-center gap-3 md:gap-6">
              <div className="text-right hidden sm:block flex-1 md:flex-none">
                <p className="text-sm text-gray-600">Conectado como</p>
                <p className="font-semibold text-gray-800 truncate">{user?.nome}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {user?.tipo === 'admin' ? 'Admin' : 'Usuário'}
                </p>
              </div>
              <Link href="/admin/editar-perfil">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                  {user?.foto ? (
                    <img src={user.foto} alt={user?.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base md:text-lg">{user?.nome?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </Link>
              <Link href="/admin/editar-perfil">
                <button className="hidden md:block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition text-sm font-medium">
                  Editar Perfil
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                Sair
              </button>
              <button
                onClick={handleLogout}
                className="md:hidden px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-xs font-medium"
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
