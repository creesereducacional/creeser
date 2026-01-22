import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminHeader from "@/components/AdminHeader";
import DashboardLayout from "@/components/DashboardLayout";
import AdminUsuarios from "@/components/AdminUsuarios";

export default function UsuariosPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usu = localStorage.getItem("usuario");
    if (!usu) { router.push("/login"); return; }
    const u = JSON.parse(usu);
    if (u.tipo !== "admin") { router.push("/dashboard"); return; }
    setUsuario(u);
  }, [router]);

  if (!usuario) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  return (
    <DashboardLayout>
      <div>
        <AdminUsuarios />
      </div>
    </DashboardLayout>
  );
}
