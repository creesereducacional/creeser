import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const STATUS_FORMACAO = {
  EM_FORMACAO:       { label: 'Em Formação',       cor: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-400', borda: 'border-l-yellow-400', fundo: 'bg-yellow-50'  },
  PRONTA_PARA_ABRIR: { label: 'Pronta para Abrir', cor: 'bg-green-100 text-green-800 border-green-300',   dot: 'bg-green-500',  borda: 'border-l-green-500',  fundo: 'bg-green-50'   },
  ATIVA:             { label: 'Ativa',             cor: 'bg-blue-100 text-blue-800 border-blue-300',      dot: 'bg-blue-500',   borda: 'border-l-blue-500',   fundo: 'bg-blue-50'    },
  ENCERRADA:         { label: 'Encerrada',         cor: 'bg-gray-100 text-gray-500 border-gray-300',      dot: 'bg-gray-400',   borda: 'border-l-gray-300',   fundo: 'bg-gray-50'    },
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

function TurmaCard({ t, podeAbrirTurma, onConfigurar, onAbrirTurma }) {
  const st = sf(t.status_formacao);
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${st.borda} overflow-hidden hover:shadow-md transition-shadow flex flex-col`}>
      {/* Header do card */}
      <div className={`px-4 py-3 ${st.fundo} border-b border-black/5`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-snug truncate" title={t.nome}>{t.nome}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{t.cursoNome || '—'}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${st.cor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
      </div>
      {/* Body do card */}
      <div className="px-4 py-3 flex flex-col gap-3 flex-1">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Unidade</p>
            <p className="text-xs font-medium text-gray-700 truncate mt-0.5" title={t.unidadeNome}>{t.unidadeNome || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Data Prevista</p>
            <p className="text-xs font-medium text-gray-700 mt-0.5">
              {t.data_prevista_inicio
                ? new Date(t.data_prevista_inicio + 'T12:00:00').toLocaleDateString('pt-BR')
                : '—'}
            </p>
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Alunos</p>
              <span className="text-xs font-bold text-gray-800 tabular-nums">
                {t.qtd_atual}<span className="text-gray-400 font-normal"> / {t.qtd_minima_alunos}</span>
              </span>
            </div>
            <ProgressBar pct={t.percentual} />
          </div>
        </div>
        {/* Botões */}
        <div className="flex gap-2 pt-1 border-t border-gray-100 mt-auto">
          <button
            onClick={() => onConfigurar(t)}
            className="flex-1 px-2 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors"
          >
            ⚙️ Configurar
          </button>
          {t.status_formacao === 'PRONTA_PARA_ABRIR' && podeAbrirTurma && (
            <button
              onClick={() => onAbrirTurma(t)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              🚀 Abrir Turma
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalAbrirTurma({ turma, alunos, carregandoAlunos, abrindo, onClose, onConfirmar }) {
  if (!turma) return null;
  const nAlunos = alunos.length;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex-shrink-0 bg-green-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">🚀</div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-800 text-base">Abrir Turma — Confirmação</h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{turma.nome}</p>
            </div>
          </div>
        </div>
        {/* Destaque: quantos alunos serão ativados */}
        <div className="px-5 pt-5 flex-shrink-0">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="text-center flex-shrink-0">
              <div className="text-4xl font-black text-green-700 tabular-nums leading-none">
                {carregandoAlunos ? '…' : nAlunos}
              </div>
              <div className="text-xs text-green-600 font-semibold mt-1 leading-tight">alunos serão<br/>ativados</div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Curso</p>
                <p className="font-semibold text-gray-800 text-xs truncate mt-0.5">{turma.cursoNome || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Unidade</p>
                <p className="font-semibold text-gray-800 text-xs truncate mt-0.5">{turma.unidadeNome || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Atual / Meta</p>
                <p className="font-semibold text-gray-800 text-xs mt-0.5 tabular-nums">{turma.qtd_atual} / {turma.qtd_minima_alunos}</p>
              </div>
              <div className="bg-white rounded-xl p-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Data Prevista</p>
                <p className="font-semibold text-gray-800 text-xs mt-0.5">
                  {turma.data_prevista_inicio
                    ? new Date(turma.data_prevista_inicio + 'T12:00:00').toLocaleDateString('pt-BR')
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Lista de alunos */}
        <div className="px-5 pt-4 pb-2 flex-1 overflow-y-auto min-h-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Lista de alunos que serão ativados ({carregandoAlunos ? '...' : nAlunos})
          </p>
          {carregandoAlunos ? (
            <div className="text-center py-6 text-gray-400 text-sm">Carregando...</div>
          ) : nAlunos === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">Nenhum aluno encontrado.</div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {alunos.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm bg-white hover:bg-gray-50">
                  <span className="text-xs text-gray-300 w-5 tabular-nums text-right flex-shrink-0">{i + 1}</span>
                  <span className="font-medium text-gray-800 flex-1 min-w-0 truncate">{a.nome}</span>
                  <span className="text-gray-400 text-xs flex-shrink-0">{a.cpf || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Alerta de irreversibilidade */}
        <div className="px-5 pt-2 pb-2 flex-shrink-0">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm text-red-800">
              <strong>Ação irreversível.</strong> Ao confirmar, <strong>{nAlunos} aluno(s)</strong> serão ativados e a turma passará para <strong>ATIVA</strong>. Esta operação não pode ser desfeita.
            </p>
          </div>
        </div>
        {/* Ações */}
        <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0 border-t">
          <button onClick={onClose} disabled={abrindo}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={abrindo || carregandoAlunos || nAlunos === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            {abrindo ? 'Ativando...' : `✅ Ativar ${nAlunos} Aluno(s)`}
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
  const [user, setUser]                 = useState(null);
  const [turmaAbrir, setTurmaAbrir]     = useState(null);
  const [alunosModal, setAlunosModal]   = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [abrindo, setAbrindo]           = useState(false);
  const [msgSucesso, setMsgSucesso]     = useState(null);

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

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.usuario) setUser(data.usuario); })
      .catch(() => {});
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
  const emFormacao       = lista.filter(t => t.status_formacao === 'EM_FORMACAO').length;
  const prontas          = lista.filter(t => t.status_formacao === 'PRONTA_PARA_ABRIR').length;
  const ativas           = lista.filter(t => t.status_formacao === 'ATIVA').length;
  const alunosAguardando = lista
    .filter(t => ['EM_FORMACAO', 'PRONTA_PARA_ABRIR'].includes(t.status_formacao))
    .reduce((acc, t) => acc + (t.qtd_atual || 0), 0);

  const podeAbrirTurma = ['grupo_admin', 'instituicao_admin', 'coordenador']
    .includes(user?.perfil || user?.tipo || '');

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

  async function handleVerAlunos(turma) {
    setTurmaAbrir(turma);
    setAlunosModal([]);
    setCarregandoAlunos(true);
    try {
      const res = await fetch(`/api/formacao-turmas/${turma.id}?incluirAlunos=1`, { credentials: 'include' });
      const data = await res.json();
      setAlunosModal(Array.isArray(data.alunos) ? data.alunos : []);
    } catch (_) {}
    finally { setCarregandoAlunos(false); }
  }

  async function handleConfirmarAbertura() {
    if (!turmaAbrir) return;
    setAbrindo(true);
    try {
      const res = await fetch(`/api/formacao-turmas/${turmaAbrir.id}/abrir`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Erro ao abrir turma.'); return; }
      setMsgSucesso(data.mensagem || 'Turma aberta com sucesso!');
      setLista(prev => prev.map(t =>
        t.id === turmaAbrir.id ? { ...t, status_formacao: 'ATIVA' } : t
      ));
      setTurmaAbrir(null);
      setTimeout(() => setMsgSucesso(null), 8000);
    } catch {
      alert('Erro de conexao.');
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Formação de Turmas</h1>
          <p className="text-sm text-gray-500 mt-1">Painel operacional — coordenação e secretaria.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🔶</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">{carregando ? '…' : emFormacao}</span>
            </div>
            <p className="text-xs text-gray-500 leading-tight font-medium">Em Formação</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">✅</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">{carregando ? '…' : prontas}</span>
            </div>
            <p className="text-xs text-gray-500 leading-tight font-medium">Prontas para Abrir</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🎓</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">{carregando ? '…' : ativas}</span>
            </div>
            <p className="text-xs text-gray-500 leading-tight font-medium">Turmas Ativas</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border-l-4 border-purple-400">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">👥</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">{carregando ? '…' : alunosAguardando}</span>
            </div>
            <p className="text-xs text-gray-500 leading-tight font-medium">Alunos Aguardando</p>
          </div>
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

        {/* Sucesso */}
        {msgSucesso && (
          <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-sm text-green-800 font-medium flex items-center gap-2">
            <span>✅</span> {msgSucesso}
          </div>
        )}

        {/* Grid de Turmas */}
        {carregando ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando turmas...</div>
        ) : filtrada.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 text-sm">Nenhuma turma encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {filtrada.length !== lista.length
                  ? `${filtrada.length} de ${lista.length} turmas`
                  : `${lista.length} turma${lista.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtrada.map(t => (
                <TurmaCard
                  key={t.id}
                  t={t}
                  podeAbrirTurma={podeAbrirTurma}
                  onConfigurar={setTurmaConfig}
                  onAbrirTurma={handleVerAlunos}
                />
              ))}
            </div>
          </>
        )}

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

      {/* Modal abrir turma */}
      {turmaAbrir && (
        <ModalAbrirTurma
          turma={turmaAbrir}
          alunos={alunosModal}
          carregandoAlunos={carregandoAlunos}
          abrindo={abrindo}
          onClose={() => setTurmaAbrir(null)}
          onConfirmar={handleConfirmarAbertura}
        />
      )}

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
