import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import { filtrarMenuPorContexto } from "../utils/menu-permissoes";

const MENU_ITEMS = [
  { id: 'dashboard', href: '/admin/dashboard', icon: '📊', label: 'Dashboard', secao: 'Menu Principal' },

  // Gestão de Usuários
  { id: 'usuarios', href: '/admin/usuarios', icon: '👤', label: 'Usuários', secao: 'Gestão de Usuários', perfis: ['grupo_admin', 'instituicao_admin'] },
  { id: 'funcionarios', href: '/admin/funcionarios', icon: '🧑‍💼', label: 'Funcionários', secao: 'Gestão de Usuários', perfis: ['grupo_admin', 'instituicao_admin'] },

  // Pedagógico
  { id: 'professores', href: '/admin/professores', icon: '🎓', label: 'Professores', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'] },
  { id: 'alunos', href: '/admin/alunos', icon: '📚', label: 'Alunos', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'financeiro'] },
  { id: 'responsaveis', href: '/admin/responsaveis', icon: '👨‍👩‍👦', label: 'Responsáveis', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria', 'financeiro'] },
  { id: 'turmas', href: '/admin/turmas', icon: '🏫', label: 'Turmas', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'] },
  { id: 'formacao-turmas', href: '/admin/formacao-turmas', icon: '🔶', label: 'Formação de Turmas', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'] },
  { id: 'cursos', href: '/admin/cursos', icon: '📖', label: 'Cursos', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'] },
  { id: 'disciplinas', href: '/admin/disciplinas', icon: '📝', label: 'Disciplinas', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'grades', href: '/admin/disciplinas/grades', icon: '🗂️', label: 'Grades Curriculares', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'notas-faltas', href: '/admin/notas-faltas', icon: '📋', label: 'Notas e Faltas', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'planejamento', href: '/admin/planejamento-diario', icon: '🗓️', label: 'Planejamento Diário', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'atividades', href: '/admin/atividades-complementares', icon: '🏆', label: 'Atividades Complementares', secao: 'Pedagógico', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },

  // Financeiro
  { id: 'financeiro-modulo', href: '/admin-financeiro', icon: '💵', label: 'Financeiro', secao: 'Financeiro', perfis: ['grupo_admin', 'instituicao_admin', 'financeiro'] },
  { id: 'contratos', href: '/admin/contratos', icon: '📄', label: 'Contratos', secao: 'Financeiro', perfis: ['grupo_admin', 'instituicao_admin', 'financeiro'] },
  { id: 'contratos-dashboard', href: '/admin/contratos/dashboard', icon: '📊', label: 'Dashboard Contratos', secao: 'Financeiro', perfis: ['grupo_admin', 'instituicao_admin', 'financeiro', 'secretaria', 'coordenador'] },
  { id: 'contratos-relatorio', href: '/admin/contratos/relatorio', icon: '📋', label: 'Relatório Contratos', secao: 'Financeiro', perfis: ['grupo_admin', 'instituicao_admin', 'financeiro', 'secretaria', 'coordenador'] },

  // Comercial (painel de gestão — apenas admins)
  { id: 'campanhas', href: '/admin/campanhas', icon: '📣', label: 'Campanhas', secao: 'Comercial', perfis: ['grupo_admin', 'instituicao_admin'] },
  { id: 'leads-admin', href: '/comercial/leads', icon: '🎯', label: 'Leads', secao: 'Comercial', perfis: ['grupo_admin', 'instituicao_admin', 'financeiro'] },

  // EAD / Comunicação
  { id: 'slider', href: '/admin/slider', icon: '🖼️', label: 'Banner/Slider', secao: 'Conteúdo', perfis: ['grupo_admin', 'instituicao_admin'] },
  { id: 'blog', href: '/admin/blog', icon: '📰', label: 'Notícias', secao: 'Conteúdo', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'forum', href: '/admin/forum', icon: '💬', label: 'Fórum', secao: 'Comunicação', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'emails', href: '/admin/emails', icon: '✉️', label: 'E-mails', secao: 'Comunicação', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'avaliacoes', href: '/admin/avaliacoes', icon: '⭐', label: 'Avaliações', secao: 'Comunicação', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'] },
  { id: 'documentos', href: '/admin/documentos', icon: '📤', label: 'Documentos', secao: 'Comunicação', perfis: ['grupo_admin', 'instituicao_admin', 'coordenador', 'secretaria'] },

  // Configurações (admin)
  {
    id: 'coordenacao',
    icon: '📋',
    label: 'Configurações',
    secao: 'Configurações',
    perfis: ['grupo_admin', 'instituicao_admin', 'coordenador'],
    submenu: [
      { id: 'configuracoes', href: '/admin/configuracoes', label: 'Geral' },
      { id: 'solicitacoes', href: '/admin/solicitacoes', label: 'Solicitações' },
      { id: 'unidades', href: '/admin/unidades', label: 'Unidades' },
      { id: 'anos-letivos', href: '/admin/anos-letivos', label: 'Anos Letivos' },
      { id: 'calendario-aulas', href: '#', label: 'Calendário de Aulas', perfis: ['grupo_admin'] },
      { id: 'contas-bancarias', href: '#', label: 'Contas Bancárias', perfis: ['grupo_admin'] },
      { id: 'go-live-checklist', href: '/admin/go-live-checklist', label: '🚀 Go-Live Checklist', perfis: ['grupo_admin', 'instituicao_admin'] },
    ],
  },
];

const SECOES_ORDER = ['Menu Principal', 'Gestão de Usuários', 'Pedagógico', 'Financeiro', 'Comercial', 'Conteúdo', 'Comunicação', 'Configurações'];

export default function AdminSidebar() {
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedSubmenus, setExpandedSubmenus] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.usuario) setUser(data.usuario); })
      .catch(() => {});
  }, []);

  const menuFiltrado = filtrarMenuPorContexto(MENU_ITEMS, user);
  const secoesMap = SECOES_ORDER.reduce((acc, s) => {
    acc[s] = menuFiltrado.filter(item => item.secao === s);
    return acc;
  }, {});

  const isActive = (path) => router.pathname === path;
  
  const MenuItem = ({ href, icon, label, badge, completed }) => (
    <Link 
      href={href} 
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative
        ${completed
          ? 'bg-orange-600 text-white shadow-lg font-semibold'
          : isActive(href) 
          ? 'bg-teal-600 text-white shadow-lg font-semibold' 
          : 'text-gray-300 hover:bg-teal-700/40 hover:text-white'
        }
      `}
      title={isCollapsed ? label : ''}
    >
      <span className="text-xl min-w-[24px] flex items-center justify-center">{icon}</span>
      {!isCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && (
            <span className="bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
      {isCollapsed && badge && (
        <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  );

  const SubMenu = ({ id, label, icon, children }) => {
    const isOpen = expandedSubmenus[id];
    
    return (
      <div className="w-full">
        <button
          onClick={() => setExpandedSubmenus(prev => ({
            ...prev,
            [id]: !prev[id]
          }))}
          className={`
            w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
            ${isOpen 
              ? 'bg-teal-600 text-white' 
              : 'text-gray-300 hover:bg-teal-700/40 hover:text-white'
            }
          `}
          title={isCollapsed ? label : ''}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl flex-shrink-0">{icon}</span>
            {!isCollapsed && <span className="truncate">{label}</span>}
          </div>
          {!isCollapsed && (
            <span className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          )}
        </button>
        
        {isOpen && !isCollapsed && (
          <div className="bg-teal-800/50 rounded-lg mt-2 space-y-0.5 py-3 px-2 ml-2 border-l-2 border-teal-500">
            {children}
          </div>
        )}
      </div>
    );
  };

  const SubMenuItem = ({ href, label, completed }) => {
    const isDisabled = href === '#';
    if (isDisabled) {
      return (
        <span className="flex items-center gap-3 px-3 py-1.5 rounded text-xs font-medium w-full text-left text-gray-400 cursor-not-allowed opacity-60">
          <span className="text-base flex-shrink-0">▪</span>
          <span className="truncate">{label}</span>
          <span className="ml-auto text-[10px] bg-teal-800 text-teal-300 px-1.5 py-0.5 rounded whitespace-nowrap">Em breve</span>
        </span>
      );
    }
    return (
      <Link
        href={href}
        className={`
          flex items-center gap-3 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 block w-full text-left
          ${completed
            ? 'bg-orange-600 text-white'
            : isActive(href)
            ? 'bg-teal-600 text-white'
            : 'text-gray-200 hover:bg-teal-700'
          }
        `}
      >
        <span className="text-base flex-shrink-0">▪</span>
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const SectionTitle = ({ children }) => {
    if (isCollapsed) return <div className="h-px bg-teal-600/30 my-4"></div>;
    return (
      <h3 className="text-xs font-semibold text-teal-200 uppercase tracking-widest px-4 mt-6 mb-2">
        {children}
      </h3>
    );
  };

  return (
    <aside className={`bg-gradient-to-b from-teal-700 to-teal-900 shadow-2xl h-screen sticky top-0 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-teal-600 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white to-teal-100 rounded-lg flex items-center justify-center shadow-lg font-bold text-teal-700">
              C
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">CREESER</h2>
              <p className="text-teal-200 text-xs">Educacional</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-white to-teal-100 rounded-lg flex items-center justify-center shadow-lg font-bold text-teal-700 mx-auto text-lg">
            C
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={`p-2 hover:bg-teal-600 rounded-lg transition-colors text-teal-100 ${isCollapsed ? 'absolute top-6 right-2' : ''}`}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-0">
        {SECOES_ORDER.map(secao => {
          const items = secoesMap[secao] || [];
          if (items.length === 0) return null;
          const showTitle = secao !== 'Coordenação';
          const isLast = secao === 'Coordenação';
          return (
            <div key={secao}>
              {showTitle && <SectionTitle>{secao}</SectionTitle>}
              <div className={`space-y-1${isLast ? ' mt-6 pb-6' : ''}`}>
                {items.map(item =>
                  item.submenu ? (
                    <SubMenu key={item.id} id={item.id} label={item.label} icon={item.icon}>
                      {item.submenu.map(sub => (
                        <SubMenuItem key={sub.id} href={sub.href} label={sub.label} completed={sub.completed} />
                      ))}
                    </SubMenu>
                  ) : (
                    <MenuItem key={item.id} href={item.href} icon={item.icon} label={item.label} completed={item.completed} />
                  )
                )}
              </div>
            </div>
          );
        })}
        </div>
      </nav>
    </aside>
  );
}