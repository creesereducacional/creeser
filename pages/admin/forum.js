import AdminHeader from "@/components/AdminHeader";
import DashboardLayout from "@/components/DashboardLayout";
import Forum from "@/components/Forum";
import { useAuth } from "@/hooks/useAuth";

export default function ForumAdminPage() {
  const { usuario, carregando } = useAuth({ tiposPermitidos: ['admin'] });

  if (carregando || !usuario) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <Forum />
    </DashboardLayout>
  );
}
