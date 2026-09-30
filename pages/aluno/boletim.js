import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import BoletimTemplate from "@/components/BoletimTemplate";
import PortalLayout from "@/components/portal/PortalLayout";

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
    <PortalLayout title="Meu Boletim Escolar" tipoRequerido="aluno">
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
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-6 print:border-none print:shadow-none print:p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Carregando notas do boletim...</div>
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
    </PortalLayout>
  );
}

