import { useState, useEffect, useMemo } from 'react';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import EmptyState from '@/components/recepcao/EmptyState';

export default function RecepcaoCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('TODAS');

  useEffect(() => {
    carregarCursos();
  }, []);

  const carregarCursos = async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/recepcao/cursos', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar cursos');
      const data = await res.json();
      setCursos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro('Não foi possível carregar a lista de cursos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cursosFiltrados = useMemo(() => {
    return cursos.filter((c) => {
      const matchBusca =
        !busca ||
        (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.nivelensino || '').toLowerCase().includes(busca.toLowerCase());

      const matchSituacao =
        filtroSituacao === 'TODAS' ||
        String(c.situacao || 'ATIVO').toUpperCase() === filtroSituacao;

      return matchBusca && matchSituacao;
    });
  }, [cursos, busca, filtroSituacao]);

  // Estatísticas do topo
  const stats = useMemo(() => {
    const total = cursos.length;
    const ativos = cursos.filter((c) => String(c.situacao || 'ATIVO').toUpperCase() === 'ATIVO').length;
    const totalTurmas = cursos.reduce((acc, c) => acc + (c.total_turmas || 0), 0);
    return { total, ativos, totalTurmas };
  }, [cursos]);

  return (
    <RecepcaoLayout titulo="Cursos Disponíveis">
      <div className="max-w-6xl w-full mx-auto space-y-6">

        {/* ── Cabeçalho e Indicadores ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Catálogo de Cursos</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Consulta de cursos ofertados pela instituição e quantitativo de turmas vinculadas (Somente Leitura).
            </p>
          </div>
          <button
            onClick={carregarCursos}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            🔄 {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>

        {/* ── Cards de Métricas ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
              📖
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total de Cursos</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-2xl flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cursos Ativos</p>
              <p className="text-2xl font-bold text-green-700 mt-0.5">{stats.ativos}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl flex-shrink-0">
              🏫
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Turmas Ofertadas</p>
              <p className="text-2xl font-bold text-purple-700 mt-0.5">{stats.totalTurmas}</p>
            </div>
          </div>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar curso por nome ou nível…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50/50"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Situação:</span>
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700"
            >
              <option value="TODAS">Todas as situações</option>
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
            </select>
          </div>
        </div>

        {/* ── Alerta de Erro ───────────────────────────────────────── */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{erro}</span>
            <button onClick={carregarCursos} className="text-xs font-semibold text-red-800 underline">Tentar novamente</button>
          </div>
        )}

        {/* ── Tabela de Cursos ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
              Carregando catálogo de cursos…
            </div>
          ) : cursosFiltrados.length === 0 ? (
            <EmptyState
              icon="📖"
              title="Nenhum curso encontrado"
              message={busca ? 'Tente ajustar os filtros de busca para encontrar o curso desejado.' : 'Não há cursos cadastrados nesta instituição.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-4">Curso</th>
                    <th className="py-3.5 px-4">Nível / Modalidade</th>
                    <th className="py-3.5 px-4">Carga Horária</th>
                    <th className="py-3.5 px-4 text-center">Turmas Vinculadas</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cursosFiltrados.map((curso) => {
                    const isAtivo = String(curso.situacao || 'ATIVO').toUpperCase() === 'ATIVO';

                    return (
                      <tr key={curso.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{curso.nome}</div>
                          {curso.duracao && (
                            <div className="text-xs text-gray-400 mt-0.5">Duração: {curso.duracao} períodos</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-gray-700 font-medium">
                            {curso.nivelensino || curso.grauconferido || '—'}
                          </span>
                          {curso.grauconferido && curso.nivelensino && (
                            <div className="text-[11px] text-gray-400">{curso.grauconferido}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-700">
                          {curso.cargahoraria ? `${curso.cargahoraria}h` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              curso.total_turmas > 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            🏫 {curso.total_turmas} {curso.total_turmas === 1 ? 'turma' : 'turmas'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isAtivo
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {isAtivo ? '● Ativo' : '○ Inativo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </RecepcaoLayout>
  );
}
