import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import ConfirmModal from '@/components/ConfirmModal';

export default function ListagemTurmas() {
  const [turmas, setTurmas] = useState([]);
  const [instituicoes, setInstituicoes] = useState([]);
  const [todasUnidades, setTodasUnidades] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroInstituicao, setFiltroInstituicao] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    idTurma: null,
    nomeTurma: '',
  });

  useEffect(() => {
    inicializar();
  }, []);

  // Resetar paginação ao alterar qualquer filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroInstituicao, filtroUnidade, filtroCurso, filtroStatus, filtroNome]);

  const inicializar = async () => {
    try {
      setLoading(true);
      const [resInst, resOpcoes, resCursos, resTurmas] = await Promise.all([
        fetch('/api/instituicoes'),
        fetch('/api/turmas/opcoes'),
        fetch('/api/cursos'),
        fetch('/api/turmas'),
      ]);

      let instList = [];
      if (resInst.ok) {
        const data = await resInst.json();
        instList = Array.isArray(data) ? data : [];
        setInstituicoes(instList);
      }

      if (resOpcoes.ok) {
        const data = await resOpcoes.json();
        if (Array.isArray(data.unidades)) setTodasUnidades(data.unidades);
      }

      if (resCursos.ok) {
        const data = await resCursos.json();
        setTodosCursos(Array.isArray(data) ? data : []);
      }

      if (resTurmas.ok) {
        const data = await resTurmas.json();
        setTurmas(Array.isArray(data) ? data : []);
      }

      // Se o usuário possuir exatamente 1 instituição, auto-seleciona
      if (instList.length === 1) {
        setFiltroInstituicao(String(instList[0].id));
      }
    } catch (error) {
      console.error('Erro ao inicializar dados de turmas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstituicaoChange = (novaInstituicaoId) => {
    setFiltroInstituicao(novaInstituicaoId);
    setFiltroUnidade('');
    setFiltroCurso('');
  };

  const handleUnidadeChange = (novaUnidadeId) => {
    setFiltroUnidade(novaUnidadeId);
    setFiltroCurso('');
  };

  // Unidades disponíveis baseadas na Instituição selecionada
  const unidadesDisponiveis = useMemo(() => {
    if (!filtroInstituicao) return todasUnidades;
    return todasUnidades.filter(
      (u) => String(u.instituicao_id || u.instituicaoid || '') === String(filtroInstituicao)
    );
  }, [todasUnidades, filtroInstituicao]);

  // Cursos disponíveis baseados na Instituição e Unidade selecionadas
  const cursosDisponiveis = useMemo(() => {
    let lista = todosCursos;

    if (filtroInstituicao) {
      lista = lista.filter(
        (c) => String(c.instituicaoId || c.instituicaoid || c.instituicao_id || '') === String(filtroInstituicao)
      );
    }

    if (filtroUnidade) {
      lista = lista.filter((c) => {
        if (Array.isArray(c.unidadeIds) && c.unidadeIds.length > 0) {
          return c.unidadeIds.some((uid) => String(uid) === String(filtroUnidade));
        }
        return true;
      });
    }

    return lista;
  }, [todosCursos, filtroInstituicao, filtroUnidade]);

  // Filtragem das turmas
  const filtradas = useMemo(() => {
    return turmas.filter((turma) => {
      // Filtro Instituição
      if (filtroInstituicao) {
        const turmaInstId = String(turma.instituicaoId || turma.instituicaoid || turma.instituicao_id || '');
        if (turmaInstId && turmaInstId !== String(filtroInstituicao)) {
          return false;
        }
      }

      // Filtro Unidade
      if (filtroUnidade) {
        const turmaUnidadeId = String(turma.unidadeId || turma.unidadeid || turma.unidade_id || '');
        if (turmaUnidadeId !== String(filtroUnidade)) {
          return false;
        }
      }

      // Filtro Curso
      if (filtroCurso) {
        const turmaCursoId = String(turma.cursoId || turma.cursoid || turma.curso_id || '');
        if (turmaCursoId !== String(filtroCurso)) {
          return false;
        }
      }

      // Filtro Status
      if (filtroStatus) {
        const statusTurma = String(turma.situacao || 'ATIVO').toUpperCase();
        if (statusTurma !== filtroStatus.toUpperCase()) {
          return false;
        }
      }

      // Filtro Busca por Nome
      if (filtroNome.trim()) {
        const termo = filtroNome.toLowerCase().trim();
        const nomeTurma = (turma.nome || '').toLowerCase();
        if (!nomeTurma.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [turmas, filtroInstituicao, filtroUnidade, filtroCurso, filtroStatus, filtroNome]);

  // Métricas para os Cards de KPI
  const totalTurmasGeral = turmas.length;
  const totalTurmasAtivas = useMemo(
    () => turmas.filter((t) => String(t.situacao || 'ATIVO').toUpperCase() === 'ATIVO').length,
    [turmas]
  );
  const totalTurmasInativas = useMemo(
    () => turmas.filter((t) => String(t.situacao || '').toUpperCase() === 'INATIVO').length,
    [turmas]
  );
  const totalCursosDistintos = useMemo(() => {
    const ids = new Set(turmas.map((t) => t.cursoId || t.cursoid || t.curso_id || t.curso).filter(Boolean));
    return ids.size;
  }, [turmas]);

  const percAtivas = totalTurmasGeral > 0 ? Math.round((totalTurmasAtivas / totalTurmasGeral) * 100) : 0;
  const percInativas = totalTurmasGeral > 0 ? Math.round((totalTurmasInativas / totalTurmasGeral) * 100) : 0;

  // Paginação
  const totalRegistros = filtradas.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = Math.min(indiceInicial + itensPorPagina, totalRegistros);

  const turmasPaginadas = useMemo(() => {
    return filtradas.slice(indiceInicial, indiceFinal);
  }, [filtradas, indiceInicial, indiceFinal]);

  const getPaginasVisiveis = () => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    if (paginaAtual <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPaginas];
    }
    if (paginaAtual >= totalPaginas - 3) {
      return [1, '...', totalPaginas - 4, totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas];
    }
    return [1, '...', paginaAtual - 1, paginaAtual, paginaAtual + 1, '...', totalPaginas];
  };

  const limparFiltros = () => {
    if (instituicoes.length === 1) {
      setFiltroInstituicao(String(instituicoes[0].id));
    } else {
      setFiltroInstituicao('');
    }
    setFiltroUnidade('');
    setFiltroCurso('');
    setFiltroStatus('');
    setFiltroNome('');
  };

  const solicitarDeletar = (turma) => {
    setModalConfirm({
      isOpen: true,
      idTurma: turma.id,
      nomeTurma: turma.nome,
    });
  };

  const executarDeletar = async () => {
    const id = modalConfirm.idTurma;
    setModalConfirm({ isOpen: false, idTurma: null, nomeTurma: '' });

    if (!id) return;

    try {
      const res = await fetch(`/api/turmas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTurmas(turmas.filter((turma) => turma.id !== id));
      }
    } catch (error) {
      console.error('Erro ao deletar turma:', error);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
        {/* ── 1. HEADER / BREADCRUMB & TÍTULO ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
              <Link href="/admin/dashboard" className="hover:text-slate-600 transition">Admin</Link>
              <span>›</span>
              <span className="text-slate-600 font-semibold">Turmas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                📚
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Gerenciar Turmas
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  {filtradas.length} turma{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''} no sistema
                </p>
              </div>
            </div>
          </div>

          <Link href="/admin/turmas/novo">
            <button className="inline-flex items-center justify-center gap-2 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer self-start sm:self-auto">
              <span className="text-lg leading-none">+</span>
              <span>Nova Turma</span>
            </button>
          </Link>
        </div>

        {/* ── 2. ABAS (Listar, Inserir) ───────────────────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-200/80">
          <button className="px-5 py-2.5 font-bold text-sm flex items-center gap-2 text-[#009688] border-b-2 border-[#009688] transition cursor-pointer">
            📋 Listar
          </button>
          <Link href="/admin/turmas/novo">
            <button className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 transition cursor-pointer">
              ➕ Inserir
            </button>
          </Link>
        </div>

        {/* ── 3. KPI METRIC CARDS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total de Turmas */}
          <div className="bg-gradient-to-b from-blue-50/70 to-blue-50/20 rounded-2xl p-5 border border-blue-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center text-lg flex-shrink-0 border border-blue-200/60">
                📚
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                Geral
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalTurmasGeral}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Total de Turmas</p>
            </div>
            <div className="pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Cadastradas no sistema</span>
              <span className="font-semibold text-blue-700 shrink-0">100%</span>
            </div>
          </div>

          {/* 2. Turmas Ativas */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-lg flex-shrink-0 border border-emerald-200/60">
                ✅
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                +{percAtivas}%
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalTurmasAtivas}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Turmas Ativas</p>
            </div>
            <div className="pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Em andamento regular</span>
              <span className="font-semibold text-emerald-700 shrink-0">{percAtivas}% do total</span>
            </div>
          </div>

          {/* 3. Turmas Inativas */}
          <div className="bg-gradient-to-b from-amber-50/70 to-amber-50/20 rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center text-lg flex-shrink-0 border border-amber-200/60">
                ⏸️
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                Inativas
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalTurmasInativas}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Turmas Inativas</p>
            </div>
            <div className="pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Encerradas / suspensas</span>
              <span className="font-semibold text-amber-700 shrink-0">{percInativas}% do total</span>
            </div>
          </div>

          {/* 4. Cursos Vinculados */}
          <div className="bg-gradient-to-b from-rose-50/70 to-rose-50/20 rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center text-lg flex-shrink-0 border border-rose-200/60">
                🎓
              </div>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full border border-rose-200/50">
                Cursos
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalCursosDistintos}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Cursos Ofertados</p>
            </div>
            <div className="pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Oferta acadêmica ativa</span>
              <span className="font-semibold text-rose-700 shrink-0">Matrizes</span>
            </div>
          </div>
        </div>

        {/* ── 4. BARRA DE FILTROS DA DASHBOARD ───────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
          {/* Linha 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Instituição */}
            {instituicoes.length > 1 && (
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Instituição</label>
                <select
                  value={filtroInstituicao}
                  onChange={(e) => handleInstituicaoChange(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
                >
                  <option value="">Todas as Instituições</option>
                  {instituicoes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Unidade */}
            <div className={instituicoes.length <= 1 ? 'sm:col-span-1' : ''}>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Unidade</label>
              <select
                value={filtroUnidade}
                onChange={(e) => handleUnidadeChange(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todas as Unidades</option>
                {unidadesDisponiveis.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Curso */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Curso</label>
              <select
                value={filtroCurso}
                onChange={(e) => setFiltroCurso(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todos os Cursos</option>
                {cursosDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todos os Status</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>

          {/* Linha 2 */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 pt-1">
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por nome da turma..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="w-full h-10 pl-10 pr-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
              />
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center">
              <button
                onClick={limparFiltros}
                className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🧹</span>
                <span>Limpar Filtros</span>
              </button>

              <button
                onClick={() => setPaginaAtual(1)}
                className="h-10 px-5 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>Aplicar Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 5. LISTAGEM EM TABELA ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          {/* Header da Tabela */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 border-b border-slate-200/80 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📚</span>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">
                  Listagem de Turmas
                </h2>
                <p className="text-xs text-slate-400 font-normal">
                  Visualize, edite e gerencie as turmas ativas da instituição
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>🖨️</span>
                <span>IMPRIMIR</span>
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Quantidade de Turmas: <strong className="text-slate-800">{filtradas.length}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8">
              <SkeletonTable rows={5} cols={6} />
            </div>
          ) : filtradas.length === 0 ? (
            <EmptyState
              icon="📚"
              title="Nenhuma turma encontrada"
              description="Ajuste os filtros ou cadastre uma nova turma."
              action={{ label: '+ Nova Turma', href: '/admin/turmas/novo', variant: 'primary' }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold text-xs border-b border-slate-200 select-none">
                      <th className="px-5 py-3.5 w-16">ID</th>
                      <th className="px-5 py-3.5">Nome da Turma</th>
                      <th className="px-5 py-3.5">Unidade</th>
                      <th className="px-5 py-3.5">Curso</th>
                      <th className="px-5 py-3.5">Grade</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {turmasPaginadas.map((turma) => {
                      const isAtivo = String(turma.situacao || 'ATIVO').toUpperCase() === 'ATIVO';

                      return (
                        <tr key={turma.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                            #{turma.id}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {turma.nome}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                            {turma.unidade || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-700">
                            {turma.curso || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-600">
                            {turma.grade || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                isAtivo
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                  : 'bg-rose-50 text-rose-700 border-rose-200/80'
                              }`}
                            >
                              {isAtivo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => window.print()}
                                className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Imprimir Ficha"
                              >
                                🖨️
                              </button>
                              <Link href={`/admin/turmas/${turma.id}`}>
                                <button
                                  className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Editar Turma"
                                >
                                  ✏️
                                </button>
                              </Link>
                              <button
                                onClick={() => solicitarDeletar(turma)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Excluir Turma"
                              >
                                ❌
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Barra de Paginação ───────────────────────────────────────── */}
              {totalRegistros > 0 && (
                <div className="px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white select-none">
                  <div className="text-xs sm:text-sm text-slate-500 font-normal">
                    Mostrando {indiceInicial + 1} até {indiceFinal} de {totalRegistros} turmas
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botão Anterior */}
                    <button
                      onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                      disabled={paginaAtual === 1}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
                      title="Página Anterior"
                    >
                      ‹
                    </button>

                    {/* Botões de Página */}
                    {getPaginasVisiveis().map((pag, idx) => {
                      if (pag === '...') {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs font-semibold"
                          >
                            ...
                          </span>
                        );
                      }

                      const isCurrent = pag === paginaAtual;

                      return (
                        <button
                          key={`pag-${pag}`}
                          onClick={() => setPaginaAtual(pag)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-[#009688] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {pag}
                        </button>
                      );
                    })}

                    {/* Botão Próximo */}
                    <button
                      onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                      disabled={paginaAtual === totalPaginas}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
                      title="Próxima Página"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmModal
          isOpen={modalConfirm.isOpen}
          onClose={() => setModalConfirm({ isOpen: false, idTurma: null, nomeTurma: '' })}
          onConfirm={executarDeletar}
          title="Excluir Turma"
          message={`Tem certeza que deseja deletar a turma "${modalConfirm.nomeTurma}"? Esta ação não poderá ser desfeita.`}
          type="delete"
        />
      </div>
    </>
  );
}
