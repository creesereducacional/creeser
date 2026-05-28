import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import StatusBadge  from '@/components/ui/StatusBadge';
import EmptyState   from '@/components/ui/EmptyState';
import PageHeader   from '@/components/ui/PageHeader';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';

const STATUS_CONTRATO = ['', 'NAO_GERADO', 'GERADO', 'ENVIADO_ASSINATURA', 'ASSINADO', 'RECUSADO', 'EXPIRADO', 'CANCELADO', 'ERRO'];

// Mapeamento status_contrato → variante do StatusBadge global
const STATUS_TO_VARIANT = {
  NAO_GERADO:         { variant: 'neutral', label: 'Não Gerado',      icon: '○'  },
  GERADO:             { variant: 'info',    label: 'Gerado',          icon: '📝' },
  ENVIADO_ASSINATURA: { variant: 'warning', label: 'Env. Assinatura', icon: '✉'   },
  ASSINADO:           { variant: 'success', label: 'Assinado',        icon: '✓'   },
  RECUSADO:           { variant: 'danger',  label: 'Recusado',        icon: '✗'   },
  EXPIRADO:           { variant: 'orange',  label: 'Vencido',         icon: '⏰'   },
  CANCELADO:          { variant: 'neutral', label: 'Cancelado',       icon: '✕'   },
  ERRO:               { variant: 'purple',  label: 'Erro',            icon: '⚡'   },
};

