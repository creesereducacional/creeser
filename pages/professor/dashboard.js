import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ProfessorDashboard() {
  const { usuario } = useAuth({
    tiposPermitidos: ["professor"],
    redirectTo: "/login",
  });

  const [stats, setStats] = useState({
    turmasVinculadas: 0,
    disciplinasVinculadas: 0,
    totalAlunos: 0,
    aulasMinistradas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const res = await fetch('/api/professor/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas do portal:", err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: "Turmas Vinculadas", val: stats.turmasVinculadas, color: "text-teal-700 bg-teal-50 border-teal-100", icon: "👥" },
    { label: "Disciplinas Vinculadas", val: stats.disciplinasVinculadas, color: "text-indigo-700 bg-indigo-50 border-indigo-100", icon: "📖" },
    { label: "Meus Alunos (Ativos)", val: stats.totalAlunos, color: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: "🎓" },
    { label: "Aulas Registradas", val: stats.aulasMinistradas, color: "text-amber-700 bg-amber-50 border-amber-100", icon: "📝" },
  ];

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto pb-10 font-sans">
        
        {/* ── 1. BANNER HERO BOAS-VINDAS PROFESSOR ────────────────────── */}
        <div className="relative bg-gradient-to-br from-teal-900/95 via-teal-950/95 to-slate-950/95 rounded-[28px] p-6 sm:p-8 lg:p-10 text-white shadow-xl overflow-hidden border border-teal-700/30">
          {/* Background Image do Portal */}
          <div 
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none"
            style={{ backgroundImage: "url('/images/bg_portal.png')" }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
                <span>👨‍🏫 Painel Acadêmico Docente</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Olá, Prof. {usuario?.nomeCompleto || usuario?.nome || "Docente"}! 👋
              </h1>
              <p className="mt-2 text-teal-100 text-xs sm:text-sm lg:text-base font-normal leading-relaxed opacity-90 max-w-xl">
                Gerencie suas turmas, registre frequências e aulas ministradas, lance notas e acompanhe o progresso pedagógico dos estudantes.
              </p>
            </div>

            {/* Resumo Rápido Docente */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 self-start md:self-auto">
              <div className="w-12 h-12 rounded-xl bg-[#00d09c]/20 border border-[#00d09c]/30 flex items-center justify-center text-2xl">
                📚
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-teal-200 tracking-wider">Atividade Docente</p>
                <p className="text-sm font-extrabold text-white">{stats.turmasVinculadas} turmas • {stats.totalAlunos} alunos</p>
              </div>
            </div>
          </div>

          {/* Marca d'água decorativa */}
          <div className="absolute right-0 bottom-0 opacity-5 text-9xl font-black translate-x-12 translate-y-12 select-none pointer-events-none">
            CREESER
          </div>
        </div>

        {/* ── 2. CARDS DE MÉTRICAS RÁPIDAS ────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg border ${card.color}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? "..." : card.val}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-1">Registrado no sistema</p>
            </div>
          ))}
        </div>

        {/* ── 3. ATALHOS RÁPIDOS PEDAGÓGICOS ──────────────────────────── */}
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Acesso Rápido às Rotinas Docentes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Selecione uma ação rápida para realizar no seu diário de classe.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/professor/diario">
              <div className="p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition duration-150 cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                  📖
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-teal-900">Diário de Classe</h3>
                <p className="text-xs text-slate-500 mt-1">Aulas ministradas e histórico</p>
              </div>
            </Link>

            <Link href="/professor/frequencia">
              <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition duration-150 cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                  📋
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-900">Fazer Chamada</h3>
                <p className="text-xs text-slate-500 mt-1">Lançar presenças e faltas</p>
              </div>
            </Link>

            <Link href="/professor/notas">
              <div className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition duration-150 cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                  📝
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-900">Lançar Notas</h3>
                <p className="text-xs text-slate-500 mt-1">Avaliações AP1, AP2, AP3 e Exames</p>
              </div>
            </Link>

            <Link href="/professor/planejamento">
              <div className="p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition duration-150 cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                  ➕
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-amber-900">Novo Planejamento</h3>
                <p className="text-xs text-slate-500 mt-1">Planejar conteúdos e metodologia</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
