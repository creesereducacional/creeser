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
                src="/images/logo_gestao.png"
                alt="CREESER Gestão Educacional"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>

            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#inicio" className="hover:text-[#0070f3] transition-colors">Início</a>
              <a href="#solucoes" className="hover:text-[#0070f3] transition-colors">Soluções</a>
              <a href="#pais" className="hover:text-[#0070f3] transition-colors">Portal dos Pais</a>
              <a href="#comunidade" className="hover:text-[#0070f3] transition-colors">Comunidade</a>
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
                  href="#pais"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Portal dos Pais
                </a>
                <a
                  href="#comunidade"
                  onClick={() => setMenuMobileAberto(false)}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Comunidade
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
            3. FAIXA DE BENEFÍCIOS (Trust Bar) - 100% Largura Horizontal
        ───────────────────────────────────────────────────────────────────── */}
        <section className="w-full bg-gradient-to-r from-[#0c2340] via-[#004b87] to-[#0070f3] py-7 sm:py-8 border-y border-blue-400/20 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              
              {/* 1 - Desenvolvida na prática */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400/25 to-teal-500/10 border border-teal-300/40 text-teal-300 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:border-teal-300 transition-all duration-200">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-white leading-tight">Desenvolvida na prática</p>
                  <p className="text-xs text-teal-100/80 font-normal mt-0.5">Validada em instituição real.</p>
                </div>
              </div>

              {/* 2 - Tecnologia & Educação */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/25 to-blue-500/10 border border-cyan-300/40 text-cyan-300 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:border-cyan-300 transition-all duration-200">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-white leading-tight">Tecnologia & Educação</p>
                  <p className="text-xs text-blue-100/80 font-normal mt-0.5">Inovação com foco acadêmico.</p>
                </div>
              </div>

              {/* 3 - Mais eficiência na equipe */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/25 to-emerald-500/10 border border-emerald-300/40 text-emerald-300 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:border-emerald-300 transition-all duration-200">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-white leading-tight">Mais eficiência na equipe</p>
                  <p className="text-xs text-emerald-100/80 font-normal mt-0.5">Processos automatizados.</p>
                </div>
              </div>

              {/* 4 - Foco nas pessoas */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border border-amber-300/40 text-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:border-amber-300 transition-all duration-200">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-white leading-tight">Foco nas pessoas</p>
                  <p className="text-xs text-amber-100/80 font-normal mt-0.5">Alunos, professores e gestores.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            NOVA SEÇÃO: CARD INSTITUCIONAL TECNOLOGIA & PROPÓSITO
        ───────────────────────────────────────────────────────────────────── */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#ebf4fc] rounded-[24px] sm:rounded-[32px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-slate-200/60"
            >
              {/* Lado Esquerdo: Imagem Institucional com Texto Sobreposto */}
              <div className="lg:col-span-6 relative min-h-[300px] sm:min-h-[360px] lg:min-h-[390px] w-full overflow-hidden flex items-center">
                <img
                  src="/images/campos.png"
                  alt="Instituições que investem em educação constroem um futuro melhor"
                  className="w-full h-full object-cover object-center absolute inset-0"
                />
                
                {/* Overlay sutil escuro para legibilidade máxima do texto */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/40 to-transparent pointer-events-none" />

                {/* Texto Sobreposto à Esquerda */}
                <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-md">
                  {/* Traço superior característico */}
                  <div className="w-12 h-1 bg-[#00d09c] mb-4 rounded-full" />
                  
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white leading-tight drop-shadow-md">
                    Instituições que investem em educação constroem um futuro melhor.
                  </h3>

                  {/* Traço inferior característico */}
                  <div className="w-12 h-1 bg-[#00d09c] mt-4 rounded-full" />
                </div>
              </div>

              {/* Lado Direito: Bloco de Conteúdo Informativo */}
              <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center bg-[#eef6fd]">
                
                {/* Título com Tipografia Serifada / Elegante */}
                <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-serif font-bold text-[#0c2340] tracking-tight leading-[1.25] mb-3">
                  Tecnologia que fortalece<br className="hidden sm:inline" /> o propósito da sua instituição.
                </h2>

                {/* Texto Descritivo */}
                <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] leading-relaxed font-sans mb-8 max-w-lg">
                  O CREESER combina inovação, segurança e simplicidade para apoiar o crescimento da sua instituição de ensino.
                </p>

                {/* Quatro Benefícios com Ícones em Linha Horizontal */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-3 text-center">
                  
                  {/* Item 1 */}
                  <div className="flex flex-col items-center group">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#00609C] border border-blue-100 shadow-sm flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-blue-300 transition-all duration-200">
                      <svg className="w-6 h-6 text-[#00609C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="4" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                      </svg>
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                      Plataforma integrada
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex flex-col items-center group">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#00897b] border border-teal-100 shadow-sm flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-teal-300 transition-all duration-200">
                      <svg className="w-6 h-6 text-[#00897b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                      Segura e confiável
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex flex-col items-center group">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#00609C] border border-blue-100 shadow-sm flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-blue-300 transition-all duration-200">
                      <svg className="w-6 h-6 text-[#00609C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m7.5 4.27 9 5.15" />
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                      </svg>
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                      Em constante evolução
                    </span>
                  </div>

                  {/* Item 4 */}
                  <div className="flex flex-col items-center group">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#00609C] border border-blue-100 shadow-sm flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-blue-300 transition-all duration-200">
                      <svg className="w-6 h-6 text-[#00609C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                      Suporte especializado
                    </span>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            4. SEÇÃO: UMA PLATAFORMA PARA TODA A GESTÃO (area02.png)
        ───────────────────────────────────────────────────────────────────── */}
        <section
          id="solucoes"
          className="w-full relative py-8 sm:py-10 lg:py-12 bg-cover bg-no-repeat overflow-hidden border-t border-slate-100"
          style={{
            backgroundImage: "url('/images/area02.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        >
          {/* Overlay suave para telas menores */}
          <div className="absolute inset-0 bg-white/40 lg:hidden pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            {/* Header da Seção - Compacto e Visualmente Equilibrado */}
            <div className="max-w-2xl mb-6 lg:mb-7">
              <span className="inline-block px-3 py-0.5 rounded-full bg-blue-100/90 text-[#0070f3] text-[11px] font-bold uppercase tracking-wider mb-2 border border-blue-200/60 shadow-xs">
                SOLUÇÃO COMPLETA
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-[28px] xl:text-[32px] font-black text-[#0c2340] tracking-tight leading-[1.15] mb-2">
                Uma plataforma para toda a gestão <span className="text-[#0070f3]">da sua instituição.</span>
              </h2>
              <p className="text-xs sm:text-[13px] lg:text-sm text-slate-600 max-w-xl font-medium leading-snug">
                Do processo seletivo à colação de grau, o CREESER integra as principais áreas da sua instituição em um único ambiente moderno e intuitivo.
              </p>
            </div>

            {/* Grid dos 8 Módulos - 4 colunas x 2 linhas compacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4">
              
              {/* 1. Gestão Acadêmica */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-blue-500 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-blue-500/10 pointer-events-none group-hover:text-blue-500/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">Gestão Acadêmica</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0" />Cursos e matrizes curriculares</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0" />Turmas e disciplinas</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0" />Matrículas e rematrículas</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0" />Notas, faltas e histórico</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center self-end mt-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 2. Secretaria */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-sky-400 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-sky-400/10 pointer-events-none group-hover:text-sky-400/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">Secretaria</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5 flex-shrink-0" />Documentos acadêmicos</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5 flex-shrink-0" />Declarações e certificados</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5 flex-shrink-0" />Histórico escolar oficial</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5 flex-shrink-0" />Processos e protocolos</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center self-end mt-2 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 3. Financeiro */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-emerald-500 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-emerald-500/10 pointer-events-none group-hover:text-emerald-500/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">Financeiro</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0" />Mensalidades e carnês</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0" />Recebimentos e baixas</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0" />Bolsas, convênios e descontos</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0" />Relatórios financeiros completos</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center self-end mt-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 4. Pedagógico */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-amber-500 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-amber-500/10 pointer-events-none group-hover:text-amber-500/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">Pedagógico</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 flex-shrink-0" />Planejamento acadêmico</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 flex-shrink-0" />Avaliações e diários</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 flex-shrink-0" />Acompanhamento docente</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 flex-shrink-0" />Indicadores de desempenho</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center self-end mt-2 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 5. Professores */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-purple-500 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-purple-500/10 pointer-events-none group-hover:text-purple-500/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">Professores</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 flex-shrink-0" />Portal exclusivo do docente</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 flex-shrink-0" />Diário de classe online</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 flex-shrink-0" />Lançamento de notas e frequências</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 flex-shrink-0" />Comunicação com alunos</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center self-end mt-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 6. Alunos */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-rose-500 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-rose-500/10 pointer-events-none group-hover:text-rose-500/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">Alunos</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 flex-shrink-0" />Portal do aluno moderno</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 flex-shrink-0" />Boletim e documentos digitais</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 flex-shrink-0" />Aulas e materiais EAD</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 flex-shrink-0" />Solicitações e serviços</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center self-end mt-2 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 7. Relatórios e Gestão */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-teal-500 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-teal-500/10 pointer-events-none group-hover:text-teal-500/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">Relatórios e Gestão</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 flex-shrink-0" />Dashboards executivos em tempo real</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 flex-shrink-0" />Indicadores institucionais</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 flex-shrink-0" />Relatórios operacionais</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 flex-shrink-0" />Tomada de decisão fundamentada</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center self-end mt-2 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 8. E muito mais */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 lg:p-4.5 border border-slate-200/80 border-b-[3px] border-b-indigo-500 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                {/* Marca d'água de fundo */}
                <div className="absolute -top-1 -right-1 text-indigo-500/10 pointer-events-none group-hover:text-indigo-500/15 transition-colors">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#0c2340] mb-2 leading-tight">E muito mais</h3>
                  <ul className="text-[11.5px] lg:text-xs text-slate-600 space-y-1 font-medium leading-tight">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 flex-shrink-0" />Gestão de pré-cadastros e captação</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 flex-shrink-0" />Fórum acadêmico integrado</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 flex-shrink-0" />Contratos com assinatura digital</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 flex-shrink-0" />Evolução contínua da plataforma</li>
                  </ul>
                </div>
                <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center self-end mt-2 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            6. SEÇÃO: CONTROLE DOS PAIS - 100% LARGURA HORIZONTAL
        ───────────────────────────────────────────────────────────────────── */}
        <section
          id="pais"
          className="w-full relative py-12 sm:py-16 lg:py-24 text-white overflow-hidden bg-[#00609c] border-y border-blue-400/20 shadow-xl"
          style={{
            backgroundImage: "url('/images/bg_app2.png')",
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center right',
          }}
        >
          {/* Overlay suave para mobile mantendo total legibilidade sem cobrir a foto em desktop */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#004f82]/95 via-[#00609c]/85 to-[#00609c]/40 lg:bg-gradient-to-r lg:from-[#00609c]/95 lg:via-[#00609c]/60 lg:to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px] sm:min-h-[480px] lg:min-h-[520px] items-center"
            >
              <div className="lg:col-span-6 py-6 sm:py-8 lg:py-10 text-white max-w-xl">
                
                {/* Eyebrow / Tag */}
                <span className="inline-block px-3.5 py-1 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest mb-3 sm:mb-4 drop-shadow-sm">
                  APP & PORTAL DA FAMÍLIA
                </span>

                {/* Título */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-tight drop-shadow-md mb-3">
                  Controle dos Pais
                </h2>

                {/* Texto */}
                <p className="text-xs sm:text-sm lg:text-[15px] text-blue-50/95 leading-relaxed font-sans mb-6 sm:mb-8 max-w-md drop-shadow-sm">
                  Acompanhe a vida acadêmica do seu filho de forma simples, prática e segura.
                </p>

                {/* 4 Recursos com Ícones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 mb-8">
                  
                  {/* Recurso 1 */}
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15 shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-teal-400/25 text-teal-300 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-[13px] font-semibold text-white">Frequência em tempo real</span>
                  </div>

                  {/* Recurso 2 */}
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15 shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-teal-400/25 text-teal-300 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-[13px] font-semibold text-white">Acompanhamento de notas</span>
                  </div>

                  {/* Recurso 3 */}
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15 shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-teal-400/25 text-teal-300 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-[13px] font-semibold text-white">Comunicados da instituição</span>
                  </div>

                  {/* Recurso 4 */}
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15 shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-teal-400/25 text-teal-300 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-[13px] font-semibold text-white">Boletim e documentos digitais</span>
                  </div>

                </div>

                {/* Botão CTA */}
                <div>
                  <button
                    onClick={() => setModalDemoAberto(true)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#00609c] hover:bg-slate-100 active:scale-95 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <span>Conheça o Portal dos Pais</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            7. SEÇÃO: TODA A COMUNIDADE ACADÊMICA CONECTADA
        ───────────────────────────────────────────────────────────────────── */}
        <section id="comunidade" className="py-16 lg:py-24 bg-slate-50/60 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header da Seção lado a lado conforme referência */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-12">
              <div className="max-w-xl">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#0c2340] tracking-tight leading-tight">
                  Toda a comunidade acadêmica conectada
                </h2>
              </div>
              <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 max-w-lg font-normal leading-relaxed lg:text-right">
                O CREESER aproxima pessoas, facilita a comunicação e integra processos, criando uma experiência fluida para toda a instituição.
              </p>
            </div>

            {/* Grid dos 4 Cards com Fotos Institucionais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Aluno */}
              <div className="bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-100">
                  <img
                    src="/images/foto01.png"
                    alt="Aluno CREESER"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-1 bg-white">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00897b] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0c2340]">Aluno</h3>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                    Acesso às informações, serviços e acompanhamento da sua vida acadêmica.
                  </p>
                </div>
              </div>

              {/* Card 2: Professor */}
              <div className="bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-100">
                  <img
                    src="/images/foto02.png"
                    alt="Professor CREESER"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-1 bg-white">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0070f3] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0c2340]">Professor</h3>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                    Gestão das turmas, diário de classe, lançamento de notas e comunicação com alunos.
                  </p>
                </div>
              </div>

              {/* Card 3: Secretaria */}
              <div className="bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-100">
                  <img
                    src="/images/foto03.png"
                    alt="Secretaria CREESER"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-1 bg-white">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0070f3] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0c2340]">Secretaria</h3>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                    Processos mais ágeis, organizados e integrados.
                  </p>
                </div>
              </div>

              {/* Card 4: Gestão */}
              <div className="bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-100">
                  <img
                    src="/images/foto04.png"
                    alt="Gestão CREESER"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-1 bg-white">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0070f3] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <polyline points="16 11 18 13 22 9" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0c2340]">Gestão</h3>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                    Visão completa da instituição com dados confiáveis e indicadores estratégicos.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            8. CTA COMERCIAL FINAL - 100% LARGURA HORIZONTAL
        ───────────────────────────────────────────────────────────────────── */}
        <section
          className="w-full relative py-12 sm:py-16 lg:py-20 text-white overflow-hidden bg-[#0c2340] border-t border-blue-400/20 shadow-2xl"
          style={{
            backgroundImage: "url('/images/campos2.png?v=2')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay sutil em degradê para garantir máxima legibilidade do texto preservando a foto */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c2340]/95 via-[#0c2340]/75 to-[#0c2340]/40 sm:to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 min-h-[140px] lg:min-h-[160px]"
            >
              {/* Lado Esquerdo: Textos */}
              <div className="max-w-2xl text-left">
                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-cyan-300 block mb-1.5 drop-shadow-sm">
                  VAMOS CONVERSAR?
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug drop-shadow-md">
                  Sua instituição está pronta para uma gestão mais integrada e eficiente?
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-blue-100/90 mt-2 leading-relaxed drop-shadow-sm">
                  Conheça o CREESER e descubra como podemos contribuir para o crescimento da sua instituição de ensino.
                </p>
              </div>

              {/* Lado Direito: Ações / Botões */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0 w-full sm:w-auto lg:w-64">
                <button
                  onClick={() => setModalDemoAberto(true)}
                  className="w-full px-5 py-3 text-xs sm:text-sm font-bold text-[#0c2340] bg-white hover:bg-slate-100 active:scale-95 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Solicitar demonstração</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>

                <button
                  onClick={() => setModalDemoAberto(true)}
                  className="w-full px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/80 active:scale-95 rounded-xl transition-all duration-200 text-center backdrop-blur-xs cursor-pointer"
                >
                  Falar com nossa equipe
                </button>
              </div>
            </motion.div>
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
                  src="/images/logo_gestao2.png"
                  alt="CREESER Gestão Educacional"
                  className="h-14 sm:h-16 lg:h-20 w-auto object-contain brightness-110"
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
