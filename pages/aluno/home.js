import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import PortalLayout from "@/components/portal/PortalLayout";

export default function AlunoHome() {
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [stats, setStats] = useState({
    cursosInscritos: 0,
    cursosConcluidos: 0,
    horasEstudadas: 42.5,
    taxaConclusao: 52,
  });

  useEffect(() => {
    carregarCursos();
  }, []);

  const carregarCursos = async () => {
    setCarregando(true);
    try {
      const response = await fetch("/api/cursos", { credentials: "include" });
      if (response.ok) {
        const todosCursos = await response.json();
        const cursosAtivos = Array.isArray(todosCursos) ? todosCursos.filter((c) => c.ativo !== false) : [];
        setCursos(cursosAtivos);

        setStats((prev) => ({
          ...prev,
          cursosInscritos: cursosAtivos.length,
          cursosConcluidos: Math.floor(cursosAtivos.length * 0.33),
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setCarregando(false);
    }
  };

  // Função para limpar HTML e extrair apenas texto com quebras de linha
  const limparHTML = (html) => {
    if (!html) return "";
    let texto = html.replace(/<\/div>/g, "\n");
    texto = texto.replace(/<[^>]*>/g, "");
    texto = texto.replace(/&nbsp;/g, " ");
    texto = texto.replace(/&amp;/g, "&");
    texto = texto.replace(/&lt;/g, "<");
    texto = texto.replace(/&gt;/g, ">");
    texto = texto.replace(/&quot;/g, '"');
    texto = texto.replace(/&#39;/g, "'");
    return texto
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean)
      .join("\n");
  };

  const cursosContinuar = cursos.slice(0, 3);

  return (
    <PortalLayout title="Início — Meus Cursos" tipoRequerido="aluno">
      <div className="space-y-8">
        {/* Banner de Boas-Vindas */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Bem-vindo ao Portal Acadêmico! 🎓
            </h2>
            <p className="text-teal-100 text-sm sm:text-base leading-relaxed opacity-90">
              Acompanhe seu progresso, acesse suas videoaulas e continue aprendendo no CREESER Educacional.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 text-9xl font-black translate-x-8 translate-y-8 select-none pointer-events-none">
            CREESER
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cursos Inscritos</span>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-3xl font-black text-teal-700">{stats.cursosInscritos}</p>
            <p className="text-xs text-gray-400 mt-1">Total disponível</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cursos Concluídos</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-black text-emerald-600">{stats.cursosConcluidos}</p>
            <p className="text-xs text-gray-400 mt-1">Parabéns pelo avanço!</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Horas Estudadas</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <p className="text-3xl font-black text-blue-600">{stats.horasEstudadas}h</p>
            <p className="text-xs text-gray-400 mt-1">Nesta semana</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Taxa Conclusão</span>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-black text-purple-600">{stats.taxaConclusao}%</p>
            <p className="text-xs text-gray-400 mt-1">Média geral</p>
          </div>
        </div>

        {/* Continue Aprendendo */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Continue Aprendendo</h3>
              <p className="text-xs text-gray-500">Retome seus cursos e aulas em andamento</p>
            </div>
            <Link href="/aluno/dashboard" className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg transition">
              Ver Todos →
            </Link>
          </div>

          {carregando ? (
            <div className="py-12 text-center text-gray-400 text-sm">Carregando cursos...</div>
          ) : cursosContinuar.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
              Nenhum curso disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cursosContinuar.map((curso) => (
                <div
                  key={curso.id}
                  onClick={() => router.push(`/assistir/${curso.id}`)}
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col group"
                >
                  <div className="h-32 bg-gradient-to-br from-teal-600 to-slate-800 flex items-center justify-center text-white text-3xl font-black">
                    🎓
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base mb-1.5 group-hover:text-teal-700 transition line-clamp-1">
                        {curso.titulo}
                      </h4>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                        {limparHTML(curso.descricao) || "Sem descrição disponível"}
                      </p>
                    </div>

                    <div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full w-2/3" />
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500">
                        <span>Em andamento</span>
                        <span className="text-teal-700 font-bold group-hover:underline">Continuar →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

