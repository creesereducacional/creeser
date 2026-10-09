import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomModal from '../../../components/CustomModal';

export default function EditarDisciplina() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    instituicaoId: '',
    unidadeId: '',
    curso: '',
    cursoId: null,
    periodo: '',
    cargaHoraria: '',
    credito: '',
    qtdAulas: '',
    grade: '',
    matriz: true,
    ementa: '',
    complementar: false,
    optativa: false,
    compoeMatriz: true,
    requerDeferimento: false,
    avaliacoes: '',
    estagio: false,
    situacao: 'ATIVO',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [instituicoes, setInstituicoes] = useState([]);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(true);

  const [unidades, setUnidades] = useState([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);

  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(false);

  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    redirectOnClose: null,
  });

  // 1. Carregar Instituições ao montar
  useEffect(() => {
    setLoadingInstituicoes(true);
    fetch('/api/instituicoes', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const ativas = (Array.isArray(data) ? data : []).filter((i) => i.ativa !== false);
        setInstituicoes(ativas);
      })
      .catch((err) => console.error('Erro ao buscar instituições:', err))
      .finally(() => setLoadingInstituicoes(false));
  }, []);

  // 1.1. Carregar Unidades filtradas por Instituição
  useEffect(() => {
    if (!formData.instituicaoId) {
      setLoadingUnidades(true);
      fetch('/api/unidades', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const ativas = (Array.isArray(data) ? data : []).filter(
            (u) => String(u.situacao || 'ATIVO').toUpperCase() === 'ATIVO'
          );
          setUnidades(ativas);
        })
        .catch((err) => console.error('Erro ao buscar unidades:', err))
        .finally(() => setLoadingUnidades(false));
      return;
    }

    setLoadingUnidades(true);
    fetch(`/api/unidades?instituicao_id=${formData.instituicaoId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const ativas = (Array.isArray(data) ? data : []).filter(
          (u) => String(u.situacao || 'ATIVO').toUpperCase() === 'ATIVO'
        );
        setUnidades(ativas);
      })
      .catch((err) => console.error('Erro ao buscar unidades da instituição:', err))
      .finally(() => setLoadingUnidades(false));
  }, [formData.instituicaoId]);

  // 2. Carregar Disciplina para edição
  useEffect(() => {
    if (id) {
      carregarDisciplina();
    }
  }, [id]);

  const carregarDisciplina = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/disciplinas/${id}`);
      if (res.ok) {
        const data = await res.json();
        const cid = data.cursoid || data.cursoId || null;

        // Se houver cursoid, buscar o curso para obter a unidade dele
        let unidadeIdEncontrada = '';
        if (cid) {
          try {
            const cRes = await fetch(`/api/cursos/${cid}`, { credentials: 'include' });
            if (cRes.ok) {
              const cData = await cRes.json();
              if (cData.unidadeIds && cData.unidadeIds.length > 0) {
                unidadeIdEncontrada = String(cData.unidadeIds[0]);
              }
            }
          } catch (_) {}
        }

        setFormData({
          codigo: data.codigo || '',
          nome: data.nome || '',
          unidadeId: unidadeIdEncontrada,
          curso: data.curso || '',
          cursoId: cid,
          periodo: data.periodo !== undefined && data.periodo !== null ? String(data.periodo) : '',
          cargaHoraria: data.cargaHoraria !== undefined && data.cargaHoraria !== null ? String(data.cargaHoraria) : '',
          credito: data.credito !== undefined && data.credito !== null ? String(data.credito) : '',
          qtdAulas: data.qtdAulas !== undefined && data.qtdAulas !== null ? String(data.qtdAulas) : '',
          grade: data.grade ? String(data.grade) : '',
          matriz: data.matriz !== undefined ? Boolean(data.matriz) : true,
          ementa: data.ementa || '',
          complementar: Boolean(data.complementar),
          optativa: Boolean(data.optativa),
          compoeMatriz: data.compoeMatriz !== undefined ? Boolean(data.compoeMatriz) : Boolean(data.matriz !== undefined ? data.matriz : true),
          requerDeferimento: Boolean(data.requerDeferimento),
          avaliacoes: data.avaliacoes !== undefined && data.avaliacoes !== null ? String(data.avaliacoes) : '',
          estagio: Boolean(data.estagio),
          situacao: data.situacao || 'ATIVO',
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Ops!',
          message: 'Disciplina não encontrada.',
          type: 'error',
          redirectOnClose: '/admin/disciplinas',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar disciplina:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao carregar disciplina.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Carregar Cursos da Unidade quando unidadeId mudar
  useEffect(() => {
    if (!formData.unidadeId) {
      // Se não houver unidade definida, carregar cursos gerais
      fetch('/api/cursos?situacao=ATIVO', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setCursos(Array.isArray(data) ? data : []))
        .catch(() => setCursos([]));
      return;
    }

    setLoadingCursos(true);
    fetch(`/api/cursos?unidade_id=${formData.unidadeId}&situacao=ATIVO`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCursos(Array.isArray(data) ? data : []))
      .catch(() => setCursos([]))
      .finally(() => setLoadingCursos(false));
  }, [formData.unidadeId]);

  // 4. Carregar Grades do Curso quando cursoId mudar
  useEffect(() => {
    if (!formData.cursoId) {
      setGrades([]);
      return;
    }

    setLoadingGrades(true);
    fetch(`/api/grades?curso_id=${formData.cursoId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        const doCurso = lista.filter((g) => {
          const gcid = g.curso_id || g.cursoid;
          return Number(gcid) === Number(formData.cursoId);
        });
        setGrades(doCurso);
      })
      .catch(() => setGrades([]))
      .finally(() => setLoadingGrades(false));
  }, [formData.cursoId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'instituicaoId') {
      setFormData((prev) => ({
        ...prev,
        instituicaoId: value,
        unidadeId: '',
        curso: '',
        cursoId: null,
        grade: '',
      }));
      return;
    }

    if (name === 'unidadeId') {
      setFormData((prev) => ({
        ...prev,
        unidadeId: value,
        curso: '',
        cursoId: null,
        grade: '',
      }));
      return;
    }

    if (name === 'cursoId') {
      const numId = value ? Number(value) : null;
      const cObj = cursos.find((c) => Number(c.id) === numId);
      setFormData((prev) => ({
        ...prev,
        cursoId: numId,
        curso: cObj ? cObj.nome : '',
        grade: '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cursoId) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Por favor, selecione um Curso válido.',
        type: 'warning',
      });
      return;
    }

    if (formData.compoeMatriz && !formData.grade) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Para disciplinas que compõem matriz, selecione uma Matriz Curricular (Grade).',
        type: 'warning',
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        unidadeId: formData.unidadeId ? Number(formData.unidadeId) : null,
        cursoId: formData.cursoId ? Number(formData.cursoId) : null,
      };

      const res = await fetch(`/api/disciplinas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (_) {
        data = {};
      }

      if (res.ok) {
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Disciplina atualizada com sucesso!',
          type: 'success',
          redirectOnClose: '/admin/disciplinas',
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Erro!',
          message: data?.error || data?.message || 'Erro ao atualizar disciplina.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: error?.message || 'Falha na comunicação com o servidor.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm">Carregando dados da disciplina...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 max-w-5xl mx-auto font-sans">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📖</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Editar Disciplina</h1>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Configuração Básica e Vínculos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4 flex items-center gap-2">
              <span>✏️</span> Dados da Disciplina
            </h3>

            {/* Linha 1: Instituição, Unidade, Curso e Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  INSTITUIÇÃO
                </label>
                <select
                  name="instituicaoId"
                  value={formData.instituicaoId}
                  onChange={handleChange}
                  disabled={loadingInstituicoes}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                >
                  <option value="">- TODAS AS INSTITUIÇÕES -</option>
                  {instituicoes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  UNIDADE
                </label>
                <select
                  name="unidadeId"
                  value={formData.unidadeId}
                  onChange={handleChange}
                  disabled={loadingUnidades}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                >
                  <option value="">- TODAS AS UNIDADES -</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  CURSO *
                </label>
                <select
                  name="cursoId"
                  value={formData.cursoId || ''}
                  onChange={handleChange}
                  required
                  disabled={loadingCursos}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                >
                  <option value="">- ESCOLHA UM CURSO -</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  PERÍODO *
                </label>
                <select
                  name="periodo"
                  value={formData.periodo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                >
                  <option value="">- ESCOLHA UM PERÍODO -</option>
                  <option value="1">01º Período</option>
                  <option value="2">02º Período</option>
                  <option value="3">03º Período</option>
                  <option value="4">04º Período</option>
                  <option value="5">05º Período</option>
                  <option value="6">06º Período</option>
                  <option value="7">07º Período</option>
                  <option value="8">08º Período</option>
                  <option value="9">09º Período</option>
                  <option value="10">10º Período</option>
                </select>
              </div>
            </div>

            {/* Linha 2: Nome, Carga Horária, Crédito e Qtd Aulas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  NOME *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome da Disciplina"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  CARGA HORÁRIA *
                </label>
                <input
                  type="text"
                  name="cargaHoraria"
                  value={formData.cargaHoraria}
                  onChange={handleChange}
                  required
                  placeholder="Somente Números"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  CRÉDITO
                </label>
                <input
                  type="text"
                  name="credito"
                  value={formData.credito || ''}
                  onChange={handleChange}
                  placeholder="Crédito"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  QTD. AULAS
                </label>
                <input
                  type="text"
                  name="qtdAulas"
                  value={formData.qtdAulas || ''}
                  onChange={handleChange}
                  placeholder="Qtd. Aulas"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                />
              </div>
            </div>
          </div>

          {/* Seção: Grade Pertencente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Grade Pertencente</h3>

            <div>
              <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                GRADE DA DISCIPLINA / MATRIZ CURRICULAR *
              </label>
              <div className="flex flex-col gap-3">
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required={formData.compoeMatriz}
                  disabled={!formData.cursoId || loadingGrades || grades.length === 0}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 disabled:bg-gray-100 disabled:text-gray-400 transition"
                >
                  {!formData.cursoId ? (
                    <option value="">- PRIMEIRO ESCOLHA UM CURSO -</option>
                  ) : loadingGrades ? (
                    <option value="">Carregando matrizes do curso...</option>
                  ) : grades.length === 0 ? (
                    <option value="">- NENHUMA MATRIZ CADASTRADA PARA ESTE CURSO -</option>
                  ) : (
                    <>
                      <option value="">Escolha uma Grade *</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nome} ({g.ano})
                        </option>
                      ))}
                    </>
                  )}
                </select>

                {formData.cursoId && !loadingGrades && grades.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                    <span className="text-base leading-none">⚠️</span>
                    <div>
                      <p className="font-semibold mb-0.5">Nenhuma matriz curricular cadastrada para este curso</p>
                      <p>O curso <strong>{formData.curso}</strong> não possui grades cadastradas. Cadastre primeiro a matriz antes de associar.</p>
                    </div>
                  </div>
                )}

                <Link href={`/admin/disciplinas/grades${formData.cursoId ? `?curso_id=${formData.cursoId}` : ''}`}>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 shadow-xs"
                  >
                    ⚙️ Gerenciar Grade {formData.curso ? `de ${formData.curso}` : ''}
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Seção: Ementa */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Ementa</h3>

            <textarea
              name="ementa"
              value={formData.ementa}
              onChange={handleChange}
              placeholder="Descrição da ementa"
              rows="4"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
            ></textarea>
          </div>

          {/* Seção: Configurações */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Configurações</h3>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="complementar"
                    checked={formData.complementar}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Complementar?</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="optativa"
                    checked={formData.optativa}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Optativa?</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="compoeMatriz"
                    checked={formData.compoeMatriz}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Compõe a matriz?</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="requerDeferimento"
                    checked={formData.requerDeferimento}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Requer Deferimento?</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                    Nº AVALIAÇÕES
                  </label>
                  <select
                    name="avaliacoes"
                    value={formData.avaliacoes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
                  >
                    <option value="">- Qtd. de Avaliações -</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="estagio"
                      checked={formData.estagio}
                      onChange={handleChange}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">Estágio</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Status</h3>

            <select
              name="situacao"
              value={formData.situacao}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 transition"
            >
              <option value="ATIVO">ATIVO</option>
              <option value="INATIVO">INATIVO</option>
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-start">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {saving ? 'SALVANDO...' : 'SALVAR'}
            </button>
            <Link href="/admin/disciplinas">
              <button
                type="button"
                className="px-8 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition text-sm cursor-pointer"
              >
                CANCELAR
              </button>
            </Link>
          </div>
        </form>
      </div>

      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => {
          const redirect = modal.redirectOnClose;
          setModal((prev) => ({ ...prev, isOpen: false }));
          if (redirect) router.push(redirect);
        }}
      />
    </>
  );
}
