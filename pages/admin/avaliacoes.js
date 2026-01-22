import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../components/AdminHeader';
import DashboardLayout from '../../components/DashboardLayout';
import AdminAvaliacoes from '../../components/AdminAvaliacoes';

export default function AvaliacoesPage() {
  const [usuario, setUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const usuarioLogado = localStorage.getItem('usuario');
    if (!usuarioLogado) {
      router.push('/login');
      return;
    }
    
    const user = JSON.parse(usuarioLogado);
    if (user.tipo !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setUsuario(user);
  }, [router]);

  if (!usuario) {
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
