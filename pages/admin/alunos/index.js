import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import BarraFiltros from '@/components/AdminFinanceiro/BarraFiltros';
import ModalContratoAluno from '@/components/ModalContratoAluno';
import ModalRematricula from '@/components/ModalRematricula';
import ConfirmModal from '@/components/ConfirmModal';

export default function ListagemAlunos() {
  const router = useRouter();
  const currentYear = new Date().getFullYear().toString();
  const [abaAtiva, setAbaAtiva] = useState('listar');
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalContratoAluno, setModalContratoAluno] = useState(null);
  const [modalRematricula, setModalRematricula] = useState(null);
  const [modalDelete, setModalDelete] = useState({ isOpen: false, id: null, nome: '' });

  // Opções para os filtros
  const [unidades, setUnidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);

  // Estados dos filtros
  const [searchVal, setSearchVal] = useState('');
  const [statusVal, setStatusVal] = useState('');
  const [unidadeVal, setUnidadeVal] = useState('');
  const [cursoVal, setCursoVal] = useState('');
  const [turmaVal, setTurmaVal] = useState('');
  const [anoLetivoVal, setAnoLetivoVal] = useState('');

  // Estados da Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  const [errorMsg, setErrorMsg] = useState(null);

  // Resetar para primeira página ao alterar qualquer filtro e fechar menu de ações
  useEffect(() => {
    setPaginaAtual(1);
    setMenuAcoesData(null);
  }, [searchVal, statusVal, unidadeVal, cursoVal, turmaVal, anoLetivoVal]);

  // Fechar menu de ações ao trocar de página
  useEffect(() => {
    setMenuAcoesData(null);
  }, [paginaAtual]);

  useEffect(() => {
    carregarAlunos();
    carregarOpcoesFiltros();
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const response = await fetch('/api/alunos');
      const data = await response.json().catch(() => null);

      if (response.ok) {
        setAlunos(Array.isArray(data) ? data : []);
      } else {
        const errorDetail = data?.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : '';
        const msg = data?.message 
          ? `${data.message}${errorDetail && errorDetail !== data.message ? `: ${errorDetail}` : ''}`
          : (errorDetail || `Erro ${response.status} ao carregar alunos.`);
        setErrorMsg(msg);
        console.error('❌ Falha ao carregar alunos:', msg, data);
        setAlunos([]);
      }
    } catch (error) {
      console.error('❌ Erro de conexão ao carregar alunos:', error);
      setErrorMsg(error.message || 'Falha de comunicação com o servidor.');
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarOpcoesFiltros = async () => {
    try {
      const [resOpcoes, resTurmas, resCursos, resAnos] = await Promise.all([
        fetch('/api/turmas/opcoes'),
        fetch('/api/turmas'),
        fetch('/api/cursos'),
        fetch('/api/configuracoes/anos-letivos'),
      ]);

      if (resOpcoes.ok) {
        const data = await resOpcoes.json();
        if (Array.isArray(data.unidades)) setUnidades(data.unidades);
      }

      if (resTurmas.ok) {
        const data = await resTurmas.json();
        setTurmas(Array.isArray(data) ? data : (data.turmas || []));
      }

      if (resCursos.ok) {
        const data = await resCursos.json();
        setCursos(Array.isArray(data) ? data : (data.cursos || []));
      }

      if (resAnos.ok) {
        const data = await resAnos.json();
        const lista = Array.isArray(data)
          ? data.map(a => (a.nome ?? a.ano ?? '').toString()).filter(Boolean)
          : [];
        setAnosLetivos([...new Set(lista)].sort());
      }
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error);
    }
  };

  // Filtragem dinâmica de turmas baseada no curso / unidade selecionados
  const turmasFiltradasOpcoes = useMemo(() => {
    let list = turmas;
    if (cursoVal) {
      list = list.filter(t => String(t.cursoId || t.cursoid || t.curso_id) === String(cursoVal));
    }
    if (unidadeVal) {
      list = list.filter(t => String(t.unidadeId || t.unidadeid || t.unidade_id) === String(unidadeVal));
    }
    return list;
  }, [turmas, cursoVal, unidadeVal]);

  const limparFiltros = () => {
    setSearchVal('');
    setStatusVal('');
    setUnidadeVal('');
    setCursoVal('');
    setTurmaVal('');
    setAnoLetivoVal('');
  };

  // Filtragem dos registros de alunos / matrículas
  const filteredAlunos = useMemo(() => {
    return alunos.filter((aluno) => {
      // 1. Busca por Texto: Nome, Matrícula, CPF, Responsável
      if (searchVal && searchVal.trim()) {
        const term = searchVal.trim().toLowerCase();
        const nome = String(aluno.nome || '').toLowerCase();
        const cpf = String(aluno.cpf || '').replace(/\D/g, '');
        const matNum = String(aluno.numero_id || aluno.matricula_codigo || aluno.matricula || '').toLowerCase();
        const respNome = String(aluno.nome_responsavel || aluno.responsavel || aluno.mae || aluno.pai || '').toLowerCase();

        const matchNome = nome.includes(term);
        const matchCpf = cpf.includes(term.replace(/\D/g, '')) || String(aluno.cpf || '').toLowerCase().includes(term);
        const matchMat = matNum.includes(term);
        const matchResp = respNome.includes(term);

        if (!matchNome && !matchCpf && !matchMat && !matchResp) {
          return false;
        }
      }

      // 2. Filtro de Status
      if (statusVal) {
        const statusAtual = String(aluno.status || aluno.status_administrativo || aluno.statusmatricula || '').toUpperCase();
        if (statusAtual !== statusVal.toUpperCase()) {
          return false;
        }
      }

      // 3. Filtro de Unidade
      if (unidadeVal) {
        const unidId = String(aluno.unidade_id || aluno.unidadeId || '');
        if (unidId !== String(unidadeVal)) {
          return false;
        }
      }

      // 4. Filtro de Curso
      if (cursoVal) {
        const cId = String(aluno.curso_id || aluno.cursoid || aluno.cursoId || '');
        if (cId !== String(cursoVal)) {
          return false;
        }
      }

      // 5. Filtro de Turma
      if (turmaVal) {
        const tId = String(aluno.turma_id || aluno.turmaid || aluno.turmaId || '');
        if (tId !== String(turmaVal)) {
          return false;
        }
      }

      // 6. Filtro de Ano Letivo
      if (anoLetivoVal) {
        const aLet = String(aluno.ano_letivo ?? aluno.anoLetivo ?? aluno.ano ?? '');
        if (aLet !== String(anoLetivoVal)) {
          return false;
        }
      }

      return true;
    });
  }, [alunos, searchVal, statusVal, unidadeVal, cursoVal, turmaVal, anoLetivoVal]);

  // Cálculos de Paginação
  const totalRegistros = filteredAlunos.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = Math.min(indiceInicial + itensPorPagina, totalRegistros);

  const alunosPaginados = useMemo(() => {
    return filteredAlunos.slice(indiceInicial, indiceFinal);
  }, [filteredAlunos, indiceInicial, indiceFinal]);

  // Lista de páginas para o componente de navegação
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

  // Métricas para os KPI Cards
  const totalAlunosGeral = alunos.length;
  const totalAtivos = useMemo(() => alunos.filter(a => String(a.status || a.status_administrativo).toUpperCase() === 'ATIVO').length, [alunos]);
  const totalPre = useMemo(() => alunos.filter(a => String(a.status || a.status_administrativo).toUpperCase() === 'PRE_CADASTRO').length, [alunos]);
  const totalEgressos = useMemo(() => alunos.filter(a => ['CONCLUIDO', 'TRANSFERIDO', 'DESISTENTE', 'CANCELADO', 'INATIVO', 'TRANCADO'].includes(String(a.status || a.status_administrativo).toUpperCase())).length, [alunos]);

  const percAtivos = totalAlunosGeral > 0 ? Math.round((totalAtivos / totalAlunosGeral) * 100) : 0;
  const percPre = totalAlunosGeral > 0 ? Math.round((totalPre / totalAlunosGeral) * 100) : 0;
  const percEgressos = totalAlunosGeral > 0 ? Math.round((totalEgressos / totalAlunosGeral) * 100) : 0;

  // Seleção de linhas (Checkboxes)
  const [selectedAlunos, setSelectedAlunos] = useState([]);
  const [menuAcoesData, setMenuAcoesData] = useState(null);

  const toggleSelectAll = () => {
    if (selectedAlunos.length === alunosPaginados.length) {
      setSelectedAlunos([]);
    } else {
      setSelectedAlunos(alunosPaginados.map(a => a.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedAlunos(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getAvatarInitials = (nome) => {
    if (!nome) return 'AL';
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarBg = (id) => {
    const colors = [
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-sky-100 text-sky-800 border-sky-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200'
    ];
    const num = Number(id) || 0;
    return colors[num % colors.length];
  };

  const exportarCSV = () => {
    if (filteredAlunos.length === 0) {
      alert('Nenhum aluno para exportar.');
      return;
    }
    const cabecalhos = ['ID', 'Nome', 'CPF', 'Ano Letivo', 'Turma', 'Curso', 'Matricula', 'Status', 'Contrato'];
    const linhas = filteredAlunos.map(a => [
      a.numero_id || a.id,
      `"${(a.nome || '').replace(/"/g, '""')}"`,
      `"${a.cpf || ''}"`,
      `"${a.ano_letivo ?? a.anoLetivo ?? ''}"`,
      `"${(a.turma_nome || a.turma || '').replace(/"/g, '""')}"`,
      `"${(a.curso_nome || a.curso || '').replace(/"/g, '""')}"`,
      `"${a.matricula_codigo || a.matricula || ''}"`,
      `"${a.status || a.status_administrativo || ''}"`,
      `"${a.status_contrato || 'NAO_GERADO'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [cabecalhos.join(';'), ...linhas.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alunos_creeser_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const solicitarDeletar = (aluno) => {
    setModalDelete({
      isOpen: true,
      id: aluno.id,
      nome: aluno.nome || 'este aluno',
    });
  };

  const executarDeletar = async () => {
    const id = modalDelete.id;
    setModalDelete({ isOpen: false, id: null, nome: '' });
    if (!id) return;

    try {
      const response = await fetch(`/api/alunos/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAlunos(prev => prev.filter(a => a.id !== id));
      } else {
        alert(data.message || data.error || 'Erro ao excluir aluno do banco de dados.');
      }
    } catch (error) {
      console.error('Erro ao deletar aluno:', error);
      alert('Falha na comunicação ao tentar excluir o aluno.');
    }
  };

  const marcarContratoGerado = async (alunoId) => {
    try {
      await fetch(`/api/contratos/aluno/${alunoId}/marcar-gerado`, {
        method: 'POST',
        credentials: 'include',
      });
      setAlunos(prev => prev.map(a => a.id === alunoId ? { ...a, status_contrato: 'GERADO' } : a));
    } catch (_) {}
  };

  const abrirContratoAluno = (aluno) => {
    if (!aluno?.id) {
      alert('Aluno não identificado para gerar contrato');
      return;
    }

    setModalContratoAluno(aluno);
  };

  const iniciarAssinaturaDigital = async (alunoId) => {
    if (!alunoId) {
      alert('Aluno não identificado para assinatura digital');
      return;
    }

    try {
      const response = await fetch(`/api/contratos/aluno/${alunoId}/assinar-digital`, {
        method: 'POST'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao iniciar assinatura digital');
      }

      const signingUrls = Array.isArray(data?.signingUrls) ? data.signingUrls : [];
      if (signingUrls.length > 0) {
        signingUrls.forEach((item) => {
          const url = typeof item === 'string' ? item : item?.url;
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });

        alert('Assinatura digital iniciada. Os links de assinatura foram abertos em nova aba.');
      } else {
        alert('Assinatura digital iniciada, mas a Assinafy não retornou links de assinatura. Verifique o documento no painel da Assinafy.');
      }
    } catch (error) {
      console.error('Erro ao iniciar assinatura digital:', error);
      alert(error.message || 'Erro ao iniciar assinatura digital');
    }
  };

  const consultarAssinaturaDigital = async (alunoId) => {
    if (!alunoId) {
      alert('Aluno não identificado para consulta de assinatura digital');
      return;
    }

    try {
      const response = await fetch(`/api/contratos/aluno/${alunoId}/assinatura-status`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao consultar assinatura digital');
      }

      const status = String(data?.status || 'desconhecido').toUpperCase();
      const provider = String(data?.provider || 'assinafy').toUpperCase();
      const documentId = data?.providerDocumentId || '-';
      const assignmentId = data?.providerAssignmentId || '-';
      const requestedAt = data?.requestedAt
        ? new Date(data.requestedAt).toLocaleString('pt-BR')
        : '-';
      const syncWarning = data?.syncWarning ? `\nAviso de sincronização: ${data.syncWarning}` : '';

      alert(
        `Assinatura Digital (${provider})\n\n` +
        `Status: ${status}\n` +
        `Documento: ${documentId}\n` +
        `Assignment: ${assignmentId}\n` +
        `Solicitado em: ${requestedAt}${syncWarning}`
      );
    } catch (error) {
      console.error('Erro ao consultar assinatura digital:', error);
      alert(error.message || 'Erro ao consultar assinatura digital');
    }
  };

  const StatusBadge = ({ status }) => {
    const raw = String(status || '').toUpperCase();
    const map = {
      ATIVO:                          { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', label: 'Ativo' },
      INATIVO:                        { cls: 'bg-rose-50 text-rose-700 border-rose-200/80',           label: 'Inativo' },
      PRE_CADASTRO:                   { cls: 'bg-sky-50 text-sky-700 border-sky-200/80',             label: 'Pré-Cadastro' },
      AGUARDANDO_PAGAMENTO:           { cls: 'bg-purple-50 text-purple-700 border-purple-200/80',     label: 'Ag. Pagamento' },
      AGUARDANDO_PAGAMENTO_MATRICULA: { cls: 'bg-purple-50 text-purple-700 border-purple-200/80',     label: 'Ag. Pagamento' },
      AGUARDANDO_TURMA:               { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',     label: 'Ag. Turma' },
      AGUARDANDO_FORMACAO_TURMA:      { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',     label: 'Ag. Turma' },
      TRANCADO:                       { cls: 'bg-amber-50 text-amber-700 border-amber-200/80',         label: 'Trancado' },
      DESISTENTE:                     { cls: 'bg-orange-50 text-orange-700 border-orange-200/80',     label: 'Desistente' },
      CANCELADO:                      { cls: 'bg-rose-50 text-rose-700 border-rose-200/80',           label: 'Cancelado' },
      CONCLUIDO:                      { cls: 'bg-teal-50 text-teal-700 border-teal-200/80',           label: 'Concluído' },
    };
    const current = map[raw] || { cls: 'bg-slate-100 text-slate-700 border-slate-200', label: status || '—' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.cls}`}>
        {current.label}
      </span>
    );
  };

  const ContratoBadge = ({ status }) => {
    const sc = status || 'NAO_GERADO';
    const BADGE = {
      NAO_GERADO:         'bg-slate-100 text-slate-600 border-slate-200/70',
      GERADO:             'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      ENVIADO_ASSINATURA: 'bg-amber-50 text-amber-700 border-amber-200/80',
      ASSINADO:           'bg-teal-50 text-teal-700 border-teal-200/80',
      RECUSADO:           'bg-rose-50 text-rose-700 border-rose-200/80',
      EXPIRADO:           'bg-orange-50 text-orange-700 border-orange-200/80',
    };
    const LABEL = {
      NAO_GERADO:         'Não Gerado',
      GERADO:             'Gerado',
      ENVIADO_ASSINATURA: 'Enviado',
      ASSINADO:           'Assinado',
      RECUSADO:           'Recusado',
      EXPIRADO:           'Expirado',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${BADGE[sc] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {LABEL[sc] || sc}
      </span>
    );
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
              <span className="text-slate-600 font-semibold">Alunos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                🎓
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Gerenciar Alunos
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  Cadastre, gerencie e acompanhe os alunos da sua instituição
                </p>
              </div>
            </div>
          </div>

          <Link href="/admin/alunos/novo">
            <button className="inline-flex items-center justify-center gap-2 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer self-start sm:self-auto">
              <span className="text-lg leading-none">+</span>
              <span>Novo Aluno</span>
            </button>
          </Link>
        </div>

        {/* ── 2. ABAS (Listar, Inserir, Importação) ─────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-200/80">
          <button 
            onClick={() => setAbaAtiva('listar')}
            className={`px-5 py-2.5 font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
              abaAtiva === 'listar' 
                ? 'text-[#009688] border-b-2 border-[#009688]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Listar
          </button>
          <Link href="/admin/alunos/novo">
            <button className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 transition cursor-pointer">
              ➕ Inserir
            </button>
          </Link>
          <button 
            onClick={() => setAbaAtiva('importacao')}
            className={`px-5 py-2.5 font-semibold text-sm flex items-center gap-2 transition cursor-pointer ${
              abaAtiva === 'importacao' 
                ? 'text-[#009688] border-b-2 border-[#009688]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📥 Importação
          </button>
        </div>

        {/* ── ABA LISTAR ─────────────────────────────────────────────────────── */}
        {abaAtiva === 'listar' && (
          <div className="space-y-6">
            
            {/* ── 3. KPI METRIC CARDS ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* 1. Total de Alunos */}
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
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalAlunosGeral}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Total de Alunos</p>
                </div>
                <div className="pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Matriculados no sistema</span>
                  <span className="font-semibold text-blue-700 shrink-0">100%</span>
                </div>
              </div>

              {/* 2. Alunos Ativos */}
              <div className="bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-lg flex-shrink-0 border border-emerald-200/60">
                    🎓
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                    +{percAtivos}%
                  </span>
                </div>
                <div className="my-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalAtivos}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Alunos Ativos</p>
                </div>
                <div className="pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Em curso regular</span>
                  <span className="font-semibold text-emerald-700 shrink-0">{percAtivos}% do total</span>
                </div>
              </div>

              {/* 3. Pré-Cadastro */}
              <div className="bg-gradient-to-b from-amber-50/70 to-amber-50/20 rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center text-lg flex-shrink-0 border border-amber-200/60">
                    ⏳
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                    Pendente
                  </span>
                </div>
                <div className="my-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalPre}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Pré-Cadastro</p>
                </div>
                <div className="pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Aguardando matrícula</span>
                  <span className="font-semibold text-amber-700 shrink-0">{percPre}% do total</span>
                </div>
              </div>

              {/* 4. Transferidos / Egressos */}
              <div className="bg-gradient-to-b from-rose-50/70 to-rose-50/20 rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center text-lg flex-shrink-0 border border-rose-200/60">
                    🚪
                  </div>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full border border-rose-200/50">
                    Histórico
                  </span>
                </div>
                <div className="my-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalEgressos}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Transferidos / Egressos</p>
                </div>
                <div className="pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Concluídos e desligados</span>
                  <span className="font-semibold text-rose-700 shrink-0">{percEgressos}% do total</span>
                </div>
              </div>

            </div>

            {/* ── 4. FILTROS DA DASHBOARD ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs space-y-3.5">
              {/* Linha 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Aluno, Matrícula, CPF ou Responsável..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-slate-50/50"
                  />
                </div>

                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] bg-white text-slate-700"
                >
                  <option value="">Todos os Status</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="PRE_CADASTRO">Pré-Cadastro</option>
                  <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                  <option value="AGUARDANDO_TURMA">Aguardando Turma</option>
                  <option value="TRANCADO">Trancado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="DESISTENTE">Desistente</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="INATIVO">Inativo</option>
                </select>

                <select
                  value={unidadeVal}
                  onChange={(e) => setUnidadeVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] bg-white text-slate-700"
                >
                  <option value="">Todas as Unidades</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>

                <select
                  value={cursoVal}
                  onChange={(e) => setCursoVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] bg-white text-slate-700"
                >
                  <option value="">Todos os Cursos</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              {/* Linha 2 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-xl">
                  <select
                    value={turmaVal}
                    onChange={(e) => setTurmaVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] bg-white text-slate-700"
                  >
                    <option value="">Todas as Turmas</option>
                    {turmasFiltradasOpcoes.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>

                  <select
                    value={anoLetivoVal}
                    onChange={(e) => setAnoLetivoVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] bg-white text-slate-700"
                  >
                    <option value="">Todos os Anos Letivos</option>
                    {anosLetivos.map((ano) => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    onClick={limparFiltros}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🧹</span>
                    <span>Limpar Filtros</span>
                  </button>

                  <button
                    onClick={() => setPaginaAtual(1)}
                    className="px-5 py-2.5 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Aplicar Filtros</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── 5. LISTAGEM EM TABELA ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              
              {/* Header da Tabela */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 border-b border-slate-200/80 gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📚</span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">
                      Listagem de Alunos e Matrículas
                    </h2>
                    <p className="text-xs text-slate-400 font-normal">
                      Visualize, edite e gerencie os alunos da instituição
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={exportarCSV}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>📥</span>
                    <span>Exportar</span>
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    Registros Exibidos: <strong className="text-slate-800">{filteredAlunos.length}</strong>
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="p-16 text-center text-slate-500 font-medium animate-pulse">
                  Carregando alunos e matrículas...
                </div>
              ) : errorMsg ? (
                <div className="p-16 text-center space-y-3">
                  <div className="text-rose-500 text-4xl">⚠️</div>
                  <div className="text-slate-800 font-bold text-sm">{errorMsg}</div>
                  <button
                    onClick={carregarAlunos}
                    className="px-4 py-2 bg-[#009688] hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : filteredAlunos.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-sm">
                  Nenhum aluno ou matrícula encontrado com os filtros selecionados.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="px-4 py-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={alunosPaginados.length > 0 && selectedAlunos.length === alunosPaginados.length}
                              onChange={toggleSelectAll}
                              className="rounded border-slate-300 text-[#009688] focus:ring-[#009688] cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3">#ID</th>
                          <th className="px-4 py-3">
                            <div className="flex items-center gap-1 cursor-pointer">
                              <span>Nome do Aluno</span>
                              <span className="text-[10px] text-slate-400">▾</span>
                            </div>
                          </th>
                          <th className="px-4 py-3">A. Letivo</th>
                          <th className="px-4 py-3">Turma</th>
                          <th className="px-4 py-3">Curso</th>
                          <th className="px-4 py-3">Matrícula</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Contrato</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {alunosPaginados.map((aluno) => {
                          const rowKey = aluno.matricula_id ? `${aluno.id}-${aluno.matricula_id}` : `${aluno.id}-${aluno.turmaid || 'legado'}`;
                          const turmaNomeExibicao = aluno.turma_nome || aluno.turma || 'Sem turma';
                          const cursoNomeExibicao = aluno.curso_nome || aluno.curso || '—';
                          const isSelected = selectedAlunos.includes(aluno.id);

                          return (
                            <tr key={rowKey} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-teal-50/40' : ''}`}>
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(aluno.id)}
                                  className="rounded border-slate-300 text-[#009688] focus:ring-[#009688] cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                                #{aluno.numero_id || aluno.id}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  {aluno.foto ? (
                                    <img
                                      src={aluno.foto}
                                      alt={aluno.nome}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${getAvatarBg(aluno.id)}`}>
                                      {getAvatarInitials(aluno.nome)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 leading-tight">
                                      {aluno.nome}
                                    </p>
                                    {aluno.is_principal === false && (
                                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                        Simultâneo
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                                {aluno.ano_letivo ?? aluno.anoLetivo ?? '—'}{aluno.semestre ? `/${aluno.semestre}` : ''}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                                {turmaNomeExibicao}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-700">
                                {cursoNomeExibicao}
                              </td>
                              <td className="px-4 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                                {aluno.matricula_codigo || aluno.matricula || aluno.numero_id || '—'}
                              </td>
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <StatusBadge status={aluno.status || aluno.status_administrativo} />
                              </td>
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <ContratoBadge status={aluno.status_contrato} />
                              </td>
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Link href={`/admin/alunos/${aluno.id}`}>
                                    <button
                                      className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                      title="Editar Aluno"
                                    >
                                      ✏️
                                    </button>
                                  </Link>
                                  <Link href={`/admin/alunos/historico?id=${aluno.id}`}>
                                    <button
                                      className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                      title="Histórico / Detalhes"
                                    >
                                      👁️
                                    </button>
                                  </Link>
                                  <Link href={`/admin/alunos/ficha?id=${aluno.id}`} target="_blank" rel="noopener noreferrer">
                                    <button
                                      className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                      title="Ficha do Aluno"
                                    >
                                      📄
                                    </button>
                                  </Link>

                                   {/* Menu de Mais Ações (Trigger para Portal Flutuante) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (menuAcoesData?.rowId === rowKey) {
                                        setMenuAcoesData(null);
                                      } else {
                                        setMenuAcoesData({ aluno, rowId: rowKey, anchorEl: e.currentTarget });
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                      menuAcoesData?.rowId === rowKey
                                        ? 'bg-slate-200 text-slate-800'
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title="Mais Ações"
                                  >
                                    •••
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Barra de Paginação ─────────────────────────────────── */}
                  {totalRegistros > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white select-none">
                      <div className="text-xs sm:text-sm text-slate-500 font-normal">
                        Mostrando {indiceInicial + 1} até {indiceFinal} de {totalRegistros} registros
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
        )}

        {/* ── ABA IMPORTAÇÃO ─────────────────────────────────────────────────── */}
        {abaAtiva === 'importacao' && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#009688] mb-1 flex items-center gap-2">
                📥 Envio de Arquivo para Importação de Alunos
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">Selecione a turma e o arquivo de alunos para importar</p>
            </div>

            <div className="bg-slate-50/60 rounded-xl p-5 border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-[#009688]">Configuração</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">TURMA</label>
                  <select className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#009688] bg-white text-slate-700">
                    <option value="">Selecione a turma</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">ANO LETIVO</label>
                  <select className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#009688] bg-white text-slate-700">
                    <option value="">Escolha o ano letivo</option>
                    {anosLetivos.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">ARQUIVO EXCEL</label>
                <div className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center cursor-pointer hover:bg-teal-50/50 transition">
                  <input type="file" className="hidden" accept=".xlsx,.xls,.csv" />
                  <div className="text-slate-500">
                    <p className="text-sm font-semibold">Clique ou arraste o arquivo aqui</p>
                    <p className="text-xs text-slate-400 mt-1">Formatos aceitos: .xlsx, .xls, .csv</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="px-6 py-2.5 bg-[#009688] hover:bg-teal-700 text-white rounded-xl font-semibold transition text-sm cursor-pointer shadow-xs">
                IMPORTAR ALUNOS
              </button>
            </div>
          </div>
        )}
      </div>

      {modalContratoAluno && (
        <ModalContratoAluno
          isOpen={!!modalContratoAluno}
          onClose={() => setModalContratoAluno(null)}
          alunoId={modalContratoAluno.id}
          alunoNome={modalContratoAluno.nome}
        />
      )}

      {modalRematricula && (
        <ModalRematricula
          isOpen={!!modalRematricula}
          onClose={() => setModalRematricula(null)}
          aluno={modalRematricula}
          onSuccess={() => carregarAlunos()}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={modalDelete.isOpen}
        onClose={() => setModalDelete({ isOpen: false, id: null, nome: '' })}
        onConfirm={executarDeletar}
        title="Excluir Aluno"
        message={`Tem certeza que deseja deletar o aluno "${modalDelete.nome}"? Esta ação não poderá ser desfeita.`}
        type="delete"
      />

      {/* Dropdown de Ações Flutuante via Portal fora do container/overflow da tabela */}
      {menuAcoesData && (
        <MenuAcoesFlutuante
          anchorEl={menuAcoesData.anchorEl}
          aluno={menuAcoesData.aluno}
          onClose={() => setMenuAcoesData(null)}
          abrirContratoAluno={abrirContratoAluno}
          marcarContratoGerado={marcarContratoGerado}
          iniciarAssinaturaDigital={iniciarAssinaturaDigital}
          consultarAssinaturaDigital={consultarAssinaturaDigital}
          setModalRematricula={setModalRematricula}
          solicitarDeletar={solicitarDeletar}
        />
      )}
    </>
  );
}

/**
 * Menu de Ações Flutuante com Portal
 * Renderizado diretamente em document.body com position: fixed,
 * garantindo que nunca fique cortado pelo overflow da tabela.
 */
function MenuAcoesFlutuante({
  anchorEl,
  aluno,
  onClose,
  abrirContratoAluno,
  marcarContratoGerado,
  iniciarAssinaturaDigital,
  consultarAssinaturaDigital,
  setModalRematricula,
  solicitarDeletar,
}) {
  const [style, setStyle] = useState({});
  const [isReady, setIsReady] = useState(false);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();

    // Se o elemento não existe ou está invisível
    if (rect.width === 0 && rect.height === 0) {
      onClose();
      return;
    }

    // Se o elemento foi scrollado completamente para fora da tela
    if (rect.bottom < -20 || rect.top > window.innerHeight + 20) {
      onClose();
      return;
    }

    const menuWidth = 224; // Largura aproximada de 220px
    const estimatedHeight = 250;
    const gap = 6;
    const padding = 12;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Se não houver espaço suficiente abaixo e houver mais espaço acima, abre para cima
    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    // Alinhamento padrão: alinha à direita do botão acionador
    let left = rect.right - menuWidth;

    // Evita transbordamento nas laterais da janela
    if (left < padding) {
      left = padding;
    } else if (left + menuWidth > viewportWidth - padding) {
      left = viewportWidth - menuWidth - padding;
    }

    if (openUpward) {
      setStyle({
        position: 'fixed',
        bottom: `${Math.round(viewportHeight - rect.top + gap)}px`,
        left: `${Math.round(left)}px`,
        width: `${menuWidth}px`,
        zIndex: 99999,
      });
    } else {
      setStyle({
        position: 'fixed',
        top: `${Math.round(rect.bottom + gap)}px`,
        left: `${Math.round(left)}px`,
        width: `${menuWidth}px`,
        zIndex: 99999,
      });
    }
    setIsReady(true);
  }, [anchorEl, onClose]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        anchorEl &&
        !anchorEl.contains(e.target)
      ) {
        onClose();
      }
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true); // Captura scroll em containers internos (tabela)
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [anchorEl, onClose, updatePosition]);

  if (typeof document === 'undefined' || !anchorEl) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        ...style,
        opacity: isReady ? 1 : 0,
        transform: isReady ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 120ms ease-out, transform 120ms ease-out',
      }}
      className="bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-200/90 py-1.5 text-xs text-left select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          abrirContratoAluno(aluno);
          marcarContratoGerado(aluno.id);
        }}
        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors text-left"
      >
        <span className="text-sm">📄</span>
        <span className="font-medium">Gerar Contrato Impresso</span>
      </button>

      <button
        onClick={() => {
          onClose();
          iniciarAssinaturaDigital(aluno.id);
        }}
        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors text-left"
      >
        <span className="text-sm">✍️</span>
        <span className="font-medium">Enviar para Assinafy</span>
      </button>

      <button
        onClick={() => {
          onClose();
          consultarAssinaturaDigital(aluno.id);
        }}
        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors text-left"
      >
        <span className="text-sm">🔍</span>
        <span className="font-medium">Status da Assinatura</span>
      </button>

      <Link href={`/admin/alunos/declaracao?id=${aluno.id}&tipo=matricula`}>
        <div
          onClick={onClose}
          className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors text-left"
        >
          <span className="text-sm">📝</span>
          <span className="font-medium">Declaração de Matrícula</span>
        </div>
      </Link>

      <button
        onClick={() => {
          onClose();
          setModalRematricula(aluno);
        }}
        className="w-full px-3.5 py-2.5 text-teal-700 hover:bg-teal-50 flex items-center gap-2.5 font-semibold cursor-pointer transition-colors text-left"
      >
        <span className="text-sm">🔄</span>
        <span>Rematrícula / Novo Curso</span>
      </button>

      <div className="h-px bg-slate-100 my-1" />

      <button
        onClick={() => {
          onClose();
          solicitarDeletar(aluno);
        }}
        className="w-full px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold cursor-pointer transition-colors text-left"
      >
        <span className="text-sm">❌</span>
        <span>Excluir Aluno</span>
      </button>
    </div>,
    document.body
  );
}

