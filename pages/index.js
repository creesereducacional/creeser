import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [modalDemoAberto, setModalDemoAberto] = useState(false);
  const [formData, setFormData] = useState({ nome: "", email: "", instituicao: "", whatsapp: "" });
  const [demoEnviado, setDemoEnviado] = useState(false);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoEnviado(true);
    setTimeout(() => {
      setModalDemoAberto(false);
      setDemoEnviado(false);
      setFormData({ nome: "", email: "", instituicao: "", whatsapp: "" });
    }, 2500);
  };

  return (
    <>
      <Head>
        <title>CREESER | Gestão Educacional para Instituições de Ensino</title>
        <meta
          name="description"
          content="O CREESER conecta pessoas, processos e informações para uma gestão acadêmica, financeira e pedagógica mais simples, integrada e eficiente."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden selection:bg-[#0070f3] selection:text-white">
        
        {/* ─────────────────────────────────────────────────────────────────────
            1. HEADER INSTITUCIONAL
        ───────────────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/images/logo_creeser.png"
                alt="CREESER Gestão Educacional"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </Link>

            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#inicio" className="hover:text-[#0070f3] transition-colors">Início</a>
              <a href="#solucoes" className="hover:text-[#0070f3] transition-colors">Soluções</a>
              <a href="#recursos" className="hover:text-[#0070f3] transition-colors">Recursos</a>
              <a href="#comunidade" className="hover:text-[#0070f3] transition-colors">Comunidade</a>
              <a href="#diferenciais" className="hover:text-[#0070f3] transition-colors">Diferenciais</a>
              <a href="#seguranca" className="hover:text-[#0070f3] transition-colors">Segurança</a>
            </nav>

            {/* Botão de Ação */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#0070f3] hover:bg-[#005ecf] active:bg-[#004fad] rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <span>Acesso ao sistema</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Menu Hambúrguer Mobile */}
            <button
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Abrir Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuMobileAberto ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Drawer Menu Mobile */}
          <AnimatePresence>
            {menuMobileAberto && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t border-slate-100 bg-white px-6 py-5 space-y-4 shadow-xl"
              >
                <a
                  href="#inicio"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Início
                </a>
                <a
                  href="#solucoes"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Soluções
                </a>
                <a
                  href="#recursos"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Recursos
                </a>
                <a
                  href="#comunidade"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Comunidade
                </a>
                <a
                  href="#diferenciais"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Diferenciais
                </a>
                <a
                  href="#seguranca"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Segurança
                </a>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                  <Link
                    href="/login"
                    onClick={() => setMenuMobileAberto(false)}
                    className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#0070f3] hover:bg-[#005ecf] rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <span>Acesso ao sistema</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ─────────────────────────────────────────────────────────────────────
            2. HERO COM bg_hero.png
        ───────────────────────────────────────────────────────────────────── */}
        <section
          id="inicio"
          className="relative min-h-[580px] lg:min-h-[640px] xl:min-h-[720px] bg-cover bg-right lg:bg-center bg-no-repeat flex items-center overflow-hidden"
          style={{
            backgroundImage: "url('/images/bg_hero.png')",
          }}
        >
          {/* Overlay suave para telas mobile/tablet para garantir contraste impecável */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent lg:from-white/95 lg:via-white/50 lg:to-transparent z-0"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 lg:py-20 relative z-10">
            <div className="max-w-xl lg:max-w-2xl">
              
              {/* Badge Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0070f3] text-xs font-bold uppercase tracking-wider mb-5"
              >
                <span>Educação que vai mais longe</span>
              </motion.div>

              {/* Headline Principal */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] font-black text-[#0c2340] leading-[1.1] tracking-tight mb-5"
              >
                Gestão educacional<br />
                para instituições que<br />
                <span className="text-[#0070f3]">transformam vidas.</span>
              </motion.h1>

              {/* Subtítulo */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-sm sm:text-base lg:text-lg text-slate-700 font-medium leading-relaxed max-w-lg mb-8"
              >
                O <strong>CREESER</strong> conecta pessoas, processos e informações para uma gestão acadêmica, financeira e pedagógica mais simples, integrada e eficiente.
              </motion.p>

              {/* Botões de Ação */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center gap-4"
              >
                <a
                  href="#solucoes"
                  className="px-6 py-3.5 text-sm font-bold text-white bg-[#0070f3] hover:bg-[#005ecf] active:bg-[#004fad] rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                  <span>Conheça o CREESER</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>

                <button
                  onClick={() => setModalDemoAberto(true)}
                  className="px-6 py-3.5 text-sm font-bold text-slate-800 bg-white/90 hover:bg-white border border-slate-300 rounded-xl transition-all shadow-sm"
                >
                  Solicitar demonstração
                </button>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            3. FAIXA DE BENEFÍCIOS (Trust Bar)
        ───────────────────────────────────────────────────────────────────── */}
        <section className="bg-slate-50 border-y border-slate-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Desenvolvida na prática</p>
                  <p className="text-[11px] text-slate-500 font-medium">Validada em uma instituição real.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0070f3] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Tecnologia a serviço da educação</p>
                  <p className="text-[11px] text-slate-500 font-medium">Inovação com foco acadêmico.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Mais eficiência para sua equipe</p>
                  <p className="text-[11px] text-slate-500 font-medium">Processos ágeis e automatizados.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Foco nas pessoas</p>
                  <p className="text-[11px] text-slate-500 font-medium">Alunos, professores e gestores.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            4. SEÇÃO: UMA PLATAFORMA PARA TODA A GESTÃO
        ───────────────────────────────────────────────────────────────────── */}
        <section id="solucoes" className="py-16 lg:py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header da Seção */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 lg:mb-16">
              <div>
                <span className="text-xs font-bold text-[#0070f3] uppercase tracking-widest">
                  SOLUÇÃO COMPLETA
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0c2340] tracking-tight mt-2">
                  Uma plataforma para toda<br />
                  a gestão da sua instituição.
                </h2>
              </div>
              <p className="text-sm sm:text-base text-slate-600 max-w-md font-medium leading-relaxed">
                Do processo seletivo à colação de grau, o CREESER integra as principais áreas da sua instituição em um único ambiente moderno e intuitivo.
              </p>
            </div>

            {/* Grid dos 8 Módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 1. Gestão Acadêmica */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-5 shadow-md shadow-blue-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Gestão Acadêmica</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Cursos e matrizes curriculares</li>
                  <li>• Turmas e disciplinas</li>
                  <li>• Matrículas e rematrículas</li>
                  <li>• Notas, faltas e histórico</li>
                </ul>
              </div>

              {/* 2. Secretaria */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-5 shadow-md shadow-sky-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Secretaria</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Documentos acadêmicos</li>
                  <li>• Declarações e certificados</li>
                  <li>• Histórico escolar oficial</li>
                  <li>• Processos e protocolos</li>
                </ul>
              </div>

              {/* 3. Financeiro */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Financeiro</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Mensalidades e carnês</li>
                  <li>• Recebimentos e baixas</li>
                  <li>• Bolsas, convênios e descontos</li>
                  <li>• Relatórios financeiros completos</li>
                </ul>
              </div>

              {/* 4. Pedagógico */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-5 shadow-md shadow-amber-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Pedagógico</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Planejamento acadêmico</li>
                  <li>• Avaliações e diários</li>
                  <li>• Acompanhamento docente</li>
                  <li>• Indicadores de desempenho</li>
                </ul>
              </div>

              {/* 5. Professores */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center mb-5 shadow-md shadow-purple-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Professores</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Portal exclusivo do docente</li>
                  <li>• Diário de classe online</li>
                  <li>• Lançamento de notas e frequências</li>
                  <li>• Comunicação com alunos</li>
                </ul>
              </div>

              {/* 6. Alunos */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-5 shadow-md shadow-rose-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Alunos</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Portal do aluno moderno</li>
                  <li>• Boletim e documentos digitais</li>
                  <li>• Aulas e materiais EAD</li>
                  <li>• Solicitações e serviços</li>
                </ul>
              </div>

              {/* 7. Relatórios e Gestão */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center mb-5 shadow-md shadow-teal-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Relatórios e Gestão</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Dashboards executivos em tempo real</li>
                  <li>• Indicadores institucionais</li>
                  <li>• Relatórios operacionais</li>
                  <li>• Tomada de decisão fundamentada</li>
                </ul>
              </div>

              {/* 8. E muito mais */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center mb-5 shadow-md shadow-indigo-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">E muito mais</h3>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Gestão de pré-cadastros e captação</li>
                  <li>• Fórum acadêmico integrado</li>
                  <li>• Contratos com assinatura digital</li>
                  <li>• Evolução contínua da plataforma</li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            6. SEÇÃO: TODA A COMUNIDADE ACADÊMICA CONECTADA
        ───────────────────────────────────────────────────────────────────── */}
        <section id="comunidade" className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-bold text-[#0070f3] uppercase tracking-widest">
                EXPERIÊNCIA INTEGRADA
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0c2340] tracking-tight mt-2">
                Toda a comunidade acadêmica conectada
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 font-medium">
                O CREESER aproxima pessoas, facilita a comunicação e integra processos, criando uma experiência fluida para toda a instituição.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Aluno */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 text-center hover:-translate-y-1 transition duration-200">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-[#0070f3] flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                  🎓
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Aluno</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Acesso simples a boletim, horários, histórico, aulas e solicitações acadêmicas pelo computador ou celular.
                </p>
              </div>

              {/* Professor */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 text-center hover:-translate-y-1 transition duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                  👨‍🏫
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Professor</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Gestão das turmas, diário de classe eletrônico, lançamento ágil de notas e comunicação direta com alunos.
                </p>
              </div>

              {/* Secretaria */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 text-center hover:-translate-y-1 transition duration-200">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                  👩‍💼
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Secretaria</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Processos mais rápidos, documentos oficiais, matrículas organizadas e conformidade regulatória.
                </p>
              </div>

              {/* Gestão */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 text-center hover:-translate-y-1 transition duration-200">
                <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                  📊
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Gestão</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Visão executiva em tempo real com dados acadêmicos e financeiros para decisões estratégicas seguras.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            7. SEÇÃO: SEGURANÇA, LGPD E MOBILIDADE
        ───────────────────────────────────────────────────────────────────── */}
        <section id="seguranca" className="py-16 lg:py-24 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Esquerda: Segurança & LGPD */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider mb-4">
                  Segurança e Confiabilidade
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-5">
                  Seus dados seguros,<br />
                  sua instituição protegida.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium mb-8">
                  O CREESER adota as melhores práticas de segurança da informação, com criptografia avançada, isolamento de permissões e total conformidade com a LGPD.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Controle de acesso granular</p>
                      <p className="text-xs text-slate-400">Cada usuário acessa estritamente as informações necessárias ao seu perfil.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Isolamento e integridade de dados</p>
                      <p className="text-xs text-slate-400">Camada de autenticação segura com suporte a multi-ambientes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Conformidade com a LGPD</p>
                      <p className="text-xs text-slate-400">Tratamento e proteção de dados de alunos, colaboradores e docentes.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direita: Mobilidade e Acesso */}
              <div className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700 backdrop-blur-sm">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  ACESSO EM QUALQUER LUGAR
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-2 mb-4">
                  Mobilidade para o seu dia a dia
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mb-6">
                  Acesse o sistema pelo computador, tablet ou smartphone. Uma experiência web moderna e 100% responsiva para secretários, professores e gestores.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/80">
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                    <p className="text-xl font-bold text-teal-400">100%</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Nuvem e Web Responsiva</p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                    <p className="text-xl font-bold text-[#0070f3]">24/7</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Disponibilidade e Acesso</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            8. CTA COMERCIAL FINAL
        ───────────────────────────────────────────────────────────────────── */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#0c2340] via-[#0d2e54] to-[#0a1e38] text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider mb-4">
              VAMOS CONVERSAR?
            </span>
            
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight max-w-3xl mx-auto mb-6">
              Sua instituição está pronta para uma gestão mais integrada e eficiente?
            </h2>
            
            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto mb-8 leading-relaxed">
              Conheça o CREESER e descubra como podemos contribuir para o crescimento e organização da sua instituição de ensino.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setModalDemoAberto(true)}
                className="px-8 py-4 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition shadow-xl shadow-black/20 flex items-center gap-2"
              >
                <span>Solicitar demonstração</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              
              <Link
                href="/login"
                className="px-8 py-4 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition"
              >
                Acessar o Sistema
              </Link>
            </div>

          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            9. FOOTER INSTITUCIONAL
        ───────────────────────────────────────────────────────────────────── */}
        <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
              
              {/* Logo Footer */}
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo_creeser.png"
                  alt="CREESER"
                  className="h-8 w-auto object-contain brightness-110"
                />
              </div>

              {/* Links */}
              <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-400">
                <a href="#inicio" className="hover:text-white transition">Início</a>
                <a href="#solucoes" className="hover:text-white transition">Soluções</a>
                <a href="#recursos" className="hover:text-white transition">Recursos</a>
                <a href="#comunidade" className="hover:text-white transition">Comunidade</a>
                <Link href="/politica-de-privacidade" className="hover:text-white transition">Privacidade</Link>
                <Link href="/termos-de-uso" className="hover:text-white transition">Termos</Link>
              </div>

            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500 font-medium">
              <p>© 2026 CREESER Gestão Educacional. Todos os direitos reservados.</p>
              <p>Educação, pessoas e tecnologia para um futuro melhor.</p>
            </div>
          </div>
        </footer>

        {/* ─────────────────────────────────────────────────────────────────────
            10. MODAL INTERATIVO DE DEMONSTRAÇÃO
        ───────────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {modalDemoAberto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 relative text-slate-900"
              >
                {/* Botão Fechar */}
                <button
                  onClick={() => setModalDemoAberto(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {demoEnviado ? (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      ✓
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Solicitação Recebida!</h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      Nossa equipe de consultores entrará em contato em breve para apresentar a plataforma.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <span className="text-xs font-bold text-[#0070f3] uppercase tracking-wider">
                        Agende uma Apresentação
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                        Solicitar Demonstração
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Veja o CREESER em funcionamento na prática com dados da sua rotina.
                      </p>
                    </div>

                    <form onSubmit={handleDemoSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Seu Nome
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Nome completo"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070f3] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          E-mail Corporativo
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="voce@instituicao.edu.br"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070f3] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nome da Instituição de Ensino
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.instituicao}
                          onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                          placeholder="Faculdade / Colégio / Escola"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070f3] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          WhatsApp / Telefone
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="(99) 99999-9999"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070f3] transition"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#0070f3] hover:bg-[#005ecf] text-white font-bold py-3 rounded-xl text-sm transition shadow-md mt-2"
                      >
                        Enviar Solicitação
                      </button>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
