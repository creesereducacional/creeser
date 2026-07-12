import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function EditarDisciplina() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    curso: '',
    periodo: '',
    cargaHoraria: '',
    grade: '',
    matriz: false,
    ementa: '',
    complementar: false,
    optativa: false,
    compoeMatriz: false,
    requerDeferimento: false,
    avaliacoes: '',
    estagio: false,
    situacao: 'ATIVO',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/cursos'),
      fetch('/api/grades')
    ]).then(async ([resCursos, resGrades]) => {
      if (resCursos.ok) setCursos(await resCursos.json());
      if (resGrades.ok) setGrades(await resGrades.json());
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (id) {
      carregarDisciplina();
    }
  }, [id]);

  const carregarDisciplina = async () => {
    try {
      const res = await fetch(`/api/disciplinas/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      } else {
        alert('Disciplina não encontrada');
        router.push('/admin/disciplinas');
      }
    } catch (error) {
      console.error('Erro ao carregar disciplina:', error);
      alert('Erro ao carregar disciplina');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/disciplinas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Disciplina atualizada com sucesso!');
        router.push('/admin/disciplinas');
      } else {
        alert('Erro ao atualizar disciplina');
      }
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      alert('Erro ao atualizar disciplina');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 text-center">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📖</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Editar Disciplina</h1>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Configuração Básica */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Configuração Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO *</label>
                <select
                  name="curso"
                  value={formData.curso}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- ESCOLHA UM CURSO -</option>
                  {cursos.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PERÍODO *</label>
                <select
                  name="periodo"
                  value={formData.periodo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- ESCOLHA UM PERÍODO -</option>
                  <option value="01º Período">01º Período</option>
                  <option value="02º Período">02º Período</option>
                  <option value="03º Período">03º Período</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome da Disciplina"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CARGA HORÁRIA *</label>
                <input
                  type="text"
                  name="cargaHoraria"
                  value={formData.cargaHoraria}
                  onChange={handleChange}
                  required
                  placeholder="Somente Números"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CRÉDITO</label>
                <input
                  type="text"
                  name="credito"
                  placeholder="Crédito"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">QTD. AULAS</label>
                <input
                  type="text"
                  name="qtdAulas"
                  placeholder="Qtd. Aulas"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Grade Pertencente */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Grade Pertencente</h3>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                ⚠️ DICAS IMPORTANTES!
              </h4>
              <ul className="text-sm text-yellow-900 space-y-1">
                <li>Caso <strong>NÃO SELECIONE UMA GRADE</strong>, a disciplina será relacionada diretamente ao curso.</li>
                <li>Caso exista uma ou mais grades relacionadas ao curso, as mesmas serão priorizadas nos cadastros de novas turmas.</li>
                <li>Clique em <strong>Gerenciar Grades</strong> para CADASTRAR UMA NOVA GRADE ou ALTERAR UMA JÁ EXISTENTE.</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">GRADE DA DISCIPLINA</label>
              <div className="flex flex-col gap-3">
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Escolha uma Grade *</option>
                  {grades
                    .filter(g => !formData.curso || g.curso_nome === formData.curso)
                    .map(g => (
                      <option key={g.id} value={g.id}>{g.nome} ({g.ano})</option>
                    ))}
                </select>
                <Link href="/admin/disciplinas/grades">
                  <button
                    type="button"
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2"
                  >
                    ⚙️ Gerenciar Grade
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Seção: Ementa */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Ementa</h3>
            
            <textarea
              name="ementa"
              value={formData.ementa}
              onChange={handleChange}
              placeholder="Descrição da ementa"
              rows="4"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            ></textarea>
          </div>

          {/* Seção: Configurações */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Configurações</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="complementar"
                    checked={formData.complementar}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Complementar?</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="optativa"
                    checked={formData.optativa}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Optativa?</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="compoeMatriz"
                    checked={formData.compoeMatriz}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Compõe a matriz?</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="requerDeferimento"
                    checked={formData.requerDeferimento}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Requer Deferimento?</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">Nº AVALIAÇÕES</label>
                  <select
                    name="avaliacoes"
                    value={formData.avaliacoes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- Qtd. de Avaliações -</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="estagio"
                      checked={formData.estagio}
                      onChange={handleChange}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">Estágio</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Status</h3>
            
            <select
              name="situacao"
              value={formData.situacao}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
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
              className="px-8 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-50"
            >
              {saving ? 'SALVANDO...' : 'SALVAR'}
            </button>
            <Link href="/admin/disciplinas">
              <button
                type="button"
                className="px-8 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition text-sm"
              >
                CANCELAR
              </button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