function ContratoBadge({ status }) {
  const cfg = STATUS_TO_VARIANT[status] || { variant: 'neutral', label: status || '—', icon: '?' };
  return <StatusBadge variant={cfg.variant} label={cfg.label} icon={cfg.icon} dot />;
}

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function RelatorioContratos() {
  const [dados, setDados]             = useState([]);
  const [cursos, setCursos]           = useState([]);
  const [turmas, setTurmas]           = useState([]);
  const [carregando, setCarregando]   = useState(false);
  const [erro, setErro]               = useState(null);

  const [filtroStatus,  setFiltroStatus]  = useState('');
  const [filtroCurso,   setFiltroCurso]   = useState('');
  const [filtroTurma,   setFiltroTurma]   = useState('');
  const [filtroNome,    setFiltroNome]    = useState('');

  useEffect(() => {
    fetch('/api/cursos', { credentials: 'include' }).then(r => r.ok ? r.json() : []).then(d => setCursos(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/turmas', { credentials: 'include' }).then(r => r.ok ? r.json() : []).then(d => setTurmas(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const buscar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    const params = new URLSearchParams();
    if (filtroStatus) params.append('status_contrato', filtroStatus);
    if (filtroCurso)  params.append('curso', filtroCurso);
    if (filtroTurma)  params.append('turma', filtroTurma);
    fetch(`/api/contratos/relatorio?${params}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setDados(Array.isArray(d) ? d : []))
      .catch(() => setErro('Erro ao carregar relatório.'))
      .finally(() => setCarregando(false));
  }, [filtroStatus, filtroCurso, filtroTurma]);

  useEffect(() => { buscar(); }, [buscar]);

  const dadosFiltrados = dados.filter(a =>
    !filtroNome || a.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  function exportarCSV() {
    const params = new URLSearchParams();
    if (filtroStatus) params.append('status_contrato', filtroStatus);
    if (filtroCurso)  params.append('curso', filtroCurso);
    if (filtroTurma)  params.append('turma', filtroTurma);
    params.append('formato', 'csv');
    window.open(`/api/contratos/relatorio?${params}`, '_blank');
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Cabeçalho */}
        <PageHeader
          icon="📋"
          title="Lista de Contratos"
          subtitle={`${dadosFiltrados.length} registro(s) encontrado(s)`}
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Contratos', href: '/admin/contratos/dashboard' }, { label: 'Lista' }]}
          actions={[
            <Link key="dash" href="/admin/contratos/dashboard">
              <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">← Dashboard</button>
            </Link>,
            <button key="refresh" onClick={buscar} className="px-4 py-2 border border-teal-300 text-teal-700 rounded-xl text-sm hover:bg-teal-50 transition-colors">🔄 Atualizar</button>,
            <button key="csv" onClick={exportarCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">⬇️ Exportar CSV</button>,
          ]}
        />

        {/* Filtros */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">STATUS CONTRATO</label>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">— Todos —</option>
              {STATUS_CONTRATO.slice(1).map(s => (
                <option key={s} value={s}>{STATUS_TO_VARIANT[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">CURSO</label>
            <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">— Todos —</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">TURMA</label>
            <select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">— Todas —</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">NOME DO ALUNO</label>
            <input value={filtroNome} onChange={e => setFiltroNome(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
        </div>

        {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>}

        {carregando ? (
          <SkeletonTable rows={6} cols={9} />
        ) : dadosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <EmptyState
              icon="📄"
              title="Nenhum contrato encontrado"
              description="Ajuste os filtros para ver os contratos dos alunos."
            />
          </div>
        ) : (
          <>
            {/* Cards — mobile / tablet */}
            <div className="lg:hidden space-y-3">
              {dadosFiltrados.map(a => (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{a.nome}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{a.cpf || '—'}</p>
                    </div>
                    <ContratoBadge status={a.statusContrato} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[10px]">Curso</p>
                      <p className="mt-0.5">{a.curso || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[10px]">Turma</p>
                      <p className="mt-0.5">{a.turma || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[10px]">Envio</p>
                      <p className="mt-0.5">{fmtDate(a.dataEnvioContrato) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[10px]">Assinatura</p>
                      <p className="mt-0.5 text-green-700 font-medium">{fmtDate(a.dataAssinaturaContrato) || '—'}</p>
                    </div>
                  </div>
                  {/* Ações */}
                  <div className="flex gap-2 flex-wrap border-t border-gray-100 pt-3">
                    <a href={`/admin/alunos/contrato/${a.id}`} target="_blank" rel="noreferrer"
                      className="flex-1 text-center px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors">
                      📄 Ver PDF
                    </a>
                    <a href={`/admin/alunos/contrato/${a.id}?autoprint=1`} target="_blank" rel="noreferrer"
                      className="flex-1 text-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors">
                      🖨️ Imprimir
                    </a>
                    <Link href={`/admin/alunos/${a.id}`}
                      className="flex-1 text-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors">
                      👤 Ver Aluno
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabela — desktop */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-teal-50 border-b border-teal-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Aluno</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Curso</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Turma</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Matrícula</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Contrato</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Envio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Assinatura</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosFiltrados.map(a => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-teal-50/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">#{a.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{a.nome}</p>
                          <p className="text-xs text-gray-400">{a.cpf || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{a.curso || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{a.turma || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{a.statusMatricula || '—'}</span>
                        </td>
                        <td className="px-4 py-3"><ContratoBadge status={a.statusContrato} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(a.dataEnvioContrato) || '—'}</td>
                        <td className="px-4 py-3 text-xs">
                          {fmtDate(a.dataAssinaturaContrato)
                            ? <span className="text-green-700 font-semibold">{fmtDate(a.dataAssinaturaContrato)}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <a href={`/admin/alunos/contrato/${a.id}`} target="_blank" rel="noreferrer"
                              title="Ver contrato / PDF"
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-xs font-medium transition-colors">
                              📄 PDF
                            </a>
                            <a href={`/admin/alunos/contrato/${a.id}?autoprint=1`} target="_blank" rel="noreferrer"
                              title="Imprimir contrato"
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded text-xs font-medium transition-colors">
                              🖨️
                            </a>
                            <Link href={`/admin/alunos/${a.id}`}
                              title="Ver aluno"
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium transition-colors">
                              👤
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                <span>{dadosFiltrados.length} registro(s)</span>
                <button onClick={exportarCSV} className="text-green-600 hover:text-green-800 font-medium transition-colors">
                  ⬇️ Exportar CSV
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
