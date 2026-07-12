import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import BoletimTemplate from "../../components/BoletimTemplate";

export default function AlunoBoletimPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [boletim, setBoletim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usu = localStorage.getItem("usuario");
    if (!usu) {
      router.push("/login");
      return;
    }

    try {
      const obj = JSON.parse(usu);
      if (obj.tipo !== "aluno") {
        router.push("/login");
        return;
      }
      setUsuario(obj);
      carregarBoletim(obj.id);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const carregarBoletim = async (alunoId) => {
    try {
      const res = await fetch(`/api/alunos/${alunoId}/boletim`);
      if (res.ok) {
        const data = await res.json();
        setBoletim(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print:bg-white">
      {/* Header (Ocultado ao imprimir) */}
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/aluno/dashboard">
            <div className="text-gray-500 hover:text-gray-700 font-bold cursor-pointer text-sm">
              ⬅️ Voltar ao Painel
            </div>
          </Link>
          <span className="text-gray-300">|</span>
          <h2 className="text-xl font-bold text-gray-800">Meu Boletim Escolar</h2>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition shadow cursor-pointer"
        >
          🖨️ Imprimir Boletim
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 print:p-0">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando notas do boletim...</p>
        ) : (
          <BoletimTemplate data={boletim} />
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
