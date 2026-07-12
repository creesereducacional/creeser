import { useState, useEffect } from "react";
import ProfessorLayout from "../../components/ProfessorLayout";
import Link from "next/link";

export default function ProfessorDiario() {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAulas();
  }, []);

  const carregarAulas = async () => {
    try {
      const res = await fetch('/api/planejamento-diario');
      if (res.ok) {
        const data = await res.json();
        setAulas(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfessorLayout title="Diário de Classe & Planejamento">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Aulas Planejadas</h1>
            <p className="text-sm text-gray-500">Histórico de aulas ministradas e planejamentos criados.</p>
          </div>
          <Link href="/professor/planejamento">
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm transition cursor-pointer">
              ➕ Novo Planejamento
            </button>
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando aulas...</p>
        ) : aulas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">Nenhum planejamento registrado para suas turmas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {aulas.map(aula => (
              <div key={aula.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-teal-800 text-lg">
                      {aula.conteudoVivenciado || 'Sem Título / Conteúdo'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 Data: {new Date(aula.data).toLocaleDateString('pt-BR')} | 🏫 Local: {aula.local || 'Sala de Aula'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Turma: {aula.turma} | Disciplina: {aula.disciplina}
                    </p>
                  </div>
                  <Link href={`/professor/planejamento?edit=${aula.id}`}>
                    <button className="px-3 py-1.5 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg text-xs font-semibold cursor-pointer">
                      ✏️ Editar
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfessorLayout>
  );
}
