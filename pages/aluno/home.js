import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import PortalLayout from "@/components/portal/PortalLayout";

export default function AlunoHome() {
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [stats, setStats] = useState({
    cursosInscritos: 0,
    cursosConcluidos: 0,
    horasEstudadas: 40,
    taxaConclusao: 65,
  });

  useEffect(() => {
    const uStr = localStorage.getItem("usuario");
    if (uStr) {
      try {
        setUsuario(JSON.parse(uStr));
      } catch (e) {}
    }
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
          cursosConcluidos: Math.floor(cursosAtivos.length * 0.4),
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setCarregando(false);
    }
  };

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
    return texto.trim();
  };

  const cursosContinuar = cursos.slice(0, 3);

  return (
    <PortalLayout title="Início — Meus Cursos" tipoRequerido="aluno">
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        
        {/* Banner de Boas-Vindas */}
        <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 rounded-[28px] p-6 sm:p-8 lg:p-10 text-white shadow-xl relative overflow-hidden border border-teal-700/30">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold uppercase tracking-wider mb-3">
              <span>🎓 Portal Acadêmico CREESER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-2">
              Bem-vindo, {usuario?.nomeCompleto || usuario?.nome || "Aluno(a)"}! 👋
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm lg:text-base leading-relaxed opacity-90">
              Acompanhe seu progresso, acesse suas videoaulas e continue aprendendo no Ambiente Virtual de Aprendizagem do CREESER.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 text-9xl font-black translate-x-10 translate-y-10 select-none pointer-events-none">
            CREESER
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cursos Inscritos</span>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-3xl font-black text-teal-700">{stats.cursosInscritos}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total disponível</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concluídos</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-black text-emerald-600">{stats.cursosConcluidos}</p>
            <p className="text-[11px] text-slate-400 mt-1">Parabéns pelo avanço!</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carga Horária</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <p className="text-3xl font-black text-blue-600">{stats.horasEstudadas}h</p>
            <p className="text-[11px] text-slate-400 mt-1">Horas contabilizadas</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa de Conclusão</span>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-black text-purple-600">{stats.taxaConclusao}%</p>
            <p className="text-[11px] text-slate-400 mt-1">Média geral</p>
          </div>
        </div>

        {/* Continue Aprendendo */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Continue Aprendendo</h3>
              <p className="text-xs text-slate-500">Retome seus cursos e aulas em andamento</p>
            </div>
            <Link
              href="/aluno/dashboard"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <span>Ver Todos os Cursos</span>
              <span>→</span>
            </Link>
          </div>

          {carregando ? (
            <div className="py-12 text-center text-slate-400 text-sm">Carregando cursos...</div>
          ) : cursosContinuar.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Nenhum curso disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cursosContinuar.map((curso, idx) => (
                <div
                  key={curso.id}
                  onClick={() => router.push(`/assistir/${curso.id}`)}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col group"
                >
                  <div className="h-36 bg-slate-900 overflow-hidden relative">
                    <img
                      src={curso.thumbnail_url || curso.thumbnail || "/images/cursos/digital.png"}
                      alt={curso.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
                      onError={(e) => {
                        e.currentTarget.src = "/images/cursos/digital.png";
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-teal-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {idx === 0 ? "70%" : idx === 1 ? "40%" : "20%"}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-teal-700 transition line-clamp-1">
                        {curso.titulo}
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                        {limparHTML(curso.descricao) || "Sem descrição disponível"}
                      </p>
                    </div>

                    <div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full"
                          style={{ width: idx === 0 ? "70%" : idx === 1 ? "40%" : "20%" }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Em andamento</span>
                        <span className="text-teal-700 font-bold group-hover:underline">Acessar Sala Virtual →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atalhos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <Link
            href="/aluno/boletim"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition flex items-center justify-center text-2xl flex-shrink-0">
              📄
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">Meu Boletim e Notas</h4>
              <p className="text-xs text-slate-500 mt-0.5">Consulte suas notas e faltas</p>
            </div>
          </Link>

          <Link
            href="/aluno/forum"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center text-2xl flex-shrink-0">
              💬
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">Fórum de Dúvidas</h4>
              <p className="text-xs text-slate-500 mt-0.5">Interaja com professores e colegas</p>
            </div>
          </Link>

          <Link
            href="/enviar-documentos"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition flex items-center justify-center text-2xl flex-shrink-0">
              📁
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition">Envio de Documentos</h4>
              <p className="text-xs text-slate-500 mt-0.5">Envie seus comprovantes e atividades</p>
            </div>
          </Link>
        </div>

      </div>
    </PortalLayout>
  );
}
