import { useState, useEffect } from "react";
import ProfessorLayout from "../../components/ProfessorLayout";
import Link from "next/link";

export default function ProfessorDiario() {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

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

  const aulasFiltradas = aulas.filter(aula => {
    const texto = `${aula.conteudoVivenciado || ''} ${aula.turma || ''} ${aula.disciplina || ''} ${aula.local || ''}`.toLowerCase();
    return texto.includes(busca.toLowerCase());
  });

  return (
    <ProfessorLayout title="Diário de Classe & Planejamentos">
      <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
        
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Diário de Classe
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Histórico pedagógico de aulas ministradas e planejamentos de ensino.
            </p>
          </div>
          <Link href="/professor/planejamento">
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer whitespace-nowrap">
              <span>➕</span>
              <span>Novo Planejamento</span>
            </button>
          </Link>
        </div>

        {/* Barra de Busca e Filtro */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por conteúdo, turma, disciplina ou local..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          </div>
        </div>

        {/* Lista de Aulas */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-500">Carregando diário de classe...</p>
          </div>
        ) : aulasFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <span className="text-4xl block mb-3">📖</span>
            <h3 className="text-base font-bold text-slate-800 mb-1">Nenhum planejamento encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
              {busca ? "Nenhum resultado para os termos pesquisados." : "Você ainda não possui aulas ou planejamentos registrados."}
            </p>
            <Link href="/professor/planejamento">
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition">
                Criar Primeiro Planejamento
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {aulasFiltradas.map((aula) => (
              <div
                key={aula.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-sm transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-teal-50 text-teal-700 border border-teal-200/60">
                      Turma: {aula.turma}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                      {aula.disciplina}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {aula.conteudoVivenciado || "Conteúdo Programático / Aula Pedagógica"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Data: {new Date(aula.data).toLocaleDateString("pt-BR")}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span>🏫</span>
                      <span>Local: {aula.local || "Sala de Aula"}</span>
                    </span>
                    {aula.quantidadeAulas && (
                      <span className="inline-flex items-center gap-1.5">
                        <span>⏱️</span>
                        <span>{aula.quantidadeAulas} aula(s)</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link href={`/professor/planejamento?edit=${aula.id}`}>
                    <button className="px-4 py-2 border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-xl text-xs font-bold transition cursor-pointer">
                      ✏️ Editar
                    </button>
                  </Link>
                  <Link href="/professor/frequencia">
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer">
                      📋 Chamada
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
