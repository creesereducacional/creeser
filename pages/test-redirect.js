import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function TestRedirect() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const addLog = (msg) => {
      console.log(msg);
      setLogs(prev => [...prev, msg]);
    };

    addLog('[TEST] Iniciando verificação...');
    
    const usu = localStorage.getItem("usuario");
    addLog(`[TEST] Usuario no localStorage: ${usu ? "SIM" : "NÃO"}`);
    
    if (usu) {
      const usuarioObj = JSON.parse(usu);
      addLog(`[TEST] Email: ${usuarioObj.email}`);
      addLog(`[TEST] Tipo: ${usuarioObj.tipo}`);
      setUsuario(usuarioObj);
    }
  }, []);

  const handleLogin = async (email, senha, tipo) => {
    const addLog = (msg) => {
      console.log(msg);
      setLogs(prev => [...prev, msg]);
    };

    addLog(`\n[TEST LOGIN] Testando login como ${tipo}...`);
    
    try {
      const res = await fetch("/api/usuarios");
      const usuarios = await res.json();

      const usuarioEncontrado = usuarios.find(
        (u) => u.email === email && u.senha === senha
      );

      if (!usuarioEncontrado) {
        addLog('[TEST LOGIN] Usuario não encontrado!');
        return;
      }

      addLog(`[TEST LOGIN] Usuario encontrado: ${usuarioEncontrado.email}`);
      addLog(`[TEST LOGIN] Tipo no banco: ${usuarioEncontrado.tipo}`);
      
      localStorage.setItem("token", "token_" + usuarioEncontrado.id);
      localStorage.setItem("usuario", JSON.stringify(usuarioEncontrado));
      
      addLog('[TEST LOGIN] Dados salvos no localStorage');
      
      setTimeout(() => {
        addLog(`[TEST LOGIN] Redirecionando para ${tipo === 'admin' ? '/admin/dashboard' : tipo === 'professor' ? '/professor/dashboard' : '/aluno/dashboard'}`);
        
        if (usuarioEncontrado.tipo === "admin") {
          addLog('[TEST LOGIN] >>> Redirect: /admin/dashboard');
          router.push("/admin/dashboard");
        } else if (usuarioEncontrado.tipo === "professor") {
          addLog('[TEST LOGIN] >>> Redirect: /professor/dashboard');
          router.push("/professor/dashboard");
        } else if (usuarioEncontrado.tipo === "aluno") {
          addLog('[TEST LOGIN] >>> Redirect: /aluno/dashboard');
          router.push("/aluno/dashboard");
        }
      }, 50);
    } catch (err) {
      addLog(`[TEST LOGIN] Erro: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Teste de Redirecionamento</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-bold mb-4">Estado Atual</h2>
          {usuario ? (
            <div className="bg-green-50 p-4 rounded border border-green-300">
              <p><strong>Email:</strong> {usuario.email}</p>
              <p><strong>Tipo:</strong> {usuario.tipo}</p>
              <p><strong>Nome:</strong> {usuario.nomeCompleto}</p>
              <button
                onClick={() => {
                  localStorage.removeItem('usuario');
                  location.reload();
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <p className="text-gray-600">Nenhum usuário logado</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-bold mb-4">Testar Logins</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleLogin('admin@creeser.com', 'admin123', 'admin')}
              className="w-full px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
            >
              👨‍💼 Login Admin
            </button>
            <button
              onClick={() => handleLogin('professor@creeser.com', 'prof123', 'professor')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              👨‍🏫 Login Professor
            </button>
            <button
              onClick={() => handleLogin('aluno@creeser.com', 'aluno123', 'aluno')}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded hover:bg-teal-700 font-semibold"
            >
              👨‍🎓 Login Aluno
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">📋 Logs</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Nenhum log ainda...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
