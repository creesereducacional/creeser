import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ProfessorDashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    console.log('[PROFESSOR_DASHBOARD] Verificando localStorage...');
    
    const usu = localStorage.getItem("usuario");
    console.log('[PROFESSOR_DASHBOARD] Usuario encontrado:', !!usu);

    if (!usu) {
      console.log('[PROFESSOR_DASHBOARD] Nenhum usuario encontrado, redirecionando para login');
      router.push("/login");
      return;
    }

    try {
      const usuarioObj = JSON.parse(usu);
      console.log('[PROFESSOR_DASHBOARD] Usuario parseado:', { 
        email: usuarioObj.email,
        tipo: usuarioObj.tipo 
      });
      
      // Validar que é professor
      if (usuarioObj.tipo !== "professor") {
        console.warn('[PROFESSOR_DASHBOARD] Usuário não é professor (tipo: ' + usuarioObj.tipo + '), redirecionando...');
        if (usuarioObj.tipo === "admin") {
          router.push("/admin/dashboard");
        } else if (usuarioObj.tipo === "aluno") {
          router.push("/aluno/dashboard");
        } else {
          router.push("/login");
        }
        return;
      }
      
      setUsuario(usuarioObj);
      carregarCursos();
    } catch (e) {
      console.error('[PROFESSOR_DASHBOARD] Erro ao parsear usuário:', e);
      router.push("/login");
    }
  }, [router]);

  const carregarCursos = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/cursos');
      const todosCursos = await response.json();
      
      // Filtrar apenas cursos ativos para professores
      const cursosAtivos = todosCursos.filter(c => c.ativo !== false).map(curso => ({
        ...curso,
        alunos: Math.floor(Math.random() * 50) + 10,
        aulas: curso.modulos?.reduce((total, mod) => total + (mod.aulas?.length || 0), 0) || 0,
        status: "ativo"
      }));
      
      setCursos(cursosAtivos);
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    }
    setCarregando(false);
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    let text = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    
    text = text.replace(/([➢➤•])/g, '\n$1');
    
    return text;
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

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const totalAlunos = cursos.reduce((sum, c) => sum + c.alunos, 0);
  const totalAulas = cursos.reduce((sum, c) => sum + c.aulas, 0);
  const cursosAtivos = cursos.filter(c => c.status === "ativo").length;

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
          <a href="#dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-teal-600 text-white transition text-sm cursor-pointer font-semibold">
            <span className="text-lg flex-shrink-0">📊</span>
            <span>Dashboard</span>
          </a>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">📚</span>
            <span>Meus Cursos</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">👥</span>
            <span>Alunos</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">📝</span>
            <span>Aulas</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">📋</span>
            <span>Avaliações</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">💬</span>
            <span>Mensagens</span>
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
              <h2 className="text-2xl font-bold text-gray-800">Painel do Professor</h2>
              <p className="text-sm text-gray-500 mt-1">CREESER Educacional</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Conectado como</p>
                <p className="font-semibold text-gray-800">{usuario?.nomeCompleto || usuario?.nome}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">PROFESSOR</p>
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
            <h1 className="text-3xl font-bold mb-6 text-teal-700">📚 Meus Cursos</h1>
            
            {/* Cards de Cursos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {carregando ? (
                <div className="text-center col-span-full py-8 text-gray-500">Carregando...</div>
              ) : cursos.length === 0 ? (
                <div className="text-center col-span-full py-12 bg-white rounded-lg">
                  <p className="text-gray-500 text-lg">Você ainda não tem cursos atribuídos</p>
                </div>
              ) : (
                cursos.map(curso => (
                  <div key={curso.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
                    <h3 className="text-lg font-bold text-teal-700 mb-2">📖 {curso.titulo}</h3>
                    <p className="text-gray-600 text-sm mb-4">{stripHtmlTags(curso.descricao).substring(0, 100)}...</p>
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="bg-teal-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Alunos</p>
                        <p className="font-bold text-teal-700">{curso.alunos}</p>
                      </div>
                      <div className="bg-teal-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Aulas</p>
                        <p className="font-bold text-teal-700">{curso.aulas}</p>
                      </div>
                    </div>
                    <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded transition text-sm font-medium">
                      Visualizar
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Seção Principal */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Bem-vindo ao Painel de Professor</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  O painel de <strong>Professor</strong> do CREESER oferece uma plataforma 
                  completa para gerenciar seus cursos e alunos, com recursos modernos e acessíveis.
                </p>
                <p>
                  Nesta interface você pode:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>📚 Gerenciar seus cursos e turmas</li>
                  <li>👥 Acompanhar desempenho dos alunos</li>
                  <li>📝 Criar e corrigir avaliações</li>
                  <li>💬 Comunicar-se com alunos e colegas</li>
                  <li>📊 Visualizar relatórios e estatísticas</li>
                </ul>
                <p className="mt-4 p-4 bg-teal-50 rounded border-l-4 border-teal-600">
                  <strong>Dica:</strong> Toda sua atividade é sincronizada com sua conta CREESER.
                </p>
              </div>
            </div>

            {/* Seção de Estatísticas */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Suas Estatísticas</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">{cursos.length}</div>
                  <p className="text-gray-600 mt-2">Cursos Atribuídos</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">{cursosAtivos}</div>
                  <p className="text-gray-600 mt-2">Cursos Ativos</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">{totalAlunos}</div>
                  <p className="text-gray-600 mt-2">Total de Alunos</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">{totalAulas}</div>
                  <p className="text-gray-600 mt-2">Total de Aulas</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
