import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ConfirmModal from '../../../components/ConfirmModal';
import CustomModal from '../../../components/CustomModal';

export default function ListagemDisciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchCurso, setSearchCurso] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [searchPeriodo, setSearchPeriodo] = useState('');
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  // Resetar paginação ao filtrar
  useEffect(() => {
    setPaginaAtual(1);
  }, [searchCurso, searchGrade, searchPeriodo, searchNome, searchSituacao]);

  const carregarDisciplinas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/disciplinas');
      if (res.ok) {
        const data = await res.json();
        setDisciplinas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Opções dinâmicas para os filtros
  const cursosOpcoes = useMemo(() => {
    const list = disciplinas.map((d) => d.curso).filter(Boolean);
    return [...new Set(list)].sort();
  }, [disciplinas]);

  const periodosOpcoes = useMemo(() => {
    const list = disciplinas.map((d) => d.periodo).filter(Boolean);
    return [...new Set(list)].sort();
  }, [disciplinas]);

  const gradesOpcoes = useMemo(() => {
    const list = disciplinas.map((d) => d.grade).filter(Boolean);
    return [...new Set(list)].sort();
  }, [disciplinas]);

  // Filtragem das disciplinas
  const filtradas = useMemo(() => {
    let resultado = disciplinas;

    if (searchCurso) {
      resultado = resultado.filter((disciplina) =>
        String(disciplina.curso || '').toLowerCase().includes(searchCurso.toLowerCase())
      );
    }

    if (searchGrade) {
      resultado = resultado.filter((disciplina) =>
        String(disciplina.grade || '').toLowerCase().includes(searchGrade.toLowerCase())
      );
    }

    if (searchPeriodo) {
      resultado = resultado.filter((disciplina) =>
        String(disciplina.periodo || '').toLowerCase().includes(searchPeriodo.toLowerCase())
      );
    }

    if (searchNome.trim()) {
      const termo = searchNome.toLowerCase().trim();
      resultado = resultado.filter((disciplina) =>
        String(disciplina.nome || '').toLowerCase().includes(termo) ||
        String(disciplina.codigo || '').toLowerCase().includes(termo)
      );
    }

    if (searchSituacao) {
      resultado = resultado.filter((disciplina) => {
        const sit = String(disciplina.situacao || 'ATIVO').toUpperCase();
        return sit === searchSituacao.toUpperCase();
      });
    }

    return resultado;
  }, [disciplinas, searchCurso, searchGrade, searchPeriodo, searchNome, searchSituacao]);

  // Métricas para os Cards de KPI
  const totalDisciplinasGeral = disciplinas.length;
  const totalDisciplinasAtivas = useMemo(
    () => disciplinas.filter((d) => String(d.situacao || 'ATIVO').toUpperCase() === 'ATIVO').length,
    [disciplinas]
  );
  const totalDisciplinasInativas = useMemo(
    () => disciplinas.filter((d) => String(d.situacao || '').toUpperCase() === 'INATIVO').length,
    [disciplinas]
  );
  const totalCursosComDisciplinas = useMemo(() => {
    const ids = new Set(disciplinas.map((d) => d.cursoId || d.curso).filter(Boolean));
    return ids.size;
  }, [disciplinas]);

  const percAtivas = totalDisciplinasGeral > 0 ? Math.round((totalDisciplinasAtivas / totalDisciplinasGeral) * 100) : 0;
  const percInativas = totalDisciplinasGeral > 0 ? Math.round((totalDisciplinasInativas / totalDisciplinasGeral) * 100) : 0;

  // Paginação
  const totalRegistros = filtradas.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = Math.min(indiceInicial + itensPorPagina, totalRegistros);

  const disciplinasPaginadas = useMemo(() => {
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
    setSearchCurso('');
    setSearchGrade('');
    setSearchPeriodo('');
    setSearchNome('');
    setSearchSituacao('');
  };

  const solicitarExclusao = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });

    try {
      const res = await fetch(`/api/disciplinas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDisciplinas((prev) => prev.filter((disciplina) => disciplina.id !== id));
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Disciplina excluída com sucesso!',
          type: 'success'
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Erro!',
          message: 'Erro ao excluir disciplina.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao deletar disciplina:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao excluir disciplina.',
        type: 'error'
      });
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
              <span className="text-slate-600 font-semibold">Disciplinas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                📖
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Gerenciar Disciplinas
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  {filtradas.length} disciplina{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''} no catálogo
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link href="/admin/disciplinas/grades">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-2xs transition cursor-pointer"
              >
                <span>⚙️</span>
                <span>Grades</span>
              </button>
            </Link>

            <Link href="/admin/disciplinas/novo">
              <button className="inline-flex items-center justify-center gap-2 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer">
                <span className="text-lg leading-none">+</span>
                <span>Nova Disciplina</span>
              </button>
            </Link>
          </div>
        </div>

        {/* ── 2. ABAS (Listar, Inserir, Grades) ───────────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-200/80">
          <button className="px-5 py-2.5 font-bold text-sm flex items-center gap-2 text-[#009688] border-b-2 border-[#009688] transition cursor-pointer">
            📋 Listar
          </button>
          <Link href="/admin/disciplinas/novo">
            <button className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 transition cursor-pointer">
              ➕ Inserir
            </button>
          </Link>
          <Link href="/admin/disciplinas/grades">
            <button className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 transition cursor-pointer">
              ⚙️ Grades Curriculares
            </button>
          </Link>
        </div>

        {/* ── 3. KPI METRIC CARDS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total de Disciplinas */}
          <div className="bg-gradient-to-b from-blue-50/70 to-blue-50/20 rounded-2xl p-5 border border-blue-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center text-lg flex-shrink-0 border border-blue-200/60">
                📖
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                Geral
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalDisciplinasGeral}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Total de Disciplinas</p>
            </div>
            <div className="pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Cadastradas no sistema</span>
              <span className="font-semibold text-blue-700 shrink-0">100%</span>
            </div>
          </div>

          {/* 2. Disciplinas Ativas */}
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
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalDisciplinasAtivas}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Disciplinas Ativas</p>
            </div>
            <div className="pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Em oferta curricular</span>
              <span className="font-semibold text-emerald-700 shrink-0">{percAtivas}% do total</span>
            </div>
          </div>

          {/* 3. Disciplinas Inativas */}
          <div className="bg-gradient-to-b from-amber-50/70 to-amber-50/20 rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center text-lg flex-shrink-0 border border-amber-200/60">
                ⏳
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                Inativas
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalDisciplinasInativas}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Disciplinas Inativas</p>
            </div>
            <div className="pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Descontinuadas</span>
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
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalCursosComDisciplinas}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Cursos Atendidos</p>
            </div>
            <div className="pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Currículos atendidos</span>
              <span className="font-semibold text-rose-700 shrink-0">Matrizes</span>
            </div>
          </div>
        </div>

        {/* ── 4. BARRA DE FILTROS DA DASHBOARD ───────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
          {/* Linha 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Curso */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Curso</label>
              <select
                value={searchCurso}
                onChange={(e) => setSearchCurso(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todos os Cursos</option>
                {cursosOpcoes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Período */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Período</label>
              <select
                value={searchPeriodo}
                onChange={(e) => setSearchPeriodo(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todos os Períodos</option>
                {periodosOpcoes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Grade Curricular</label>
              <select
                value={searchGrade}
                onChange={(e) => setSearchGrade(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todas as Grades</option>
                {gradesOpcoes.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Situação */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Situação</label>
              <select
                value={searchSituacao}
                onChange={(e) => setSearchSituacao(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todas as Situações</option>
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
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
                placeholder="Buscar por nome ou código da disciplina..."
                value={searchNome}
                onChange={(e) => setSearchNome(e.target.value)}
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
              <span className="text-xl">📖</span>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">
                  Listagem das Disciplinas
                </h2>
                <p className="text-xs text-slate-400 font-normal">
                  Visualize e gerencie a grade curricular e a oferta acadêmica
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
                Quantidade de Disciplinas: <strong className="text-slate-800">{filtradas.length}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
              Carregando disciplinas...
            </div>
          ) : filtradas.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm font-medium">Nenhuma disciplina encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="tabela-disciplinas">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold text-xs border-b border-slate-200 select-none">
                      <th className="px-5 py-3.5 w-16">#</th>
                      <th className="px-5 py-3.5">Período</th>
                      <th className="px-5 py-3.5">Disciplina</th>
                      <th className="px-5 py-3.5">Curso</th>
                      <th className="px-5 py-3.5">Carga Horária</th>
                      <th className="px-5 py-3.5">Matriz?</th>
                      <th className="px-5 py-3.5">Grade</th>
                      <th className="px-5 py-3.5 text-center">Situação</th>
                      <th className="px-5 py-3.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {disciplinasPaginadas.map((disciplina) => {
                      const isAtivo = String(disciplina.situacao || 'ATIVO').toUpperCase() === 'ATIVO';

                      return (
                        <tr key={disciplina.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                            #{disciplina.codigo || disciplina.id}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                            {disciplina.periodo || '—'}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {disciplina.nome}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-700">
                            {disciplina.curso || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                            {disciplina.cargaHoraria ? `${disciplina.cargaHoraria}h` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              disciplina.matriz ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {disciplina.matriz ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                            {disciplina.grade || '—'}
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
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Imprimir Plano"
                              >
                                📝
                              </button>
                              <button
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Link / Ementa"
                              >
                                🔗
                              </button>
                              <button
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Configurações"
                              >
                                ⚙️
                              </button>
                              <button
                                className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                                title="Material / Cloud"
                              >
                                ☁️
                              </button>
                              <Link href={`/admin/disciplinas/${disciplina.id}`}>
                                <button
                                  className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Editar Disciplina"
                                >
                                  ✏️
                                </button>
                              </Link>
                              <button
                                onClick={() => solicitarExclusao(disciplina.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Excluir Disciplina"
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
                    Mostrando {indiceInicial + 1} até {indiceFinal} de {totalRegistros} disciplinas
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
      </div>

      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta disciplina? Esta ação não poderá ser desfeita."
        type="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </>
  );
}
