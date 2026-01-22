import { useRouter } from "next/router";
import { useSidebar } from "../context/SidebarContext";

export default function AdminHeader({ usuario }) {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? '80px' : '256px';
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.push("/");
  };
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 h-16 z-10 transition-all duration-300" style={{ left: '0', right: '0' }}>
      <div className="flex items-center justify-between h-16">
        {/* Logo area - sincronizada com sidebar */}
        <div className="bg-gradient-to-b from-teal-700 via-teal-800 to-teal-900 flex items-center justify-center border-r border-teal-600 transition-all duration-300" style={{ width: sidebarWidth, height: '64px' }}>
          {isCollapsed ? (
            <span className="text-white font-bold text-xl">C</span>
          ) : (
            <div className="text-center">
              <h1 className="text-sm font-bold text-white">CREESER</h1>
              <p className="text-xs text-teal-200">Educacional</p>
            </div>
          )}
        </div>
        
        {/* Conteúdo do header */}
        <div className="flex items-center justify-between flex-1 px-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CREESER Educacional</h1>
              <p className="text-sm text-gray-500 -mt-1">Painel de Administração</p>
            </div>
          </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{usuario?.nomeCompleto || usuario?.nome}</span>
          <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Administrador</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            Sair
          </button>
        </div>
        </div>
      </div>
    </header>
  );
}
