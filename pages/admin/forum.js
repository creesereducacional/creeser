import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminHeader from "@/components/AdminHeader";
import DashboardLayout from "@/components/DashboardLayout";
import Forum from "@/components/Forum";

export default function ForumAdminPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usu = localStorage.getItem("usuario");
    if (!usu) {
      router.push("/login");
      return;
    }

    const u = JSON.parse(usu);
    if (u.tipo !== "admin") {
      router.push("/dashboard");
      return;
    }

    setUsuario(u);
  }, [router]);

  if (!usuario) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <Forum />
    </DashboardLayout>
  );
}
