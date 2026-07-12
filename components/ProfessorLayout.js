import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ProfessorLayout({ children, title = "Painel do Professor" }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usu = localStorage.getItem("usuario");
    if (!usu) {
      router.push("/login");
      return;
    }

    try {
      const usuarioObj = JSON.parse(usu);
      if (usuarioObj.tipo !== "professor") {
        router.push("/login");
        return;
      }
      setUsuario(usuarioObj);
    } catch (e) {
      console.error(e);
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-600 to-teal-800">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-bounce">⏳</div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: "Dashboard", href: "/professor/dashboard", icon: "📊" },
    { label: "Diário de Classe", href: "/professor/diario", icon: "📖" },
    { label: "Frequência (Chamada)", href: "/professor/frequencia", icon: "📋" },
    { label: "Lançar Notas", href: "/professor/notas", icon: "📝" },
    { label: "Meus Alunos", href: "/professor/alunos", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-teal-700 to-teal-800 text-white shadow-lg fixed h-full left-0 top-0 overflow-y-auto z-50">
        {/* Logo */}
        <div className="p-6 border-b border-teal-600 flex flex-col items-center justify-center min-h-20">
          <h1 className="text-xl font-bold">CREESER</h1>
          <p className="text-xs text-teal-200">Educacional</p>
        </div>

        {/* Menu Items */}
        <nav className="py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm cursor-pointer font-semibold ${
                  isActive ? 'bg-teal-600 text-white shadow-md' : 'text-teal-100 hover:bg-teal-600/30'
                }`}>
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{usuario?.nomeCompleto || usuario?.nome}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">PROFESSOR</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                {usuario?.nomeCompleto?.charAt(0).toUpperCase() || usuario?.nome?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic page contents */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
