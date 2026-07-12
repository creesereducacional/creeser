import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProfessorLayout from "../../components/ProfessorLayout";

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
          dataFim: data.dataFim || data.data_fim || ""
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

  // Filtrar disciplinas com base na turma selecionada (Matriz Curricular)
  const disciplinasFiltradas = opcoes.disciplinas.filter(d => {
    if (!formData.turma) return true;
    const vin = opcoes.vinculos.find(v => String(v.turma_id) === String(formData.turma) && String(v.disciplina_id) === String(d.numero_id || d.id));
    return !!vin;
  });

  return (
    <ProfessorLayout title={editId ? "Editar Planejamento" : "Novo Planejamento"}>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-teal-600 block mb-1">TURMA *</label>
            <select
              name="turma"
              value={formData.turma}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
            >
              <option value="">- Selecione uma Turma -</option>
              {opcoes.turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-teal-600 block mb-1">DISCIPLINA *</label>
            <select
              name="disciplina"
              value={formData.disciplina}
              onChange={handleChange}
              required
              disabled={!formData.turma}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500 disabled:opacity-50"
            >
              <option value="">- Selecione a Disciplina -</option>
              {disciplinasFiltradas.map(d => (
                <option key={d.id} value={d.numero_id || d.id}>{d.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-medium text-teal-600 block mb-1">DATA DA AULA *</label>
            <input
              type="date"
              name="data"
              value={formData.data}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-teal-600 block mb-1">SALAS/LOCAL</label>
            <input
              type="text"
              name="local"
              value={formData.local}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-teal-600 block mb-1">QTD. AULAS *</label>
            <input
              type="number"
              name="quantidadeAulas"
              value={formData.quantidadeAulas}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-teal-600 block mb-1">CONTEÚDO PROGRAMÁTICO VIVENCIADO</label>
          <textarea
            name="conteudoVivenciado"
            value={formData.conteudoVivenciado}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-teal-600 block mb-1">OBJETIVO DA AULA</label>
          <textarea
            name="objetivoAula"
            value={formData.objetivoAula}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => router.push("/professor/diario")}
            className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-lg text-sm transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Salvando..." : "Salvar Planejamento"}
          </button>
        </div>
      </form>
    </ProfessorLayout>
  );
}
