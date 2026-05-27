import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

const STATUS_CONTRATO = ['', 'NAO_GERADO', 'GERADO', 'ENVIADO_ASSINATURA', 'ASSINADO', 'RECUSADO', 'EXPIRADO'];
const STATUS_LABEL = {
  NAO_GERADO:         'Não Gerado',
  GERADO:             'Gerado',
  ENVIADO_ASSINATURA: 'Enviado p/ Assinatura',
  ASSINADO:           'Assinado',
  RECUSADO:           'Recusado',
  EXPIRADO:           'Expirado',
};
const STATUS_BADGE = {
  NAO_GERADO:         'bg-gray-100 text-gray-600',
  GERADO:             'bg-blue-100 text-blue-700',
  ENVIADO_ASSINATURA: 'bg-yellow-100 text-yellow-700',
  ASSINADO:           'bg-green-100 text-green-700',
  RECUSADO:           'bg-red-100 text-red-700',
  EXPIRADO:           'bg-orange-100 text-orange-700',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function RelatorioContratos() {
  const [dados, setDados]             = useState([]);
  const [cursos, setCursos]           = useState([]);
  const [turmas, setTurmas]           = useState([]);
  const [carregando, setCarregando]   = useState(false);
  const [erro, setErro]               = useState(null);

  // Filtros
  const [filtroStatus,  setFiltroStatus]  = useState('');
  const [filtroCurso,   setFiltroCurso]   = useState('');
  const [filtroTurma,   setFiltroTurma]   = useState('');
  const [filtroNome,    setFiltroNome]    = useState('');

  // Carregar listas de filtros
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Relatório de Contratos</h1>
              <p className="text-sm text-gray-500">{dadosFiltrados.length} registro(s)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/contratos/dashboard">
              <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                ← Dashboard
              </button>
            </Link>
            <button onClick={exportarCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
              ⬇️ Exportar CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">STATUS CONTRATO</label>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none">
              <option value="">— Todos —</option>
              {STATUS_CONTRATO.slice(1).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">CURSO</label>
            <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none">
              <option value="">— Todos —</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">TURMA</label>
            <select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none">
              <option value="">— Todas —</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block">NOME</label>
            <input value={filtroNome} onChange={e => setFiltroNome(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:outline-none" />
          </div>
        </div>

        {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>}

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {carregando ? (
            <div className="text-center py-12 text-gray-400">Carregando...</div>
          ) : dadosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum registro encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-50 border-b border-teal-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">#ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Curso</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Turma</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">St. Matrícula</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Contrato</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Envio</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Assinatura</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-teal-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map(a => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">#{a.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{a.nome}</td>
                      <td className="px-4 py-3 text-gray-500">{a.cpf || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.curso || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.turma || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-500">{a.statusMatricula}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          STATUS_BADGE[a.statusContrato] || 'bg-gray-100 text-gray-500'
                        } border-current/20`}>
                          {STATUS_LABEL[a.statusContrato] || a.statusContrato}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(a.dataEnvioContrato)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(a.dataAssinaturaContrato)}</td>
                      <td className="px-4 py-3">
                        <a href={`/admin/alunos/${a.id}`}
                          className="text-teal-600 hover:text-teal-800 text-xs font-medium transition-colors">
                          Ver aluno →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
