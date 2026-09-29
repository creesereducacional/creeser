import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import Link from 'next/link';
import StatusBadge, { STATUS_CONFIG } from '@/components/recepcao/StatusBadge';
import EmptyState from '@/components/recepcao/EmptyState';
import PageHeader from '@/components/ui/PageHeader';

const STATUS_FILTROS = [
  { key: '',                               label: 'Todos' },
  { key: 'PRE_CADASTRO',                   label: 'Pré-Cadastro' },
  { key: 'AGUARDANDO_PAGAMENTO_MATRICULA', label: 'Ag. Pagamento' },
  { key: 'AGUARDANDO_FORMACAO_TURMA',      label: 'Ag. Turma' },
  { key: 'ATIVO',                          label: 'Ativo' },
  { key: 'DESISTENTE',                     label: 'Desistente' },
];

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

function formatarDataHora(dataIso) {
  if (!dataIso) return '—';
  try {
    return new Date(dataIso).toLocaleDateString('pt-BR');
  } catch (_) {
    return dataIso;
  }
}

export default function PreCadastrosIndex() {
  const router = useRouter();

  // Dados
  const [lista, setLista]           = useState([]);
  const [unidades, setUnidades]     = useState([]);
  const [cursos, setCursos]         = useState([]);
  const [turmas, setTurmas]         = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [busca, setBusca]                 = useState('');
  const [filtroStatus, setFiltroStatus]   = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroCurso, setFiltroCurso]     = useState('');
  const [filtroTurma, setFiltroTurma]     = useState('');

  // Paginação
  const [paginaAtual, setPaginaAtual]         = useState(1);
  const [itensPorPagina, setItensPorPagina]   = useState(10);

  // Data/hora para o cabeçalho de impressão
  const [dataEmissao, setDataEmissao] = useState('');

  // Lê query params ao montar
  useEffect(() => {
    const { busca: b, filtro: f } = router.query;
    if (b) setBusca(b);
    if (f) setFiltroStatus(f);
  }, [router.query]);

  // Carregar dados e opções
  useEffect(() => {
    setCarregando(true);
    fetch('/api/recepcao/pre-cadastros?include_options=true', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setLista(Array.isArray(data.alunos) ? data.alunos : []);
          setUnidades(Array.isArray(data.unidades) ? data.unidades : []);
          setCursos(Array.isArray(data.cursos) ? data.cursos : []);
          setTurmas(Array.isArray(data.turmas) ? data.turmas : []);
        } else if (Array.isArray(data)) {
          setLista(data);
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  // ── Dependência de Filtros em Cascata ──────────────────────────────────
  // Cursos disponíveis respeitando a unidade selecionada
  const cursosFiltrados = useMemo(() => {
    if (!filtroUnidade) return cursos;
    const unidIdNum = Number(filtroUnidade);
    return cursos.filter(c => Array.isArray(c.unidade_ids) && c.unidade_ids.includes(unidIdNum));
  }, [cursos, filtroUnidade]);

  // Turmas disponíveis respeitando unidade e curso selecionados
  const turmasFiltradas = useMemo(() => {
    return turmas.filter(t => {
      const matchUnidade = !filtroUnidade || Number(t.unidadeid) === Number(filtroUnidade);
      const matchCurso = !filtroCurso || Number(t.cursoid) === Number(filtroCurso);
      return matchUnidade && matchCurso;
    });
  }, [turmas, filtroUnidade, filtroCurso]);

  // Ao mudar Unidade, limpar Curso ou Turma caso fiquem incompatíveis
  function handleUnidadeChange(novaUnidade) {
    setFiltroUnidade(novaUnidade);
    setPaginaAtual(1);
    if (novaUnidade) {
      const unidIdNum = Number(novaUnidade);
      // Checar se o curso atual ainda é válido para esta unidade
      if (filtroCurso) {
        const cursoValido = cursos.some(
          c => String(c.id) === String(filtroCurso) && Array.isArray(c.unidade_ids) && c.unidade_ids.includes(unidIdNum)
        );
        if (!cursoValido) {
          setFiltroCurso('');
          setFiltroTurma('');
        }
      }
      // Checar se a turma atual ainda é válida para esta unidade
      if (filtroTurma) {
        const turmaValida = turmas.some(
          t => String(t.id) === String(filtroTurma) && Number(t.unidadeid) === unidIdNum
        );
        if (!turmaValida) {
          setFiltroTurma('');
        }
      }
    }
  }

  // Ao mudar Curso, limpar Turma caso fique incompatível
  function handleCursoChange(novoCurso) {
    setFiltroCurso(novoCurso);
    setPaginaAtual(1);
    if (novoCurso && filtroTurma) {
      const turmaValida = turmas.some(
        t => String(t.id) === String(filtroTurma) && String(t.cursoid) === String(novoCurso)
      );
      if (!turmaValida) {
        setFiltroTurma('');
      }
    }
  }

  function handleTurmaChange(novaTurma) {
    setFiltroTurma(novaTurma);
    setPaginaAtual(1);
  }

  function handleBuscaChange(e) {
    setBusca(e.target.value);
    setPaginaAtual(1);
  }

  function handleStatusChange(statusKey) {
    setFiltroStatus(statusKey);
    setPaginaAtual(1);
  }

  function handleLimparFiltros() {
    setBusca('');
    setFiltroStatus('');
    setFiltroUnidade('');
    setFiltroCurso('');
    setFiltroTurma('');
    setPaginaAtual(1);
  }

  const temFiltrosAtivos = Boolean(
    busca || filtroStatus || filtroUnidade || filtroCurso || filtroTurma
  );

  // ── Filtragem dos Dados ────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    const qNum = busca.replace(/\D/g, '');

    return lista.filter(a => {
      // Busca textual por nome, CPF, telefone ou email
      const matchBusca =
        !busca ||
        (a.nome || '').toLowerCase().includes(q) ||
        (qNum && (a.cpf || '').replace(/\D/g, '').includes(qNum)) ||
        (qNum && (a.telefone_celular || '').replace(/\D/g, '').includes(qNum)) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.curso_nome || '').toLowerCase().includes(q) ||
        (a.turma_nome || '').toLowerCase().includes(q);

      // Status
      const matchStatus = !filtroStatus || a.statusmatricula === filtroStatus;

      // Unidade
      const matchUnidade = !filtroUnidade || String(a.unidade_id) === String(filtroUnidade);

      // Curso
      const matchCurso = !filtroCurso || String(a.cursoid) === String(filtroCurso);

      // Turma
      const matchTurma = !filtroTurma || String(a.turmaid) === String(filtroTurma);

      return matchBusca && matchStatus && matchUnidade && matchCurso && matchTurma;
    });
  }, [lista, busca, filtroStatus, filtroUnidade, filtroCurso, filtroTurma]);

  // Contagem por status para os tabs
  const contagem = useMemo(() => {
    const counts = {};
    lista.forEach(a => {
      counts[a.statusmatricula] = (counts[a.statusmatricula] || 0) + 1;
    });
    return counts;
  }, [lista]);

  // ── Paginação ──────────────────────────────────────────────────────────
  const totalRegistros = filtrados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;
  const paginaValida = Math.min(Math.max(paginaAtual, 1), totalPaginas);

  const inicioIdx = (paginaValida - 1) * itensPorPagina;
  const fimIdx = Math.min(inicioIdx + itensPorPagina, totalRegistros);
  const itensPaginados = useMemo(() => {
    return filtrados.slice(inicioIdx, fimIdx);
  }, [filtrados, inicioIdx, fimIdx]);

  // Botão Imprimir Lista
  function handleImprimirLista() {
    setDataEmissao(new Date().toLocaleString('pt-BR'));
    setTimeout(() => {
      window.print();
    }, 100);
  }

  // Descrições dos filtros ativos para o cabeçalho de impressão
  const nomeUnidadeSel = unidades.find(u => String(u.id) === String(filtroUnidade))?.nome || 'Todas';
  const nomeCursoSel = cursos.find(c => String(c.id) === String(filtroCurso))?.nome || 'Todos';
  const nomeTurmaSel = turmas.find(t => String(t.id) === String(filtroTurma))?.nome || 'Todas';
  const statusLabelSel = STATUS_FILTROS.find(s => s.key === filtroStatus)?.label || 'Todos';

  return (
    <RecepcaoLayout titulo="Pré-Cadastros">
      <div className="space-y-4 print:space-y-0">

        {/* ── SEÇÃO DE IMPRESSÃO EXCLUSIVA EM A4 (visível apenas ao imprimir) ── */}
        <div className="hidden print:block font-sans text-gray-900 p-4">
          {/* Cabeçalho do Relatório */}
          <div className="border-b-2 border-blue-600 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight text-blue-800">CREESER EDUCACIONAL</h1>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mt-0.5">
                  Lista de Pré-Cadastros
                </h2>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Emissão: <span className="font-semibold text-gray-800">{dataEmissao || new Date().toLocaleString('pt-BR')}</span></p>
                <p>Total de Registros: <span className="font-bold text-blue-700">{totalRegistros}</span></p>
              </div>
            </div>

            {/* Resumo dos Filtros Aplicados */}
            <div className="mt-3 pt-2 border-t border-gray-200 grid grid-cols-4 gap-2 text-[11px] text-gray-600">
              <div><span className="font-semibold text-gray-800">Unidade:</span> {nomeUnidadeSel}</div>
              <div><span className="font-semibold text-gray-800">Curso:</span> {nomeCursoSel}</div>
              <div><span className="font-semibold text-gray-800">Turma:</span> {nomeTurmaSel}</div>
              <div><span className="font-semibold text-gray-800">Status:</span> {statusLabelSel}</div>
              {busca && (
                <div className="col-span-4 mt-1"><span className="font-semibold text-gray-800">Busca textual:</span> &ldquo;{busca}&rdquo;</div>
              )}
            </div>
          </div>

          {/* Tabela de Impressão */}
          {filtrados.length === 0 ? (
            <p className="text-center text-xs py-8 text-gray-500">Nenhum pré-cadastro encontrado com os filtros aplicados.</p>
          ) : (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider">
                  <th className="py-2 px-2 w-8 text-center border-r border-gray-200">#</th>
                  <th className="py-2 px-2 border-r border-gray-200">Nome do Aluno</th>
                  <th className="py-2 px-2 border-r border-gray-200">CPF</th>
                  <th className="py-2 px-2 border-r border-gray-200">Telefone</th>
                  <th className="py-2 px-2 border-r border-gray-200">Curso</th>
                  <th className="py-2 px-2 border-r border-gray-200">Turma</th>
                  <th className="py-2 px-2 border-r border-gray-200">Data Cadastro</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtrados.map((aluno, idx) => {
                  const statusConf = STATUS_CONFIG[aluno.statusmatricula] || { label: aluno.statusmatricula || '—' };
                  return (
                    <tr key={aluno.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-1.5 px-2 text-center font-semibold text-gray-500 border-r border-gray-200">{idx + 1}</td>
                      <td className="py-1.5 px-2 font-medium text-gray-900 border-r border-gray-200">{aluno.nome}</td>
                      <td className="py-1.5 px-2 text-gray-700 border-r border-gray-200 whitespace-nowrap">{aluno.cpf || '—'}</td>
                      <td className="py-1.5 px-2 text-gray-700 border-r border-gray-200 whitespace-nowrap">{aluno.telefone_celular || '—'}</td>
                      <td className="py-1.5 px-2 text-gray-700 border-r border-gray-200">{aluno.curso_nome || '—'}</td>
                      <td className="py-1.5 px-2 text-gray-700 border-r border-gray-200">{aluno.turma_nome || '—'}</td>
                      <td className="py-1.5 px-2 text-gray-600 border-r border-gray-200 whitespace-nowrap">{formatarDataHora(aluno.datacriacao)}</td>
                      <td className="py-1.5 px-2 text-center whitespace-nowrap font-medium text-gray-800">
                        {statusConf.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Rodapé da Impressão */}
          <div className="mt-6 pt-3 border-t border-gray-200 text-right text-[10px] text-gray-400">
            Relatório gerado pelo ERP CREESER · Página de Impressão A4
          </div>
        </div>

        {/* ── CONTEÚDO DE TELA (ocultado durante a impressão) ──────────────── */}
        <div className="space-y-4 print:hidden">
          {/* ── Header ────────────────────────────────────────────────── */}
          <PageHeader
            icon="📋"
            title="Pré-Cadastros"
            subtitle={`${filtrados.length} de ${lista.length} registro${lista.length !== 1 ? 's' : ''}`}
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={handleImprimirLista}
                  disabled={filtrados.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gerar visualização e PDF em A4 de todos os registros filtrados"
                >
                  🖨️ Imprimir Lista
                </button>
                <Link href="/recepcao/pre-cadastros/novo">
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                    <span>+</span> Novo Pré-Cadastro
                  </button>
                </Link>
              </div>
            }
          />

          {/* ── Painel de Filtros Organizado e Responsivo ─────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3.5">
            {/* Linha 1: Busca e Selects de Unidade, Curso e Turma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Busca textual */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  🔍 Buscar Aluno
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome, CPF ou telefone…"
                    value={busca}
                    onChange={handleBuscaChange}
                    className="w-full pl-3.5 pr-8 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                  {busca && (
                    <button
                      onClick={() => { setBusca(''); setPaginaAtual(1); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Unidade */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  🏢 Unidade
                </label>
                <select
                  value={filtroUnidade}
                  onChange={e => handleUnidadeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="">Todas as Unidades</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Curso */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  📖 Curso
                </label>
                <select
                  value={filtroCurso}
                  onChange={e => handleCursoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="">Todos os Cursos</option>
                  {cursosFiltrados.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Turma */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  🏫 Turma
                </label>
                <select
                  value={filtroTurma}
                  onChange={e => handleTurmaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="">Todas as Turmas</option>
                  {turmasFiltradas.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nome}{t.turno ? ` — ${t.turno}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 2: Status Tabs + Botão Limpar Filtros */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              {/* Tabs de Status */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide flex-1">
                {STATUS_FILTROS.map(f => {
                  const ativo = filtroStatus === f.key;
                  const cnt   = f.key ? (contagem[f.key] || 0) : lista.length;
                  return (
                    <button
                      key={f.key}
                      onClick={() => handleStatusChange(f.key)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        ativo
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {f.label}
                      {!carregando && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${ativo ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {cnt}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Botão LIMPAR */}
              {temFiltrosAtivos && (
                <button
                  onClick={handleLimparFiltros}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex-shrink-0"
                  title="Restaurar todos os filtros e busca"
                >
                  <span>↺</span> Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* ── Lista de Pré-Cadastros ─────────────────────────────────── */}
          {carregando ? (
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full w-24" />
                </div>
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon="🔍"
              title={temFiltrosAtivos ? 'Nenhum resultado encontrado' : 'Nenhum pré-cadastro ainda'}
              message={
                temFiltrosAtivos
                  ? 'Tente ajustar ou limpar os filtros de busca, unidade, curso, turma ou status.'
                  : 'Cadastre o primeiro aluno para começar.'
              }
              action={
                !temFiltrosAtivos ? (
                  <Link href="/recepcao/pre-cadastros/novo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                    ➕ Novo Pré-Cadastro
                  </Link>
                ) : (
                  <button onClick={handleLimparFiltros}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
                    Limpar todos os filtros
                  </button>
                )
              }
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="divide-y divide-gray-50">
                {itensPaginados.map(a => {
                  const tel = (a.telefone_celular || '').replace(/\D/g, '');
                  const wppLink = tel ? `https://wa.me/55${tel}` : null;

                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/60 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full ${avatarCor(a.nome)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                        {iniciais(a.nome)}
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{a.nome}</p>
                          {a.curso_nome && (
                            <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-medium">
                              {a.curso_nome}
                            </span>
                          )}
                          {a.turma_nome && (
                            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                              {a.turma_nome}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                          {a.cpf && <span>CPF {a.cpf}</span>}
                          {a.telefone_celular && <span>📱 {a.telefone_celular}</span>}
                          {a.unidade_nome && <span>🏢 {a.unidade_nome}</span>}
                          {a.datacriacao && (
                            <span className="hidden sm:inline">
                              📅 {new Date(a.datacriacao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="hidden sm:block flex-shrink-0">
                        <StatusBadge status={a.statusmatricula} size="md" />
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {wppLink && (
                          <a
                            href={wppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir WhatsApp"
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 border border-green-200 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors text-sm"
                            onClick={e => e.stopPropagation()}
                          >
                            💬
                          </a>
                        )}
                        <Link
                          href={`/recepcao/pre-cadastros/${a.id}`}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs font-semibold transition-colors"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/recepcao/pre-cadastros/${a.id}?editar=1`}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs font-semibold transition-colors"
                        >
                          Editar
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Barra de Paginação e Rodapé ──────────────────────────── */}
              <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                {/* Resumo de registros e seletor por página */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    Exibindo <strong>{inicioIdx + 1}</strong>–<strong>{fimIdx}</strong> de <strong>{totalRegistros}</strong> registro{totalRegistros !== 1 ? 's' : ''}
                    {temFiltrosAtivos && ` (filtrado de ${lista.length} total)`}
                  </span>

                  <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200">
                    <span>Exibir:</span>
                    <select
                      value={itensPorPagina}
                      onChange={e => {
                        setItensPorPagina(Number(e.target.value));
                        setPaginaAtual(1);
                      }}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Controles de Navegação de Página */}
                {totalPaginas > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
                      disabled={paginaValida === 1}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ‹ Anterior
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => {
                      // Mostrar página atual, adjacentes e primeira/última
                      if (
                        num === 1 ||
                        num === totalPaginas ||
                        (num >= paginaValida - 1 && num <= paginaValida + 1)
                      ) {
                        const isAtiva = num === paginaValida;
                        return (
                          <button
                            key={num}
                            onClick={() => setPaginaAtual(num)}
                            className={`min-w-[28px] py-1 px-2 rounded-lg text-xs font-semibold transition-colors ${
                              isAtiva
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      }
                      if (num === paginaValida - 2 || num === paginaValida + 2) {
                        return <span key={num} className="px-1 text-xs text-gray-400">…</span>;
                      }
                      return null;
                    })}

                    <button
                      onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
                      disabled={paginaValida === totalPaginas}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Próximo ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </RecepcaoLayout>
  );
}
