import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomModal from '../../../components/CustomModal';
import ConfirmModal from '../../../components/ConfirmModal';

export default function GerenciarGrades() {
  const router = useRouter();
  const [grades, setGrades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchNome, setSearchNome] = useState('');
  const [searchCurso, setSearchCurso] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('ATIVO');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [instituicoes, setInstituicoes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loadingOpcoes, setLoadingOpcoes] = useState(false);

  const [formData, setFormData] = useState({
    instituicaoId: '',
    cursoId: '',
    ano: '',
    nome: '',
    situacao: 'ATIVO'
  });

  useEffect(() => {
    carregarGrades();
    carregarOpcoesFormulario();
  }, []);

  const getValue = (obj, key) => obj?.[key] ?? obj?.[key.toLowerCase()];

  const carregarOpcoesFormulario = async () => {
    try {
      setLoadingOpcoes(true);

      const [instituicoesRes, cursosRes, unidadesRes] = await Promise.all([
        fetch('/api/instituicoes', { credentials: 'include' }),
        fetch('/api/cursos', { credentials: 'include' }),
        fetch('/api/unidades', { credentials: 'include' })
      ]);

      if (instituicoesRes.ok) {
        const data = await instituicoesRes.json();
        setInstituicoes(Array.isArray(data) ? data : []);
      }

      if (cursosRes.ok) {
        const data = await cursosRes.json();
        setCursos(Array.isArray(data) ? data : []);
      }

      if (unidadesRes.ok) {
        const data = await unidadesRes.json();
        setUnidades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar opções do formulário de grades:', error);
    } finally {
      setLoadingOpcoes(false);
    }
  };

  const unidadesById = useMemo(() => {
    const map = new Map();
    unidades.forEach((unidade) => {
      const unidadeId = String(getValue(unidade, 'id') || '');
      if (!unidadeId) return;

      const instituicaoId = String(
        getValue(unidade, 'instituicaoId') || getValue(unidade, 'instituicao_id') || ''
      );

      map.set(unidadeId, instituicaoId);
    });
    return map;
  }, [unidades]);

  const cursosFiltradosPorInstituicao = useMemo(() => {
    const instituicaoSelecionada = String(formData.instituicaoId || '');
    if (!instituicaoSelecionada) return [];

    return cursos.filter((curso) => {
      const cursoInstituicaoId = String(
        getValue(curso, 'instituicaoId') || getValue(curso, 'instituicao_id') || ''
      );

      if (cursoInstituicaoId) {
        return cursoInstituicaoId === instituicaoSelecionada;
      }

      const unidadeIdsRaw = getValue(curso, 'unidadeIds') || getValue(curso, 'unidadeids') || [];
      const unidadeIds = Array.isArray(unidadeIdsRaw)
        ? unidadeIdsRaw.map((id) => String(id))
        : [];

      if (unidadeIds.length === 0) {
        return false;
      }

      return unidadeIds.some((unidadeId) => unidadesById.get(unidadeId) === instituicaoSelecionada);
    });
  }, [cursos, formData.instituicaoId, unidadesById]);

  const carregarGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      if (res.ok) {
        const data = await res.json();
        setGrades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar grades:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao carregar grades.',
        type: 'error'
      });
    }
  };

  const filtrarGrades = () => {
    return grades.filter((grade) => {
      const nomeMatch = (grade.nome || '').toLowerCase().includes(searchNome.toLowerCase());
      const situacaoMatch = searchSituacao === '' || grade.situacao === searchSituacao;
      const gCursoId = String(grade.cursoId || grade.cursoid || grade.curso_id || '');
      const cursoMatch = !searchCurso || gCursoId === String(searchCurso);
      return nomeMatch && situacaoMatch && cursoMatch;
    });
  };

  const gradesFiltradas = filtrarGrades();
  const totalPages = Math.ceil(gradesFiltradas.length / recordsPerPage) || 1;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const gradesExibidas = gradesFiltradas.slice(startIndex, startIndex + recordsPerPage);

  // Métricas dos Cards de KPI
  const totalGradesGeral = grades.length;
  const totalGradesAtivas = useMemo(
    () => grades.filter((g) => String(g.situacao || 'ATIVO').toUpperCase() === 'ATIVO').length,
    [grades]
  );
  const totalGradesInativas = useMemo(
    () => grades.filter((g) => String(g.situacao || '').toUpperCase() === 'INATIVO').length,
    [grades]
  );
  const totalCursosComGrade = useMemo(() => {
    const ids = new Set(grades.map((g) => g.cursoId || g.cursoid || g.curso_id).filter(Boolean));
    return ids.size;
  }, [grades]);

  const percAtivas = totalGradesGeral > 0 ? Math.round((totalGradesAtivas / totalGradesGeral) * 100) : 0;
  const percInativas = totalGradesGeral > 0 ? Math.round((totalGradesInativas / totalGradesGeral) * 100) : 0;

  const getPaginasVisiveis = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'instituicaoId') {
      setFormData(prev => ({
        ...prev,
        instituicaoId: value,
        cursoId: ''
      }));
      return;
    }

    if (name === 'ano') {
      setFormData(prev => ({
        ...prev,
        ano: value.replace(/\D/g, '').slice(0, 4)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Preencha o nome da grade.',
        type: 'warning'
      });
      return;
    }

    if (!formData.instituicaoId) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Selecione a instituição.',
        type: 'warning'
      });
      return;
    }

    if (!formData.cursoId) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Selecione o curso.',
        type: 'warning'
      });
      return;
    }

    if (!/^\d{4}$/.test(String(formData.ano || ''))) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Informe um ano válido com 4 dígitos (ex.: 2026).',
        type: 'warning'
      });
      return;
    }

    const instituicaoSelecionada = instituicoes.find((inst) => String(getValue(inst, 'id')) === String(formData.instituicaoId));
    const cursoSelecionado = cursos.find((curso) => String(getValue(curso, 'id')) === String(formData.cursoId));

    const payload = {
      ...formData,
      instituicaoId: String(formData.instituicaoId),
      instituicaoNome: getValue(instituicaoSelecionada, 'nome') || '',
      cursoId: String(formData.cursoId),
      cursoNome: getValue(cursoSelecionado, 'nome') || '',
      ano: Number.parseInt(formData.ano, 10)
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/grades/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            id: editingId
          })
        });

        if (res.ok) {
          await carregarGrades();
          setModal({
            isOpen: true,
            title: 'Sucesso!',
            message: 'Grade atualizada com sucesso!',
            type: 'success'
          });
          resetForm();
          setShowForm(false);
        } else {
          setModal({
            isOpen: true,
            title: 'Erro!',
            message: 'Erro ao atualizar grade.',
            type: 'error'
          });
        }
      } else {
        const res = await fetch('/api/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          await carregarGrades();
          setModal({
            isOpen: true,
            title: 'Sucesso!',
            message: 'Grade criada com sucesso!',
            type: 'success'
          });
          resetForm();
          setShowForm(false);
        } else {
          setModal({
            isOpen: true,
            title: 'Erro!',
            message: 'Erro ao criar grade.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar grade:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao salvar grade: ' + error.message,
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({ instituicaoId: '', cursoId: '', ano: '', nome: '', situacao: 'ATIVO' });
    setEditingId(null);
    setCurrentPage(1);
  };

  const handleEdit = (grade) => {
    let instituicaoId = String(getValue(grade, 'instituicaoId') || getValue(grade, 'instituicaoid') || '');
    const cursoId = String(getValue(grade, 'cursoId') || getValue(grade, 'cursoid') || '');
    const ano = String(getValue(grade, 'ano') || '');

    if (!instituicaoId && cursoId) {
      const cursoVinculado = cursos.find(c => String(getValue(c, 'id')) === cursoId);
      if (cursoVinculado) {
        const instCurso = String(getValue(cursoVinculado, 'instituicaoId') || getValue(cursoVinculado, 'instituicao_id') || '');
        if (instCurso) {
          instituicaoId = instCurso;
        } else {
          const unidadeIdsRaw = getValue(cursoVinculado, 'unidadeIds') || getValue(cursoVinculado, 'unidadeids') || [];
          const unidadeIds = Array.isArray(unidadeIdsRaw) ? unidadeIdsRaw.map(id => String(id)) : [];
          if (unidadeIds.length > 0) {
            const instUnidade = unidadesById.get(unidadeIds[0]);
            if (instUnidade) instituicaoId = instUnidade;
          }
        }
      }
    }

    setFormData({
      instituicaoId,
      cursoId,
      ano,
      nome: grade.nome || '',
      situacao: grade.situacao || 'ATIVO'
    });
    setEditingId(grade.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });

    try {
      const res = await fetch(`/api/grades/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await carregarGrades();
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Grade deletada com sucesso!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao deletar grade.',
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
              <Link href="/admin/disciplinas" className="hover:text-slate-600 transition">Disciplinas</Link>
              <span>›</span>
              <span className="text-slate-600 font-semibold">Grades</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                ⚙️
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Gerenciar Grades Curriculares
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  {gradesFiltradas.length} grade{gradesFiltradas.length !== 1 ? 's' : ''} encontrada{gradesFiltradas.length !== 1 ? 's' : ''} no sistema
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link href="/admin/disciplinas">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-2xs transition cursor-pointer"
              >
                <span>←</span>
                <span>Disciplinas</span>
              </button>
            </Link>

            <button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer"
            >
              <span className="text-lg leading-none">+</span>
              <span>Nova Grade</span>
            </button>
          </div>
        </div>

        {/* ── 2. ABAS (Listar, Inserir) ───────────────────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-200/80">
          <button
            onClick={() => setShowForm(false)}
            className={`px-5 py-2.5 font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
              !showForm
                ? 'text-[#009688] border-b-2 border-[#009688]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Listar
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              resetForm();
            }}
            className={`px-5 py-2.5 font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
              showForm
                ? 'text-[#009688] border-b-2 border-[#009688]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {editingId ? '✏️ Editar' : '➕ Inserir'}
          </button>
        </div>

        {/* ── ABA LISTAR ──────────────────────────────────────────────────────── */}
        {!showForm && (
          <div className="space-y-6">
            {/* ── 3. KPI METRIC CARDS ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* 1. Total de Grades */}
              <div className="bg-gradient-to-b from-blue-50/70 to-blue-50/20 rounded-2xl p-5 border border-blue-100 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center text-lg flex-shrink-0 border border-blue-200/60">
                    ⚙️
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                    Geral
                  </span>
                </div>
                <div className="my-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalGradesGeral}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Total de Grades</p>
                </div>
                <div className="pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Matrizes no sistema</span>
                  <span className="font-semibold text-blue-700 shrink-0">100%</span>
                </div>
              </div>

              {/* 2. Grades Ativas */}
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
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalGradesAtivas}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Grades Ativas</p>
                </div>
                <div className="pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Matrizes vigentes</span>
                  <span className="font-semibold text-emerald-700 shrink-0">{percAtivas}% do total</span>
                </div>
              </div>

              {/* 3. Grades Inativas */}
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
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalGradesInativas}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Grades Inativas</p>
                </div>
                <div className="pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Descontinuadas</span>
                  <span className="font-semibold text-amber-700 shrink-0">{percInativas}% do total</span>
                </div>
              </div>

              {/* 4. Cursos Atendidos */}
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
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalCursosComGrade}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Cursos com Matriz</p>
                </div>
                <div className="pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 truncate font-normal">Oferta vinculada</span>
                  <span className="font-semibold text-rose-700 shrink-0">Currículo</span>
                </div>
              </div>
            </div>

            {/* ── 4. BARRA DE FILTROS DA DASHBOARD ───────────────────────────── */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* 1. Nome da Grade */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Buscar por Nome</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Nome da grade curricular..."
                      value={searchNome}
                      onChange={(e) => {
                        setSearchNome(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full h-10 pl-10 pr-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
                    />
                  </div>
                </div>

                {/* 2. Curso */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Curso</label>
                  <select
                    value={searchCurso}
                    onChange={(e) => {
                      setSearchCurso(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
                  >
                    <option value="">Todos os Cursos</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Situação */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Situação</label>
                  <select
                    value={searchSituacao}
                    onChange={(e) => {
                      setSearchSituacao(e.target.value);
                      setCurrentPage(1);
                    }}
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
                  onClick={() => {
                    setSearchNome('');
                    setSearchCurso('');
                    setSearchSituacao('ATIVO');
                    setCurrentPage(1);
                  }}
                  className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🧹</span>
                  <span>Limpar Filtros</span>
                </button>

                <button
                  onClick={() => setCurrentPage(1)}
                  className="h-10 px-5 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>Aplicar Filtros</span>
                </button>
              </div>
            </div>

            {/* ── 5. LISTAGEM EM TABELA ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              {/* Header da Tabela */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 border-b border-slate-200/80 gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📋</span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">
                      Listagem das Grades Curriculares
                    </h2>
                    <p className="text-xs text-slate-400 font-normal">
                      Visualize, edite e gerencie as matrizes cadastradas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={recordsPerPage}
                      onChange={(e) => {
                        setRecordsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer"
                    >
                      <option value="10">10 por pág.</option>
                      <option value="25">25 por pág.</option>
                      <option value="50">50 por pág.</option>
                      <option value="100">100 por pág.</option>
                    </select>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Total: <strong className="text-slate-800">{gradesFiltradas.length}</strong>
                  </span>
                </div>
              </div>

              {gradesFiltradas.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-400 text-sm font-medium">Nenhuma grade curricular encontrada</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs border-b border-slate-200 select-none">
                          <th className="px-5 py-3.5 w-16">#</th>
                          <th className="px-5 py-3.5">Nome da Grade</th>
                          <th className="px-5 py-3.5">Ano da Matriz</th>
                          <th className="px-5 py-3.5 text-center">Situação</th>
                          <th className="px-5 py-3.5 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-sm">
                        {gradesExibidas.map((grade, index) => {
                          const isAtivo = String(grade.situacao || 'ATIVO').toUpperCase() === 'ATIVO';

                          return (
                            <tr key={grade.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                                #{startIndex + index + 1}
                              </td>
                              <td className="px-5 py-3.5 font-bold text-slate-900">
                                {grade.nome}
                              </td>
                              <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                                {getValue(grade, 'ano') || '—'}
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
                                    onClick={() => handleEdit(grade)}
                                    className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                    title="Editar Grade"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDelete(grade.id)}
                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Excluir Grade"
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

                  {/* ── Barra de Paginação ───────────────────────────────────── */}
                  {gradesFiltradas.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white select-none">
                      <div className="text-xs sm:text-sm text-slate-500 font-normal">
                        Mostrando {startIndex + 1} até {Math.min(startIndex + recordsPerPage, gradesFiltradas.length)} de {gradesFiltradas.length} grades
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Botão Anterior */}
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
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

                          const isCurrent = pag === currentPage;

                          return (
                            <button
                              key={`pag-${pag}`}
                              onClick={() => setCurrentPage(pag)}
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
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
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

        {/* ── ABA INSERIR / EDITAR ────────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {editingId ? '✏️ Editar Grade Curricular' : '➕ Nova Grade Curricular'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Preencha os dados abaixo para estruturar a matriz curricular
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Instituição *</label>
                  <select
                    name="instituicaoId"
                    value={formData.instituicaoId}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
                    disabled={loadingOpcoes}
                  >
                    <option value="">Selecione a instituição</option>
                    {instituicoes.map((instituicao) => (
                      <option key={getValue(instituicao, 'id')} value={getValue(instituicao, 'id')}>
                        {getValue(instituicao, 'nome')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Curso *</label>
                  <select
                    name="cursoId"
                    value={formData.cursoId}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
                    disabled={!formData.instituicaoId || loadingOpcoes}
                  >
                    <option value="">{formData.instituicaoId ? 'Selecione o curso' : 'Selecione a instituição primeiro'}</option>
                    {cursosFiltradosPorInstituicao.map((curso) => (
                      <option key={getValue(curso, 'id')} value={getValue(curso, 'id')}>
                        {getValue(curso, 'nome')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Nome da Grade *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Ex.: Matriz 2026 / 1"
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Ano da Matriz *</label>
                  <input
                    type="text"
                    name="ano"
                    value={formData.ano}
                    onChange={handleInputChange}
                    placeholder="Ex.: 2026"
                    maxLength={4}
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Situação</label>
                <select
                  name="situacao"
                  value={formData.situacao}
                  onChange={handleInputChange}
                  className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white text-slate-700 cursor-pointer"
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-[#009688] hover:bg-[#00796B] active:bg-[#00695C] text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer"
                >
                  <span>💾</span>
                  <span>Salvar Grade</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer"
                >
                  <span>✕</span>
                  <span>Cancelar</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modais */}
      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ isOpen: false, title: '', message: '', type: 'success' })}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja deletar esta grade? Esta ação não pode ser desfeita."
        type="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </>
  );
}
