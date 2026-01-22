import Link from 'next/link';
import { useState } from 'react';

export default function EADCreeser() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* SIDEBAR */}
      <aside className={`w-60 bg-gradient-to-b from-teal-700 to-teal-800 text-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
        <div className="p-6 border-b border-teal-600">
          <h2 className="text-2xl font-bold">CREESER</h2>
          <p className="text-teal-100 text-sm mt-1">Módulo EAD</p>
        </div>
        
        <nav className="mt-6 space-y-1 px-3">
          <a href="#" className="block px-4 py-3 rounded-lg text-sm hover:bg-teal-600 transition duration-200 border-l-4 border-teal-300">
            Início
          </a>
          <a href="#cursos" className="block px-4 py-3 rounded-lg text-sm hover:bg-teal-600 transition duration-200">
            Cursos
          </a>
          <a href="#sobre" className="block px-4 py-3 rounded-lg text-sm hover:bg-teal-600 transition duration-200">
            Sobre
          </a>
          <a href="#contato" className="block px-4 py-3 rounded-lg text-sm hover:bg-teal-600 transition duration-200">
            Contato
          </a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="bg-gradient-to-r from-teal-700 to-teal-800 text-white py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-white p-2"
              >
                ☰
              </button>
              
              <h1 className="text-2xl font-bold flex-1 md:flex-none">CREESER - Educação a Distância</h1>
              
              <div className="flex items-center gap-4">
                <Link href="/login">
                  <button className="bg-white text-teal-700 font-bold px-4 py-2 rounded hover:bg-gray-100 transition">
                    Voltar ao CREESER
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 p-6">
          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-4xl font-bold text-teal-700 mb-4">💚 O Futuro da Educação</h2>
            <p className="text-xl text-gray-700 mb-6">
              Bem-vindo ao módulo de <strong>Educação a Distância (EAD)</strong> do CREESER. 
              Uma plataforma moderna, completa e acessível para aprender de qualquer lugar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-teal-50 rounded-lg border-l-4 border-teal-600">
                <h3 className="font-bold text-teal-900 mb-2 text-lg">🎯 Missão</h3>
                <p className="text-teal-800">
                  Oferecer educação de qualidade, acessível e flexível através de uma plataforma 
                  inovadora que atende alunos, professores e gestores.
                </p>
              </div>
              <div className="p-6 bg-teal-50 rounded-lg border-l-4 border-teal-600">
                <h3 className="font-bold text-teal-900 mb-2 text-lg">🚀 Visão</h3>
                <p className="text-teal-800">
                  Ser a plataforma de referência em educação a distância no Brasil, 
                  promovendo inovação, qualidade e acessibilidade.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/ead_creeser_login">
                <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold py-4 rounded-lg hover:from-teal-700 hover:to-teal-800 transition shadow-lg text-lg">
                  🔐 Área do Aluno
                </button>
              </Link>
              <Link href="/ead_creeser_login">
                <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition shadow-lg text-lg">
                  👨‍💼 Área Administrativa
                </button>
              </Link>
            </div>
          </div>

          {/* Recursos Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">✨ Nossos Recursos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="text-4xl mb-2">📹</div>
                <h3 className="font-bold text-blue-900 mb-2">Videoaulas</h3>
                <p className="text-sm text-blue-800">Aulas em alta qualidade, disponíveis on-demand 24/7</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="text-4xl mb-2">📚</div>
                <h3 className="font-bold text-green-900 mb-2">Materiais</h3>
                <p className="text-sm text-green-800">Apostilas, PDFs e recursos complementares</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="font-bold text-yellow-900 mb-2">Avaliações</h3>
                <p className="text-sm text-yellow-800">Testes e exercícios interativos</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                <div className="text-4xl mb-2">💬</div>
                <h3 className="font-bold text-pink-900 mb-2">Comunidade</h3>
                <p className="text-sm text-pink-800">Fóruns e espaços de discussão</p>
              </div>
            </div>
          </div>

          {/* Cursos Disponíveis */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📖 Cursos Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border-2 border-teal-200 rounded-lg hover:shadow-lg transition">
                <h3 className="font-bold text-teal-700 mb-2 text-lg">Introdução ao CREESER</h3>
                <p className="text-gray-600 text-sm mb-4">Aprenda os fundamentos do sistema educacional.</p>
                <p className="text-xs text-gray-500 mb-4">⏱️ 4 semanas | 📊 Básico</p>
                <button className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition text-sm font-semibold">
                  Visualizar
                </button>
              </div>

              <div className="p-6 bg-white border-2 border-teal-200 rounded-lg hover:shadow-lg transition">
                <h3 className="font-bold text-teal-700 mb-2 text-lg">Ferramentas Avançadas</h3>
                <p className="text-gray-600 text-sm mb-4">Domine funcionalidades avançadas do sistema.</p>
                <p className="text-xs text-gray-500 mb-4">⏱️ 6 semanas | 📊 Intermediário</p>
                <button className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition text-sm font-semibold">
                  Visualizar
                </button>
              </div>

              <div className="p-6 bg-white border-2 border-teal-200 rounded-lg hover:shadow-lg transition">
                <h3 className="font-bold text-teal-700 mb-2 text-lg">Gestão e Relatórios</h3>
                <p className="text-gray-600 text-sm mb-4">Aprenda a gerenciar dados e gerar relatórios.</p>
                <p className="text-xs text-gray-500 mb-4">⏱️ 5 semanas | 📊 Avançado</p>
                <button className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition text-sm font-semibold">
                  Visualizar
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-6 rounded-lg text-center">
            <p className="mb-2">© 2024 CREESER Educacional - Módulo EAD</p>
            <p className="text-sm text-gray-400">Plataforma Integrada de Gestão Educacional</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
