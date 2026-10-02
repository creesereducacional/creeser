import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Forum from "@/components/Forum";

export default function AlunoForumPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.usuario) {
          setUsuario(data.usuario);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            💬 Comunidade e Fórum de Dúvidas
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Tire dúvidas sobre disciplinas, compartilhe conhecimentos e interaja com professores e colegas.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-6">
          <Forum usuario={usuario} />
        </div>
      </div>
    </>
  );
}

