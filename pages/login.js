import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  resolveDomainContext,
  validarCompatibilidadeAmbiente,
  getDestinoPosLogin,
  DOMAIN_CONTEXTS,
} from "@/lib/domain-helpers";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tipoAcesso, setTipoAcesso] = useState("aluno"); // 'aluno' | 'professor'
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [contexto, setContexto] = useState(DOMAIN_CONTEXTS.DEFAULT);
  const [modalEsqueciSenha, setModalEsqueciSenha] = useState(false);

  // Detecta o domínio atual no cliente ou override via query param (?tipo=admin / ?tipo=portal)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTipo = (urlParams.get("tipo") || urlParams.get("env") || urlParams.get("modo") || urlParams.get("contexto") || "").toLowerCase();
      
      if (queryTipo === "admin" || queryTipo === "app") {
        setContexto(DOMAIN_CONTEXTS.ADMIN);
      } else if (queryTipo === "portal" || queryTipo === "academico") {
        setContexto(DOMAIN_CONTEXTS.PORTAL);
      } else {
        const ctx = resolveDomainContext(window.location.hostname);
        setContexto(ctx);
      }
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setErro(errorData.error || "Email ou senha inválidos");
        setCarregando(false);
        return;
      }

      const data = await res.json();
      const usuario = data.usuario;

      // ── Validação de Compatibilidade por Ambiente (Fase 2) ───────────────
      const validacao = validarCompatibilidadeAmbiente(usuario, contexto);
      if (!validacao.permitido) {
        // Se o perfil for incompatível com o subdomínio acessado, desloga a sessão criada
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        localStorage.removeItem("usuario");
        setErro(validacao.mensagemErro || "Seu perfil não tem permissão para acessar este ambiente.");
        setCarregando(false);
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(usuario));

      // ── Destino inteligente pós-login ────────────────────────────────────
      const destino = getDestinoPosLogin(usuario, contexto);
      router.push(destino);
    } catch (err) {
      console.error("[LOGIN] Erro:", err);
      setErro("Erro ao conectar ao servidor. Verifique sua conexão.");
      setCarregando(false);
    }
  };

  const isAdmin = contexto === DOMAIN_CONTEXTS.ADMIN;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDERIZAÇÃO: AMBIENTE ADMINISTRATIVO (app.creeser.com.br)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div
        className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex items-center overflow-x-hidden font-sans select-none"
        style={{
          backgroundImage: "url('/images/bg_app.png')",
          backgroundAttachment: "fixed",
          backgroundPosition: "center center",
        }}
      >
        {/* Overlay suave para telas menores */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[1px] lg:hidden z-0"></div>

        {/* Container Principal */}
        <div className="w-full min-h-screen flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-28 py-8 lg:py-12 relative z-10">
          
          {/* Coluna Esquerda: Conteúdo Institucional Administrativo */}
          <div className="w-full lg:w-[430px] xl:w-[490px] 2xl:w-[530px] flex-shrink-0 flex flex-col justify-center py-4 lg:py-6 z-10">
            <div>
              {/* Logo Creeser */}
              <div className="mb-6 lg:mb-8">
                <img
                  src="/images/logo_creeser2.fw.png"
                  alt="Creeser Grupo Educacional"
                  className="h-10 sm:h-12 xl:h-14 w-auto object-contain drop-shadow-sm brightness-110"
                />
              </div>

              {/* Tag e Headline Principal */}
              <div className="mb-6 lg:mb-8">
                <p className="text-xs uppercase tracking-widest font-extrabold text-teal-300 mb-2.5">
                  PORTAL ADMINISTRATIVO
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] 2xl:text-[54px] font-black text-white leading-[1.28] sm:leading-[1.25] xl:leading-[1.22] tracking-tight">
                  Gestão que<br />
                  impulsiona<br />
                  <span className="text-[#00d09c]">a educação</span>
                </h1>
                <p className="mt-4 sm:mt-5 text-xs sm:text-sm lg:text-[15px] xl:text-base text-white font-medium leading-relaxed max-w-[380px] xl:max-w-[460px]">
                  Acesso seguro e centralizado para a gestão acadêmica, financeira e administrativa do Grupo Creeser.
                </p>
              </div>

              {/* Lista de Recursos Administrativos */}
              <div className="space-y-4 xl:space-y-4.5">
                
                {/* Item 1: Gestão Integrada */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 flex-shrink-0">
                    <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm xl:text-base font-bold text-white leading-snug">Gestão Integrada</p>
                    <p className="text-[11px] sm:text-xs xl:text-[13px] text-white/90 font-medium">Acadêmico, financeiro e administrativo em um só lugar.</p>
                  </div>
                </div>

                {/* Item 2: Controle e Segurança */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 flex-shrink-0">
                    <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm xl:text-base font-bold text-white leading-snug">Controle e Segurança</p>
                    <p className="text-[11px] sm:text-xs xl:text-[13px] text-white/90 font-medium">Acesso por perfis e permissões.</p>
                  </div>
                </div>

                {/* Item 3: Processos Mais Ágeis */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 flex-shrink-0">
                    <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm xl:text-base font-bold text-white leading-snug">Processos Mais Ágeis</p>
                    <p className="text-[11px] sm:text-xs xl:text-[13px] text-white/90 font-medium">Organize, acompanhe e tome decisões com mais eficiência.</p>
                  </div>
                </div>

                {/* Item 4: Informações Confiáveis */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 flex-shrink-0">
                    <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm xl:text-base font-bold text-white leading-snug">Informações Confiáveis</p>
                    <p className="text-[11px] sm:text-xs xl:text-[13px] text-white/90 font-medium">Dados atualizados para uma gestão mais estratégica.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Espaçador Central transparente */}
          <div className="hidden lg:block flex-1 pointer-events-none"></div>

          {/* Coluna Direita: Card de Login Administrativo */}
          <div className="w-full lg:w-[380px] xl:w-[410px] 2xl:w-[430px] flex-shrink-0 flex flex-col items-center lg:items-end my-4 lg:my-0 z-20">
            
            {/* Link Superior: Voltar para o site */}
            <div className="w-full flex justify-end mb-3 sm:mb-4">
              <a
                href="https://creeser.com.br"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-[#007A78] bg-white/95 hover:bg-white backdrop-blur-md px-4 py-2 sm:py-2.5 rounded-2xl shadow-md hover:shadow-lg border border-slate-200/90 transition-all duration-200 group"
              >
                <svg className="w-4 h-4 text-slate-600 group-hover:text-[#007A78] group-hover:-translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Voltar para o site</span>
              </a>
            </div>

            <div className="bg-white rounded-[28px] xl:rounded-[32px] shadow-2xl p-6 sm:p-8 xl:p-9 w-full border border-slate-100/90 relative">
              
              {/* Logo dentro do Card */}
              <div className="flex justify-center mb-4">
                <img
                  src="/images/logo_creeser2.fw.png"
                  alt="Creeser"
                  className="h-9 sm:h-11 w-auto object-contain"
                />
              </div>

              {/* Cabeçalho do Card */}
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Portal Administrativo
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                  Acesse sua conta para continuar
                </p>
              </div>

              {/* Formulário de Acesso */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Campo E-mail / Usuário */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email ou Usuário
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Senha
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 focus:border-[#007A78] transition-all text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                      tabIndex={-1}
                    >
                      {mostrarSenha ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Lembrar de mim / Esqueceu sua senha */}
                <div className="flex justify-between items-center text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <span>Lembrar de mim</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalEsqueciSenha(true)}
                    className="font-medium text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                {/* Mensagem de Erro */}
                {erro && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs leading-relaxed flex items-start gap-2">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    <p className="flex-1 font-medium">{erro}</p>
                  </div>
                )}

                {/* Botão Entrar */}
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#007A78] hover:bg-[#006866] active:bg-[#005553] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-1"
                >
                  {carregando ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Conectando...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Acessar Sistema</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Badge de Ambiente Seguro */}
              <div className="mt-5 bg-[#f0f7ff] border border-[#d2e5fe] rounded-2xl p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 text-teal-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Ambiente seguro</p>
                  <p className="text-[10.5px] text-slate-500 leading-tight">Seus dados são protegidos e criptografados.</p>
                </div>
              </div>

            </div>

            {/* Link Discreto para Portal Acadêmico */}
            <div className="mt-3.5 text-center w-full">
              <a
                href="https://portal.creeser.com.br/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#007A78] bg-white/80 hover:bg-white backdrop-blur-md px-4 py-2 rounded-full shadow-sm hover:shadow border border-slate-200/80 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Portal Acadêmico (Alunos e Professores)</span>
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Modal de Recuperação de Senha */}
        {modalEsqueciSenha && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-fade-in text-center">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Recuperação de Acesso</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Para redefinir sua senha de acesso administrativo, solicite o reset ao administrador geral do sistema ou setor de TI.
              </p>
              <button
                type="button"
                onClick={() => setModalEsqueciSenha(false)}
                className="w-full bg-[#007A78] hover:bg-[#006866] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDERIZAÇÃO: PORTAL ACADÊMICO (portal.creeser.com.br / Padrão)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex items-center overflow-x-hidden font-sans select-none"
      style={{
        backgroundImage: "url('/images/bg_portal.png')",
        backgroundAttachment: "fixed",
        backgroundPosition: "center center",
      }}
    >
      {/* Overlay sutil apenas em mobile/tablet para garantir contraste */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] lg:hidden z-0"></div>

      {/* Container Principal com Grid/Flex perfeitamente distribuído */}
      <div className="w-full min-h-screen flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-12 xl:px-16 2xl:px-24 py-8 lg:py-10 relative z-10">
        
        {/* Coluna Esquerda: Texto Institucional com forte impacto e hierarquia SaaS */}
        <div className="w-full lg:w-[400px] xl:w-[460px] 2xl:w-[500px] flex-shrink-0 flex flex-col justify-between self-stretch py-2 lg:py-4 z-10">
          
          {/* Topo: Logo e Conteúdo Principal */}
          <div>
            <div className="mb-5 lg:mb-7">
              <img
                src="/images/logo_creeser.png"
                alt="Creeser Grupo Educacional"
                className="h-10 sm:h-12 xl:h-14 w-auto object-contain drop-shadow-sm"
              />
            </div>

            {/* Headline Principal de Grande Impacto */}
            <div className="mb-5 lg:mb-7">
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] xl:text-[46px] 2xl:text-[52px] font-black text-[#0a2342] leading-[1.22] sm:leading-[1.2] xl:leading-[1.18] tracking-tight">
                Conhecimento<br />
                que transforma<br />
                futuros
              </h1>
              <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm lg:text-[15px] xl:text-base text-slate-700 font-medium leading-relaxed max-w-[380px] xl:max-w-[440px]">
                Acesse o Portal Acadêmico e tenha tudo o que você precisa para a sua jornada educacional em um só lugar.
              </p>
            </div>

            {/* Lista de Recursos com Ícones Proporcionais e Destacados */}
            <div className="space-y-3.5 xl:space-y-4">
              
              {/* Item 1: Aulas e materiais */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0">
                  <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm xl:text-base font-bold text-slate-900 leading-snug">Aulas e materiais</p>
                  <p className="text-[11px] sm:text-xs xl:text-[13px] text-slate-600 font-medium">Acesse conteúdos e atividades</p>
                </div>
              </div>

              {/* Item 2: Horários e calendário */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 flex-shrink-0">
                  <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm xl:text-base font-bold text-slate-900 leading-snug">Horários e calendário</p>
                  <p className="text-[11px] sm:text-xs xl:text-[13px] text-slate-600 font-medium">Organize sua rotina acadêmica</p>
                </div>
              </div>

              {/* Item 3: Notas e avaliações */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 flex-shrink-0">
                  <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm xl:text-base font-bold text-slate-900 leading-snug">Notas e avaliações</p>
                  <p className="text-[11px] sm:text-xs xl:text-[13px] text-slate-600 font-medium">Acompanhe seu desempenho</p>
                </div>
              </div>

              {/* Item 4: Comunicação */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/25 flex-shrink-0">
                  <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm xl:text-base font-bold text-slate-900 leading-snug">Comunicação</p>
                  <p className="text-[11px] sm:text-xs xl:text-[13px] text-slate-600 font-medium">Fale com professores e coordenação</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Espaçador Central transparente para valorizar os personagens do background */}
        <div className="hidden lg:block flex-1 pointer-events-none"></div>

        {/* Coluna Direita: Card de Login Flutuante */}
        <div className="w-full lg:w-[380px] xl:w-[410px] 2xl:w-[430px] flex-shrink-0 flex flex-col items-center lg:items-end my-4 lg:my-0 z-20">
          
          {/* Link Superior: Voltar para o site */}
          <div className="w-full flex justify-end mb-3 sm:mb-4">
            <a
              href="https://creeser.com.br"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-[#0070f3] bg-white/95 hover:bg-white backdrop-blur-md px-4 py-2 sm:py-2.5 rounded-2xl shadow-md hover:shadow-lg border border-slate-200/90 transition-all duration-200 group"
            >
              <svg className="w-4 h-4 text-slate-600 group-hover:text-[#0070f3] group-hover:-translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Voltar para o site</span>
            </a>
          </div>

          <div className="bg-white rounded-[28px] xl:rounded-[32px] shadow-2xl p-6 sm:p-8 xl:p-9 w-full border border-slate-100/90 relative">
            
            {/* Logo dentro do Card */}
            <div className="flex justify-center mb-4">
              <img
                src="/images/logo_creeser.png"
                alt="Creeser"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </div>

            {/* Cabeçalho do Card */}
            <div className="text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Portal Acadêmico
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                Acesse sua conta para continuar
              </p>
            </div>

            {/* Seletor de Perfil: Aluno / Professor */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setTipoAcesso("aluno");
                  setErro("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tipoAcesso === "aluno"
                    ? "bg-[#0070f3] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Aluno</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoAcesso("professor");
                  setErro("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tipoAcesso === "professor"
                    ? "bg-[#0070f3] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Professor</span>
              </button>
            </div>

            {/* Formulário de Acesso */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Campo E-mail / Matrícula */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail ou matrícula
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tipoAcesso === "aluno" ? "Digite seu e-mail ou matrícula" : "Digite seu e-mail institucional"}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3] transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Campo Senha com link Esqueceu */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Senha</label>
                  <button
                    type="button"
                    onClick={() => setModalEsqueciSenha(true)}
                    className="text-xs font-medium text-[#0070f3] hover:text-[#005bb5] hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3] transition-all text-slate-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro */}
              {erro && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs leading-relaxed flex items-start gap-2">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <p className="flex-1 font-medium">{erro}</p>
                </div>
              )}

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-[#0070f3] hover:bg-[#0060df] active:bg-[#0051bb] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-1"
              >
                {carregando ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Conectando...
                  </span>
                ) : (
                  <>
                    <span>Entrar</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Badge de Ambiente Seguro */}
            <div className="mt-4 bg-[#f0f7ff] border border-[#d2e5fe] rounded-2xl p-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-[#0070f3]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Ambiente seguro</p>
                <p className="text-[10.5px] text-slate-500 leading-tight">Seus dados são protegidos e criptografados.</p>
              </div>
            </div>

          </div>

          {/* Link Discreto para Área Administrativa */}
          <div className="mt-3.5 text-center w-full">
            <a
              href="https://app.creeser.com.br/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0070f3] bg-white/80 hover:bg-white backdrop-blur-md px-4 py-2 rounded-full shadow-sm hover:shadow border border-slate-200/80 transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Área Administrativa</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

      </div>

      {/* Modal de Recuperação de Senha */}
      {modalEsqueciSenha && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0070f3] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Recuperação de Acesso</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Para redefinir sua senha ou recuperar seu acesso ao Portal Acadêmico, entre em contato com a <strong>Secretaria Acadêmica</strong> ou com a coordenação do seu curso.
            </p>
            <button
              type="button"
              onClick={() => setModalEsqueciSenha(false)}
              className="w-full bg-[#0070f3] hover:bg-[#0060df] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
