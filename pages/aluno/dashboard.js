import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function AlunoDashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    console.log('[ALUNO_DASHBOARD] Verificando localStorage...');
    
    const usu = localStorage.getItem("usuario");
    console.log('[ALUNO_DASHBOARD] Usuario encontrado:', !!usu);

    if (!usu) {
      console.log('[ALUNO_DASHBOARD] Nenhum usuario encontrado, redirecionando para login');
      router.push("/login");
      return;
    }

    try {
      const usuarioObj = JSON.parse(usu);
      console.log('[ALUNO_DASHBOARD] Usuario parseado:', { 
        email: usuarioObj.email,
        tipo: usuarioObj.tipo 
      });
      
      // Validar que é aluno
      if (usuarioObj.tipo !== "aluno") {
        console.warn('[ALUNO_DASHBOARD] Usuário não é aluno (tipo: ' + usuarioObj.tipo + '), redirecionando...');
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
      console.error('[ALUNO_DASHBOARD] Erro ao parsear usuário:', e);
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

  const nomeExibicao = usuario?.nomecompleto || usuario?.nomeCompleto || usuario?.nome || '';

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
          <a href="/aluno/home" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-teal-600 transition text-sm cursor-pointer font-semibold">
            <span className="text-lg flex-shrink-0">🏠</span>
            <span>Início</span>
          </a>
          <a href="#dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-teal-600 text-white transition text-sm cursor-pointer font-semibold">
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
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Bem-vindo ao Módulo EAD</h2>
              <p className="text-sm text-gray-500 mt-1">CREESER Educacional</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Conectado como</p>
                <p className="font-semibold text-gray-800">{nomeExibicao}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">ALUNO</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                {nomeExibicao.charAt(0).toUpperCase()}
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
            <h1 className="text-3xl font-bold mb-6 text-teal-700">📚 Módulo EAD</h1>
            
            {/* Cards de Cursos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {carregando ? (
                <div className="text-center col-span-full py-8 text-gray-500">Carregando cursos...</div>
              ) : cursos.length === 0 ? (
                <div className="text-center col-span-full py-12 bg-white rounded-lg">
                  <p className="text-gray-500 text-lg">Nenhum curso disponível</p>
                </div>
              ) : (
                cursos.map((curso, index) => (
                  <div key={curso.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition cursor-pointer flex flex-col h-full" onClick={() => router.push(`/assistir/${curso.id}`)}>
                    <h3 className="text-lg font-bold text-teal-700 mb-2">📖 {curso.titulo}</h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow whitespace-pre-wrap break-words">
                      {limparHTML(curso.descricao)}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-teal-600 h-2 rounded-full" style={{width: `${[65, 40, 0][index % 3]}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{[65, 40, 0][index % 3]}% completo</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/assistir/${curso.id}`);
                      }}
                      className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition text-sm font-medium"
                    >
                      Acessar Sala
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Seção Principal */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Bem-vindo ao Módulo EAD</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  O módulo de <strong>Educação a Distância (EAD)</strong> do CREESER oferece uma plataforma 
                  completa para ensino online, com recursos modernos e acessíveis.
                </p>
                <p>
                  Nesta interface você pode:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>📹 Acessar videoaulas gravadas e ao vivo</li>
                  <li>📚 Baixar materiais didáticos e apostilas</li>
                  <li>✅ Realizar avaliações e atividades</li>
                  <li>💬 Participar de fóruns de discussão</li>
                  <li>📊 Acompanhar seu progresso e desempenho</li>
                </ul>
                <p className="mt-4 p-4 bg-teal-50 rounded border-l-4 border-teal-600">
                  <strong>Dica:</strong> Seu progresso é sincronizado com sua conta CREESER.
                </p>
              </div>
            </div>

            {/* Seção de Estatísticas */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Seu Desempenho</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">{cursos.length}</div>
                  <p className="text-gray-600 mt-2">Cursos Disponíveis</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">1</div>
                  <p className="text-gray-600 mt-2">Cursos Concluídos</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">52%</div>
                  <p className="text-gray-600 mt-2">Taxa de Conclusão Média</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">8.5</div>
                  <p className="text-gray-600 mt-2">Média Geral</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
