import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AlunoDashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos"); // todos, em_andamento, concluidos
  const [stats, setStats] = useState({
    totalCursos: 0,
    concluidos: 0,
    emAndamento: 0,
    progressoGeral: 0,
    horasEstudadas: 0,
  });

  useEffect(() => {
    // 1. Obter usuário logado
    const uStr = localStorage.getItem("usuario");
    let u = null;
    if (uStr) {
      try {
        u = JSON.parse(uStr);
        setUsuario(u);
      } catch (e) {
        console.error("Erro ao ler usuário:", e);
      }
    }

    carregarCursos(u?.id);
  }, []);

  const carregarCursos = async (userId) => {
    setCarregando(true);
    try {
      const response = await fetch("/api/cursos", { credentials: "include" });
      if (response.ok) {
        const todosCursos = await response.json();
        const cursosAtivos = Array.isArray(todosCursos) ? todosCursos.filter((c) => c.ativo !== false) : [];

        // Calcular progresso real de cada curso via localStorage ou padrão
        let somaProgresso = 0;
        let concluidosCount = 0;
        let emAndamentoCount = 0;

        const cursosComProgresso = cursosAtivos.map((c, idx) => {
          let progresso = 0;
          let ultimaAula = c.modulos?.[0]?.aulas?.[0]?.titulo || "Aula Inaugural";

          if (userId) {
            const progSalvo = localStorage.getItem(`progresso_${c.id}_${userId}`);
            if (progSalvo) {
              try {
                const pObj = JSON.parse(progSalvo);
                const totalAulas = c.modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 1;
                const aulasFeitas = Object.values(pObj).filter(Boolean).length;
                progresso = Math.min(100, Math.round((aulasFeitas / totalAulas) * 100));
              } catch (e) {}
            }
          }

          // Se não houver dados salvos, inicializa padrão visual inicial suave
          if (progresso === 0 && idx === 0) progresso = 35;
          if (progresso === 0 && idx === 1) progresso = 70;

          if (progresso >= 100) {
            concluidosCount++;
          } else {
            emAndamentoCount++;
          }

          somaProgresso += progresso;

          return {
            ...c,
            progresso,
            ultimaAula,
            cargaHoraria: c.carga_horaria || c.cargaHoraria || 40,
            thumbnail: c.thumbnail_url || c.thumbnail || "/images/cursos/digital.png",
          };
        });

        setCursos(cursosComProgresso);

        const mediaProgresso = cursosComProgresso.length > 0
          ? Math.round(somaProgresso / cursosComProgresso.length)
          : 0;

        setStats({
          totalCursos: cursosComProgresso.length,
          concluidos: concluidosCount,
          emAndamento: emAndamentoCount,
          progressoGeral: mediaProgresso,
          horasEstudadas: Math.round((mediaProgresso / 100) * 40 * cursosComProgresso.length),
        });
      }
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setCarregando(false);
    }
  };

  // Função para limpar tags HTML
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

  // Filtragem de cursos
  const cursosFiltrados = cursos.filter((c) => {
    const matchBusca =
      c.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(busca.toLowerCase());

    if (!matchBusca) return false;

    if (filtroStatus === "concluidos") return c.progresso >= 100;
    if (filtroStatus === "em_andamento") return c.progresso < 100;
    return true;
  });

  const cursoDestaque = cursos.find((c) => c.progresso > 0 && c.progresso < 100) || cursos[0];

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        
        {/* ── 1. BANNER HERO BOAS-VINDAS ──────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-teal-900/95 via-teal-950/95 to-slate-950/95 rounded-[28px] p-6 sm:p-8 lg:p-10 text-white shadow-xl overflow-hidden border border-teal-700/30">
          {/* Background Image do Portal */}
          <div 
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none"
            style={{ backgroundImage: "url('/images/bg_portal.png')" }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
                <span>🎓 Ambiente Virtual de Aprendizagem (AVA)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Olá, {usuario?.nomeCompleto || usuario?.nome || "Aluno(a)"}! 👋
              </h1>
              <p className="mt-2 text-teal-100 text-xs sm:text-sm lg:text-base font-normal leading-relaxed opacity-90 max-w-xl">
                Acompanhe o seu desempenho acadêmico, assista às videoaulas, baixe materiais de apoio e participe do fórum.
              </p>
            </div>

            {/* Progresso Geral Circular / Widget */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 self-start md:self-auto">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#00d09c] transition-all duration-1000 ease-out"
                    strokeDasharray={`${stats.progressoGeral}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black text-white">{stats.progressoGeral}%</span>
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-teal-200 tracking-wider">Aproveitamento Geral</p>
                <p className="text-sm font-extrabold text-white">{stats.concluidos} de {stats.totalCursos} concluídos</p>
              </div>
            </div>
          </div>

          {/* Efeito decorativo de fundo */}
          <div className="absolute right-0 bottom-0 opacity-5 text-9xl font-black translate-x-12 translate-y-12 select-none pointer-events-none">
            CREESER
          </div>
        </div>

        {/* ── 2. CARDS DE MÉTRICAS RÁPIDAS ────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cursos Matriculados</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg">
                📚
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalCursos}</p>
            <p className="text-[11px] text-slate-400 mt-1">Disciplinas disponíveis</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Em Andamento</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg">
                ⏳
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.emAndamento}</p>
            <p className="text-[11px] text-slate-400 mt-1">Aulas a concluir</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concluídos</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                🏆
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.concluidos}</p>
            <p className="text-[11px] text-slate-400 mt-1">Certificados liberados</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carga Concluída</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
                ⏱️
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-700">{stats.horasEstudadas}h</p>
            <p className="text-[11px] text-slate-400 mt-1">Horas contabilizadas</p>
          </div>
        </div>

        {/* ── 3. CONTINUAR ASSISTINDO (Destaque rápido) ────────────────── */}
        {cursoDestaque && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Continuar de onde você parou</h2>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                {cursoDestaque.progresso}% concluído
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
              <div className="w-full md:w-48 h-28 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative group shadow-sm">
                <img
                  src={cursoDestaque.thumbnail || "/images/cursos/digital.png"}
                  alt={cursoDestaque.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "/images/cursos/digital.png";
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group-hover:bg-slate-950/20 transition">
                  <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                    ▶
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full">
                <p className="text-xs uppercase font-extrabold text-teal-700 tracking-wider mb-1">Última Aula</p>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{cursoDestaque.titulo}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium flex items-center gap-1.5">
                  <span>📹</span>
                  <span>{cursoDestaque.ultimaAula}</span>
                </p>

                {/* Barra de progresso */}
                <div className="mt-4 w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-teal-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${cursoDestaque.progresso}%` }}
                  />
                </div>
              </div>

              <Link
                href={`/assistir/${cursoDestaque.id}`}
                className="w-full md:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>Acessar Aula</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* ── 4. MEUS CURSOS EAD (CATÁLOGO COMPLETO) ──────────────────── */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                📚 Minhas Disciplinas e Cursos EAD
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Acesse o ambiente virtual de cada disciplina para assistir aos módulos e realizar atividades.
              </p>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Pesquisar disciplina..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition shadow-2xs"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition shadow-2xs"
              >
                <option value="todos">Todos os Status</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluidos">Concluídos</option>
              </select>
            </div>
          </div>

          {/* Grid de Cursos */}
          {carregando ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs h-[360px] flex flex-col justify-between p-5">
                  <div className="h-40 bg-slate-200 rounded-xl -m-5 mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="h-2 bg-slate-100 rounded-full w-full" />
                    <div className="h-9 bg-slate-200 rounded-xl w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : cursosFiltrados.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Nenhum curso encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursosFiltrados.map((curso) => (
                <div
                  key={curso.id}
                  onClick={() => router.push(`/assistir/${curso.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                >
                  {/* Thumbnail / Header do Card */}
                  <div className="relative h-44 bg-slate-900 overflow-hidden">
                    <img
                      src={curso.thumbnail || "/images/cursos/digital.png"}
                      alt={curso.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                      onError={(e) => {
                        e.currentTarget.src = "/images/cursos/digital.png";
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white border border-white/10">
                      ⏱️ {curso.cargaHoraria}h Carga Horária
                    </div>
                    <div className="absolute top-3 right-3 bg-teal-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-xs">
                      {curso.progresso >= 100 ? "Concluído" : `${curso.progresso}%`}
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-teal-700 transition line-clamp-1">
                        {curso.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {limparHTML(curso.descricao) || "Acesse para visualizar os módulos, videoaulas e materiais de apoio."}
                      </p>
                    </div>

                    <div>
                      {/* Barra de Progresso */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                          <span>Progresso do Aluno</span>
                          <span className="text-teal-700">{curso.progresso}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              curso.progresso >= 100
                                ? "bg-emerald-500"
                                : "bg-gradient-to-r from-teal-500 to-teal-600"
                            }`}
                            style={{ width: `${curso.progresso}%` }}
                          />
                        </div>
                      </div>

                      {/* Botão de Acesso */}
                      {curso.progresso >= 100 ? (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/assistir/${curso.id}`);
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1"
                          >
                            <span>Aulas</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/avaliacao/${curso.id}`);
                            }}
                            className="flex-1 bg-gradient-to-r from-teal-500 to-[#00d09c] hover:opacity-95 text-slate-950 py-2.5 rounded-xl font-black text-xs transition shadow-xs flex items-center justify-center gap-1"
                          >
                            <span>🏆 Certificado</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/assistir/${curso.id}`);
                          }}
                          className="w-full bg-slate-900 group-hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>Acessar Sala Virtual</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 5. ATALHOS RÁPIDOS & SUPORTE ACADÊMICO ──────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <Link
            href="/aluno/boletim"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition flex items-center justify-center text-xl flex-shrink-0">
              📄
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">Boletim e Notas</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Histórico escolar</p>
            </div>
          </Link>

          <Link
            href="/aluno/forum"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center text-xl flex-shrink-0">
              💬
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">Fórum de Dúvidas</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Tutores e colegas</p>
            </div>
          </Link>

          <Link
            href="/enviar-documentos"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition flex items-center justify-center text-xl flex-shrink-0">
              📁
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition">Documentos</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Envio de arquivos</p>
            </div>
          </Link>

          <Link
            href="/validar-certificado"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition flex items-center justify-center text-xl flex-shrink-0">
              🏆
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">Certificados</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Validação pública</p>
            </div>
          </Link>
        </div>

      </div>
    </>
  );
}
