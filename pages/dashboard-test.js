import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function DashboardTest() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const usuarioStr = localStorage.getItem("usuario");
    
    if (!usuarioStr) {
      router.push("/login");
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioStr));
    } catch (error) {
      console.error("Erro ao parsear usuario:", error);
      router.push("/login");
    }
  }, [mounted, router]);

  if (!mounted || !usuario) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-teal-700 mb-4">✅ DASHBOARD PRINCIPAL</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8">
          <p className="text-lg font-bold text-blue-900">Você está na página CORRETA!</p>
          <p className="text-blue-800 mt-2">Usuário: {usuario.nomeCompleto}</p>
          <p className="text-blue-800">Email: {usuario.email}</p>
          <p className="text-blue-800">Tipo: {usuario.tipo}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-green-900 mb-3">✓ Status</h3>
            <p className="text-green-800">Autenticado com sucesso</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">⚠ Aviso</h3>
            <p className="text-yellow-800">Esta é uma página de TESTE</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-purple-900 mb-3">ℹ Info</h3>
            <p className="text-purple-800">Sem DashboardLayout</p>
          </div>
        </div>

        <div className="mt-8 bg-gray-100 p-6 rounded-lg">
          <h3 className="font-bold mb-4">Dados de Authenticação:</h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
{JSON.stringify(usuario, null, 2)}
          </pre>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              localStorage.removeItem('usuario');
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
          >
            🚪 Sair
          </button>
          <button
            onClick={() => router.push('/dashboard_ead')}
            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition"
          >
            📚 Ir para EAD
          </button>
        </div>
      </div>
    </div>
  );
}
