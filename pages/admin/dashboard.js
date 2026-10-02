import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SkeletonCard } from "@/components/ui/LoadingSkeleton";

export default function AdminDashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [podeAcessarFinanceiro, setPodeAcessarFinanceiro] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState("12");
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalCursos: 0,
    totalTopicos: 0,
    totalNoticias: 0,
    cursosAtivos: 0,
    alunosAtivos: 0,
    topicosPorCurso: [],
    cursosRecentes: [],
    atividadeRecente: [],
    evolucaoAlunos: [],
    distribuicaoCursos: [],
    ultimasMatriculas: [],
    comunicados: [],
    logsAtividades: [],
    alertasSistema: [],
    financeiro: null,
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(({ usuario: user }) => {
        const tipoUser = (user.tipo || "").toLowerCase();
        const perfilUser = (user.perfil || "").toLowerCase();

        // Redireciona perfis que não pertencem ao painel admin
        if (tipoUser === "aluno") {
          router.replace("/aluno/dashboard");
          return;
        }
        if (tipoUser === "professor") {
          router.replace("/professor/dashboard");
          return;
        }
        if (perfilUser === "comercial" || perfilUser === "comercial_master") {
          router.replace("/comercial/dashboard");
          return;
        }
        if (perfilUser === "financeiro" || perfilUser === "financeiro_admin") {
          router.replace("/admin-financeiro");
          return;
        }
        if (perfilUser === "recepcao" || tipoUser === "recepcao") {
          router.replace("/recepcao/dashboard");
          return;
        }

        const perfisAutorizadosFinanceiro = [
          "grupo_admin",
          "instituicao_admin",
          "admin",
          "financeiro",
          "financeiro_admin",
        ];
        const temAcessoFin = perfisAutorizadosFinanceiro.includes(perfilUser);
        setPodeAcessarFinanceiro(temAcessoFin);

        setUsuario(user);
        carregarEstatisticas(temAcessoFin);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const carregarEstatisticas = async (temAcessoFin) => {
    setCarregando(true);
    try {
      const fetchComTimeout = async (url, timeout = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          console.warn(`Timeout ou erro em ${url}:`, error);
          return null;
        }
      };

      const [
        alunosRes,
        professoresRes,
        cursosRes,
        forumRes,
        noticiasRes,
        turmasRes,
        logsRes,
        financeiroRes,
      ] = await Promise.allSettled([
        fetchComTimeout("/api/alunos", 8000),
        fetchComTimeout("/api/professores", 8000),
        fetchComTimeout("/api/cursos", 8000),
        fetchComTimeout("/api/forum", 8000),
        fetchComTimeout("/api/noticias", 8000),
        fetchComTimeout("/api/turmas", 8000),
        fetchComTimeout("/api/admin/logs?limit=5", 8000),
        temAcessoFin
          ? fetchComTimeout("/api/admin-financeiro/dashboard", 8000)
          : Promise.resolve(null),
      ]);

      const parseResponse = async (result) => {
        try {
          if (result.status === "fulfilled" && result.value && result.value.ok) {
            return await result.value.json();
          }
          return [];
        } catch (error) {
          return [];
        }
      };

      const parseFinanceiro = async (result) => {
        try {
          if (result.status === "fulfilled" && result.value && result.value.ok) {
            return await result.value.json();
          }
          return null;
        } catch (error) {
          return null;
        }
      };

      const alunos = await parseResponse(alunosRes);
      const professores = await parseResponse(professoresRes);
      const cursos = await parseResponse(cursosRes);
      const topicos = await parseResponse(forumRes);
      const noticias = await parseResponse(noticiasRes);
      const turmas = await parseResponse(turmasRes);
      const logsData = await parseResponse(logsRes);
      const financeiro = temAcessoFin ? await parseFinanceiro(financeiroRes) : null;

      const cursosAtivos = Array.isArray(cursos) ? cursos.filter((c) => c.ativo).length : 0;

      // Comunicados formatados
      const comunicados = (Array.isArray(noticias) ? noticias : [])
        .sort((a, b) => new Date(b.data_publicacao || b.created_at || 0) - new Date(a.data_publicacao || a.created_at || 0))
        .slice(0, 4)
        .map((n, idx) => ({
          id: n.id || idx,
          titulo: n.titulo || "Comunicado Acadêmico",
          resumo: n.resumo || n.conteudo || "Aviso institucional para o corpo discente e docente.",
          data: n.data_publicacao || n.created_at || new Date().toISOString(),
          categoria: n.categoria || "Geral",
        }));

      // Logs de Atividades Recentes
      const logsAtividades = (logsData?.logs || (Array.isArray(logsData) ? logsData : []))
        .slice(0, 5)
        .map((log, idx) => ({
          id: log.id || idx,
          data: log.created_at || new Date().toISOString(),
          usuario: log.usuario_email?.split("@")[0] || log.usuario_nome || "Sistema",
          acao: log.acao || "Atualização",
          detalhes: log.entidade ? `${log.acao || "Ação"} em ${log.entidade}` : log.detalhes || "Operação realizada com sucesso",
        }));

      // Evolução dos alunos nos últimos 12 meses
      const evolucaoAlunos = (() => {
        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const hoje = new Date();
        const ultimos12Meses = [];

        for (let i = 11; i >= 0; i--) {
          const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
          ultimos12Meses.push({
            ano: d.getFullYear(),
            mes: d.getMonth(),
            rotulo: `${mesesNomes[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,
            mesCurto: mesesNomes[d.getMonth()],
            total: 0,
          });
        }

        if (Array.isArray(alunos)) {
          alunos.forEach((aluno) => {
            const dataMatr = aluno.datamatricula || aluno.dataCriacao || aluno.createdAt;
            if (!dataMatr) return;
            const dt = new Date(dataMatr);
            if (isNaN(dt.getTime())) return;

            ultimos12Meses.forEach((m) => {
              if (dt.getFullYear() === m.ano && dt.getMonth() === m.mes) {
                m.total++;
              }
            });
          });
        }

        return ultimos12Meses;
      })();

      // Distribuição de alunos por curso
      const distribuicaoCursos = (() => {
        if (!Array.isArray(alunos) || !Array.isArray(cursos) || !alunos.length || !cursos.length) return [];
        const contagem = {};

        alunos.forEach((aluno) => {
          const cid = aluno.cursoid || aluno.cursoId;
          if (!cid) return;
          contagem[cid] = (contagem[cid] || 0) + 1;
        });

        const listaCursos = Object.keys(contagem)
          .map((cid) => {
            const curso = cursos.find((c) => String(c.id) === String(cid));
            return {
              titulo: curso ? curso.titulo : `Curso ID ${cid}`,
              total: contagem[cid],
            };
          })
          .sort((a, b) => b.total - a.total);

        const totalComCurso = listaCursos.reduce((sum, item) => sum + item.total, 0);

        return listaCursos.slice(0, 5).map((item) => ({
          ...item,
          percentual: totalComCurso > 0 ? Math.round((item.total / totalComCurso) * 100) : 0,
        }));
      })();

      setStats({
        totalAlunos: Array.isArray(alunos) ? alunos.length : 0,
        totalProfessores: Array.isArray(professores) ? professores.length : 0,
        totalCursos: Array.isArray(cursos) ? cursos.length : 0,
        totalTopicos: Array.isArray(topicos) ? topicos.length : 0,
        totalNoticias: Array.isArray(noticias) ? noticias.length : 0,
        cursosAtivos,
        alunosAtivos: Array.isArray(alunos) ? alunos.filter((a) => a.ativo !== false).length : 0,
        topicosPorCurso: [],
        cursosRecentes: [],
        atividadeRecente: [],
        evolucaoAlunos,
        distribuicaoCursos,
        ultimasMatriculas: [],
        comunicados,
        logsAtividades,
        alertasSistema: [],
        financeiro,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
    setCarregando(false);
  };

  const fmtValor = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  // Data formatada para o Card de Data do Hero
  const agora = new Date();
  const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const mesesNomesCompletos = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const diaSemanaTexto = diasSemana[agora.getDay()];
  const dataExtensoTexto = `${String(agora.getDate()).padStart(2, "0")} de ${mesesNomesCompletos[agora.getMonth()]} de ${agora.getFullYear()}`;
  const anoVigenteTexto = `${agora.getFullYear()}`;

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">Carregando painel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ── 1. HERO / CABEÇALHO DA DASHBOARD ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#EEF4FB] shadow-xs">
        {/* Background Image da Instituição (bg_dash.png) */}
        <div
          className="absolute inset-0 bg-cover bg-center sm:bg-right pointer-events-none"
          style={{
            backgroundImage: `url('/images/bg_dash.png')`
          }}
        />

        <div className="relative z-10 px-6 py-5 sm:px-8 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#1B3B6F] bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                Painel Administrativo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0B2545] tracking-tight">
              Visão geral do sistema
            </h1>
            <p className="text-xs sm:text-sm text-[#4B6282] mt-1 max-w-xl font-normal leading-relaxed">
              Acompanhe os principais indicadores da sua instituição em tempo real e tome decisões mais estratégicas.
            </p>
          </div>

          {/* Card de Data & Calendário Claro */}
          <div className="flex-shrink-0 bg-white border border-slate-200/80 rounded-xl p-3 sm:px-4 sm:py-3 shadow-sm flex items-center gap-3 self-start md:self-auto">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center text-lg flex-shrink-0 border border-sky-100/80">
              📅
            </div>
            <div className="text-left min-w-[150px]">
              <p className="text-[11px] font-semibold text-slate-500 capitalize leading-none">{diaSemanaTexto}</p>
              <p className="text-xs sm:text-sm font-extrabold text-[#0B2545] mt-1 leading-none">{dataExtensoTexto}</p>
              <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider mt-1 leading-none">
                Ano letivo {anoVigenteTexto} em andamento
              </p>
            </div>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="space-y-6">
          <SkeletonCard count={4} cols="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" />
        </div>
      ) : (
        <>
          {/* ── 2. KPI CARDS (Alunos, Professores, Cursos, Fórum) ──────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Alunos */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl border border-teal-100">
                  👥
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                  ↑ 12%
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Alunos</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">{stats.totalAlunos}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{stats.alunosAtivos} ativos no sistema</p>
              </div>
            </div>

            {/* Professores */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100">
                  🎓
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  Ativo
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Professores</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">{stats.totalProfessores}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Corpo docente cadastrado</p>
              </div>
            </div>

            {/* Cursos */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl border border-purple-100">
                  📚
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                  {stats.cursosAtivos} ativos
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Cursos</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">{stats.totalCursos}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{stats.cursosAtivos} cursos publicados/ativos</p>
              </div>
            </div>

            {/* Fórum */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl border border-amber-100">
                  💬
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  EAD
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Fórum</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">{stats.totalTopicos}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Discussões acadêmicas abertas</p>
              </div>
            </div>
          </div>

          {/* ── 3. RESUMO FINANCEIRO & ÚLTIMOS COMUNICADOS ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Resumo Financeiro (2 Colunas) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-sm font-bold">
                    💵
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Resumo Financeiro</h3>
                </div>
                <Link
                  href="/admin-financeiro"
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  Ver financeiro <span>→</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
                {/* Total Recebido */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Total Recebido</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">↑</span>
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1.5 truncate">
                    {stats.financeiro ? fmtValor(stats.financeiro.totalRecebido) : "R$ 0,00"}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1">↑ 8% este mês</span>
                </div>

                {/* A Receber */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">A Receber</span>
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">🕒</span>
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-sky-700 mt-1.5 truncate">
                    {stats.financeiro ? fmtValor(stats.financeiro.totalAReceber) : "R$ 0,00"}
                  </p>
                  <span className="text-[10px] text-sky-600 font-semibold mt-1">→ 0% em aberto</span>
                </div>

                {/* Valor em Atraso */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Valor em Atraso</span>
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px]">⚠️</span>
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-rose-700 mt-1.5 truncate">
                    {stats.financeiro ? fmtValor(stats.financeiro.valorVencido) : "R$ 0,00"}
                  </p>
                  <span className="text-[10px] text-rose-600 font-semibold mt-1">↓ 0% inadimplência</span>
                </div>

                {/* Taxa de Recebimento */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Taxa Recebimento</span>
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px]">📊</span>
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5 truncate">
                    {stats.financeiro ? `${stats.financeiro.taxaRecebimento || 0}%` : "0%"}
                  </p>
                  <span className="text-[10px] text-teal-700 font-semibold mt-1">↑ 2% média atual</span>
                </div>
              </div>
            </div>

            {/* Últimos Comunicados (1 Coluna) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm font-bold">
                    📢
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Últimos Comunicados</h3>
                </div>
                <Link
                  href="/admin/documentos"
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 transition"
                >
                  Ver todos →
                </Link>
              </div>

              <div className="space-y-3 mt-3">
                {stats.comunicados && stats.comunicados.length > 0 ? (
                  stats.comunicados.map((item, idx) => {
                    const cores = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];
                    const icones = ["👥", "📝", "⚙️", "🎓"];
                    const corPonto = cores[idx % cores.length];
                    const icone = icones[idx % icones.length];
                    return (
                      <div key={item.id || idx} className="flex items-start gap-3 group cursor-pointer">
                        <div className="relative mt-1">
                          <span className={`block w-2.5 h-2.5 rounded-full ${corPonto} ring-4 ring-slate-50`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-600 transition">
                              {item.titulo}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                              {new Date(item.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">{item.resumo}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">Nenhum comunicado recente cadastrado.</div>
                )}
              </div>
            </div>
          </div>

          {/* ── 4. GRÁFICOS (Evolução de Alunos & Alunos por Curso) ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Evolução Mensal de Alunos (3 Colunas) */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base text-teal-600 font-bold">📊</span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Evolução Mensal de Alunos</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Novas matrículas nos últimos 12 meses</p>
                </div>
                <select
                  value={periodoFiltro}
                  onChange={(e) => setPeriodoFiltro(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 self-start sm:self-auto cursor-pointer"
                >
                  <option value="12">Últimos 12 meses</option>
                  <option value="6">Últimos 6 meses</option>
                  <option value="3">Últimos 3 meses</option>
                </select>
              </div>

              {/* Grid de Barras */}
              <div className="h-[220px] flex items-end justify-between gap-2 sm:gap-3 px-2 pt-6 relative">
                {stats.evolucaoAlunos.map((mesStats, idx) => {
                  const maxAlunos = Math.max(...stats.evolucaoAlunos.map((m) => m.total), 1);
                  const alturaPorc = Math.max((mesStats.total / maxAlunos) * 85, 6);
                  const isDestaque = mesStats.total > 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip flutuante */}
                      <div className="absolute bottom-full mb-1.5 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-md">
                        {mesStats.total} matrícula{mesStats.total !== 1 ? "s" : ""} ({mesStats.rotulo})
                      </div>
                      {/* Barra */}
                      <div
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 cursor-pointer ${
                          isDestaque
                            ? "bg-teal-500 hover:bg-teal-600 shadow-xs shadow-teal-500/30"
                            : "bg-slate-200 hover:bg-slate-300"
                        }`}
                        style={{ height: `${alturaPorc}%` }}
                      />
                      {/* Rótulo */}
                      <span className="text-[10px] font-semibold text-slate-500 mt-2 truncate w-full text-center">
                        {mesStats.mesCurto}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alunos por Curso (2 Colunas) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base text-sky-600 font-bold">🎯</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Alunos por Curso</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Proporção e quantidade absoluta de matrículas</p>
              </div>

              {stats.distribuicaoCursos.length === 0 ? (
                /* Estado Vazio Elegante com Donut Neutro e CTA */
                <div className="py-4 flex flex-col items-center text-center">
                  <div className="flex items-center justify-center gap-6 my-2">
                    {/* Donut Neutro */}
                    <div className="relative w-24 h-24 rounded-full border-8 border-slate-100 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-xl font-extrabold text-slate-700 block leading-none">0</span>
                        <span className="text-[10px] font-semibold text-slate-400">alunos</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700">Nenhum curso cadastrado ainda</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vincule turmas e cursos para ver os dados.</p>
                    </div>
                  </div>

                  {/* Card Informativo com CTA */}
                  <div className="w-full mt-3 p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sky-600 text-sm">ℹ️</span>
                      <p className="text-[11px] text-sky-900 font-medium truncate">
                        Cadastre cursos para visualizar a distribuição de alunos.
                      </p>
                    </div>
                    <Link
                      href="/admin/cursos/novo"
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 whitespace-nowrap hover:underline"
                    >
                      Cadastrar →
                    </Link>
                  </div>
                </div>
              ) : (
                /* Listagem dos Cursos */
                <div className="space-y-3 my-auto py-2">
                  {stats.distribuicaoCursos.map((curso, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate mr-2">{curso.titulo}</span>
                        <span className="text-slate-500 font-bold">{curso.total} ({curso.percentual}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${curso.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── 5. ATIVIDADES RECENTES & ACESSO RÁPIDO ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Atividades Recentes (2 Colunas) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">
                    🕒
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Atividades Recentes</h3>
                </div>
                <Link
                  href="/admin/logs"
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 transition"
                >
                  Ver todas →
                </Link>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-2.5 px-2">Data</th>
                      <th className="py-2.5 px-2">Usuário</th>
                      <th className="py-2.5 px-2">Ação</th>
                      <th className="py-2.5 px-2">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stats.logsAtividades && stats.logsAtividades.length > 0 ? (
                      stats.logsAtividades.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-2 whitespace-nowrap font-medium text-slate-500">
                            {new Date(log.data).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="text-xs">👤</span> {log.usuario}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap font-medium text-teal-700">
                            {log.acao}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 truncate max-w-xs">
                            {log.detalhes}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-slate-400 font-medium">
                          Nenhuma atividade recente registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acesso Rápido (1 Coluna com 4 Botões de Ação) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                  ⚡
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Acesso Rápido</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Novo Aluno */}
                <Link href="/admin/alunos/novo">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/60 text-center cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 h-24">
                    <span className="text-2xl">👤⁺</span>
                    <span className="text-xs font-bold text-emerald-900">Novo Aluno</span>
                  </div>
                </Link>

                {/* Nova Turma */}
                <Link href="/admin/turmas/novo">
                  <div className="p-3.5 rounded-xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/60 text-center cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 h-24">
                    <span className="text-2xl">👥</span>
                    <span className="text-xs font-bold text-sky-900">Nova Turma</span>
                  </div>
                </Link>

                {/* Novo Curso */}
                <Link href="/admin/cursos/novo">
                  <div className="p-3.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/60 text-center cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 h-24">
                    <span className="text-2xl">📖</span>
                    <span className="text-xs font-bold text-purple-900">Novo Curso</span>
                  </div>
                </Link>

                {/* Emitir Relatório */}
                <Link href="/admin/contratos/relatorio">
                  <div className="p-3.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/60 text-center cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 h-24">
                    <span className="text-2xl">📄</span>
                    <span className="text-xs font-bold text-amber-900">Emitir Relatório</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
