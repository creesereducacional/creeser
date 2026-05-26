import AdminHeader from "@/components/AdminHeader";
import DashboardLayout from "@/components/DashboardLayout";
import AdminUsuarios from "@/components/AdminUsuarios";
import { useAuth } from "@/hooks/useAuth";

export default function UsuariosPage() {
  const { usuario, carregando } = useAuth({ tiposPermitidos: ['admin'] });

  if (carregando || !usuario) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  return (
    <DashboardLayout>
      <div>
        <AdminUsuarios />
      </div>
    </DashboardLayout>
  );
}
