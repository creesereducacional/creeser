import { useState, useEffect } from "react";

export default function ProfessorNotas() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opcoes, setOpcoes] = useState({ turmas: [], disciplinas: [], vinculos: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState("");
  
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
      const res = await fetch(`/api/alunos?turmaId=${turmaId}`);
      if (res.ok) {
        const data = await res.json();
        setAlunos(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const abrirModalNovo = () => {
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
      alunoId: reg.aluno_id,
      matricula: reg.matricula || "",
      nomeAluno: reg.nome_aluno || "",
      turma: reg.turma_id || "",
      disciplina: reg.disciplina_id || "",
      ap1: reg.ap1 ?? "",
      ap2: reg.ap2 ?? "",
      ap3: reg.ap3 ?? "",
      exameFinal: reg.exame_final ?? "",
      frequencia: reg.frequencia ?? ""
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const salvarNotas = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const payload = {
        ...formData,
        ap1: formData.ap1 === "" ? null : Number(formData.ap1),
        ap2: formData.ap2 === "" ? null : Number(formData.ap2),
        ap3: formData.ap3 === "" ? null : Number(formData.ap3),
        exameFinal: formData.exameFinal === "" ? null : Number(formData.exameFinal),
        frequencia: formData.frequencia === "" ? null : Number(formData.frequencia),
      };

      const res = await fetch('/api/notas-faltas', {
        method: formData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Notas salvas com sucesso!');
        setIsModalOpen(false);
        carregarNotas();
      } else {
        const erro = await res.json();
        alert(erro.error || 'Erro ao salvar notas.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setModalLoading(false);
    }
  };

  const disciplinasFiltradas = opcoes.disciplinas.filter(d => {
    if (!formData.turma) return true;
    const vin = opcoes.vinculos.find(v => String(v.turma_id) === String(formData.turma) && String(v.disciplina_id) === String(d.numero_id || d.id));
    return !!vin;
  });

  const registrosFiltrados = registros.filter(r => {
    const txt = `${r.nome_aluno || ''} ${r.matricula || ''} ${r.situacao || ''}`.toLowerCase();
    return txt.includes(busca.toLowerCase());
  });

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
        
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Boletim & Lançamento de Notas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Registre notas avaliativas (AP1, AP2, AP3), exames finais e visualize médias e situações dos alunos.
            </p>
          </div>
          <button
            onClick={abrirModalNovo}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span>➕</span>
            <span>Lançar Nova Nota</span>
          </button>
        </div>

        {/* Busca */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome do aluno, matrícula ou situação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          </div>
        </div>

        {/* Tabela de Notas */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-500">Carregando notas...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <span className="text-4xl block mb-3">📝</span>
            <h3 className="text-base font-bold text-slate-800 mb-1">Nenhum registro encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
              {busca ? "Nenhum aluno corresponde à busca." : "Nenhuma nota registrada para suas turmas."}
            </p>
            <button
              onClick={abrirModalNovo}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
            >
              Lançar Primeira Nota
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 font-extrabold text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6">Aluno</th>
                    <th className="p-4">Matrícula</th>
                    <th className="p-4 text-center">AP1</th>
                    <th className="p-4 text-center">AP2</th>
                    <th className="p-4 text-center">AP3</th>
                    <th className="p-4 text-center">Média Parcial</th>
                    <th className="p-4 text-center">Frequência</th>
                    <th className="p-4 text-center">Média Final</th>
                    <th className="p-4 text-center">Situação</th>
                    <th className="p-4 text-center pr-6">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrosFiltrados.map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50/60 transition duration-150">
                      <td className="p-4 pl-6 font-bold text-slate-900">{reg.nome_aluno}</td>
                      <td className="p-4 text-xs font-medium text-slate-500">{reg.matricula}</td>
                      <td className="p-4 text-center font-semibold text-slate-700">{reg.ap1 ?? '-'}</td>
                      <td className="p-4 text-center font-semibold text-slate-700">{reg.ap2 ?? '-'}</td>
                      <td className="p-4 text-center font-semibold text-slate-700">{reg.ap3 ?? '-'}</td>
                      <td className="p-4 text-center font-black text-teal-700">{reg.media_prova ?? '-'}</td>
                      <td className="p-4 text-center font-semibold text-slate-700">{reg.frequencia !== null && reg.frequencia !== undefined ? `${reg.frequencia}%` : '-'}</td>
                      <td className="p-4 text-center font-black text-slate-900">{reg.media_final ?? '-'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                          reg.situacao === 'APROVADO' ? 'bg-emerald-100 text-emerald-800' :
                          reg.situacao === 'EXAME_FINAL' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {reg.situacao || 'CURSANDO'}
                        </span>
                      </td>
                      <td className="p-4 text-center pr-6">
                        <button
                          onClick={() => abrirEdicao(reg)}
                          className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 rounded-lg font-bold transition cursor-pointer"
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

        {/* Modal de Lançamento/Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <form onSubmit={salvarNotas} className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {formData.id ? "✏️ Editar Notas do Estudante" : "➕ Lançar Nova Avaliação"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Preencha as notas avaliativas correspondentes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">TURMA *</label>
                  <select
                    name="turma"
                    value={formData.turma}
                    onChange={handleChange}
                    required
                    disabled={!!formData.id}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
                  >
                    <option value="">- Selecione a Turma -</option>
                    {opcoes.turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">DISCIPLINA *</label>
                  <select
                    name="disciplina"
                    value={formData.disciplina}
                    onChange={handleChange}
                    required
                    disabled={!formData.turma || !!formData.id}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white disabled:opacity-50"
                  >
                    <option value="">- Selecione a Disciplina -</option>
                    {disciplinasFiltradas.map(d => (
                      <option key={d.id} value={d.numero_id || d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!formData.id && (
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">ESTUDANTE *</label>
                  <select
                    name="alunoId"
                    value={formData.alunoId}
                    onChange={handleChange}
                    required
                    disabled={!formData.turma}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white disabled:opacity-50"
                  >
                    <option value="">- Selecione o Aluno -</option>
                    {alunos.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">AP1</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="ap1"
                    placeholder="0.0"
                    value={formData.ap1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">AP2</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="ap2"
                    placeholder="0.0"
                    value={formData.ap2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">AP3</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="ap3"
                    placeholder="0.0"
                    value={formData.ap3}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">EXAME FINAL</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="exameFinal"
                    placeholder="0.0"
                    value={formData.exameFinal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {modalLoading ? "Salvando..." : "Confirmar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </>
  );
}
