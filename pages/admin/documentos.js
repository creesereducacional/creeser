import AdminHeader from '../../components/AdminHeader';
import DashboardLayout from '../../components/DashboardLayout';
import AdminDocumentos from '../../components/AdminDocumentos';
import { useAuth } from '../../hooks/useAuth';

export default function DocumentosPage() {
  const { usuario, carregando } = useAuth({ tiposPermitidos: ['admin'] });

  if (carregando || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <AdminDocumentos />
    </DashboardLayout>
  );
}
