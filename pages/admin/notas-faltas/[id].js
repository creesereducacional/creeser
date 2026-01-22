import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function EditarNotaFalta() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    nomeAluno: '',
    matricula: '',
    turma: '',
    disciplina: '',
    ap1: '',
    ap2: '',
    ap3: '',
    mediaProva: '',
    exameFinal: '',
    frequencia: '',
    mediaFinal: '',
    situacao: 'CURSANDO'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      carregarRegistro();
    }
  }, [id]);

  const carregarRegistro = async () => {
    try {
      const res = await fetch(`/api/notas-faltas/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      } else {
        alert('Registro não encontrado');
        router.push('/admin/notas-faltas');
      }
    } catch (error) {
      console.error('Erro ao carregar registro:', error);
      alert('Erro ao carregar registro');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nomeAluno || !formData.turma || !formData.disciplina) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/notas-faltas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ap1: formData.ap1 ? parseFloat(formData.ap1) : null,
          ap2: formData.ap2 ? parseFloat(formData.ap2) : null,
          ap3: formData.ap3 ? parseFloat(formData.ap3) : null,
          mediaProva: formData.mediaProva ? parseFloat(formData.mediaProva) : null,
          exameFinal: formData.exameFinal ? parseFloat(formData.exameFinal) : null,
          frequencia: formData.frequencia ? parseFloat(formData.frequencia) : 0,
          mediaFinal: formData.mediaFinal ? parseFloat(formData.mediaFinal) : null
        }),
      });

      if (res.ok) {
        alert('Registro atualizado com sucesso!');
        router.push('/admin/notas-faltas');
      } else {
        alert('Erro ao atualizar registro');
      }
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      alert('Erro ao atualizar registro');
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
            <span className="text-3xl">📊</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Editar Notas e Faltas</h1>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Seleção do Aluno */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Seleção do Aluno</h3>
            
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
                  <option value="ADM EAD 01 - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)">ADM EAD 01 - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)</option>
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

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME DO ALUNO *</label>
                <input
                  type="text"
                  name="nomeAluno"
                  value={formData.nomeAluno}
                  onChange={handleChange}
                  required
                  placeholder="Nome do Aluno"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MATRÍCULA</label>
                <input
                  type="text"
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleChange}
                  placeholder="Matrícula"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Avaliações */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Avaliações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">AP1 (0-10)</label>
                <input
                  type="number"
                  name="ap1"
                  value={formData.ap1}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">AP2 (0-10)</label>
                <input
                  type="number"
                  name="ap2"
                  value={formData.ap2}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">AP3 (0-10)</label>
                <input
                  type="number"
                  name="ap3"
                  value={formData.ap3}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MÉDIA PROVA</label>
                <input
                  type="number"
                  name="mediaProva"
                  value={formData.mediaProva}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">EXAME FINAL (0-10)</label>
                <input
                  type="number"
                  name="exameFinal"
                  value={formData.exameFinal}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">FREQUÊNCIA (%)</label>
                <input
                  type="number"
                  name="frequencia"
                  value={formData.frequencia}
                  onChange={handleChange}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Resultado */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Resultado</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MÉDIA FINAL</label>
                <input
                  type="number"
                  name="mediaFinal"
                  value={formData.mediaFinal}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">SITUAÇÃO</label>
                <select
                  name="situacao"
                  value={formData.situacao}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="CURSANDO">CURSANDO</option>
                  <option value="APROVADO">APROVADO</option>
                  <option value="REPROVADO">REPROVADO</option>
                  <option value="DISPENSADO">DISPENSADO</option>
                </select>
              </div>
            </div>
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
            <Link href="/admin/notas-faltas">
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
