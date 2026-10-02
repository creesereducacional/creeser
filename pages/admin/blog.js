import AdminHeader from '../../components/AdminHeader';
import AdminBlog from '../../components/AdminBlog';
import { useAuth } from '../../hooks/useAuth';

export default function BlogPage() {
  const { usuario, carregando } = useAuth({ tiposPermitidos: ['admin'] });

  if (carregando || !usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <AdminBlog />
    </>
  );
}
