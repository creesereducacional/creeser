/**
 * pages/admin/backup.js
 * Exportação operacional de dados e documentação de backup.
 */

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';

const EXPORTS = [
  {
    tipo: 'alunos',
    icon: '📚',
    titulo: 'Alunos',
    descricao: 'Exporta todos os alunos com status, curso, turma, CPF e e-mail.',
  },
  {
    tipo: 'contratos',
    icon: '📄',
    titulo: 'Contratos',
    descricao: 'Exporta alunos com status de contrato, datas de envio e assinatura.',
  },
];

function ExportCard({ tipo, icon, titulo, descricao }) {
  const [baixando, setBaixando] = useState(false);

  const baixar = async () => {
    setBaixando(true);
    try {
      const url = `/api/admin/export?tipo=${tipo}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `creeser_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setBaixando(false), 1500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 mb-0.5">{titulo}</h3>
        <p className="text-sm text-gray-500 mb-3">{descricao}</p>
        <button
          onClick={baixar}
          disabled={baixando}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2">
          {baixando ? '⏳ Gerando…' : '⬇️ Exportar CSV'}
        </button>
      </div>
    </div>
  );
}

export default function Backup() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon="💾"
          title="Backup e Exportação"
          description="Exportação de dados operacionais e documentação de backup"
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Backup' },
          ]}
        />

        {/* Exportações disponíveis */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Exportações CSV</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXPORTS.map(e => <ExportCard key={e.tipo} {...e} />)}
            {/* Logs de auditoria */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">📋</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-0.5">Logs de Auditoria</h3>
                <p className="text-sm text-gray-500 mb-3">Exporta logs operacionais com filtros personalizados.</p>
                <a href="/admin/logs"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition">
                  📋 Abrir Logs
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Supabase */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">☁️ Backup Supabase (Banco de Dados)</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="font-medium text-gray-800">Acesse o Supabase Dashboard</p>
                <p>→ <a href="https://supabase.com/dashboard" className="text-teal-600 underline" target="_blank" rel="noreferrer">supabase.com/dashboard</a> → Seu projeto → <strong>Project Settings</strong></p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <div>
                <p className="font-medium text-gray-800">Backup automático (planos pagos)</p>
                <p>Em <strong>Database → Backups</strong>, ative backups diários automáticos. Plano Free tem PITR limitado.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <div>
                <p className="font-medium text-gray-800">Backup manual via CLI</p>
                <code className="block mt-1 bg-gray-100 rounded px-3 py-2 text-xs font-mono">
                  pg_dump "postgresql://postgres:[senha]@[host]:5432/postgres" &gt; backup_{'{'}data{'}'}.sql
                </code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <div>
                <p className="font-medium text-gray-800">Restore</p>
                <code className="block mt-1 bg-gray-100 rounded px-3 py-2 text-xs font-mono">
                  psql "postgresql://postgres:[senha]@[host]:5432/postgres" &lt; backup.sql
                </code>
              </div>
            </li>
          </ol>
        </div>

        {/* Health Check rápido */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Status do Sistema</p>
            <p className="text-sm text-gray-500 mt-0.5">Verifique integridade do banco, envs e integrações</p>
          </div>
          <a href="/api/health" target="_blank" rel="noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
            🔍 /api/health
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
