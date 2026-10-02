import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ProfessorPlanejamento() {
  const router = useRouter();
  const { edit: editId } = router.query;

  const [formData, setFormData] = useState({
    turma: "",
    disciplina: "",
    data: new Date().toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    local: "SALA DE AULA",
    quantidadeAulas: 1,
    unidadeBimestral: "1º BIMESTRE",
    conteudoVivenciado: "",
    objetivoAula: "",
    metodologias: "",
    recursos: "",
    avaliacao: "",
    avaliacaoCheckbox: false
  });

  const [opcoes, setOpcoes] = useState({ turmas: [], disciplinas: [], vinculos: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarOpcoes();
  }, []);

  useEffect(() => {
    if (editId) {
      carregarPlanejamento();
    }
  }, [editId]);

  const carregarOpcoes = async () => {
    try {
      const res = await fetch('/api/professor/vinculos');
      if (res.ok) {
        const data = await res.json();
        setOpcoes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const carregarPlanejamento = async () => {
    try {
      const res = await fetch(`/api/planejamento-diario/${editId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          ...data,
          data: data.data || "",
          dataFim: data.dataFim || "",
          turma: data.turma_id || data.turma || "",
          disciplina: data.disciplina_id || data.disciplina || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.turma || !formData.disciplina) {
      alert("Selecione a Turma e a Disciplina");
      return;
    }

    setSaving(true);
    try {
      const url = editId ? `/api/planejamento-diario/${editId}` : `/api/planejamento-diario`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(editId ? "Planejamento atualizado!" : "Planejamento criado!");
        router.push("/professor/diario");
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar planejamento.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  };

  // Filtrar disciplinas com base na turma selecionada
  const disciplinasFiltradas = opcoes.disciplinas.filter(d => {
    if (!formData.turma) return true;
    const vin = opcoes.vinculos.find(v => String(v.turma_id) === String(formData.turma) && String(v.disciplina_id) === String(d.numero_id || d.id));
    return !opcoes.vinculos?.length || !!vin;
  });

  return (
    <>
      <div className="max-w-4xl mx-auto pb-10 font-sans space-y-6">
        
        {/* Header da Página */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {editId ? "✏️ Editar Planejamento Pedagógico" : "➕ Novo Planejamento de Aula"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Registre os objetivos, metodologia e conteúdos programáticos da sua aula.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/professor/diario")}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            ← Voltar ao Diário
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200/80 shadow-xs space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">TURMA *</label>
              <select
                name="turma"
                value={formData.turma}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
              >
                <option value="">- Selecione uma Turma -</option>
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
                disabled={!formData.turma}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white disabled:opacity-50"
              >
                <option value="">- Selecione a Disciplina -</option>
                {disciplinasFiltradas.map(d => (
                  <option key={d.id} value={d.numero_id || d.id}>{d.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">DATA DA AULA *</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">LOCAL / SALA</label>
              <input
                type="text"
                name="local"
                value={formData.local}
                onChange={handleChange}
                placeholder="Ex: Sala 102, Lab, etc."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">QTD. AULAS *</label>
              <input
                type="number"
                name="quantidadeAulas"
                value={formData.quantidadeAulas}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">CONTEÚDO PROGRAMÁTICO VIVENCIADO *</label>
            <textarea
              name="conteudoVivenciado"
              value={formData.conteudoVivenciado}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Descreva o conteúdo abordado na aula..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">OBJETIVO DA AULA</label>
            <textarea
              name="objetivoAula"
              value={formData.objetivoAula}
              onChange={handleChange}
              rows="2"
              placeholder="Objetivos de aprendizagem dos estudantes..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">METODOLOGIA UTILIZADA</label>
              <textarea
                name="metodologias"
                value={formData.metodologias}
                onChange={handleChange}
                rows="2"
                placeholder="Ex: Aula expositiva dialogada, estudo de casos..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">RECURSOS DIDÁTICOS</label>
              <textarea
                name="recursos"
                value={formData.recursos}
                onChange={handleChange}
                rows="2"
                placeholder="Ex: Projetor, apostilas, slides..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => router.push("/professor/diario")}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Salvando..." : (editId ? "Salvar Alterações" : "Criar Planejamento")}
            </button>
          </div>
        </form>

      </div>
    </>
  );
}
