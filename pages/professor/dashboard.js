import { useState, useEffect } from "react";
import ProfessorLayout from "../../components/ProfessorLayout";
import Link from "next/link";

export default function ProfessorDashboard() {
  const [stats, setStats] = useState({
    turmasVinculadas: 0,
    disciplinasVinculadas: 0,
    totalAlunos: 0,
    aulasMinistradas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const res = await fetch('/api/professor/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas do portal:", err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: "Turmas Vinculadas", val: stats.turmasVinculadas, color: "bg-teal-500", icon: "👥" },
    { label: "Disciplinas Vinculadas", val: stats.disciplinasVinculadas, color: "bg-indigo-500", icon: "📖" },
    { label: "Meus Alunos (Ativos)", val: stats.totalAlunos, color: "bg-emerald-500", icon: "🎓" },
    { label: "Aulas Registradas", val: stats.aulasMinistradas, color: "bg-amber-500", icon: "📝" },
  ];

  return (
    <ProfessorLayout title="Dashboard Geral">
      {loading ? (
        <p className="text-center py-8 text-gray-500">Carregando indicadores...</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bem-vindo, Professor!</h1>
            <p className="text-sm text-gray-500 mt-1">Aqui está o resumo real das suas atividades escolares.</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
              <div key={card.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
                <div>
                  <p className="text-sm font-semibold text-gray-500">{card.label}</p>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{card.val}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Atalhos Rápidos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Acesso Rápido</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/professor/diario">
                <div className="p-4 border border-teal-100 rounded-xl hover:bg-teal-50 transition cursor-pointer text-center">
                  <span className="text-2xl">📖</span>
                  <p className="font-bold text-teal-800 mt-2 text-sm">Diário de Classe</p>
                </div>
              </Link>
              <Link href="/professor/frequencia">
                <div className="p-4 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition cursor-pointer text-center">
                  <span className="text-2xl">📋</span>
                  <p className="font-bold text-emerald-800 mt-2 text-sm">Fazer Chamada</p>
                </div>
              </Link>
              <Link href="/professor/notas">
                <div className="p-4 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition cursor-pointer text-center">
                  <span className="text-2xl">📝</span>
                  <p className="font-bold text-indigo-800 mt-2 text-sm">Lançar Notas</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </ProfessorLayout>
  );
}
