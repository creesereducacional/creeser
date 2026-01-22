import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSidebar } from "../context/SidebarContext";

export default function AdminSidebar() {
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedSubmenus, setExpandedSubmenus] = useState({});
  
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

  const SubMenuItem = ({ href, label, completed }) => (
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
          <SectionTitle>Menu Principal</SectionTitle>
        <div className="space-y-1">
          <MenuItem href="/admin/dashboard" icon="📊" label="Dashboard" />
        </div>

        <SectionTitle>Gestão de Usuários</SectionTitle>
        <div className="space-y-1">
          <MenuItem href="/admin/usuarios" icon="👤" label="Usuários" completed={true} />
          <MenuItem href="/admin/professores" icon="🎓" label="Professores" />
          <MenuItem href="/admin/alunos" icon="📚" label="Alunos" />
        </div>

        <SectionTitle>Conteúdo</SectionTitle>
        <div className="space-y-1">
          <MenuItem href="/admin/cursos" icon="📖" label="Cursos" completed={true} />
          <MenuItem href="/admin/slider" icon="🖼️" label="Banner/Slider" />
          <MenuItem href="/admin/blog" icon="📰" label="Notícias" />
        </div>

        <SectionTitle>Comunicação</SectionTitle>
        <div className="space-y-1">
          <MenuItem href="/admin/forum" icon="💬" label="Fórum" completed={true} />
          <MenuItem href="/admin/emails" icon="✉️" label="E-mails" completed={true} />
          <MenuItem href="/admin/avaliacoes" icon="⭐" label="Avaliações" completed={true} />
          <MenuItem href="/admin/documentos" icon="📤" label="Documentos" completed={true} />
        </div>

        <div className="space-y-1 mt-6 pb-6">
          <SubMenu id="coordenacao" label="Coordenação" icon="📋">
            <SubMenuItem href="/admin/configuracoes" label="Configurações" />
            <SubMenuItem href="/admin/solicitacoes" label="Solicitações" />
            <SubMenuItem href="/admin/unidades" label="Unidades" completed={true} />
            <SubMenuItem href="/admin/anos-letivos" label="Anos Letivos" />
            <SubMenuItem href="/admin/calendario-aulas" label="Calendário de Aulas" />
            <SubMenuItem href="/admin/contas-bancarias" label="Contas Bancárias" />
          </SubMenu>
        </div>
        </div>
      </nav>
    </aside>
  );
}