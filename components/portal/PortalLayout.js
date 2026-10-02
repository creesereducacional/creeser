import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePortalLayout } from "@/context/PortalLayoutContext";

const ROUTE_TITLES = {
  "/aluno/home": "Início — Meus Cursos",
  "/aluno/dashboard": "Painel EAD do Aluno",
  "/aluno/boletim": "Meu Boletim Escolar",
  "/aluno/forum": "Fórum de Dúvidas e Discussão",
  "/enviar-documentos": "Envio de Documentos e Trabalhos",
  "/professor/dashboard": "Dashboard do Professor",
  "/professor/diario": "Diário de Classe & Planejamentos",
  "/professor/frequencia": "Frequência & Controle de Presença",
  "/professor/notas": "Lançamento & Gestão de Notas",
  "/professor/alunos": "Meus Alunos & Turmas",
  "/professor/planejamento": "Planejamento de Aula",
};

export default function PortalLayout({ children, title, tipoRequerido = "aluno" }) {
  const router = useRouter();
  const portalContext = usePortalLayout();

  // Tipo efetivo: detecta professor pela rota, independente da prop
  const effectiveTipoRequerido = router.pathname.startsWith("/professor/")
    ? "professor"
    : tipoRequerido;

  // Título do Topbar: prop > mapa de rotas > contexto > padrão
  const displayTitle =
    title ||
    ROUTE_TITLES[router.pathname] ||
    portalContext?.title ||
    "Portal Acadêmico";

  // Sincroniza título externo com contexto (apenas quando a página passa title via prop)
  useEffect(() => {
    if (title && portalContext?.setTitle) {
      portalContext.setTitle(title);
    }
  }, [title]);

  // Autenticação — somente leitura de estado; redirect gerenciado pelo useAuth
  const tiposPermitidos =
    effectiveTipoRequerido === "todos"
      ? ["aluno", "professor"]
      : [effectiveTipoRequerido];

  const { usuario } = useAuth({
    tiposPermitidos,
    redirectTo: "/login",
    redirectIfUnauthorized:
      effectiveTipoRequerido === "aluno" ? "/professor/dashboard" : "/aluno/home",
  });

  // Controle do drawer mobile — não afeta Sidebar nem Topbar no desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const closeSidebar = () => setSidebarOpen(false);
    router.events.on("routeChangeComplete", closeSidebar);
    return () => router.events.off("routeChangeComplete", closeSidebar);
  }, [router.events]);

  // ── Dados derivados do usuário ──────────────────────────────────
  const isAluno =
    (usuario?.tipo ||
      (router.pathname.startsWith("/professor/") ? "professor" : "aluno")) ===
    "aluno";

  const menuItems = isAluno
    ? [
        { label: "Início / Meus Cursos", href: "/aluno/home", icon: "🎓" },
        { label: "Dashboard", href: "/aluno/dashboard", icon: "📊" },
        { label: "Meu Boletim", href: "/aluno/boletim", icon: "📄" },
        { label: "Fórum de Dúvidas", href: "/aluno/forum", icon: "💬" },
        { label: "Enviar Documentos", href: "/enviar-documentos", icon: "📁" },
      ]
    : [
        { label: "Dashboard", href: "/professor/dashboard", icon: "📊" },
        { label: "Diário de Classe", href: "/professor/diario", icon: "📖" },
        { label: "Frequência (Chamada)", href: "/professor/frequencia", icon: "📋" },
        { label: "Lançar Notas", href: "/professor/notas", icon: "📝" },
        { label: "Meus Alunos", href: "/professor/alunos", icon: "👥" },
        { label: "Planejamento", href: "/professor/planejamento", icon: "📝" },
      ];

  const userDisplayName = usuario?.nomeCompleto || usuario?.nome || "Usuário";
  const userInitials = userDisplayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    } finally {
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  // ── Shell permanente ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f8f7] flex font-sans text-gray-800 antialiased">

      {/* Backdrop mobile — não afeta desktop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR — permanece montado ─────────────────────────── */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-gradient-to-b from-teal-800 via-teal-900 to-slate-900 text-white flex flex-col z-50 shadow-2xl md:shadow-none md:translate-x-0 md:transition-none ${
          sidebarOpen
            ? "translate-x-0 transition-transform duration-300 ease-in-out"
            : "-translate-x-full transition-transform duration-300 ease-in-out"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-teal-700/50 flex items-center justify-between">
          <Link
            href={isAluno ? "/aluno/home" : "/professor/dashboard"}
            className="flex items-center gap-3 group"
          >
            <div className="h-10 px-2 rounded-xl bg-white/95 shadow-md flex items-center justify-center">
              <img
                src="/images/logo_creeser.png"
                alt="CREESER"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200 bg-teal-800/80 px-2 py-0.5 rounded-md border border-teal-600/40">
                {isAluno ? "Aluno" : "Professor"}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-teal-200 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* Itens de navegação — next/link em todos */}
        <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm font-semibold cursor-pointer group ${
                  isActive
                    ? "bg-teal-500 text-white shadow-md shadow-teal-950/20"
                    : "text-teal-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-lg flex-shrink-0 transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Perfil e Logout */}
        <div className="p-4 border-t border-teal-700/40 bg-black/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm border border-teal-300/40">
              {userInitials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {userDisplayName}
              </p>
              <p className="text-[11px] text-teal-200/80 truncate">
                {usuario?.email || "portal@creeser.com.br"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>🚪</span>
            <span>Sair do Portal</span>
          </button>
        </div>
      </aside>

      {/* ── COLUNA DIREITA ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── TOPBAR — permanece montado ────────────────────────── */}
        <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="px-4 sm:px-8 py-3.5 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight truncate">
                {displayTitle}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Portal Acadêmico
              </span>
            </div>
          </div>
        </header>

        {/* ── MAIN — ÚNICO elemento que troca por rota ─────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
