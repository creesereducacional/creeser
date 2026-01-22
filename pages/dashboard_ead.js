import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardEAD() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    console.log('[DASHBOARD_EAD] Verificando localStorage...');
    
    // Tenta ler de usuario_ead primeiro (login via ead_creeser_login)
    let usu = localStorage.getItem("usuario_ead");
    let whichKey = 'usuario_ead';
    
    // Se não encontrou usuario_ead, tenta ler de usuario (login via CREESER)
    if (!usu) {
      usu = localStorage.getItem("usuario");
      whichKey = 'usuario';
    }

    console.log('[DASHBOARD_EAD] Chave usada:', whichKey, 'Dados encontrados:', !!usu);

    if (usu) {
      try {
        const usuarioObj = JSON.parse(usu);
        console.log('[DASHBOARD_EAD] Usuario parseado de chave ' + whichKey + ':', { 
          email: usuarioObj.email,
          tipo: usuarioObj.tipo 
        });
        
        // Validar que é aluno
        if (usuarioObj.tipo !== "aluno") {
          console.warn('[DASHBOARD_EAD] Usuário não é aluno, redirecionando...');
          if (usuarioObj.tipo === "admin") {
            router.push("/admin/dashboard");
          } else if (usuarioObj.tipo === "professor") {
            router.push("/professor/dashboard");
          } else {
            router.push("/login");
          }
          return;
        }
        
        setUsuario(usuarioObj);
      } catch (e) {
        console.error('[DASHBOARD_EAD] Erro ao parsear usuário:', e);
        router.push("/ead_creeser_login");
      }
    } else {
      console.log('[DASHBOARD_EAD] Nenhum usuario encontrado em nenhuma chave, redirecionando');
      router.push("/ead_creeser_login");
    }
  }, [mounted, router]);

  if (!mounted || !usuario) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6 text-teal-700">📚 Módulo EAD</h1>
        
        {/* Cards de Cursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
            <h3 className="text-lg font-bold text-teal-700 mb-2">📖 Curso de Introdução</h3>
            <p className="text-gray-600 text-sm mb-4">Aprenda os fundamentos do sistema educacional.</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-teal-600 h-2 rounded-full" style={{width: '65%'}}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">65% completo</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
            <h3 className="text-lg font-bold text-teal-700 mb-2">🎓 Curso Avançado</h3>
            <p className="text-gray-600 text-sm mb-4">Aprofunde seus conhecimentos com tópicos avançados.</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-teal-600 h-2 rounded-full" style={{width: '40%'}}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">40% completo</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
            <h3 className="text-lg font-bold text-teal-700 mb-2">🚀 Novo Curso</h3>
            <p className="text-gray-600 text-sm mb-4">Comece um novo curso de desenvolvimento.</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-teal-600 h-2 rounded-full" style={{width: '0%'}}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">0% completo</p>
          </div>
        </div>

        {/* Seção Principal */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Bem-vindo ao Módulo EAD</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              O módulo de <strong>Educação a Distância (EAD)</strong> do CREESER oferece uma plataforma 
              completa para ensino online, com recursos modernos e acessíveis.
            </p>
            <p>
              Nesta interface você pode:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>📹 Acessar videoaulas gravadas e ao vivo</li>
              <li>📚 Baixar materiais didáticos e apostilas</li>
              <li>✅ Realizar avaliações e atividades</li>
              <li>💬 Participar de fóruns de discussão</li>
              <li>📊 Acompanhar seu progresso e desempenho</li>
            </ul>
            <p className="mt-4 p-4 bg-teal-50 rounded border-l-4 border-teal-600">
              <strong>Dica:</strong> Use o menu à esquerda para navegar entre os cursos disponíveis 
              e acompanhar seu desempenho. Seus progresso é sincronizado com sua conta CREESER.
            </p>
          </div>
        </div>

        {/* Seção de Estatísticas */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Seu Desempenho</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">3</div>
              <p className="text-gray-600 mt-2">Cursos Inscritos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">1</div>
              <p className="text-gray-600 mt-2">Cursos Concluídos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">52%</div>
              <p className="text-gray-600 mt-2">Taxa de Conclusão Média</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">8.5</div>
              <p className="text-gray-600 mt-2">Média Geral</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
