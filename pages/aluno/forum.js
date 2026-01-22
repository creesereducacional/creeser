import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Forum from "@/components/Forum";

export default function AlunoForumPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
      router.push("/login");
      return;
    }

    try {
      const u = JSON.parse(usuarioStr);
      if (u.tipo !== "aluno") {
        if (u.tipo === "admin") {
          router.push("/admin/dashboard");
        } else if (u.tipo === "professor") {
          router.push("/professor/dashboard");
        } else {
          router.push("/login");
        }
        return;
      }
      setUsuario(u);
    } catch (e) {
      console.error("Erro ao parsear usuário:", e);
      router.push("/login");
    }
  }, [router]);

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

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-teal-700 to-teal-800 text-white shadow-lg fixed h-full left-0 top-0 overflow-y-auto z-50">
        
        {/* Logo */}
        <div className="p-6 border-b border-teal-600 flex items-center justify-center min-h-20">
          <div className="text-center">
            <h1 className="text-xl font-bold">CREESER</h1>
            <p className="text-xs text-teal-200">Educacional</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="py-6 px-3 space-y-2">
          <a href="/aluno/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-teal-600 transition text-sm cursor-pointer font-semibold">
            <span className="text-lg flex-shrink-0">📚</span>
            <span>Meus Cursos</span>
          </a>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">📝</span>
            <span>Atividades</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">📊</span>
            <span>Desempenho</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
          <a href="/aluno/forum" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-teal-600 text-white transition text-sm cursor-pointer font-semibold">
            <span className="text-lg flex-shrink-0">💬</span>
            <span>Fórum</span>
          </a>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">📚</span>
            <span>Biblioteca</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Fórum de Discussão</h2>
              <p className="text-sm text-gray-500 mt-1">Participe das discussões da comunidade</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Conectado como</p>
                <p className="font-semibold text-gray-800">{usuario?.nomeCompleto || usuario?.nome}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">ALUNO</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                {usuario?.nomeCompleto?.charAt(0).toUpperCase() || usuario?.nome?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Forum usuario={usuario} />
          </div>
        </main>
      </div>
    </div>
  );
}
