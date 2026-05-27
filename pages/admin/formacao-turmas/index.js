import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const STATUS_FORMACAO = {
  EM_FORMACAO:      { label: 'Em Formacao',        cor: 'bg-yellow-100 text-yellow-800 border-yellow-300',  dot: 'bg-yellow-400' },
  PRONTA_PARA_ABRIR:{ label: 'Pronta para Abrir',  cor: 'bg-green-100  text-green-800  border-green-300',   dot: 'bg-green-500'  },
  ATIVA:            { label: 'Ativa',              cor: 'bg-blue-100   text-blue-800   border-blue-300',    dot: 'bg-blue-500'   },
  ENCERRADA:        { label: 'Encerrada',          cor: 'bg-gray-100   text-gray-500   border-gray-300',    dot: 'bg-gray-400'   },
};

const sf = (status) => STATUS_FORMACAO[status] || STATUS_FORMACAO.EM_FORMACAO;

function ProgressBar({ pct }) {
  const cor =
    pct >= 100 ? 'bg-green-500' :
    pct >= 75  ? 'bg-teal-500'  :
    pct >= 40  ? 'bg-yellow-400' :
    'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
        <div className={`h-2 rounded-full transition-all ${cor}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function ModalConfigurar({ turma, onClose, onSave }) {
  const [qtdMin, setQtdMin]     = useState(turma?.qtd_minima_alunos ?? 20);
  const [dataPrev, setDataPrev] = useState(turma?.data_prevista_inicio || '');
  const [statusF, setStatusF]   = useState(turma?.status_formacao || 'EM_FORMACAO');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState(null);

  async function handleSalvar() {
    if (!turma) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/formacao-turmas/${turma.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qtd_minima_alunos:    Number(qtdMin),
          data_prevista_inicio: dataPrev || null,
          status_formacao:      statusF,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao salvar'); return; }
      onSave(turma.id, data);
    } catch {
      setErro('Erro de conexao.');
    } finally {
      setSalvando(false);
    }
  }

  if (!turma) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b">
          <h2 className="font-bold text-gray-800">Configurar Turma</h2>
          <p className="text-sm text-gray-500 mt-0.5">{turma.nome}</p>
        </div>
        <div className="p-5 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">{erro}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Minima de Alunos</label>
            <input
              type="number" min={1} max={500}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={qtdMin}
              onChange={e => setQtdMin(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista de Inicio</label>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={dataPrev}
              onChange={e => setDataPrev(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Situacao de Formacao</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={statusF}
              onChange={e => setStatusF(e.target.value)}
            >
              {Object.entries(STATUS_FORMACAO).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} disabled={salvando}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FormacaoTurmas() {
  const [lista, setLista]               = useState([]);
  const [carregando, setCarregando]     = useState(true);
  const [erro, setErro]                 = useState(null);
  const [turmaConfig, setTurmaConfig]   = useState(null);

  // Filtros
  const [filtroInstituicao, setFiltroInstituicao] = useState('');
  const [filtroCurso, setFiltroCurso]             = useState('');
  const [filtroSituacao, setFiltroSituacao]       = useState('');
  const [filtroNome, setFiltroNome]               = useState('');

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    fetch('/api/formacao-turmas', { credentials: 'include' })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error || 'Erro')))
      .then(data => setLista(Array.isArray(data) ? data : []))
      .catch(e => setErro(String(e)))
      .finally(() => setCarregando(false));
  }, []);

  // Opcoes unicas para filtros
  const optsInstituicao = useMemo(() => [...new Set(lista.map(t => t.instituicaoId).filter(Boolean))], [lista]);
  const optsCurso       = useMemo(() => {
    const visivel = filtroInstituicao
      ? lista.filter(t => t.instituicaoId === filtroInstituicao)
      : lista;
    const map = {};
    visivel.forEach(t => { if (t.cursoId && t.cursoNome) map[t.cursoId] = t.cursoNome; });
    return Object.entries(map);
  }, [lista, filtroInstituicao]);

  const filtrada = useMemo(() => lista.filter(t => {
    if (filtroInstituicao && t.instituicaoId !== filtroInstituicao) return false;
    if (filtroCurso && String(t.cursoId) !== filtroCurso) return false;
    if (filtroSituacao && t.status_formacao !== filtroSituacao) return false;
    if (filtroNome && !t.nome.toLowerCase().includes(filtroNome.toLowerCase())) return false;
    return true;
  }), [lista, filtroInstituicao, filtroCurso, filtroSituacao, filtroNome]);

  // Cards
  const emFormacao   = lista.filter(t => t.status_formacao === 'EM_FORMACAO').length;
  const prontas      = lista.filter(t => t.status_formacao === 'PRONTA_PARA_ABRIR').length;
  const encerradas   = lista.filter(t => t.status_formacao === 'ENCERRADA').length;
  const alunosTotal  = lista.reduce((acc, t) => acc + (t.qtd_atual || 0), 0);

  const cards = [
    { label: 'Turmas em Formacao',         valor: emFormacao,  icon: '🔶', cor: 'border-yellow-500' },
    { label: 'Alunos Aguardando Formacao', valor: alunosTotal, icon: '👥', cor: 'border-blue-500'   },
    { label: 'Turmas Prontas p/ Abrir',    valor: prontas,     icon: '✅', cor: 'border-green-500'  },
    { label: 'Turmas Encerradas',          valor: encerradas,  icon: '📦', cor: 'border-gray-400'   },
  ];

  function handleSaveModal(turmaId, updated) {
    setLista(prev => prev.map(t => t.id === turmaId
      ? {
          ...t,
          qtd_minima_alunos:    updated.qtd_minima_alunos    ?? t.qtd_minima_alunos,
          data_prevista_inicio: updated.data_prevista_inicio ?? t.data_prevista_inicio,
          status_formacao:      updated.status_formacao      ?? t.status_formacao,
          percentual: updated.qtd_minima_alunos
            ? Math.min(100, Math.round(((t.qtd_atual || 0) / updated.qtd_minima_alunos) * 100))
            : t.percentual,
        }
      : t
    ));
    setTurmaConfig(null);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">

        {/* Cabecalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Formacao de Turmas</h1>
          <p className="text-sm text-gray-500 mt-1">Monitore e gerencie turmas em processo de formacao.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${c.cor}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-3xl font-bold text-gray-800">{carregando ? '…' : c.valor}</span>
              </div>
              <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Buscar por nome..."
              value={filtroNome}
              onChange={e => setFiltroNome(e.target.value)}
            />
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={filtroCurso}
              onChange={e => setFiltroCurso(e.target.value)}
            >
              <option value="">Todos os cursos</option>
              {optsCurso.map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={filtroSituacao}
              onChange={e => setFiltroSituacao(e.target.value)}
            >
              <option value="">Todas as situacoes</option>
              {Object.entries(STATUS_FORMACAO).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
            <button
              onClick={() => { setFiltroInstituicao(''); setFiltroCurso(''); setFiltroSituacao(''); setFiltroNome(''); }}
              className="px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">
              Turmas{filtrada.length !== lista.length ? ` (${filtrada.length} de ${lista.length})` : ` (${lista.length})`}
            </h2>
          </div>

          {carregando ? (
            <div className="py-16 text-center text-gray-400 text-sm">Carregando...</div>
          ) : filtrada.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">Nenhuma turma encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Turma</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Curso</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Unidade</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Data Prevista</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Meta</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 min-w-[140px]">Progresso</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Situacao</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrada.map(t => {
                    const st = sf(t.status_formacao);
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{t.nome}</td>
                        <td className="px-4 py-3 text-gray-500">{t.cursoNome || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{t.unidadeNome || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {t.data_prevista_inicio
                            ? new Date(t.data_prevista_inicio + 'T12:00:00').toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-700">{t.qtd_atual}</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-gray-500">{t.qtd_minima_alunos}</span>
                        </td>
                        <td className="px-4 py-3">
                          <ProgressBar pct={t.percentual} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.cor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setTurmaConfig(t)}
                            className="px-2.5 py-1 rounded border border-blue-400 text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors"
                          >
                            Configurar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(STATUS_FORMACAO).map(([k, v]) => (
            <span key={k} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${v.cor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Modal de configuracao */}
      {turmaConfig && (
        <ModalConfigurar
          turma={turmaConfig}
          onClose={() => setTurmaConfig(null)}
          onSave={handleSaveModal}
        />
      )}
    </DashboardLayout>
  );
}
