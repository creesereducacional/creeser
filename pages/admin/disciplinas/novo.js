import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomModal from '../../../components/CustomModal';

export default function NovaDisciplina() {
  const router = useRouter();
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

  const [loading, setLoading] = useState(false);

  // Estados de dados, carregamento e erros para cascata Instituição -> Unidade -> Curso -> Matriz
  const [instituicoes, setInstituicoes] = useState([]);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(true);
  const [erroInstituicoes, setErroInstituicoes] = useState(null);

  const [unidades, setUnidades] = useState([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [erroUnidades, setErroUnidades] = useState(null);

  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [erroCursos, setErroCursos] = useState(null);

  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [erroGrades, setErroGrades] = useState(null);

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    redirectOnClose: null,
  });

  // 1. Carregar lista de Instituições disponíveis ao montar o componente
  useEffect(() => {
    let isMounted = true;
    setLoadingInstituicoes(true);
    setErroInstituicoes(null);

    fetch('/api/instituicoes', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => null);
          throw new Error(errData?.error || `Erro ${r.status} ao carregar instituições.`);
        }
        return r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const lista = Array.isArray(data) ? data : [];
        const ativas = lista.filter((i) => i.ativa !== false);
        setInstituicoes(ativas);

        // Se houver apenas 1 instituição, seleciona automaticamente
        if (ativas.length === 1) {
          const instId = String(ativas[0].id);
          setFormData((prev) => ({ ...prev, instituicaoId: instId }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao buscar instituições:', err);
        setErroInstituicoes(err.message || 'Falha ao carregar instituições.');
      })
      .finally(() => {
        if (isMounted) setLoadingInstituicoes(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Quando a Instituição for alterada: carregar Unidades vinculadas àquela Instituição
  useEffect(() => {
    let isMounted = true;

    if (!formData.instituicaoId) {
      setUnidades([]);
      setCursos([]);
      setGrades([]);
      setFormData((prev) => ({
        ...prev,
        unidadeId: '',
        curso: '',
        cursoId: null,
        grade: '',
      }));
      setLoadingUnidades(false);
      setErroUnidades(null);
      return;
    }

    setLoadingUnidades(true);
    setErroUnidades(null);
    setUnidades([]);
    setCursos([]);
    setGrades([]);

    fetch(`/api/unidades?instituicao_id=${formData.instituicaoId}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => null);
          throw new Error(errData?.error || `Erro ${r.status} ao carregar unidades.`);
        }
        return r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const lista = Array.isArray(data) ? data : [];
        const ativas = lista.filter(
          (u) => String(u.situacao || 'ATIVO').toUpperCase() === 'ATIVO'
        );
        setUnidades(ativas);

        // Se houver exatamente uma unidade para a instituição selecionada, seleciona automaticamente
        if (ativas.length === 1) {
          const uId = String(ativas[0].id);
          setFormData((prev) => ({ ...prev, unidadeId: uId }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao buscar unidades:', err);
        setErroUnidades(err.message || 'Falha ao carregar unidades.');
      })
      .finally(() => {
        if (isMounted) setLoadingUnidades(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.instituicaoId]);

  // 3. Quando a Unidade for alterada: carregar cursos vinculados à unidade selecionada
  useEffect(() => {
    let isMounted = true;

    if (!formData.unidadeId) {
      setCursos([]);
      setGrades([]);
      setFormData((prev) => ({
        ...prev,
        curso: '',
        cursoId: null,
        grade: '',
      }));
      setLoadingCursos(false);
      setErroCursos(null);
      return;
    }

    setLoadingCursos(true);
    setErroCursos(null);
    setCursos([]);
    setGrades([]);

    fetch(`/api/cursos?unidade_id=${formData.unidadeId}&situacao=ATIVO`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => null);
          throw new Error(errData?.error || `Erro ${r.status} ao carregar cursos.`);
        }
        return r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const lista = Array.isArray(data) ? data : [];
        const cursosAtivos = lista.filter(c => String(c.situacao || 'ATIVO').toUpperCase() === 'ATIVO');
        setCursos(cursosAtivos);

        // Se houver apenas 1 curso na unidade, pode selecionar automaticamente
        if (cursosAtivos.length === 1) {
          const cUnico = cursosAtivos[0];
          setFormData((prev) => ({
            ...prev,
            cursoId: Number(cUnico.id),
            curso: cUnico.nome,
            grade: '',
          }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao buscar cursos da unidade:', err);
        setErroCursos(err.message || 'Falha ao carregar cursos da unidade.');
      })
      .finally(() => {
        if (isMounted) setLoadingCursos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.unidadeId]);

  // 4. Quando o Curso for alterado: carregar exclusivamente as matrizes pertencentes ao curso
  useEffect(() => {
    let isMounted = true;

    if (!formData.cursoId) {
      setGrades([]);
      setFormData((prev) => ({ ...prev, grade: '' }));
      setLoadingGrades(false);
      setErroGrades(null);
      return;
    }

    setLoadingGrades(true);
    setErroGrades(null);
    setGrades([]);

    fetch(`/api/grades?curso_id=${formData.cursoId}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => null);
          throw new Error(errData?.error || `Erro ${r.status} ao carregar matrizes.`);
        }
        return r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const lista = Array.isArray(data) ? data : [];
        // Filtro estrito: garantir que curso_id/cursoid corresponda ao curso selecionado
        const matrizesDoCurso = lista.filter((g) => {
          const gCursoId = g.curso_id !== undefined && g.curso_id !== null ? Number(g.curso_id) : g.cursoid !== undefined && g.cursoid !== null ? Number(g.cursoid) : null;
          return gCursoId === Number(formData.cursoId);
        });

        setGrades(matrizesDoCurso);

        // Se houver apenas 1 matriz, seleciona automaticamente por conveniência
        if (matrizesDoCurso.length === 1) {
          setFormData((prev) => ({
            ...prev,
            grade: String(matrizesDoCurso[0].id),
          }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao buscar matrizes do curso:', err);
        setErroGrades(err.message || 'Falha ao carregar matrizes curriculares.');
      })
      .finally(() => {
        if (isMounted) setLoadingGrades(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.cursoId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'instituicaoId') {
      // Ao mudar de instituição: limpa unidade, curso e grade selecionados
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
      // Ao mudar de unidade: limpa curso e grade selecionados
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
      // Ao mudar de curso: seleciona o ID, nome e limpa a grade anteriormente selecionada
      const numId = value ? Number(value) : null;
      const cursoObj = cursos.find((c) => Number(c.id) === numId);
      setFormData((prev) => ({
        ...prev,
        cursoId: numId,
        curso: cursoObj ? cursoObj.nome : '',
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

    if (instituicoes.length > 0 && !formData.instituicaoId) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Por favor, selecione a Instituição da disciplina.',
        type: 'warning',
      });
      return;
    }

    if (!formData.unidadeId) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Por favor, selecione a Unidade da disciplina.',
        type: 'warning',
      });
      return;
    }

    if (!formData.cursoId) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Por favor, selecione o Curso da disciplina.',
        type: 'warning',
      });
      return;
    }

    if (!formData.periodo) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Por favor, selecione o Período da disciplina.',
        type: 'warning',
      });
      return;
    }

    if (!formData.nome.trim()) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Por favor, informe o Nome da disciplina.',
        type: 'warning',
      });
      return;
    }

    if (!formData.cargaHoraria.trim()) {
      setModal({
        isOpen: true,
        title: 'Atenção!',
        message: 'Por favor, informe a Carga Horária da disciplina.',
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

    setLoading(true);

    try {
      const payload = {
        ...formData,
        unidadeId: formData.unidadeId ? Number(formData.unidadeId) : null,
        cursoId: formData.cursoId ? Number(formData.cursoId) : null,
      };

      const res = await fetch('/api/disciplinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseErr) {
        console.error('Resposta não-JSON da API de disciplinas:', res.status, rawText);
        setModal({
          isOpen: true,
          title: 'Erro de Servidor',
          message: `Falha no servidor (HTTP ${res.status}). A resposta retornada não pôde ser interpretada.`,
          type: 'error',
        });
        return;
      }

      if (res.ok) {
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Disciplina cadastrada com sucesso!',
          type: 'success',
          redirectOnClose: '/admin/disciplinas',
        });
      } else {
        const mensagemErro = data?.error || data?.message || `Erro ${res.status} ao cadastrar disciplina.`;
        setModal({
          isOpen: true,
          title: 'Erro no Cadastro',
          message: mensagemErro,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Erro de requisição ao cadastrar disciplina:', error);
      setModal({
        isOpen: true,
        title: 'Erro de Conexão',
        message: error?.message || 'Falha de comunicação com o servidor.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4 md:p-6 max-w-5xl mx-auto font-sans">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📖</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Disciplinas</h1>
          </div>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <Link href="/admin/disciplinas">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold flex items-center gap-2 transition">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold flex items-center gap-2">
            ➕ Inserir
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Configuração Básica e Vínculos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4 flex items-center gap-2">
              <span>➕</span> Inserir Disciplina
            </h3>

            {/* Linha 1: Instituição, Unidade, Curso e Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  INSTITUIÇÃO *
                </label>
                <select
                  name="instituicaoId"
                  value={formData.instituicaoId}
                  onChange={handleChange}
                  required
                  disabled={loadingInstituicoes}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 disabled:bg-gray-100 disabled:text-gray-400 transition"
                >
                  <option value="">{loadingInstituicoes ? 'Carregando instituições...' : '- ESCOLHA UMA INSTITUIÇÃO -'}</option>
                  {instituicoes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nome}
                    </option>
                  ))}
                </select>
                {erroInstituicoes && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{erroInstituicoes}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                  UNIDADE *
                </label>
                <select
                  name="unidadeId"
                  value={formData.unidadeId}
                  onChange={handleChange}
                  required
                  disabled={!formData.instituicaoId || loadingUnidades || unidades.length === 0}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 disabled:bg-gray-100 disabled:text-gray-400 transition"
                >
                  {!formData.instituicaoId ? (
                    <option value="">- PRIMEIRO SELECIONE UMA INSTITUIÇÃO -</option>
                  ) : loadingUnidades ? (
                    <option value="">Carregando unidades da instituição...</option>
                  ) : unidades.length === 0 ? (
                    <option value="">- NENHUMA UNIDADE VINCULADA -</option>
                  ) : (
                    <>
                      <option value="">- ESCOLHA UMA UNIDADE -</option>
                      {unidades.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {erroUnidades && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{erroUnidades}</p>
                )}
                {formData.instituicaoId && !loadingUnidades && unidades.length === 0 && !erroUnidades && (
                  <p className="text-xs text-amber-700 mt-1">Nenhuma unidade ativa vinculada a esta instituição.</p>
                )}
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
                  disabled={!formData.unidadeId || loadingCursos || cursos.length === 0}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/50 disabled:bg-gray-100 disabled:text-gray-400 transition"
                >
                  {!formData.unidadeId ? (
                    <option value="">- PRIMEIRO SELECIONE UMA UNIDADE -</option>
                  ) : loadingCursos ? (
                    <option value="">Carregando cursos da unidade...</option>
                  ) : cursos.length === 0 ? (
                    <option value="">- NENHUM CURSO VINCULADO A ESTA UNIDADE -</option>
                  ) : (
                    <>
                      <option value="">- ESCOLHA UM CURSO -</option>
                      {cursos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {erroCursos && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{erroCursos}</p>
                )}
                {formData.unidadeId && !loadingCursos && cursos.length === 0 && !erroCursos && (
                  <p className="text-xs text-amber-700 mt-1">Nenhum curso ativo vinculado a esta unidade.</p>
                )}
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

            <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 mb-4 rounded-r-lg">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                ⚠️ DICAS IMPORTANTES!
              </h4>
              <ul className="text-sm text-amber-900 space-y-1">
                <li>
                  Caso <strong>NÃO SELECIONE UMA GRADE</strong>, a disciplina será relacionada diretamente ao curso.
                </li>
                <li>
                  Caso exista uma ou mais grades relacionadas ao curso, as mesmas serão priorizadas nos cadastros de novas turmas.
                </li>
                <li>
                  Clique em <strong>Gerenciar Grade</strong> para CADASTRAR UMA NOVA GRADE ou ALTERAR UMA JÁ EXISTENTE.
                </li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">
                GRADE DA DISCIPLINA / MATRIZ CURRICULAR *
              </label>
              <div className="flex flex-col gap-3">
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
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

                {erroGrades && (
                  <p className="text-xs text-rose-600 font-medium">{erroGrades}</p>
                )}

                {/* Orientação quando o curso selecionado não possui matrizes */}
                {formData.cursoId && !loadingGrades && grades.length === 0 && !erroGrades && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                    <span className="text-base leading-none">ℹ️</span>
                    <div>
                      <p className="font-semibold text-amber-900 mb-0.5">
                        Curso sem Matriz Curricular Cadastrada
                      </p>
                      <p>
                        O curso <strong>{formData.curso}</strong> ainda não possui grades cadastradas no sistema.
                        Para vincular disciplinas a este curso, clique no botão <strong>Gerenciar Grade</strong> abaixo e cadastre a primeira matriz curricular.
                      </p>
                    </div>
                  </div>
                )}

                <Link href={`/admin/disciplinas/grades${formData.cursoId ? `?curso_id=${formData.cursoId}` : ''}`}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 shadow-xs"
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
              placeholder="Descrição da ementa da disciplina"
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
              disabled={loading}
              className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
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
