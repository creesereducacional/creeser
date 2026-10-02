import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import ConfirmModal from '@/components/ConfirmModal';

export default function ListagemResponsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    idResponsavel: null,
    nomeResponsavel: '',
  });

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  // Resetar paginação ao filtrar
  useEffect(() => {
    setPaginaAtual(1);
  }, [searchNome, searchSituacao]);

  const carregarResponsaveis = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/responsaveis');
      if (res.ok) {
        const data = await res.json();
        setResponsaveis(Array.isArray(data) ? data : []);
      } else {
        setResponsaveis([]);
      }
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
      setResponsaveis([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem dos responsáveis
  const filtrados = useMemo(() => {
    let resultado = responsaveis;

    if (searchNome.trim()) {
      const termo = searchNome.toLowerCase().trim();
      resultado = resultado.filter((resp) => {
        const nome = (resp.nome || '').toLowerCase();
        const email = (resp.email || '').toLowerCase();
        const doc = String(resp.cpf || resp.documento || '').replace(/\D/g, '');
        const fone = String(resp.whatsapp || resp.telefone || '').replace(/\D/g, '');
        return (
          nome.includes(termo) ||
          email.includes(termo) ||
          doc.includes(termo.replace(/\D/g, '')) ||
          fone.includes(termo.replace(/\D/g, ''))
        );
      });
    }

    if (searchSituacao) {
      resultado = resultado.filter((resp) => {
        const sit = String(resp.situacao || resp.status || 'ATIVO').toUpperCase();
        return sit === searchSituacao.toUpperCase();
      });
    }

    return resultado;
  }, [responsaveis, searchNome, searchSituacao]);

  // Métricas dos Cards de KPI
  const totalResponsaveisGeral = responsaveis.length;
  const totalComWhatsApp = useMemo(
    () => responsaveis.filter((r) => Boolean(r.whatsapp || r.telefone || r.celular)).length,
    [responsaveis]
  );
  const totalComEmail = useMemo(
    () => responsaveis.filter((r) => Boolean(r.email && r.email.includes('@'))).length,
    [responsaveis]
  );
  const totalAtivos = useMemo(
    () => responsaveis.filter((r) => String(r.situacao || r.status || 'ATIVO').toUpperCase() === 'ATIVO').length,
    [responsaveis]
  );

  const percWhats = totalResponsaveisGeral > 0 ? Math.round((totalComWhatsApp / totalResponsaveisGeral) * 100) : 0;
  const percEmail = totalResponsaveisGeral > 0 ? Math.round((totalComEmail / totalResponsaveisGeral) * 100) : 0;
  const percAtivos = totalResponsaveisGeral > 0 ? Math.round((totalAtivos / totalResponsaveisGeral) * 100) : 0;

  // Paginação
  const totalRegistros = filtrados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = Math.min(indiceInicial + itensPorPagina, totalRegistros);

  const responsaveisPaginados = useMemo(() => {
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

  const getAvatarInitials = (nome) => {
    if (!nome) return 'RP';
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarBg = (id) => {
    const colors = [
      'bg-teal-50 text-teal-700 border-teal-200',
      'bg-sky-50 text-sky-700 border-sky-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-purple-50 text-purple-700 border-purple-200',
    ];
    const index = (id || 0) % colors.length;
    return colors[index];
  };

  const limparFiltros = () => {
    setSearchNome('');
    setSearchSituacao('');
  };

  const solicitarDeletar = (resp) => {
    setModalConfirm({
      isOpen: true,
      idResponsavel: resp.id,
      nomeResponsavel: resp.nome,
    });
  };

  const executarDeletar = async () => {
    const id = modalConfirm.idResponsavel;
    setModalConfirm({ isOpen: false, idResponsavel: null, nomeResponsavel: '' });

    if (!id) return;

    try {
      const res = await fetch(`/api/responsaveis/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResponsaveis((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error('Erro ao deletar responsável:', error);
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
              <span className="text-slate-600 font-semibold">Responsáveis</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                👥
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Gerenciar Responsáveis
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  {filtrados.length} responsável{filtrados.length !== 1 ? 'is' : ''} encontrado{filtrados.length !== 1 ? 's' : ''} no sistema
                </p>
              </div>
            </div>
          </div>

          <Link href="/admin/responsaveis/novo">
            <button className="inline-flex items-center justify-center gap-2 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer self-start sm:self-auto">
              <span className="text-lg leading-none">+</span>
              <span>Novo Responsável</span>
            </button>
          </Link>
        </div>

        {/* ── 2. ABAS (Listar, Inserir) ───────────────────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-200/80">
          <button className="px-5 py-2.5 font-bold text-sm flex items-center gap-2 text-[#009688] border-b-2 border-[#009688] transition cursor-pointer">
            📋 Listar
          </button>
          <Link href="/admin/responsaveis/novo">
            <button className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 transition cursor-pointer">
              ➕ Inserir
            </button>
          </Link>
        </div>

        {/* ── 3. KPI METRIC CARDS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total de Responsáveis */}
          <div className="bg-gradient-to-b from-blue-50/70 to-blue-50/20 rounded-2xl p-5 border border-blue-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center text-lg flex-shrink-0 border border-blue-200/60">
                👥
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                Geral
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalResponsaveisGeral}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Total de Responsáveis</p>
            </div>
            <div className="pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Cadastrados no sistema</span>
              <span className="font-semibold text-blue-700 shrink-0">100%</span>
            </div>
          </div>

          {/* 2. Com WhatsApp */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-lg flex-shrink-0 border border-emerald-200/60">
                💬
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                +{percWhats}%
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalComWhatsApp}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Com WhatsApp/Celular</p>
            </div>
            <div className="pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Contato direto ativo</span>
              <span className="font-semibold text-emerald-700 shrink-0">{percWhats}% do total</span>
            </div>
          </div>

          {/* 3. Com E-mail */}
          <div className="bg-gradient-to-b from-amber-50/70 to-amber-50/20 rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center text-lg flex-shrink-0 border border-amber-200/60">
                📧
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                Notificações
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalComEmail}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Com E-mail Válido</p>
            </div>
            <div className="pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Faturas e avisos</span>
              <span className="font-semibold text-amber-700 shrink-0">{percEmail}% do total</span>
            </div>
          </div>

          {/* 4. Responsáveis Ativos */}
          <div className="bg-gradient-to-b from-rose-50/70 to-rose-50/20 rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center text-lg flex-shrink-0 border border-rose-200/60">
                ✅
              </div>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full border border-rose-200/50">
                Ativos
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalAtivos}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Situação Ativa</p>
            </div>
            <div className="pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate font-normal">Vínculos acadêmicos</span>
              <span className="font-semibold text-rose-700 shrink-0">{percAtivos}% do total</span>
            </div>
          </div>
        </div>

        {/* ── 4. BARRA DE FILTROS DA DASHBOARD ───────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Busca por Nome / Documento */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Buscar Responsável</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Nome, e-mail, CPF ou telefone do responsável..."
                  value={searchNome}
                  onChange={(e) => setSearchNome(e.target.value)}
                  className="w-full h-10 pl-10 pr-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
                />
              </div>
            </div>

            {/* 2. Situação */}
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
              <span className="text-xl">👥</span>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">
                  Listagem dos Responsáveis
                </h2>
                <p className="text-xs text-slate-400 font-normal">
                  Visualize e gerencie os responsáveis vinculados aos alunos
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
                Quantidade de Responsáveis: <strong className="text-slate-800">{filtrados.length}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8">
              <SkeletonTable rows={5} cols={6} />
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Nenhum responsável encontrado"
              description="Ajuste os filtros ou cadastre um novo responsável no sistema."
              action={{ label: '+ Novo Responsável', href: '/admin/responsaveis/novo', variant: 'primary' }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="tabela-responsaveis">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold text-xs border-b border-slate-200 select-none">
                      <th className="px-5 py-3.5 w-16">ID</th>
                      <th className="px-5 py-3.5">Nome do Responsável</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Whatsapp / Celular</th>
                      <th className="px-5 py-3.5">Telefone Comercial</th>
                      <th className="px-5 py-3.5 text-center">Situação</th>
                      <th className="px-5 py-3.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {responsaveisPaginados.map((responsavel) => {
                      const isAtivo = String(responsavel.situacao || responsavel.status || 'ATIVO').toUpperCase() === 'ATIVO';

                      return (
                        <tr key={responsavel.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                            #{responsavel.id}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${getAvatarBg(responsavel.id)}`}>
                                {getAvatarInitials(responsavel.nome)}
                              </div>
                              <span className="font-bold text-slate-900 leading-tight">
                                {responsavel.nome}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                            {responsavel.email || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-700 whitespace-nowrap font-mono">
                            {responsavel.whatsapp || responsavel.telefone || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap font-mono">
                            {responsavel.telefoneComercial || '—'}
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
                                title="Imprimir"
                              >
                                🖨️
                              </button>
                              <Link href={`/admin/responsaveis/${responsavel.id}`}>
                                <button
                                  className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Editar Responsável"
                                >
                                  ✏️
                                </button>
                              </Link>
                              <button
                                onClick={() => solicitarDeletar(responsavel)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Excluir Responsável"
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
                    Mostrando {indiceInicial + 1} até {indiceFinal} de {totalRegistros} responsáveis
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
          onClose={() => setModalConfirm({ isOpen: false, idResponsavel: null, nomeResponsavel: '' })}
          onConfirm={executarDeletar}
          title="Excluir Responsável"
          message={`Tem certeza que deseja deletar o responsável "${modalConfirm.nomeResponsavel}"? Esta ação não poderá ser desfeita.`}
          type="delete"
        />
      </div>
    </>
  );
}
