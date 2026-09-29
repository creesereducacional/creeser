import { useState, useEffect, useMemo } from 'react';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import EmptyState from '@/components/recepcao/EmptyState';
import StatusBadge from '@/components/recepcao/StatusBadge';

export default function RecepcaoTurmas() {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('TODAS');
  const [filtroTurno, setFiltroTurno] = useState('TODOS');

  // Modal de Alunos da Turma
  const [modalTurma, setModalTurma] = useState(null);
  const [alunosTurma, setAlunosTurma] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [buscaAlunoModal, setBuscaAlunoModal] = useState('');

  useEffect(() => {
    carregarTurmas();
  }, []);

  const carregarTurmas = async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/recepcao/turmas', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar turmas');
      const data = await res.json();
      setTurmas(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro('Não foi possível carregar a lista de turmas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const abrirAlunosTurma = async (turma) => {
    setModalTurma(turma);
    setAlunosTurma([]);
    setBuscaAlunoModal('');
    setCarregandoAlunos(true);

    try {
      const res = await fetch(`/api/recepcao/turmas?turma_id=${turma.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar alunos');
      const data = await res.json();
      setAlunosTurma(Array.isArray(data.alunos) ? data.alunos : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoAlunos(false);
    }
  };

  const fecharModal = () => {
    setModalTurma(null);
    setAlunosTurma([]);
  };

  // Filtros da listagem principal
  const turmasFiltradas = useMemo(() => {
    return turmas.filter((t) => {
      const matchBusca =
        !busca ||
        (t.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (t.cursoNome || '').toLowerCase().includes(busca.toLowerCase());

      const matchSituacao =
        filtroSituacao === 'TODAS' ||
        String(t.situacao || 'ATIVO').toUpperCase() === filtroSituacao;

      const matchTurno =
        filtroTurno === 'TODOS' ||
        String(t.turno || '').toUpperCase() === filtroTurno;

      return matchBusca && matchSituacao && matchTurno;
    });
  }, [turmas, busca, filtroSituacao, filtroTurno]);

  // Alunos filtrados dentro do modal
  const alunosModalFiltrados = useMemo(() => {
    if (!buscaAlunoModal) return alunosTurma;
    const b = buscaAlunoModal.toLowerCase();
    return alunosTurma.filter(
      (a) =>
        (a.nome || '').toLowerCase().includes(b) ||
        (a.cpf || '').includes(b) ||
        (a.matricula || '').toLowerCase().includes(b)
    );
  }, [alunosTurma, buscaAlunoModal]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = turmas.length;
    const ativas = turmas.filter((t) => {
      const s = String(t.situacao || 'ATIVO').toUpperCase();
      return s === 'ATIVO' || s === 'EM_ANDAMENTO' || s === 'ABERTA';
    }).length;
    const totalAlunos = turmas.reduce((acc, t) => acc + (t.totalAlunos || 0), 0);
    return { total, ativas, totalAlunos };
  }, [turmas]);

  return (
    <RecepcaoLayout titulo="Quadro de Turmas">
      <div className="max-w-6xl w-full mx-auto space-y-6">

        {/* ── Cabeçalho e Indicadores ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Quadro de Turmas</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Consulta de turmas, lotação de alunos e visualização rápida da lista de matriculados (Somente Leitura).
            </p>
          </div>
          <button
            onClick={carregarTurmas}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            🔄 {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>

        {/* ── Cards de Métricas ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl flex-shrink-0">
              🏫
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total de Turmas</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-2xl flex-shrink-0">
              ⚡
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Turmas Ativas / Abertas</p>
              <p className="text-2xl font-bold text-green-700 mt-0.5">{stats.ativas}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
              👥
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total de Alunos Matriculados</p>
              <p className="text-2xl font-bold text-blue-700 mt-0.5">{stats.totalAlunos}</p>
            </div>
          </div>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por turma ou curso…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50/50"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Situação:</span>
              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700"
              >
                <option value="TODAS">Todas</option>
                <option value="ATIVO">Ativa</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluída</option>
                <option value="CANCELADO">Cancelada</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Turno:</span>
              <select
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700"
              >
                <option value="TODOS">Todos</option>
                <option value="MATUTINO">Matutino</option>
                <option value="VESPERTINO">Vespertino</option>
                <option value="NOTURNO">Noturno</option>
                <option value="INTEGRAL">Integral</option>
                <option value="EAD">EAD</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Alerta de Erro ───────────────────────────────────────── */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{erro}</span>
            <button onClick={carregarTurmas} className="text-xs font-semibold text-red-800 underline">Tentar novamente</button>
          </div>
        )}

        {/* ── Tabela de Turmas ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
              Carregando quadro de turmas…
            </div>
          ) : turmasFiltradas.length === 0 ? (
            <EmptyState
              icon="🏫"
              title="Nenhuma turma encontrada"
              message={busca ? 'Tente ajustar os filtros de busca para encontrar a turma desejada.' : 'Não há turmas cadastradas nesta instituição.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-4">Turma</th>
                    <th className="py-3.5 px-4">Curso</th>
                    <th className="py-3.5 px-4">Turno</th>
                    <th className="py-3.5 px-4">Lotação / Alunos</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Alunos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {turmasFiltradas.map((turma) => {
                    const isAtiva =
                      String(turma.situacao || 'ATIVO').toUpperCase() === 'ATIVO' ||
                      String(turma.situacao || '').toUpperCase() === 'EM_ANDAMENTO';

                    return (
                      <tr key={turma.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{turma.nome}</div>
                          {turma.unidadeNome && turma.unidadeNome !== '—' && (
                            <div className="text-xs text-gray-400 mt-0.5">Unidade: {turma.unidadeNome}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-gray-800">{turma.cursoNome}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600">
                          {turma.turno || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800">
                              {turma.totalAlunos}
                              {turma.capacidadeMaxima ? ` / ${turma.capacidadeMaxima}` : ' alunos'}
                            </span>
                            {turma.taxaOcupacao !== null && (
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                                turma.taxaOcupacao >= 90
                                  ? 'bg-red-50 text-red-700'
                                  : turma.taxaOcupacao >= 70
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                {turma.taxaOcupacao}%
                              </span>
                            )}
                          </div>
                          {turma.capacidadeMaxima && (
                            <div className="w-28 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  turma.taxaOcupacao >= 90
                                    ? 'bg-red-500'
                                    : turma.taxaOcupacao >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(turma.taxaOcupacao || 0, 100)}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isAtiva
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {isAtiva ? '● Ativa' : '○ ' + (turma.situacao || 'Inativa')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => abrirAlunosTurma(turma)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition"
                          >
                            👥 Ver Alunos ({turma.totalAlunos})
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

        {/* ── Modal de Alunos da Turma ──────────────────────────────── */}
        {modalTurma && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
              
              {/* Topo do Modal */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>🏫</span> {modalTurma.nome}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Curso: {modalTurma.cursoNome} • Turno: {modalTurma.turno || '—'}
                  </p>
                </div>
                <button
                  onClick={fecharModal}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Barra de Busca dentro do modal */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Filtrar aluno por nome, CPF ou matrícula…"
                    value={buscaAlunoModal}
                    onChange={(e) => setBuscaAlunoModal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
                </div>
                <div className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Total: <span className="text-blue-700 font-bold">{alunosModalFiltrados.length}</span>
                </div>
              </div>

              {/* Lista de Alunos */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                {carregandoAlunos ? (
                  <div className="p-8 text-center text-gray-400 text-sm animate-pulse">
                    Buscando alunos da turma…
                  </div>
                ) : alunosModalFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {buscaAlunoModal ? 'Nenhum aluno encontrado para a busca.' : 'Esta turma ainda não possui alunos matriculados.'}
                  </div>
                ) : (
                  alunosModalFiltrados.map((aluno) => {
                    const tel = aluno.telefone_celular?.replace(/\D/g, '');
                    const wppLink = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent('Olá ' + aluno.nome + ', tudo bem?')}` : null;

                    return (
                      <div
                        key={aluno.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:bg-blue-50/30 transition-colors shadow-sm"
                      >
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{aluno.nome}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                            {aluno.cpf && <span>CPF: {aluno.cpf}</span>}
                            {aluno.matricula && <span>Matrícula: <strong className="text-gray-700">{aluno.matricula}</strong></span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {wppLink && (
                            <a
                              href={wppLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200/50"
                            >
                              💬 WhatsApp
                            </a>
                          )}
                          <StatusBadge status={aluno.status} size="sm" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={fecharModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </RecepcaoLayout>
  );
}
