import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

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
      
      // Salvar token e dados do usuário
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      
      console.log('[LOGIN] Login bem-sucedido:', {
        email: data.usuario.email,
        tipo: data.usuario.tipo,
      });

      // Aguarda um pouco para garantir que localStorage foi salvo
      setTimeout(() => {
        // Redireciona conforme tipo de usuário
        console.log('[LOGIN] Redirecionando usuario tipo:', data.usuario.tipo);
        if (data.usuario.tipo === "admin") {
          router.push("/admin/dashboard");
        } else if (data.usuario.tipo === "professor") {
          router.push("/professor/dashboard");
        } else if (data.usuario.tipo === "aluno") {
          router.push("/aluno/home");
        } else {
          router.push("/login");
        }
      }, 50);
    } catch (err) {
      console.error('[LOGIN] Erro:', err);
      setErro("Erro ao conectar ao servidor. Verifique sua conexão.");
      setCarregando(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/bg_creeser.jpg)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay escuro para melhorar contraste */}
      <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500 opacity-10 rounded-full -mr-48 -mt-48 z-0"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400 opacity-10 rounded-full -ml-48 -mb-48 z-0"></div>

      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative z-10">
        {/* Header com Logo Centralizada */}
        <div className="flex justify-center mb-8">
          <div className="w-64 h-auto">
            <img src="/images/logo_creeser.png" alt="CREESER Educacional" className="w-full h-auto object-contain" />
          </div>
        </div>
        
        <div className="mb-8 border-b border-teal-200 pb-6">
          <p className="text-center text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-2">
            Portal Acadêmico
          </p>
          <p className="text-center text-gray-600 text-sm mt-2">
            Dados de Acesso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">
              📧 Email ou Usuário
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">
              🔒 Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
              required
            />
          </div>

          {erro && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{erro}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold py-3 rounded-lg hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {carregando ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Conectando...
              </span>
            ) : (
              "🔓 Acessar Sistema"
            )}
          </button>
        </form>
          
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link href="/">
            <button
              type="button"
              className="w-full text-teal-600 hover:text-teal-700 font-semibold py-2 rounded-lg hover:bg-teal-50 transition text-sm"
            >
              ← Voltar para Home
            </button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600 text-xs font-semibold uppercase tracking-wider mb-4">Dados de Acesso</p>
          <div className="space-y-2 text-sm">
            <div className="bg-teal-50 border-l-4 border-teal-600 p-3 rounded-r">
              <p className="font-bold text-teal-900">👤 Admin:</p>
              <p className="text-teal-800 text-xs font-mono mt-1">admin@creeser.com / admin123</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r">
              <p className="font-bold text-blue-900">👨‍🏫 Professor:</p>
              <p className="text-blue-800 text-xs font-mono mt-1">professor@creeser.com / prof123</p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-600 p-3 rounded-r">
              <p className="font-bold text-purple-900">👨‍🎓 Aluno:</p>
              <p className="text-purple-800 text-xs font-mono mt-1">aluno@creeser.com / aluno123</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Sistema de Gerenciamento Educacional</p>
          <p>© 2024 CREESER Educacional</p>
        </div>
      </div>
    </div>
  );
}
