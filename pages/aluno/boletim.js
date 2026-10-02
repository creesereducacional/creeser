import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import BoletimTemplate from "@/components/BoletimTemplate";

export default function AlunoBoletimPage() {
  const router = useRouter();
  const [boletim, setBoletim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega o usuário autenticado via me/localStorage para obter o id
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.usuario?.id) {
          carregarBoletim(data.usuario.id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const carregarBoletim = async (alunoId) => {
    try {
      const res = await fetch(`/api/alunos/${alunoId}/boletim`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBoletim(data);
      }
    } catch (e) {
      console.error("Erro ao carregar boletim:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6 print:space-y-0">
        {/* Barra de Ações (Ocultada na impressão) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm print:hidden">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Histórico de Notas e Frequência</h3>
            <p className="text-xs text-gray-500">Documento oficial de acompanhamento de notas do aluno.</p>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            <span>🖨️</span>
            <span>Imprimir Boletim (A4)</span>
          </button>
        </div>

        {/* Template do Boletim */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-6 print:border-none print:shadow-none print:p-0 min-h-[500px]">
          {loading ? (
            <div className="p-8 rounded-3xl max-w-4xl mx-auto space-y-6 animate-pulse">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-6">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-slate-200 rounded-md" />
                  <div className="h-3 w-32 bg-slate-100 rounded-md" />
                </div>
                <div className="h-8 w-32 bg-slate-100 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-2.5 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="h-12 bg-slate-200 w-full" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 border-t border-slate-100 bg-slate-50/50 flex items-center px-4 gap-4">
                    <div className="h-4 w-1/3 bg-slate-200 rounded" />
                    <div className="h-4 w-1/4 bg-slate-100 rounded" />
                    <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <BoletimTemplate data={boletim} />
          )}
        </div>
      </div>

      {/* Estilos CSS Print */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, nav, button, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

