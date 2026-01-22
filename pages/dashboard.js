import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    console.log('[DASHBOARD] Iniciando redirecionamento automático...');
    
    try {
      const usuarioStr = localStorage.getItem("usuario");
      
      if (!usuarioStr) {
        console.log('[DASHBOARD] Nenhum usuario no localStorage - redirecionando para login');
        router.push("/login");
        return;
      }

      const usuarioObj = JSON.parse(usuarioStr);
      console.log('[DASHBOARD] Usuario encontrado:', usuarioObj.email, 'Tipo:', usuarioObj.tipo);
      
      // Redirecionar para o dashboard correto baseado no tipo
      if (usuarioObj.tipo === "admin") {
        console.log('[DASHBOARD] Redirecionando admin para /admin/dashboard');
        router.push("/admin/dashboard");
      } else if (usuarioObj.tipo === "professor") {
        console.log('[DASHBOARD] Redirecionando professor para /professor/dashboard');
        router.push("/professor/dashboard");
      } else if (usuarioObj.tipo === "aluno") {
        console.log('[DASHBOARD] Redirecionando aluno para /aluno/dashboard');
        router.push("/aluno/dashboard");
      } else {
        console.warn('[DASHBOARD] Tipo de usuario desconhecido, redirecionando para login');
        router.push("/login");
      }
    } catch (error) {
      console.error('[DASHBOARD] Erro ao ler usuario:', error);
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-600 to-teal-800">
      <div className="text-center">
        <div className="mb-4 text-4xl animate-bounce">⏳</div>
        <p className="text-white text-lg">Redirecionando...</p>
      </div>
    </div>
  );
}
