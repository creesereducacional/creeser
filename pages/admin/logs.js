/**
 * pages/admin/logs.js
 * Painel de auditoria centralizada — apenas grupo_admin / instituicao_admin.
 */

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';

const MODULOS = ['', 'auth', 'comercial', 'financeiro', 'admin', 'recepcao', 'professor', 'aluno'];
const ACOES   = ['', 'LOGIN', 'LOGIN_FALHA', 'LOGIN_BLOQUEADO', 'CRIAR', 'EDITAR', 'DELETAR', 'EXPORTAR', 'BAIXA_MANUAL', 'GERAR_CONTRATO', 'ASSINAR_CONTRATO', 'CRIAR_LEAD', 'PRE_CADASTRO'];
const PERFIS  = ['', 'grupo_admin', 'instituicao_admin', 'financeiro', 'comercial_master', 'comercial_operador', 'recepcao', 'coordenador', 'professor'];

const BADGE = {
  LOGIN:           'bg-green-50 text-green-700 border-green-200',
  LOGIN_FALHA:     'bg-red-50 text-red-700 border-red-200',
  LOGIN_BLOQUEADO: 'bg-orange-50 text-orange-700 border-orange-200',
  CRIAR:           'bg-blue-50 text-blue-700 border-blue-200',
  EDITAR:          'bg-amber-50 text-amber-700 border-amber-200',
  DELETAR:         'bg-red-50 text-red-700 border-red-200',
  EXPORTAR:        'bg-purple-50 text-purple-700 border-purple-200',
};

function AcaoBadge({ acao }) {
  const cls = BADGE[acao] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {acao}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AdminLogs() {
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]           = useState(null);
  const [expandido, setExpandido] = useState(null);

  // Filtros
  const [filtroModulo,  setFiltroModulo]  = useState('');
  const [filtroAcao,    setFiltroAcao]    = useState('');
  const [filtroPerfil,  setFiltroPerfil]  = useState('');
  const [filtroEmail,   setFiltroEmail]   = useState('');
  const [filtroInicio,  setFiltroInicio]  = useState('');
  const [filtroFim,     setFiltroFim]     = useState('');

  const buscar = useCallback(async (p = 1) => {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (filtroModulo)  params.set('modulo', filtroModulo);
      if (filtroAcao)    params.set('acao', filtroAcao);
      if (filtroPerfil)  params.set('perfil', filtroPerfil);
      if (filtroEmail)   params.set('usuario_email', filtroEmail);
      if (filtroInicio)  params.set('data_inicio', filtroInicio);
      if (filtroFim)     params.set('data_fim', filtroFim);

      const res = await fetch(`/api/admin/logs?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar logs');
      setLogs(json.logs || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
      setPage(p);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [filtroModulo, filtroAcao, filtroPerfil, filtroEmail, filtroInicio, filtroFim]);

  useEffect(() => { buscar(1); }, []);

  const exportar = async () => {
    const params = new URLSearchParams({ exportCsv: '1' });
    if (filtroModulo)  params.set('modulo', filtroModulo);
    if (filtroAcao)    params.set('acao', filtroAcao);
    if (filtroPerfil)  params.set('perfil', filtroPerfil);
    if (filtroEmail)   params.set('usuario_email', filtroEmail);
    if (filtroInicio)  params.set('data_inicio', filtroInicio);
    if (filtroFim)     params.set('data_fim', filtroFim);
    window.open(`/api/admin/logs?${params}`, '_blank');
  };

  const limparFiltros = () => {
    setFiltroModulo(''); setFiltroAcao(''); setFiltroPerfil('');
    setFiltroEmail(''); setFiltroInicio(''); setFiltroFim('');
    setTimeout(() => buscar(1), 50);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon="📋"
          title="Logs de Auditoria"
          description="Histórico centralizado de ações operacionais do sistema"
          badge={total > 0 ? { label: `${total} registros`, variant: 'info' } : undefined}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Logs' },
          ]}
        />

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">MÓDULO</label>
              <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:outline-none">
                {MODULOS.map(m => <option key={m} value={m}>{m || '— Todos —'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">AÇÃO</label>
              <select value={filtroAcao} onChange={e => setFiltroAcao(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:outline-none">
                {ACOES.map(a => <option key={a} value={a}>{a || '— Todas —'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">PERFIL</label>
              <select value={filtroPerfil} onChange={e => setFiltroPerfil(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:outline-none">
                {PERFIS.map(p => <option key={p} value={p}>{p || '— Todos —'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">E-MAIL</label>
              <input value={filtroEmail} onChange={e => setFiltroEmail(e.target.value)}
                placeholder="Buscar usuário…"
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">DE</label>
              <input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">ATÉ</label>
              <input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => buscar(1)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition">
              🔍 Filtrar
            </button>
            <button onClick={limparFiltros}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition">
              ✕ Limpar
            </button>
            <button onClick={exportar}
              className="ml-auto px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-semibold rounded-lg transition">
              ⬇️ Exportar CSV
            </button>
          </div>
        </div>

        {/* ── Erro ────────────────────────────────────────────────────────── */}
        {erro && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            ⚠️ {erro}
          </div>
        )}

        {/* ── Tabela ──────────────────────────────────────────────────────── */}
        {carregando ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <SkeletonTable rows={10} cols={7} />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nenhum log encontrado"
            description="Quando ações forem realizadas no sistema, aparecerão aqui. Execute a migration SQL para criar a tabela audit_logs."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">DATA/HORA</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">USUÁRIO</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">PERFIL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">AÇÃO</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">MÓDULO</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ENTIDADE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">DETALHES</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <>
                      <tr key={log.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setExpandido(expandido === log.id ? null : log.id)}>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{log.usuario_email || '—'}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{log.perfil || '—'}</td>
                        <td className="px-4 py-2.5"><AcaoBadge acao={log.acao} /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{log.modulo || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {log.entidade ? (
                            <span>{log.entidade}{log.id_entidade ? <span className="ml-1 text-gray-400">#{log.id_entidade}</span> : ''}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{log.ip || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-teal-600">
                          {log.detalhes ? (expandido === log.id ? '▲ fechar' : '▼ ver') : '—'}
                        </td>
                      </tr>
                      {expandido === log.id && log.detalhes && (
                        <tr key={`${log.id}-det`} className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-3">
                            <pre className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
                              {JSON.stringify(log.detalhes, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{total} registro(s) — página {page} de {totalPages}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => buscar(page - 1)} disabled={page <= 1}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition">
                  ← Anterior
                </button>
                <button
                  onClick={() => buscar(page + 1)} disabled={page >= totalPages}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition">
                  Próxima →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
