import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import HistoricoTemplate from "../../../components/HistoricoTemplate";

export default function AdminAlunoHistoricoPage() {
  const router = useRouter();
  const { id } = router.query;
  const [historico, setHistorico] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      carregarHistorico(id);
    }
  }, [id]);

  const carregarHistorico = async (alunoId) => {
    try {
      const res = await fetch(`/api/alunos/${alunoId}/historico`);
      if (res.ok) {
        const data = await res.json();
        setHistorico(data);
      } else {
        alert("Erro ao carregar histórico.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print:bg-white">
      {/* Header (Ocultado ao imprimir) */}
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/alunos">
            <div className="text-gray-500 hover:text-gray-700 font-bold cursor-pointer text-sm">
              ⬅️ Voltar para Alunos
            </div>
          </Link>
          <span className="text-gray-300">|</span>
          <h2 className="text-xl font-bold text-gray-800">Emissão de Histórico Escolar</h2>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition shadow cursor-pointer"
        >
          🖨️ Imprimir Histórico
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 print:p-0">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando dados do histórico...</p>
        ) : (
          <HistoricoTemplate data={historico} />
        )}
      </main>

      {/* Estilos CSS Print embutidos */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden, header, footer, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
