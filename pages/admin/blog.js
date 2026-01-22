import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../components/AdminHeader';
import DashboardLayout from '../../components/DashboardLayout';
import AdminBlog from '../../components/AdminBlog';

export default function BlogPage() {
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
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <AdminBlog />
    </DashboardLayout>
  );
}
