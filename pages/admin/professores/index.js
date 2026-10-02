import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ListagemProfessores() {
  const router = useRouter();
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchNome, setSearchNome] = useState('');
  const [searchNivel, setSearchNivel] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchArea, setSearchArea] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados do Modal de Vínculos
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [vinculos, setVinculos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedDisciplina, setSelectedDisciplina] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Modal de Confirmação de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    carregarProfessores();
    carregarTurmasEDisciplinas();
  }, []);

  const carregarProfessores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/professores');
      if (response.ok) {
        const data = await response.json();
        setProfessores(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarTurmasEDisciplinas = async () => {
    try {
      const [resTurmas, resDisciplinas] = await Promise.all([
        fetch('/api/turmas'),
        fetch('/api/disciplinas')
      ]);
      if (resTurmas.ok) {
        const dataTurmas = await resTurmas.json();
        setTurmas(Array.isArray(dataTurmas) ? dataTurmas : []);
      }
      if (resDisciplinas.ok) {
        const dataDisciplinas = await resDisciplinas.json();
        setDisciplinas(Array.isArray(dataDisciplinas) ? dataDisciplinas : []);
      }
    } catch (error) {
      console.error('Erro ao carregar turmas ou disciplinas:', error);
    }
  };

  // Opções dinâmicas de áreas e níveis
  const niveisOpcoes = useMemo(() => {
    const list = new Set();
    professores.forEach((p) => {
      if (p.nivelInstrucao && p.nivelInstrucao.trim()) {
        list.add(p.nivelInstrucao.trim());
      }
    });
    return Array.from(list).sort();
  }, [professores]);

  const areasOpcoes = useMemo(() => {
    const list = new Set();
    professores.forEach((p) => {
      if (p.areaAtuacao && p.areaAtuacao.trim()) {
        list.add(p.areaAtuacao.trim());
      }
    });
    return Array.from(list).sort();
  }, [professores]);

  // Vínculos Modal
  const abrirModalVinculos = async (professor) => {
    setSelectedProfessor(professor);
    setModalOpen(true);
    setModalError('');
    setModalSuccess('');
    setSelectedTurma('');
    setSelectedDisciplina('');
    setVinculos([]);

    try {
      setModalLoading(true);
      const response = await fetch(`/api/professores/${professor.id}/vinculos`);
      if (response.ok) {
        const data = await response.json();
        setVinculos(Array.isArray(data) ? data : []);
      } else {
        setModalError('Erro ao carregar vínculos existentes.');
      }
    } catch (err) {
      setModalError('Falha de rede ao buscar vínculos.');
    } finally {
      setModalLoading(false);
    }
  };

  const adicionarVinculo = async () => {
    if (!selectedTurma || !selectedDisciplina) {
      setModalError('Selecione uma Turma e uma Disciplina.');
      return;
    }
    setModalError('');
    setModalSuccess('');

    try {
      setModalLoading(true);
      const response = await fetch(`/api/professores/${selectedProfessor.id}/vinculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turma_id: selectedTurma,
          disciplina_id: selectedDisciplina
        })
      });

      if (response.ok) {
        const resList = await fetch(`/api/professores/${selectedProfessor.id}/vinculos`);
        if (resList.ok) {
          const data = await resList.json();
          setVinculos(Array.isArray(data) ? data : []);
        }
        setSelectedTurma('');
        setSelectedDisciplina('');
        setModalSuccess('Vínculo adicionado com sucesso!');
        setTimeout(() => setModalSuccess(''), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setModalError(errData.error || 'Erro ao adicionar vínculo.');
      }
    } catch (err) {
      setModalError('Falha ao salvar vínculo.');
    } finally {
      setModalLoading(false);
    }
  };

  const removerVinculo = async (vinculoId) => {
    if (!confirm('Deseja realmente remover este vínculo acadêmico?')) return;
    setModalError('');
    setModalSuccess('');

    try {
      setModalLoading(true);
      const response = await fetch(`/api/professores/${selectedProfessor.id}/vinculos/${vinculoId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVinculos((prev) => prev.filter((v) => v.id !== vinculoId));
        setModalSuccess('Vínculo removido com sucesso!');
        setTimeout(() => setModalSuccess(''), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setModalError(errData.error || 'Erro ao remover vínculo.');
      }
    } catch (err) {
      setModalError('Falha ao excluir vínculo.');
    } finally {
      setModalLoading(false);
    }
  };

  // Exclusão de professor
  const confirmarExclusao = (professor) => {
    setProfessorToDelete(professor);
    setDeleteModalOpen(true);
  };

  const executarExclusao = async () => {
    if (!professorToDelete) return;
    try {
      setDeleting(true);
      const response = await fetch(`/api/professores/${professorToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProfessores((prev) => prev.filter((p) => p.id !== professorToDelete.id));
        setDeleteModalOpen(false);
        setProfessorToDelete(null);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Erro ao deletar professor');
      }
    } catch (error) {
      console.error('Erro ao deletar professor:', error);
      alert('Erro ao deletar professor');
    } finally {
      setDeleting(false);
    }
  };

  const limparFiltros = () => {
    setSearchNome('');
    setSearchNivel('');
    setSearchStatus('');
    setSearchArea('');
    setCurrentPage(1);
  };

  // Filtragem
  const filteredProfessores = useMemo(() => {
    return professores.filter((p) => {
      const matchNome =
        !searchNome ||
        (p.nome && p.nome.toLowerCase().includes(searchNome.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchNome.toLowerCase())) ||
        (p.cpf && p.cpf.toLowerCase().includes(searchNome.toLowerCase())) ||
        (p.telefoneCelular && p.telefoneCelular.toLowerCase().includes(searchNome.toLowerCase())) ||
        (p.cidade && p.cidade.toLowerCase().includes(searchNome.toLowerCase()));

      const matchNivel = !searchNivel || (p.nivelInstrucao && p.nivelInstrucao === searchNivel);

      const matchStatus =
        !searchStatus ||
        (searchStatus === 'ATIVO'
          ? p.status === 'ATIVO' || p.status === true || p.status === 'ativo'
          : p.status === 'INATIVO' || p.status === false || p.status === 'inativo');

      const matchArea =
        !searchArea ||
        (p.areaAtuacao && p.areaAtuacao.toLowerCase().includes(searchArea.toLowerCase()));

      return matchNome && matchNivel && matchStatus && matchArea;
    });
  }, [professores, searchNome, searchNivel, searchStatus, searchArea]);

  // Estatísticas para os cards
  const stats = useMemo(() => {
    const total = professores.length;
    const ativos = professores.filter(
      (p) => p.status === 'ATIVO' || p.status === true || p.status === 'ativo'
    ).length;
    const inativos = total - ativos;
    const percentAtivos = total > 0 ? ((ativos / total) * 100).toFixed(1) : 0;

    const posGraduados = professores.filter((p) => {
      const nivel = (p.nivelInstrucao || '').toUpperCase();
      return (
        nivel.includes('ESPECIALIZA') ||
        nivel.includes('MESTR') ||
        nivel.includes('DOUTOR') ||
        nivel.includes('PÓS') ||
        nivel.includes('POS')
      );
    }).length;

    const cidadesUnicas = new Set(
      professores.map((p) => (p.cidade || '').trim()).filter(Boolean)
    ).size;

    return {
      total,
      ativos,
      inativos,
      percentAtivos,
      posGraduados,
      cidadesUnicas
    };
  }, [professores]);

  // Paginação
  const totalPages = Math.ceil(filteredProfessores.length / itemsPerPage) || 1;
  const paginatedProfessores = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProfessores.slice(start, start + itemsPerPage);
  }, [filteredProfessores, currentPage, itemsPerPage]);

  const getInitials = (name) => {
    if (!name) return 'PR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
            👨‍🏫
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-slate-500">
              <span>Admin</span>
              <span>›</span>
              <span className="text-[#009688]">Professores</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gerenciar Professores</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão do corpo docente, qualificações e vínculos acadêmicos com turmas e disciplinas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            <span>🖨️</span>
            <span>Imprimir</span>
          </button>
          <Link href="/admin/professores/novo">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold shadow-xs transition transform active:scale-95">
              <span>➕</span>
              <span>Novo Professor</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Abas - Listar e Inserir */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button className="px-5 py-2.5 text-[#009688] border-b-2 border-[#009688] font-bold text-sm flex items-center gap-2 transition">
          <span>📋</span>
          <span>Listar Professores</span>
        </button>
        <Link href="/admin/professores/novo">
          <button className="px-5 py-2.5 text-slate-500 hover:text-[#009688] font-medium text-sm flex items-center gap-2 transition">
            <span>➕</span>
            <span>Cadastrar Novo</span>
          </button>
        </Link>
      </div>

      {/* 2. Cards de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Professores */}
        <div className="bg-gradient-to-br from-blue-50/70 to-blue-50/20 border border-blue-100/80 rounded-2xl p-5 min-h-[150px] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
              👨‍🏫
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
              Docentes
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {stats.total}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">Total de Professores</div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-blue-100/60 pt-2.5">
            <span>Cadastrados no sistema</span>
            <span className="font-semibold text-blue-700">100%</span>
          </div>
        </div>

        {/* Professores Ativos */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-50/20 border border-emerald-100/80 rounded-2xl p-5 min-h-[150px] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
              ✅
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              {stats.percentAtivos}% ativos
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {stats.ativos}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">Professores Ativos</div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-emerald-100/60 pt-2.5">
            <span>Em atividade letiva</span>
            <span className="font-semibold text-emerald-700">{stats.ativos} ativos</span>
          </div>
        </div>

        {/* Pós-Graduados & Especialistas */}
        <div className="bg-gradient-to-br from-amber-50/70 to-amber-50/20 border border-amber-100/80 rounded-2xl p-5 min-h-[150px] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold">
              🎓
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              Pós / Mestrado+
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {stats.posGraduados}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">Qualificação Avançada</div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-amber-100/60 pt-2.5">
            <span>Especialistas, Mestres ou Doutores</span>
            <span className="font-semibold text-amber-700">
              {stats.total > 0 ? Math.round((stats.posGraduados / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Cidades Atendidas / Inativos */}
        <div className="bg-gradient-to-br from-rose-50/70 to-rose-50/20 border border-rose-100/80 rounded-2xl p-5 min-h-[150px] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold">
              📍
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
              {stats.inativos} inativo(s)
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {stats.cidadesUnicas || (stats.total > 0 ? 1 : 0)}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">Cidades / Regiões</div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-rose-100/60 pt-2.5">
            <span>Distribuição geográfica</span>
            <span className="font-semibold text-rose-700">{stats.cidadesUnicas} cidades</span>
          </div>
        </div>
      </div>

      {/* 3. Card de Filtros com Respiro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <span>🔍</span>
            <span>Filtros de Busca</span>
          </div>
          {(searchNome || searchNivel || searchStatus || searchArea) && (
            <span className="text-xs text-[#009688] font-semibold bg-teal-50 px-2.5 py-1 rounded-md">
              Filtros ativos
            </span>
          )}
        </div>

        {/* Linha 1: Filtros de Seleção */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Nível de Instrução */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Nível de Instrução
            </label>
            <select
              value={searchNivel}
              onChange={(e) => {
                setSearchNivel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] text-slate-700 font-medium transition"
            >
              <option value="">Todos os Níveis</option>
              <option value="GRADUAÇÃO">Graduação</option>
              <option value="ESPECIALIZAÇÃO">Especialização</option>
              <option value="MESTRADO">Mestrado</option>
              <option value="DOUTORADO">Doutorado</option>
              {niveisOpcoes
                .filter(
                  (n) => !['GRADUAÇÃO', 'ESPECIALIZAÇÃO', 'MESTRADO', 'DOUTORADO'].includes(n.toUpperCase())
                )
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
            </select>
          </div>

          {/* Área de Atuação */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Área de Atuação
            </label>
            <input
              type="text"
              placeholder="Ex: Pedagogia, Direito, Saúde..."
              value={searchArea}
              onChange={(e) => {
                setSearchArea(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] text-slate-700 placeholder:text-slate-400 font-medium transition"
            />
          </div>

          {/* Situação */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Situação / Status
            </label>
            <select
              value={searchStatus}
              onChange={(e) => {
                setSearchStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] text-slate-700 font-medium transition"
            >
              <option value="">Todas as Situações</option>
              <option value="ATIVO">Apenas Ativos</option>
              <option value="INATIVO">Apenas Inativos</option>
            </select>
          </div>
        </div>

        {/* Linha 2: Busca por Nome + Ações */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-8 lg:col-span-9">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por nome do professor, e-mail, CPF, cidade ou telefone..."
                value={searchNome}
                onChange={(e) => {
                  setSearchNome(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] text-slate-700 placeholder:text-slate-400 font-medium transition"
              />
            </div>
          </div>

          <div className="md:col-span-4 lg:col-span-3 flex items-center justify-end gap-2">
            <button
              onClick={limparFiltros}
              className="w-full sm:w-auto px-4 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>🔄</span>
              <span>Limpar</span>
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className="w-full sm:w-auto px-5 h-10 rounded-xl bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabela de Professores */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Topbar da Tabela */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📚</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Listagem dos Professores
              </h2>
              <p className="text-[11px] text-slate-500">
                {filteredProfessores.length} professor(es) encontrado(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
              Exibindo <strong>{paginatedProfessores.length}</strong> de <strong>{filteredProfessores.length}</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-[#009688] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium">Carregando professores...</p>
          </div>
        ) : filteredProfessores.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <span className="text-3xl block">👨‍🏫</span>
            <p className="text-sm font-semibold text-slate-700">Nenhum professor encontrado</p>
            <p className="text-xs text-slate-400">
              Tente ajustar os filtros de busca ou cadastre um novo professor.
            </p>
            <button
              onClick={limparFiltros}
              className="mt-2 text-xs text-[#009688] font-bold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3.5">Professor / Docente</th>
                  <th className="px-4 py-3.5">Nível de Instrução</th>
                  <th className="px-4 py-3.5">Área de Atuação</th>
                  <th className="px-4 py-3.5">Cidade / UF</th>
                  <th className="px-4 py-3.5">Contato</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center w-40">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedProfessores.map((professor) => {
                  const isAtivo =
                    professor.status === 'ATIVO' ||
                    professor.status === true ||
                    professor.status === 'ativo';

                  return (
                    <tr
                      key={professor.id}
                      className="hover:bg-teal-50/30 transition duration-150 group"
                    >
                      {/* Docente / Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#00796b] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {getInitials(professor.nome)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-[#009688] transition truncate">
                              {professor.nome}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                              {professor.email && <span>{professor.email}</span>}
                              {professor.cpf && <span>• CPF: {professor.cpf}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nível de Instrução */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                          {professor.nivelInstrucao || 'Não informado'}
                        </span>
                      </td>

                      {/* Área de Atuação */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700 truncate max-w-[180px]">
                          {professor.areaAtuacao || 'Geral'}
                        </div>
                      </td>

                      {/* Cidade / UF */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-600 font-medium">
                          {professor.cidade ? (
                            <>
                              {professor.cidade}
                              {professor.uf ? ` - ${professor.uf}` : ''}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </div>
                      </td>

                      {/* Contato */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-700 font-medium">
                          {professor.telefoneCelular || professor.telefoneResidencial || (
                            <span className="text-slate-400 italic">Sem telefone</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAtivo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAtivo ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          {isAtivo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Vínculos */}
                          <button
                            onClick={() => abrirModalVinculos(professor)}
                            className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-[#009688] text-[#009688] hover:text-white flex items-center justify-center transition shadow-2xs"
                            title="Gerenciar Vínculos (Turmas e Disciplinas)"
                          >
                            <span className="text-xs">🔗</span>
                          </button>

                          {/* Editar */}
                          <Link href={`/admin/professores/${professor.id}`}>
                            <button
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center transition shadow-2xs"
                              title="Editar Dados do Professor"
                            >
                              <span className="text-xs">✏️</span>
                            </button>
                          </Link>

                          {/* Deletar */}
                          <button
                            onClick={() => confirmarExclusao(professor)}
                            className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition shadow-2xs"
                            title="Excluir Professor"
                          >
                            <span className="text-xs">❌</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Barra de Paginação */}
        {filteredProfessores.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span>Linhas por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#009688]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-400">|</span>
              <span>
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                {Math.min(currentPage * itemsPerPage, filteredProfessores.length)} de{' '}
                {filteredProfessores.length}
              </span>
            </div>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 font-bold transition"
                title="Primeira página"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 font-bold transition"
                title="Página anterior"
              >
                ‹
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 font-bold transition"
                title="Próxima página"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 font-bold transition"
                title="Última página"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Modal de Gerenciamento de Vínculos (Turmas e Disciplinas) */}
      {modalOpen && selectedProfessor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#00796b] flex items-center justify-center text-lg font-bold">
                  🔗
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">
                    Vincular Turmas e Disciplinas
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Professor: <strong className="text-[#009688]">{selectedProfessor.nome}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-lg flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>✅</span>
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Form de Criação de Vínculo */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>➕</span>
                  <span>Adicionar Novo Vínculo Acadêmico</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select Turma */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Turma
                    </label>
                    <select
                      value={selectedTurma}
                      onChange={(e) => setSelectedTurma(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] text-slate-700 font-medium transition"
                    >
                      <option value="">- Selecione uma Turma -</option>
                      {turmas.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Disciplina */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Disciplina
                    </label>
                    <select
                      value={selectedDisciplina}
                      onChange={(e) => setSelectedDisciplina(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] text-slate-700 font-medium transition"
                    >
                      <option value="">- Selecione uma Disciplina -</option>
                      {disciplinas
                        .filter((d) => {
                          const tObj = turmas.find((t) => String(t.id) === String(selectedTurma));
                          return (
                            !tObj ||
                            !tObj.gradeId ||
                            String(d.grade) === String(tObj.gradeId)
                          );
                        })
                        .map((d) => (
                          <option key={d.id} value={d.numero_id || d.id}>
                            {d.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={adicionarVinculo}
                    disabled={modalLoading || !selectedTurma || !selectedDisciplina}
                    className="px-5 py-2 bg-[#009688] hover:bg-[#00796b] text-white font-bold rounded-xl transition text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {modalLoading ? 'Gravando...' : 'Adicionar Vínculo'}
                  </button>
                </div>
              </div>

              {/* Listagem de Vínculos Atuais */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Vínculos Existentes ({vinculos.length})
                  </h4>
                </div>

                {modalLoading && vinculos.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-6">Carregando vínculos...</div>
                ) : vinculos.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    Nenhum vínculo acadêmico associado a este professor.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3">Turma</th>
                          <th className="p-3">Disciplina</th>
                          <th className="p-3 text-center w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vinculos.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-semibold text-slate-800">
                              {v.turmas?.nome || `Turma #${v.turma_id}`}
                            </td>
                            <td className="p-3 text-slate-700">
                              {v.disciplinas?.nome || `Disciplina #${v.disciplina_id}`}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => removerVinculo(v.id)}
                                disabled={modalLoading}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 rounded-lg font-bold text-[11px] transition disabled:opacity-50"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Confirmação de Exclusão */}
      {deleteModalOpen && professorToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Excluir Professor</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir o cadastro do professor{' '}
                <strong className="text-slate-800">{professorToDelete.nome}</strong>? Esta ação
                não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProfessorToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={executarExclusao}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
