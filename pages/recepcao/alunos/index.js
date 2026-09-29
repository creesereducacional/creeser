import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import EmptyState from '@/components/recepcao/EmptyState';
import StatusBadge from '@/components/recepcao/StatusBadge';

function iniciais(nome) {
  if (!nome) return '?';
  const p = nome.trim().split(' ').filter(Boolean);
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

function avatarCor(nome) {
  const cores = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];
  if (!nome) return cores[0];
  return cores[nome.charCodeAt(0) % cores.length];
}

export default function RecepcaoAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/alunos', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar alunos');
      const data = await res.json();
      setAlunos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro('Não foi possível carregar a lista de alunos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((a) => {
      const b = busca.toLowerCase();
      const matchBusca =
        !busca ||
        (a.nome || '').toLowerCase().includes(b) ||
        (a.cpf || '').includes(b) ||
        (a.matricula || '').toLowerCase().includes(b) ||
        (a.email || '').toLowerCase().includes(b) ||
        (a.cursoNome || '').toLowerCase().includes(b) ||
        (a.turmaNome || '').toLowerCase().includes(b);

      const statusItem = a.statusmatricula || a.status || '';
      const matchStatus =
        filtroStatus === 'TODOS' ||
        String(statusItem).toUpperCase() === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [alunos, busca, filtroStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = alunos.length;
    const matriculados = alunos.filter((a) => {
      const s = String(a.statusmatricula || a.status || '').toUpperCase();
      return s === 'ATIVO' || s === 'MATRICULADO';
    }).length;
    const preCadastros = alunos.filter((a) => {
      const s = String(a.statusmatricula || a.status || '').toUpperCase();
      return s === 'PRE_CADASTRO' || s === 'AGUARDANDO_PAGAMENTO_MATRICULA' || s === 'AGUARDANDO_FORMACAO_TURMA';
    }).length;
    return { total, matriculados, preCadastros };
  }, [alunos]);

  return (
    <RecepcaoLayout titulo="Consulta de Alunos">
      <div className="max-w-6xl w-full mx-auto space-y-6">

        {/* ── Cabeçalho e Indicadores ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Consulta de Alunos e Vínculos</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Identificação de alunos cadastrados, cursos matriculados e turmas associadas (Somente Leitura).
            </p>
          </div>
          <button
            onClick={carregarAlunos}
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
              👥
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total de Registros</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-2xl flex-shrink-0">
              🎓
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Matrículas Ativas</p>
              <p className="text-2xl font-bold text-green-700 mt-0.5">{stats.matriculados}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
              ⏳
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pré-Cadastros / Em Andamento</p>
              <p className="text-2xl font-bold text-amber-700 mt-0.5">{stats.preCadastros}</p>
            </div>
          </div>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Buscar por nome, CPF, matrícula ou curso…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50/50"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Status:</span>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700"
            >
              <option value="TODOS">Todos os status</option>
              <option value="ATIVO">Ativo / Matriculado</option>
              <option value="PRE_CADASTRO">Pré-Cadastro</option>
              <option value="AGUARDANDO_PAGAMENTO_MATRICULA">Aguardando Pagamento</option>
              <option value="AGUARDANDO_FORMACAO_TURMA">Aguardando Turma</option>
              <option value="DESISTENTE">Desistente</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>

        {/* ── Alerta de Erro ───────────────────────────────────────── */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{erro}</span>
            <button onClick={carregarAlunos} className="text-xs font-semibold text-red-800 underline">Tentar novamente</button>
          </div>
        )}

        {/* ── Tabela de Alunos ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
              Carregando lista de alunos…
            </div>
          ) : alunosFiltrados.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Nenhum aluno encontrado"
              message={busca ? 'Tente ajustar os filtros de busca para encontrar o aluno.' : 'Não há alunos cadastrados nesta instituição.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-4">Aluno</th>
                    <th className="py-3.5 px-4">Contato / CPF</th>
                    <th className="py-3.5 px-4">Vínculo Atual (Curso / Turma)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alunosFiltrados.map((aluno, index) => {
                    const tel = aluno.telefone_celular?.replace(/\D/g, '');
                    const wppLink = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent('Olá ' + aluno.nome + ', tudo bem?')}` : null;
                    const statusItem = aluno.statusmatricula || aluno.status || 'ATIVO';

                    return (
                      <tr key={aluno.matriculaId || `${aluno.id}_${index}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${avatarCor(aluno.nome)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm`}>
                              {iniciais(aluno.nome)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{aluno.nome}</div>
                              {aluno.matricula && (
                                <div className="text-xs text-gray-400">Matrícula: {aluno.matricula}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs text-gray-800 font-medium">{aluno.cpf || 'CPF não informado'}</div>
                          {aluno.telefone_celular && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-gray-500">{aluno.telefone_celular}</span>
                              {wppLink && (
                                <a
                                  href={wppLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-green-600 hover:text-green-700 font-semibold"
                                  title="Abrir WhatsApp"
                                >
                                  💬
                                </a>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-gray-800">
                            {aluno.cursos?.nome || aluno.cursoNome || (aluno.cursoid ? `Curso ID ${aluno.cursoid}` : 'Sem curso')}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {aluno.turmas?.nome || aluno.turmaNome || (aluno.turmaid ? `Turma ID ${aluno.turmaid}` : 'Sem turma')}
                            {aluno.ano_letivo ? ` • ${aluno.ano_letivo}/${aluno.semestre || '1'}` : ''}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={statusItem} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/recepcao/pre-cadastros/${aluno.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-xl text-xs font-semibold transition"
                          >
                            👁️ Ficha
                          </Link>
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
