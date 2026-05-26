import AdminHeader from '../../components/AdminHeader';
import DashboardLayout from '../../components/DashboardLayout';
import AdminAvaliacoes from '../../components/AdminAvaliacoes';
import { useAuth } from '../../hooks/useAuth';

export default function AvaliacoesPage() {
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
      <AdminAvaliacoes />
    </DashboardLayout>
  );
}
