/**
 * AdminFinanceiroLayout
 * Layout do módulo financeiro usando o layout padrão do projeto.
 */

import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';

// ========================================
// CONFIGURAÇÕES CONSTANTES
// ========================================

/**
 * Menu items da navegação do financeiro
 */
const MENU_ITEMS = [
  { href: '/admin-financeiro', label: 'Dashboard', icon: '📊', habilitado: true },
  { href: '/admin-financeiro/alunos', label: 'Alunos', icon: '🎓', habilitado: true },
  { href: '/admin-financeiro/convenios', label: 'Convênios', icon: '🤝', habilitado: true },
  { href: '#', label: 'Relatórios', icon: '📈', habilitado: false },
];

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function AdminFinanceiroLayout({ children }) {
  const router = useRouter();
  const isAtivo = (href) => router.pathname === href;

  // ========================================
  // RENDER
  // ========================================

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
              <p className="text-sm text-gray-600">Gestão financeira integrada ao padrão visual administrativo</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition"
            >
              Voltar ao Dashboard
            </Link>
          </div>

          <nav className="flex flex-wrap gap-2">
            {MENU_ITEMS.map((item) => {
              if (!item.habilitado) {
                return (
                  <span
                    key={item.href}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                    title="Em breve"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
                    isAtivo(item.href)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </section>

        {children}
      </div>
    </DashboardLayout>
  );
}
