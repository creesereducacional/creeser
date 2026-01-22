/**
 * AdminFinanceiroLayout
 * Componente de layout para a área administrativa de financeiro
 * Fornece navegação sidebar e estrutura padrão para sub-páginas
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ========================================
// CONFIGURAÇÕES CONSTANTES
// ========================================

/**
 * Menu items da navegação do financeiro
 */
const MENU_ITEMS = [
  { href: '/admin-financeiro', label: '📊 Dashboard', icon: '📊' },
  { href: '/admin-financeiro/clientes', label: '👥 Clientes', icon: '👥' },
  { href: '/admin-financeiro/assinaturas', label: '📋 Assinaturas', icon: '📋' },
  { href: '/admin-financeiro/faturas', label: '💳 Faturas', icon: '💳' },
  { href: '/admin-financeiro/pagamentos', label: '💰 Pagamentos', icon: '💰' },
  { href: '/admin-financeiro/relatorios', label: '📈 Relatórios', icon: '📈' },
  { href: '/admin-financeiro/planos', label: '🎯 Planos', icon: '🎯' },
  { href: '/admin-financeiro/promocoes', label: '🎁 Promoções', icon: '🎁' },
];

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function AdminFinanceiroLayout({ children }) {
  const router = useRouter();
  
  // ========================================
  // ESTADO LOCAL
  // ========================================
  const [sidebarAberto, setSidebarAberto] = useState(true);

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Verifica se uma rota está ativa
   */
  const isAtivo = useCallback((href) => router.pathname === href, [router.pathname]);

  /**
   * Alterna sidebar aberto/fechado
   */
  const toggleSidebar = useCallback(() => {
    setSidebarAberto(prev => !prev);
  }, []);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* SEÇÃO: Cabeçalho */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
              title="Alternar menu"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <h1 className="text-2xl font-bold text-white">💼 Admin Financeiro</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <a className="px-4 py-2 text-sm text-slate-300 hover:text-white transition">
                ← Dashboard Educacional
              </a>
            </Link>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SEÇÃO: Sidebar de Navegação */}
        {sidebarAberto && (
          <aside className="w-64 bg-slate-800 border-r border-slate-700 shadow-lg overflow-y-auto">
            <nav className="p-4 space-y-2">
              {MENU_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`block w-full text-left px-4 py-3 rounded-lg transition ${
                      isAtivo(item.href)
                        ? 'bg-blue-600 text-white shadow-lg font-semibold'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>

            {/* Informações da Área */}
            <div className="p-4 border-t border-slate-700 mt-4">
              <div className="bg-slate-700 rounded-lg p-3 text-xs text-slate-300">
                <p className="font-semibold text-white mb-2">🔒 Área Restrita</p>
                <p className="leading-relaxed">
                  Apenas usuários de Suporte e Vendas têm acesso a esta área.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* SEÇÃO: Conteúdo Principal */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
