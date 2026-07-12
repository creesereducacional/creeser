import { useState, useEffect } from "react";
import ProfessorLayout from "../../components/ProfessorLayout";

export default function ProfessorNotas() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opcoes, setOpcoes] = useState({ turmas: [], disciplinas: [], vinculos: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [alunos, setAlunos] = useState([]);
  
  const [formData, setFormData] = useState({
    id: null,
    alunoId: "",
    matricula: "",
    nomeAluno: "",
    turma: "",
    disciplina: "",
    ap1: "",
    ap2: "",
    ap3: "",
    exameFinal: "",
    frequencia: ""
  });

  useEffect(() => {
    carregarNotas();
    carregarVinculos();
  }, []);

  useEffect(() => {
    if (formData.turma) {
      carregarAlunos(formData.turma);
    } else {
      setAlunos([]);
    }
  }, [formData.turma]);

  const carregarNotas = async () => {
    try {
      const res = await fetch('/api/notas-faltas');
      if (res.ok) {
        const data = await res.json();
        setRegistros(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const carregarVinculos = async () => {
    try {
      const res = await fetch('/api/professor/vinculos');
      if (res.ok) {
        const data = await res.json();
        setOpcoes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const carregarAlunos = async (turmaId) => {
    try {
      const res = await fetch('/api/alunos');
      if (res.ok) {
        const data = await res.json();
        // Filtrar alunos matriculados na turma
        const daTurma = data.filter(aluno => String(aluno.turmaid) === String(turmaId));
        setAlunos(daTurma);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "alunoId") {
      const aluno = alunos.find(a => String(a.id) === String(value));
      setFormData(prev => ({
        ...prev,
        alunoId: value,
        matricula: aluno ? aluno.matricula : "",
        nomeAluno: aluno ? aluno.nome : ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const abrirNovo = () => {
    setFormData({
      id: null,
      alunoId: "",
      matricula: "",
      nomeAluno: "",
      turma: "",
      disciplina: "",
      ap1: "",
      ap2: "",
      ap3: "",
      exameFinal: "",
      frequencia: ""
    });
    setIsModalOpen(true);
  };

  const abrirEdicao = (reg) => {
    setFormData({
      id: reg.id,
      alunoId: "",
      matricula: reg.matricula,
      nomeAluno: reg.nome_aluno,
      turma: reg.turma,
      disciplina: reg.disciplina,
      ap1: reg.ap1 !== null ? String(reg.ap1) : "",
      ap2: reg.ap2 !== null ? String(reg.ap2) : "",
      ap3: reg.ap3 !== null ? String(reg.ap3) : "",
      exameFinal: reg.exame_final !== null ? String(reg.exame_final) : "",
      frequencia: reg.frequencia !== null ? String(reg.frequencia) : ""
    });
    setIsModalOpen(true);
  };

  const salvarNotas = async (e) => {
    e.preventDefault();
    if (!formData.nomeAluno || !formData.turma || !formData.disciplina) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    setModalLoading(true);
    try {
      const url = formData.id ? `/api/notas-faltas/${formData.id}` : `/api/notas-faltas`;
      const method = formData.id ? "PUT" : "POST";
      const payload = {
        ...formData,
        ap1: formData.ap1 ? parseFloat(formData.ap1) : null,
        ap2: formData.ap2 ? parseFloat(formData.ap2) : null,
        ap3: formData.ap3 ? parseFloat(formData.ap3) : null,
        exameFinal: formData.exameFinal ? parseFloat(formData.exameFinal) : null,
        frequencia: formData.frequencia ? parseFloat(formData.frequencia) : 0
      };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Lançamento salvo com sucesso!");
        setIsModalOpen(false);
        carregarNotas();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar notas.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar ao servidor.");
    } finally {
      setModalLoading(false);
    }
  };

  // Filtrar disciplinas com base na turma selecionada
  const disciplinasFiltradas = opcoes.disciplinas.filter(d => {
    if (!formData.turma) return true;
    const vin = opcoes.vinculos.find(v => String(v.turma_id) === String(formData.turma) && String(v.disciplina_id) === String(d.numero_id || d.id));
    return !!vin;
  });

  return (
    <ProfessorLayout title="Notas e Avaliações">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lançamento de Notas</h1>
            <p className="text-sm text-gray-500">Módulo de avaliações e boletim acadêmico.</p>
          </div>
          <button
            onClick={abrirNovo}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm transition cursor-pointer"
          >
            ➕ Lançar Nota
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando boletim acadêmico...</p>
        ) : registros.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">Nenhuma nota ou avaliação cadastrada para suas turmas.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-teal-50 border-b border-teal-100 text-teal-800 font-semibold">
                    <th className="p-4">Aluno</th>
                    <th className="p-4">Matrícula</th>
                    <th className="p-4 text-center">AP1</th>
                    <th className="p-4 text-center">AP2</th>
                    <th className="p-4 text-center">AP3</th>
                    <th className="p-4 text-center">Média Parcial</th>
                    <th className="p-4 text-center">Frequência</th>
                    <th className="p-4 text-center">Média Final</th>
                    <th className="p-4 text-center">Situação</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registros.map(reg => (
                    <tr key={reg.id} className="hover:bg-gray-55/30 transition">
                      <td className="p-4 font-semibold text-gray-800">{reg.nome_aluno}</td>
                      <td className="p-4 text-gray-500">{reg.matricula}</td>
                      <td className="p-4 text-center font-medium">{reg.ap1 ?? '-'}</td>
                      <td className="p-4 text-center font-medium">{reg.ap2 ?? '-'}</td>
                      <td className="p-4 text-center font-medium">{reg.ap3 ?? '-'}</td>
                      <td className="p-4 text-center font-bold text-teal-700">{reg.media_prova ?? '-'}</td>
                      <td className="p-4 text-center">{reg.frequencia !== null ? `${reg.frequencia}%` : '-'}</td>
                      <td className="p-4 text-center font-extrabold text-teal-950">{reg.media_final ?? '-'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          reg.situacao === 'APROVADO' ? 'bg-green-100 text-green-700' :
                          reg.situacao === 'EXAME_FINAL' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {reg.situacao}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => abrirEdicao(reg)}
                          className="px-2.5 py-1 text-xs border border-teal-200 text-teal-700 hover:bg-teal-50 rounded font-semibold cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Nova/Editar Nota */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={salvarNotas} className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-teal-800">
                  {formData.id ? "✏️ Editar Nota" : "➕ Lançar Nova Nota"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-teal-600 block mb-1">TURMA *</label>
                  <select
                    name="turma"
                    value={formData.turma}
                    onChange={handleChange}
                    required
                    disabled={!!formData.id}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">- Selecione -</option>
                    {opcoes.turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-teal-600 block mb-1">DISCIPLINA *</label>
                  <select
                    name="disciplina"
                    value={formData.disciplina}
                    onChange={handleChange}
                    required
                    disabled={!formData.turma || !!formData.id}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">- Selecione -</option>
                    {disciplinasFiltradas.map(d => (
                      <option key={d.id} value={d.numero_id || d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!formData.id && (
                <div>
                  <label className="text-xs font-semibold text-teal-600 block mb-1">ESTUDANTE *</label>
                  <select
                    name="alunoId"
                    value={formData.alunoId}
                    onChange={handleChange}
                    required
                    disabled={!formData.turma}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">- Selecione o Aluno -</option>
                    {alunos.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-teal-600 block mb-1">AP1</label>
                  <input
                    type="number"
                    step="0.01"
                    name="ap1"
                    value={formData.ap1}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-teal-600 block mb-1">AP2</label>
                  <input
                    type="number"
                    step="0.01"
                    name="ap2"
                    value={formData.ap2}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-teal-600 block mb-1">AP3</label>
                  <input
                    type="number"
                    step="0.01"
                    name="ap3"
                    value={formData.ap3}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-teal-600 block mb-1">EXAME FINAL</label>
                  <input
                    type="number"
                    step="0.01"
                    name="exameFinal"
                    value={formData.exameFinal}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-lg text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {modalLoading ? "Salvando..." : "Confirmar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ProfessorLayout>
  );
}
