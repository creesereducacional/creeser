import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../components/AdminHeader';
import DashboardLayout from '../../components/DashboardLayout';
import AdminEmails from '../../components/AdminEmails';

export default function Emails() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioStorage = localStorage.getItem('usuario');
    if (usuarioStorage) {
      const usuarioData = JSON.parse(usuarioStorage);
      setUsuario(usuarioData);
      
      if (usuarioData.tipo !== 'admin') {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!usuario) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <AdminEmails />
    </DashboardLayout>
  );
}
