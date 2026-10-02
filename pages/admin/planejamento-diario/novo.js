import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PlanejamentoDiarioNovo() {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    turma: '',
    disciplina: '',
    data: '',
    dataFim: '',
    local: '',
    quantidadeAulas: '',
    avaliacaoCheckbox: false,
    professor: '',
    unidadeBimestral: '',
    conteudoVivenciado: '',
    objetivoAula: '',
    metodologias: '',
    recursos: '',
    avaliacao: ''
  });

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      carregarRegistro();
    }
  }, [id]);

  const carregarRegistro = async () => {
    try {
      const res = await fetch(`/api/planejamento-diario/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          ...data,
          data: data.data.split('T')[0],
          dataFim: data.dataFim.split('T')[0]
        });
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
      alert('Erro ao carregar planejamento');
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

    if (!formData.turma || !formData.disciplina || !formData.data) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const endpoint = isEditing ? `/api/planejamento-diario/${id}` : '/api/planejamento-diario';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          data: new Date(formData.data).toISOString(),
          dataFim: new Date(formData.dataFim).toISOString()
        })
      });

      if (res.ok) {
        alert(isEditing ? 'Planejamento atualizado com sucesso' : 'Planejamento criado com sucesso');
        router.push('/admin/planejamento-diario');
      } else {
        alert('Erro ao salvar planejamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar planejamento');
    }
  };

  if (loading) {
    return (
      <>
        <div className="p-4 md:p-6 text-center">Carregando...</div>
      </>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          {isEditing ? 'Editar Plano de Ensino' : 'Registrar Novo Plano de Ensino'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Turma e Disciplina */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-sm font-bold text-teal-600 mb-4">Seleção de Turma e Disciplina</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA *</label>
                <select
                  name="turma"
                  value={formData.turma}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- ESCOLHA UMA TURMA -</option>
                  <option value="ADM - TESTE MEC - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)">ADM - TESTE MEC - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DISCIPLINA *</label>
                <select
                  name="disciplina"
                  value={formData.disciplina}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- ESCOLHA UMA DISCIPLINA -</option>
                  <option value="1 - Comunicação Contemporânea">1 - Comunicação Contemporânea</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Informações da Aula */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-sm font-bold text-teal-600 mb-4">ℹ️ Informações da Aula</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DATA *</label>
                <input
                  type="date"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DATA FIM</label>
                <input
                  type="date"
                  name="dataFim"
                  value={formData.dataFim}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">LOCAL</label>
                <input
                  type="text"
                  name="local"
                  value={formData.local}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UNIDADE BIMESTRAL</label>
                <select
                  name="unidadeBimestral"
                  value={formData.unidadeBimestral}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- ESCOLHA UMA UNIDADE -</option>
                  <option value="1º Bimestre">1º Bimestre</option>
                  <option value="2º Bimestre">2º Bimestre</option>
                  <option value="3º Bimestre">3º Bimestre</option>
                  <option value="4º Bimestre">4º Bimestre</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">QTD. AULAS *</label>
                <input
                  type="number"
                  name="quantidadeAulas"
                  value={formData.quantidadeAulas}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PROFESSOR</label>
                <select
                  name="professor"
                  value={formData.professor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">- ESCOLHA UM PROFESSOR -</option>
                  <option value="Prof. João Silva">Prof. João Silva</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-teal-600 mb-2 block">POSSUI AVALIAÇÃO?</label>
              <input
                type="checkbox"
                name="avaliacaoCheckbox"
                checked={formData.avaliacaoCheckbox}
                onChange={handleChange}
                className="w-5 h-5 border-teal-300 rounded focus:border-teal-500"
              />
            </div>
          </div>

          {/* Seção 3: Conteúdo */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="text-xs font-medium text-teal-600 mb-2 block">CONTEÚDO A SER VIVENCIADO</label>
            <textarea
              name="conteudoVivenciado"
              value={formData.conteudoVivenciado}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            />
          </div>

          {/* Seção 4: Objetivo */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="text-xs font-medium text-teal-600 mb-2 block">OBJETIVO DA AULA</label>
            <textarea
              name="objetivoAula"
              value={formData.objetivoAula}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            />
          </div>

          {/* Seção 5: Metodologias */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <details open>
              <summary className="cursor-pointer text-sm font-bold text-teal-600 mb-3">▼ Metodologias</summary>
              <textarea
                name="metodologias"
                value={formData.metodologias}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </details>
          </div>

          {/* Seção 6: Recursos */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <details open>
              <summary className="cursor-pointer text-sm font-bold text-teal-600 mb-3">▼ Recursos</summary>
              <textarea
                name="recursos"
                value={formData.recursos}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </details>
          </div>

          {/* Seção 7: Avaliação */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <details open>
              <summary className="cursor-pointer text-sm font-bold text-teal-600 mb-3">▼ Avaliação</summary>
              <textarea
                name="avaliacao"
                value={formData.avaliacao}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </details>
          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/admin/planejamento-diario')}
              className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition flex items-center gap-2"
            >
              💾 Salvar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
