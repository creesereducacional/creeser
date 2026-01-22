import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function AlunoHome() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [stats, setStats] = useState({
    cursosInscritos: 0,
    cursosConcluidos: 0,
    horasEstudadas: 42.5,
    taxaConclusao: 52
  });

  useEffect(() => {
    console.log('[ALUNO_HOME] Verificando localStorage...');
    
    const usu = localStorage.getItem("usuario");
    console.log('[ALUNO_HOME] Usuario encontrado:', !!usu);

    if (!usu) {
      console.log('[ALUNO_HOME] Nenhum usuario encontrado, redirecionando para login');
      router.push("/login");
      return;
    }

    try {
      const usuarioObj = JSON.parse(usu);
      console.log('[ALUNO_HOME] Usuario parseado:', { 
        email: usuarioObj.email,
        tipo: usuarioObj.tipo 
      });
      
      // Validar que é aluno
      if (usuarioObj.tipo !== "aluno") {
        console.warn('[ALUNO_HOME] Usuário não é aluno (tipo: ' + usuarioObj.tipo + '), redirecionando...');
        if (usuarioObj.tipo === "admin") {
          router.push("/admin/dashboard");
        } else if (usuarioObj.tipo === "professor") {
          router.push("/professor/dashboard");
        } else {
          router.push("/login");
        }
        return;
      }
      
      setUsuario(usuarioObj);
      carregarCursos();
    } catch (e) {
      console.error('[ALUNO_HOME] Erro ao parsear usuário:', e);
      router.push("/login");
    }
  }, [router]);

  const carregarCursos = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/cursos');
      const todosCursos = await response.json();
      
      // Filtrar apenas cursos ativos
      const cursosAtivos = todosCursos.filter(c => c.ativo !== false);
      setCursos(cursosAtivos);

      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        cursosInscritos: cursosAtivos.length,
        cursosConcluidos: Math.floor(cursosAtivos.length * 0.33)
      }));
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    }
    setCarregando(false);
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

  // Função para limpar HTML e extrair apenas texto com quebras de linha
  const limparHTML = (html) => {
    if (!html) return '';
    // Substitui </div> por quebra de linha para preservar separação
    let texto = html.replace(/<\/div>/g, '\n');
    // Remove todas as tags HTML
    texto = texto.replace(/<[^>]*>/g, '');
    // Decodifica entidades HTML
    texto = texto.replace(/&nbsp;/g, ' ');
    texto = texto.replace(/&amp;/g, '&');
    texto = texto.replace(/&lt;/g, '<');
    texto = texto.replace(/&gt;/g, '>');
    texto = texto.replace(/&quot;/g, '"');
    texto = texto.replace(/&#39;/g, "'");
    // Remove espaços extras mas mantém quebras de linha
    texto = texto.split('\n').map(linha => linha.trim()).filter(linha => linha).join('\n');
    return texto;
  };

  const cursosContinuar = cursos.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
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
          <a href="/aluno/home" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-teal-600 text-white transition text-sm cursor-pointer font-semibold">
            <span className="text-lg flex-shrink-0">🏠</span>
            <span>Início</span>
          </a>
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
          <a href="/aluno/forum" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-teal-600 transition text-sm cursor-pointer font-semibold">
            <span className="text-lg flex-shrink-0">💬</span>
            <span>Fórum</span>
          </a>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 opacity-50 cursor-not-allowed text-sm">
            <span className="text-lg flex-shrink-0">📚</span>
            <span>Biblioteca</span>
            <span className="text-xs ml-auto">Em breve</span>
          </div>
        </nav>
        {/* User Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-600 bg-teal-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-teal-900 font-bold text-sm">
              {usuario?.nomeCompleto?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{usuario?.nomeCompleto}</p>
              <p className="text-xs text-teal-200 truncate">{usuario?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Bem-vindo a Faculdade CREESER Educacional</h2>
              <p className="text-sm text-gray-500 mt-1">Acompanhe seu progresso e continue aprendendo</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Conectado como</p>
                <p className="font-semibold text-gray-800">{usuario?.nomeCompleto}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Aluno</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                {usuario?.nomeCompleto?.charAt(0).toUpperCase()}
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
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Cursos Inscritos</p>
                    <p className="text-3xl font-bold text-teal-600 mt-2">{stats.cursosInscritos}</p>
                  </div>
                  <div className="text-3xl">📚</div>
                </div>
                <p className="text-xs text-gray-500">Total de cursos disponíveis</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Cursos Concluídos</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.cursosConcluidos}</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
                <p className="text-xs text-gray-500">Parabéns pelos avanços!</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Horas Estudadas</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.horasEstudadas}</p>
                  </div>
                  <div className="text-3xl">⏱️</div>
                </div>
                <p className="text-xs text-gray-500">Esta semana</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Taxa de Conclusão</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.taxaConclusao}%</p>
                  </div>
                  <div className="text-3xl">📈</div>
                </div>
                <p className="text-xs text-gray-500">Média dos cursos</p>
              </div>
            </div>

            {/* Continue Learning Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Continue Aprendendo</h3>
                  <p className="text-sm text-gray-500 mt-1">Retome seus cursos em progresso</p>
                </div>
                <a href="/aluno/dashboard" className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
                  Ver Todos →
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {carregando ? (
                  <div className="text-center col-span-full py-8 text-gray-500">Carregando cursos...</div>
                ) : cursosContinuar.length === 0 ? (
                  <div className="text-center col-span-full py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">Nenhum curso disponível</p>
                  </div>
                ) : (
                  cursosContinuar.map(curso => (
                    <div key={curso.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => router.push(`/assistir/${curso.id}`)}>
                      <div className="h-32 bg-gradient-to-r from-teal-500 to-teal-700"></div>
                      <div className="p-5 flex flex-col h-full">
                        <h4 className="font-bold text-gray-900 mb-2">{curso.titulo}</h4>
                        <p className="text-sm text-gray-600 mb-4 flex-grow whitespace-pre-wrap break-words">
                          {limparHTML(curso.descricao)}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div className="bg-teal-600 h-2 rounded-full" style={{width: '65%'}}></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>65% completo</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/assistir/${curso.id}`);
                            }}
                            className="text-teal-600 hover:text-teal-700 font-semibold"
                          >
                            Continuar →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Classes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-4">📅 Próximas Aulas</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="text-2xl">🎓</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">React Avançado</p>
                      <p className="text-xs text-gray-500">Hoje às 19:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl">💻</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">Node.js</p>
                      <p className="text-xs text-gray-500">Amanhã às 20:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-4">ℹ️ Informações Importantes</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm">
                    <p className="font-semibold text-gray-900">📢 Aviso</p>
                    <p className="text-gray-700 mt-1">Não esqueça de responder a pesquisa de satisfação!</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                    <p className="font-semibold text-gray-900">🎉 Conquista!</p>
                    <p className="text-gray-700 mt-1">Você completou 1 curso este mês!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
