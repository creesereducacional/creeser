import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ProfessorLayout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    // Carregar usuário do localStorage
    const usuarioStorage = localStorage.getItem('usuario');
    console.log('[ProfessorLayout] Verificando usuario no localStorage:', { usuarioStorage: !!usuarioStorage });
    
    if (usuarioStorage) {
      try {
        const usuarioObj = JSON.parse(usuarioStorage);
        console.log('[ProfessorLayout] Usuario parseado com sucesso:', { 
          email: usuarioObj.email,
          tipo: usuarioObj.tipo 
        });
        setUser(usuarioObj);
      } catch (e) {
        console.error('[ProfessorLayout] Erro ao parsear usuário:', e);
      }
    } else {
      console.log('[ProfessorLayout] Nenhum usuario encontrado no localStorage');
    }
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      console.log('[ProfessorLayout] Usuario nao definido, redirecionando para login após 100ms');
      // Pequeno delay para evitar conflitos de navegação
      const timer = setTimeout(() => {
        console.log('[ProfessorLayout] Executando redirect para /login');
        router.push('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  // Menu específico para professor
  const menuItems = [
    { id: 'dashboard', nome: 'Dashboard', icon: '📊', url: '/professor/dashboard', em_breve: false },
    { id: 'cursos', nome: 'Meus Cursos', icon: '📚', url: '/professor/cursos', em_breve: true },
    { id: 'alunos', nome: 'Alunos', icon: '👥', url: '/professor/alunos', em_breve: true },
    { id: 'aulas', nome: 'Aulas', icon: '📝', url: '/professor/aulas', em_breve: true },
    { id: 'avaliacoes', nome: 'Avaliações', icon: '📋', url: '/professor/avaliacoes', em_breve: true },
    { id: 'messages', nome: 'Mensagens', icon: '💬', url: '/professor/mensagens', em_breve: true },
    { id: 'perfil', nome: 'Meu Perfil', icon: '👤', url: '/professor/perfil', em_breve: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-teal-700 to-teal-800 text-white shadow-lg transition-all duration-300 fixed h-full left-0 top-0 overflow-y-auto z-50`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-teal-600 flex items-center justify-center min-h-20">
          {sidebarOpen ? (
            <div className="text-center">
              <h1 className="text-xl font-bold">CREESER</h1>
              <p className="text-xs text-teal-200">Professor</p>
            </div>
          ) : (
            <div className="text-xl font-bold">C</div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.url}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    router.pathname === item.url
                      ? 'bg-teal-600 text-white'
                      : 'text-teal-100 hover:bg-teal-600'
                  } ${item.em_breve ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => item.em_breve && e.preventDefault()}
                  title={item.em_breve ? 'Em breve' : ''}
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{item.nome}</span>
                      {item.em_breve && <span className="text-xs bg-yellow-600 px-2 py-1 rounded">Em breve</span>}
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-teal-600">
          <div className="flex items-center justify-between mb-3">
            {sidebarOpen && (
              <div className="text-sm">
                <p className="font-semibold text-white truncate">{user.nomeCompleto || user.email}</p>
                <p className="text-xs text-teal-200">Professor</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            {sidebarOpen ? 'Sair' : '🚪'}
          </button>
        </div>

        {/* Toggle Sidebar Button */}
        <div className="p-4 border-t border-teal-600">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-teal-100 hover:text-white py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ☰
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Painel do Professor</h1>
          </div>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
