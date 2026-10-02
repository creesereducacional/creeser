import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import ConfirmModal from '@/components/ConfirmModal';

export default function ListagemCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instituicoes, setInstituicoes] = useState([]);
  const [instituicaoPadraoId, setInstituicaoPadraoId] = useState('');
  const [selectedInstituicaoId, setSelectedInstituicaoId] = useState('');
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    idCurso: null,
    nomeCurso: '',
  });

  useEffect(() => {
    carregarInstituicoes();
  }, []);

  // Resetar paginação ao filtrar
  useEffect(() => {
    setPaginaAtual(1);
  }, [searchNome, searchSituacao, selectedInstituicaoId]);

  const carregarInstituicoes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/instituicoes');
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        setInstituicoes(lista);

        if (lista.length > 0) {
          const padrao = String(lista[0].id);
          setInstituicaoPadraoId(padrao);
          setSelectedInstituicaoId(padrao);
          await carregarCursos(padrao);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
      setLoading(false);
    }
  };

  const carregarCursos = async (instId = selectedInstituicaoId) => {
    if (!instId) {
      setCursos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/cursos?instituicao_id=${encodeURIComponent(instId)}`);
      if (res.ok) {
        const data = await res.json();
        setCursos(Array.isArray(data) ? data : []);
      } else {
        setCursos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      setCursos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem dos cursos
  const filtrados = useMemo(() => {
    let resultado = cursos;

    if (searchNome.trim()) {
      const termo = searchNome.toLowerCase().trim();
      resultado = resultado.filter((curso) =>
        (curso.nome || '').toLowerCase().includes(termo)
      );
    }

    if (searchSituacao) {
      resultado = resultado.filter((curso) => {
        const sit = String(curso.situacao || 'ATIVO').toUpperCase();
        return sit === searchSituacao.toUpperCase();
      });
    }

    return resultado;
  }, [cursos, searchNome, searchSituacao]);

  // Métricas dos Cards de KPI
  const totalCursosGeral = cursos.length;
  const totalCursosAtivos = useMemo(
    () => cursos.filter((c) => String(c.situacao || 'ATIVO').toUpperCase() === 'ATIVO').length,
    [cursos]
  );
  const totalCursosInativos = useMemo(
    () => cursos.filter((c) => String(c.situacao || '').toUpperCase() === 'INATIVO').length,
    [cursos]
  );
  const totalCargaHorariaMedia = useMemo(() => {
    if (cursos.length === 0) return 0;
    const soma = cursos.reduce((acc, c) => acc + (Number(c.cargaHoraria) || 0), 0);
    return Math.round(soma / cursos.length);
  }, [cursos]);

  const percAtivos = totalCursosGeral > 0 ? Math.round((totalCursosAtivos / totalCursosGeral) * 100) : 0;
  const percInativos = totalCursosGeral > 0 ? Math.round((totalCursosInativos / totalCursosGeral) * 100) : 0;

  // Paginação
  const totalRegistros = filtrados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = Math.min(indiceInicial + itensPorPagina, totalRegistros);

  const cursosPaginados = useMemo(() => {
    return filtrados.slice(indiceInicial, indiceFinal);
  }, [filtrados, indiceInicial, indiceFinal]);

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
    setSearchNome('');
    setSearchSituacao('');
    if (instituicaoPadraoId) {
      setSelectedInstituicaoId(instituicaoPadraoId);
      carregarCursos(instituicaoPadraoId);
    }
  };

  const solicitarDeletar = (curso) => {
    setModalConfirm({
      isOpen: true,
      idCurso: curso.id,
      nomeCurso: curso.nome,
    });
  };

  const executarDeletar = async () => {
    const id = modalConfirm.idCurso;
    setModalConfirm({ isOpen: false, idCurso: null, nomeCurso: '' });

    if (!id) return;

    try {
      const res = await fetch(`/api/cursos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        carregarCursos(selectedInstituicaoId);
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const imprimirCursos = () => {
    window.print();
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
              <span className="text-slate-600 font-semibold">Cursos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                📖
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Gerenciar Cursos
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  {filtrados.length} curso{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''} no sistema
                </p>
              </div>
            </div>
          </div>

          <Link href="/admin/cursos/novo">
            <button className="inline-flex items-center justify-center gap-2 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer self-start sm:self-auto">
              <span className="text-lg leading-none">+</span>
              <span>Novo Curso</span>
            </button>
          </Link>
        </div>

        {/* ── 2. ABAS (Listar, Inserir) ───────────────────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-200/80">
          <button className="px-5 py-2.5 font-bold text-sm flex items-center gap-2 text-[#009688] border-b-2 border-[#009688] transition cursor-pointer">
            📋 Listar
          </button>
          <Link href="/admin/cursos/novo">
            <button className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 transition cursor-pointer">
              ➕ Inserir
            </button>
          </Link>
        </div>

        {/* ── 3. KPI METRIC CARDS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total de Cursos */}
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
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalCursosGeral}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Total de Cursos</p>
            </div>
            <div className="pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Cadastrados no catálogo</span>
              <span className="font-semibold text-blue-700 shrink-0">100%</span>
            </div>
          </div>

          {/* 2. Cursos Ativos */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-lg flex-shrink-0 border border-emerald-200/60">
                ✅
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                +{percAtivos}%
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalCursosAtivos}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Cursos Ativos</p>
            </div>
            <div className="pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Com turmas / matrículas</span>
              <span className="font-semibold text-emerald-700 shrink-0">{percAtivos}% do total</span>
            </div>
          </div>

          {/* 3. Cursos Inativos */}
          <div className="bg-gradient-to-b from-amber-50/70 to-amber-50/20 rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center text-lg flex-shrink-0 border border-amber-200/60">
                ⏳
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                Inativos
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalCursosInativos}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Cursos Inativos</p>
            </div>
            <div className="pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Desativados ou suspensos</span>
              <span className="font-semibold text-amber-700 shrink-0">{percInativos}% do total</span>
            </div>
          </div>

          {/* 4. Carga Horária Média */}
          <div className="bg-gradient-to-b from-rose-50/70 to-rose-50/20 rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center text-lg flex-shrink-0 border border-rose-200/60">
                ⏱️
              </div>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full border border-rose-200/50">
                Média
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalCargaHorariaMedia}h</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Carga Horária Média</p>
            </div>
            <div className="pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Horas por matriz</span>
              <span className="font-semibold text-rose-700 shrink-0">Currículo</span>
            </div>
          </div>
        </div>

        {/* ── 4. BARRA DE FILTROS DA DASHBOARD ───────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Instituição */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Instituição *</label>
              <select
                value={selectedInstituicaoId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedInstituicaoId(val);
                  carregarCursos(val);
                }}
                disabled={instituicoes.length <= 1}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
              >
                {instituicoes.length === 0 && <option value="">Nenhuma instituição autorizada</option>}
                {instituicoes.map((inst) => (
                  <option key={inst.id} value={String(inst.id)}>
                    {inst.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Nome do Curso */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome do Curso</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nome do curso..."
                  value={searchNome}
                  onChange={(e) => setSearchNome(e.target.value)}
                  className="w-full h-10 pl-10 pr-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
                />
              </div>
            </div>

            {/* 3. Situação */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Situação</label>
              <select
                value={searchSituacao}
                onChange={(e) => setSearchSituacao(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Todas</option>
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
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

        {/* ── 5. LISTAGEM EM TABELA ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          {/* Header da Tabela */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 border-b border-slate-200/80 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📚</span>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">
                  Listagem de Cursos
                </h2>
                <p className="text-xs text-slate-400 font-normal">
                  Visualize e gerencie a matriz e a oferta curricular da instituição
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={imprimirCursos}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>🖨️</span>
                <span>IMPRIMIR</span>
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Quantidade de Cursos: <strong className="text-slate-800">{filtrados.length}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8">
              <SkeletonTable rows={5} cols={6} />
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon="📖"
              title="Nenhum curso encontrado"
              description="Ajuste os filtros ou cadastre um novo curso no catálogo."
              action={{ label: '+ Novo Curso', href: '/admin/cursos/novo', variant: 'primary' }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="tabela-cursos">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold text-xs border-b border-slate-200 select-none">
                      <th className="px-5 py-3.5 w-16">ID</th>
                      <th className="px-5 py-3.5">Nome do Curso</th>
                      <th className="px-5 py-3.5">Duração</th>
                      <th className="px-5 py-3.5">Nível Ensino</th>
                      <th className="px-5 py-3.5">Carga Horária</th>
                      <th className="px-5 py-3.5 text-center">Situação</th>
                      <th className="px-5 py-3.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {cursosPaginados.map((curso) => {
                      const isAtivo = String(curso.situacao || 'ATIVO').toUpperCase() === 'ATIVO';

                      return (
                        <tr key={curso.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                            #{curso.id}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {curso.nome}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                            {curso.duracao ? `${curso.duracao} período(s)` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-700">
                            {curso.nivelEnsino || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                            {curso.cargaHoraria ? `${curso.cargaHoraria}h` : '—'}
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
                              <Link href={`/admin/cursos/${curso.id}`}>
                                <button
                                  className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Editar Curso"
                                >
                                  ✏️
                                </button>
                              </Link>
                              <button
                                onClick={() => solicitarDeletar(curso)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Excluir Curso"
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
                    Mostrando {indiceInicial + 1} até {indiceFinal} de {totalRegistros} cursos
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
          onClose={() => setModalConfirm({ isOpen: false, idCurso: null, nomeCurso: '' })}
          onConfirm={executarDeletar}
          title="Excluir Curso"
          message={`Tem certeza que deseja deletar o curso "${modalConfirm.nomeCurso}"? Esta ação não poderá ser desfeita.`}
          type="delete"
        />
      </div>
    </>
  );
}
