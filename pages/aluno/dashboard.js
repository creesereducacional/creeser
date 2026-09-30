import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import PortalLayout from "@/components/portal/PortalLayout";

export default function AlunoDashboard() {
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarCursos();
  }, []);

  const carregarCursos = async () => {
    setCarregando(true);
    try {
      const response = await fetch("/api/cursos", { credentials: "include" });
      if (response.ok) {
        const todosCursos = await response.json();
        const cursosAtivos = Array.isArray(todosCursos) ? todosCursos.filter((c) => c.ativo !== false) : [];
        setCursos(cursosAtivos);
      }
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setCarregando(false);
    }
  };

  // Função para limpar HTML e extrair apenas texto com quebras de linha
  const limparHTML = (html) => {
    if (!html) return "";
    let texto = html.replace(/<\/div>/g, "\n");
    texto = texto.replace(/<[^>]*>/g, "");
    texto = texto.replace(/&nbsp;/g, " ");
    texto = texto.replace(/&amp;/g, "&");
    texto = texto.replace(/&lt;/g, "<");
    texto = texto.replace(/&gt;/g, ">");
    texto = texto.replace(/&quot;/g, '"');
    texto = texto.replace(/&#39;/g, "'");
    return texto
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean)
      .join("\n");
  };

  return (
    <PortalLayout title="Dashboard — Cursos EAD" tipoRequerido="aluno">
      <div className="space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            📚 Meus Cursos e Disciplinas EAD
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Selecione uma disciplina para acessar a sala de aula virtual e assistir às videoaulas.
          </p>
        </div>

        {/* Cards de Cursos Grid */}
        {carregando ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando catálogo de cursos...</div>
        ) : cursos.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
            Nenhum curso disponível no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso, index) => (
              <div
                key={curso.id}
                onClick={() => router.push(`/assistir/${curso.id}`)}
                className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl mb-4 group-hover:bg-teal-600 group-hover:text-white transition">
                    📖
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-teal-700 transition line-clamp-1">
                    {curso.titulo}
                  </h3>
                  <p className="text-xs text-gray-500 mb-5 line-clamp-3 leading-relaxed">
                    {limparHTML(curso.descricao) || "Sem descrição disponível"}
                  </p>
                </div>

                <div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-teal-600 h-full rounded-full"
                      style={{ width: `${[65, 40, 20][index % 3]}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-4">
                    <span>Progresso</span>
                    <span className="text-teal-700 font-bold">{[65, 40, 20][index % 3]}%</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/assistir/${curso.id}`);
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold text-xs transition shadow-sm"
                  >
                    Acessar Sala Virtual
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informações da Plataforma */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-3">🎓 Ambiente Virtual de Aprendizagem (AVA)</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
            O ambiente EAD do CREESER disponibiliza aulas gravadas, avaliações, materiais complementares e interação direta com professores e tutores.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-gray-700 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span>📹</span>
              <span>Videoaulas em alta resolução</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span>Boletim e histórico escolar</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💬</span>
              <span>Fórum de dúvidas acadêmicas</span>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

